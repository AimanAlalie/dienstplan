/**
 * Supabase Edge Function: daily-shift-reminder
 *
 * Sendet in-app Dienst-Erinnerungen für alle Mitarbeiter, die morgen
 * einen Dienst oder eine Bereitschaft haben.
 *
 * Kann manuell aufgerufen oder per pg_net aus pg_cron getriggert werden.
 * Alternativ läuft public.send_daily_shift_reminders() direkt via pg_cron
 * ohne diesen HTTP-Einstiegspunkt.
 *
 * Aufruf (mit Service-Role-Key):
 *   POST https://<project>.supabase.co/functions/v1/daily-shift-reminder
 *   Authorization: Bearer <service_role_key>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ShiftRow {
  id: string
  employee_id: string
  shift_date: string
  start_time: string
  end_time: string
  category: string
}

interface EmployeeSettings {
  employee_id: string
  notify_shift_reminder: boolean
}

/** Gibt das heutige Datum in Europe/Berlin als YYYY-MM-DD zurück */
function getTomorrowBerlin(): string {
  const now = new Date()
  // Aktuelles Datum in Berlin-Timezone
  const berlinFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayBerlin = berlinFormatter.format(now) // YYYY-MM-DD (sv-SE Locale)
  const tomorrow = new Date(todayBerlin + 'T00:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().substring(0, 10)
}

/** Formatiert ein ISO-Datum zu DD.MM.YYYY */
function formatDateDE(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
}

/** Extrahiert HH:MM aus einem ISO-Timestamp, konvertiert nach Berlin-Timezone */
function extractTimeBerlin(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

Deno.serve(async (req: Request) => {
  // Nur POST oder GET zulassen
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Authorization prüfen (Service-Role-Key erforderlich)
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token || token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  try {
    // Option A: DB-Funktion direkt aufrufen (einfacher, konsistenter mit Migration)
    const { data, error } = await supabase.rpc('send_daily_shift_reminders')
    if (error) throw error

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Fallback: Edge Function macht alles selbst (falls DB-Funktion nicht existiert)
    console.error('DB-Funktion fehlgeschlagen, führe Fallback aus:', err)
    return await runFallback(supabase)
  }
})

async function runFallback(
  supabase: ReturnType<typeof createClient>
): Promise<Response> {
  const tomorrow = getTomorrowBerlin()
  const tomorrowDE = formatDateDE(tomorrow)

  // Dienste für morgen aus veröffentlichten Plänen laden
  const { data: shifts, error: shiftsError } = await supabase
    .from('shifts')
    .select(`
      id,
      employee_id,
      shift_date,
      start_time,
      end_time,
      category,
      monthly_plans!inner ( status )
    `)
    .eq('shift_date', tomorrow)
    .eq('monthly_plans.status', 'published')
    .in('category', ['normal', 'standby'])
    .neq('status', 'cancelled')

  if (shiftsError) {
    return new Response(
      JSON.stringify({ error: shiftsError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const typedShifts = (shifts ?? []) as ShiftRow[]

  if (typedShifts.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, skipped: 0, date: tomorrow }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Benachrichtigungseinstellungen für alle betroffenen Mitarbeiter laden
  const employeeIds = [...new Set(typedShifts.map((s) => s.employee_id))]

  const { data: settingsData } = await supabase
    .from('employee_settings')
    .select('employee_id, notify_shift_reminder')
    .in('employee_id', employeeIds)

  // Map: employee_id → notify_shift_reminder (Standard: true wenn kein Eintrag)
  const settingsMap = new Map<string, boolean>(
    (settingsData as EmployeeSettings[] ?? []).map((s) => [
      s.employee_id,
      s.notify_shift_reminder,
    ])
  )

  let sent = 0
  let skipped = 0

  for (const shift of typedShifts) {
    const shouldNotify = settingsMap.get(shift.employee_id) ?? true
    if (!shouldNotify) {
      skipped++
      continue
    }

    const startTime = extractTimeBerlin(shift.start_time)
    const endTime   = extractTimeBerlin(shift.end_time)
    const catLabel  = shift.category === 'standby' ? 'Bereitschaft' : 'Dienst'

    const { error: notifError } = await supabase.rpc('create_notification', {
      p_employee_id:         shift.employee_id,
      p_type:                'shift_reminder',
      p_title:               `Morgen hast du ${catLabel}`,
      p_body:                `${catLabel} am ${tomorrowDE}, ${startTime}–${endTime} Uhr`,
      p_related_entity_type: 'shift',
      p_related_entity_id:   shift.id,
    })

    if (notifError) {
      console.error(`Notification fehlgeschlagen für ${shift.employee_id}:`, notifError)
    } else {
      sent++
    }
  }

  return new Response(
    JSON.stringify({ sent, skipped, date: tomorrow }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
