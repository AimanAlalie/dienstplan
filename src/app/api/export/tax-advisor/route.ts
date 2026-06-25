import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getEmployees } from '@/lib/queries/employees'
import { getShiftsForMonth } from '@/lib/queries/shifts'
import { aggregateStats, generateTaxAdvisorExcel } from '@/lib/utils/tax-advisor-excel'
import { ShiftWithEmployee } from '@/types/database'

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Nicht angemeldet', { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return new Response('Kein Zugriff', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))

  if (!year || !month || month < 1 || month > 12) {
    return new Response('Ungültige Parameter (year, month erforderlich)', { status: 400 })
  }

  const [employees, shifts] = await Promise.all([
    getEmployees(true),
    getShiftsForMonth(year, month).catch(() => [] as ShiftWithEmployee[]),
  ])

  const stats = aggregateStats(employees, shifts, year)
  const buffer = await generateTaxAdvisorExcel(stats, year, month)

  const filename = `Steuerberater_${String(month).padStart(2, '0')}_${year}.xlsx`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
