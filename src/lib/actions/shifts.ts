'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { shiftSchema } from '@/lib/validations/shift'
import { ServerActionResult } from '@/types/app'
import { Shift } from '@/types/database'
import { insertAuditLog } from './audit'
import { revalidatePath } from 'next/cache'
import { format, parseISO, addDays } from 'date-fns'

function buildStartEnd(
  shiftDate: string,
  startTime: string,
  endTime: string
): { start: string; end: string } {
  const startDt = `${shiftDate}T${startTime}:00`
  const startDate = parseISO(startDt)

  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMins = startH * 60 + startM
  const endMins = endH * 60 + endM

  let endDate = shiftDate
  if (endMins <= startMins) {
    // Dienst geht über Mitternacht oder ist 24h
    endDate = format(addDays(startDate, 1), 'yyyy-MM-dd')
  }

  // Sonderfall: exakt gleiche Zeit = 24h-Dienst
  if (startTime === endTime) {
    endDate = format(addDays(startDate, 1), 'yyyy-MM-dd')
  }

  return {
    start: `${shiftDate}T${startTime}:00`,
    end: `${endDate}T${endTime}:00`,
  }
}

export async function createShift(
  monthlyPlanId: string,
  formData: unknown
): Promise<ServerActionResult<Shift>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = shiftSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { start, end } = buildStartEnd(
    parsed.data.shift_date,
    parsed.data.start_time,
    parsed.data.end_time
  )

  const { data, error } = await supabase
    .from('shifts')
    .insert({
      monthly_plan_id: monthlyPlanId,
      employee_id: parsed.data.employee_id,
      shift_type_id: parsed.data.shift_type_id ?? null,
      shift_date: parsed.data.shift_date,
      start_time: start,
      end_time: end,
      break_minutes: parsed.data.break_minutes,
      category: parsed.data.category,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'shift.created',
    entityType: 'shift',
    entityId: data.id,
    newData: data as Record<string, unknown>,
  })

  revalidatePath(`/admin/planning/${new Date(start).getFullYear()}/${new Date(start).getMonth() + 1}`)
  return { success: true, data }
}

export async function updateShift(
  id: string,
  formData: unknown
): Promise<ServerActionResult<Shift>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = shiftSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data: oldData } = await supabase
    .from('shifts')
    .select()
    .eq('id', id)
    .single()

  const { start, end } = buildStartEnd(
    parsed.data.shift_date,
    parsed.data.start_time,
    parsed.data.end_time
  )

  const { data, error } = await supabase
    .from('shifts')
    .update({
      employee_id: parsed.data.employee_id,
      shift_type_id: parsed.data.shift_type_id ?? null,
      shift_date: parsed.data.shift_date,
      start_time: start,
      end_time: end,
      break_minutes: parsed.data.break_minutes,
      category: parsed.data.category,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'shift.updated',
    entityType: 'shift',
    entityId: id,
    oldData: oldData as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  })

  revalidatePath(`/admin/planning`)
  return { success: true, data }
}

export async function deleteShift(id: string): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { data: oldData } = await supabase
    .from('shifts')
    .select()
    .eq('id', id)
    .single()

  const { error } = await supabase.from('shifts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'shift.deleted',
    entityType: 'shift',
    entityId: id,
    oldData: oldData as Record<string, unknown>,
  })

  revalidatePath('/admin/planning')
  return { success: true }
}
