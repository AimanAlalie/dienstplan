'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { requestDeadlineSchema } from '@/lib/validations/shift'
import { ServerActionResult } from '@/types/app'
import { RequestDeadline } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function upsertRequestDeadline(
  formData: unknown
): Promise<ServerActionResult<RequestDeadline>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = requestDeadlineSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data, error } = await supabase
    .from('request_deadlines')
    .upsert(
      {
        year: parsed.data.year,
        month: parsed.data.month,
        deadline_at: parsed.data.deadline_at,
        notes: parsed.data.notes || null,
        created_by: user.id,
      },
      { onConflict: 'year,month' }
    )
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/settings')
  revalidatePath('/requests')
  return { success: true, data }
}

export async function deleteRequestDeadline(
  year: number,
  month: number
): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { error } = await supabase
    .from('request_deadlines')
    .delete()
    .eq('year', year)
    .eq('month', month)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/settings')
  revalidatePath('/requests')
  return { success: true }
}

export async function getDeadlineForMonth(
  year: number,
  month: number
): Promise<RequestDeadline | null> {
  const supabase = await getSupabaseServerClient()

  const { data } = await supabase
    .from('request_deadlines')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  return data ?? null
}
