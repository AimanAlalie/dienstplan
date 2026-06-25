'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { shiftRequestSchema } from '@/lib/validations/shift'
import { ServerActionResult } from '@/types/app'
import { ShiftRequest } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { notifyEmployeeRequestStatus } from './notifications'

export async function createShiftRequest(
  formData: unknown
): Promise<ServerActionResult<ShiftRequest & { hasVacationConflict?: boolean }>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = shiftRequestSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return { success: false, error: 'Mitarbeiterprofil nicht gefunden' }

  // Wunschfrist prüfen
  if (parsed.data.request_date) {
    const reqDate = new Date(parsed.data.request_date)
    const year = reqDate.getFullYear()
    const month = reqDate.getMonth() + 1

    const { data: deadline } = await supabase
      .from('request_deadlines')
      .select('deadline_at')
      .eq('year', year)
      .eq('month', month)
      .single()

    if (deadline && new Date(deadline.deadline_at) < new Date()) {
      return {
        success: false,
        error: 'Die Wunschfrist für diesen Monat ist abgelaufen. Neue Wünsche können nicht mehr eingetragen werden.',
      }
    }
  }

  // Anonyme Urlaubskonflikt-Prüfung
  let hasVacationConflict = false
  if (parsed.data.request_type === 'vacation') {
    const startDate = parsed.data.request_date
    const endDate = parsed.data.end_date ?? parsed.data.request_date

    const { data: conflictExists } = await supabase.rpc(
      'has_conflicting_vacation_request',
      {
        p_employee_id: employee.id,
        p_start_date: startDate,
        p_end_date: endDate,
      }
    )
    hasVacationConflict = conflictExists === true
  }

  const { data, error } = await supabase
    .from('shift_requests')
    .insert({
      employee_id: employee.id,
      request_type: parsed.data.request_type,
      request_date: parsed.data.request_date,
      end_date: parsed.data.end_date ?? null,
      start_time: parsed.data.start_time ?? null,
      end_time: parsed.data.end_time ?? null,
      priority: parsed.data.priority,
      notes: parsed.data.notes || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/requests')
  revalidatePath('/admin/requests')
  return { success: true, data: { ...data, hasVacationConflict } }
}

export async function reviewShiftRequest(
  id: string,
  status: 'approved' | 'modified' | 'rejected',
  adminNotes?: string
): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  // Vorher Antrag laden für Benachrichtigung
  const { data: request } = await supabase
    .from('shift_requests')
    .select('employee_id, request_type')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('shift_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  // Benachrichtigung an Mitarbeiter senden
  if (request) {
    await notifyEmployeeRequestStatus(
      request.employee_id,
      request.request_type,
      status,
      id
    ).catch(() => {}) // Fehler hier nicht blockieren
  }

  revalidatePath('/admin/requests')
  revalidatePath('/admin/leaves')
  return { success: true }
}

export async function deleteShiftRequest(id: string): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('shift_requests')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/requests')
  revalidatePath('/admin/requests')
  return { success: true }
}
