'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ServerActionResult } from '@/types/app'
import { Notification } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function getMyNotifications(): Promise<Notification[]> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return []

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}

export async function getMyUnreadCount(): Promise<number> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return 0

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employee.id)
    .eq('is_read', false)

  return count ?? 0
}

export async function markNotificationRead(id: string): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/notifications')
  return { success: true }
}

export async function markAllNotificationsRead(): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return { success: false, error: 'Mitarbeiterprofil nicht gefunden' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('employee_id', employee.id)
    .eq('is_read', false)

  if (error) return { success: false, error: error.message }

  revalidatePath('/notifications')
  return { success: true }
}

// Admin-Funktion: Benachrichtigung an alle Mitarbeiter senden
// (z.B. bei Plan-Veröffentlichung)
export async function notifyAllEmployeesPlanPublished(
  year: number,
  month: number,
  monthName: string
): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, employee_settings(notify_plan_published)')
    .eq('status', 'active')

  if (!employees) return { success: true }

  const title = `Dienstplan ${monthName} veröffentlicht`
  const body = `Der Dienstplan für ${monthName} wurde veröffentlicht und ist jetzt einsehbar.`

  for (const emp of employees) {
    const settings = (emp as any).employee_settings
    const wantsNotification = !settings || settings.notify_plan_published !== false

    if (wantsNotification) {
      await supabase.rpc('create_notification', {
        p_employee_id: emp.id,
        p_type: 'plan_published',
        p_title: title,
        p_body: body,
        p_related_entity_type: 'monthly_plan',
        p_related_entity_id: null,
      })
    }
  }

  return { success: true }
}

// Benachrichtigung bei Antrag-Status-Änderung
export async function notifyEmployeeRequestStatus(
  employeeId: string,
  requestType: string,
  newStatus: string,
  requestId: string
): Promise<void> {
  const supabase = await getSupabaseServerClient()

  const statusLabels: Record<string, string> = {
    approved: 'übernommen',
    modified: 'angepasst',
    rejected: 'abgelehnt',
  }

  const typeLabels: Record<string, string> = {
    vacation: 'Urlaubswunsch',
    unavailability: 'Sperrtag',
    preference: 'Wunschdienst',
    block_shift: 'Blockdienst-Wunsch',
    availability: 'Verfügbarkeit',
  }

  const statusLabel = statusLabels[newStatus] ?? newStatus
  const typeLabel = typeLabels[requestType] ?? requestType

  await supabase.rpc('create_notification', {
    p_employee_id: employeeId,
    p_type: 'request_status',
    p_title: `Antrag ${statusLabel}`,
    p_body: `Dein ${typeLabel} wurde ${statusLabel}.`,
    p_related_entity_type: 'shift_request',
    p_related_entity_id: requestId,
  })
}
