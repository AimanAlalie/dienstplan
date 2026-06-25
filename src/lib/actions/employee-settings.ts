'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { employeeSettingsSchema } from '@/lib/validations/shift'
import { ServerActionResult } from '@/types/app'
import { EmployeeSettings } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function upsertEmployeeSettings(
  formData: unknown
): Promise<ServerActionResult<EmployeeSettings>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = employeeSettingsSchema.safeParse(formData)
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

  const { data, error } = await supabase
    .from('employee_settings')
    .upsert(
      {
        employee_id: employee.id,
        ...parsed.data,
      },
      { onConflict: 'employee_id' }
    )
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/profile')
  revalidatePath('/notifications')
  return { success: true, data }
}

export async function getMyEmployeeSettings(): Promise<EmployeeSettings | null> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return null

  const { data } = await supabase
    .from('employee_settings')
    .select('*')
    .eq('employee_id', employee.id)
    .single()

  return data ?? null
}
