'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ServerActionResult } from '@/types/app'
import { MonthlyPlan } from '@/types/database'
import { insertAuditLog } from './audit'
import { notifyAllEmployeesPlanPublished } from './notifications'
import { formatMonthYear } from '@/lib/utils/date'
import { revalidatePath } from 'next/cache'

export async function getOrCreateMonthlyPlan(
  year: number,
  month: number
): Promise<ServerActionResult<MonthlyPlan>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  // Prüfen ob bereits vorhanden
  const { data: existing } = await supabase
    .from('monthly_plans')
    .select()
    .eq('year', year)
    .eq('month', month)
    .single()

  if (existing) return { success: true, data: existing }

  // Neu erstellen
  const { data, error } = await supabase
    .from('monthly_plans')
    .insert({ year, month, status: 'draft', created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'monthly_plan.created',
    entityType: 'monthly_plan',
    entityId: data.id,
    newData: { year, month, status: 'draft' },
  })

  return { success: true, data }
}

export async function publishMonthlyPlan(
  id: string
): Promise<ServerActionResult<MonthlyPlan>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { data, error } = await supabase
    .from('monthly_plans')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: user.id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'monthly_plan.published',
    entityType: 'monthly_plan',
    entityId: id,
    newData: { status: 'published' },
  })

  // Benachrichtigungen an alle Mitarbeiter
  await notifyAllEmployeesPlanPublished(
    data.year,
    data.month,
    formatMonthYear(data.year, data.month)
  ).catch(() => {})

  revalidatePath('/admin/planning')
  revalidatePath('/calendar')
  return { success: true, data }
}

export async function unpublishMonthlyPlan(
  id: string
): Promise<ServerActionResult<MonthlyPlan>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { data, error } = await supabase
    .from('monthly_plans')
    .update({ status: 'draft', published_at: null, published_by: null })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'monthly_plan.unpublished',
    entityType: 'monthly_plan',
    entityId: id,
  })

  revalidatePath('/admin/planning')
  revalidatePath('/calendar')
  return { success: true, data }
}

export async function updatePlanNotes(
  id: string,
  notes: string
): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('monthly_plans')
    .update({ notes })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
