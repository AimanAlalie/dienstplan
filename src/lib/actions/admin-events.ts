'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { adminEventSchema } from '@/lib/validations/shift'
import { ServerActionResult } from '@/types/app'
import { AdminEvent } from '@/types/database'
import { insertAuditLog } from './audit'
import { revalidatePath } from 'next/cache'

export async function createAdminEvent(
  formData: unknown
): Promise<ServerActionResult<AdminEvent>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = adminEventSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data, error } = await supabase
    .from('admin_events')
    .insert({
      title: parsed.data.title,
      event_date: parsed.data.event_date,
      end_date: parsed.data.end_date || null,
      start_time: parsed.data.start_time || null,
      end_time: parsed.data.end_time || null,
      event_type: parsed.data.event_type,
      description: parsed.data.description || null,
      is_visible_to_employees: parsed.data.is_visible_to_employees,
      color: parsed.data.color,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'admin_event.created',
    entityType: 'admin_event',
    entityId: data.id,
    newData: data as Record<string, unknown>,
  })

  revalidatePath('/admin/events')
  return { success: true, data }
}

export async function updateAdminEvent(
  id: string,
  formData: unknown
): Promise<ServerActionResult<AdminEvent>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = adminEventSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data, error } = await supabase
    .from('admin_events')
    .update({
      title: parsed.data.title,
      event_date: parsed.data.event_date,
      end_date: parsed.data.end_date || null,
      start_time: parsed.data.start_time || null,
      end_time: parsed.data.end_time || null,
      event_type: parsed.data.event_type,
      description: parsed.data.description || null,
      is_visible_to_employees: parsed.data.is_visible_to_employees,
      color: parsed.data.color,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'admin_event.updated',
    entityType: 'admin_event',
    entityId: id,
    newData: data as Record<string, unknown>,
  })

  revalidatePath('/admin/events')
  return { success: true, data }
}

export async function deleteAdminEvent(id: string): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { error } = await supabase.from('admin_events').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'admin_event.deleted',
    entityType: 'admin_event',
    entityId: id,
  })

  revalidatePath('/admin/events')
  return { success: true }
}
