'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { employeeSchema } from '@/lib/validations/employee'
import { ServerActionResult } from '@/types/app'
import { Employee } from '@/types/database'
import { insertAuditLog } from './audit'
import { revalidatePath } from 'next/cache'

export async function createEmployee(
  formData: unknown
): Promise<ServerActionResult<Employee>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = employeeSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Kürzel bereits vergeben.' }
    }
    return { success: false, error: error.message }
  }

  await insertAuditLog({
    actorId: user.id,
    action: 'employee.created',
    entityType: 'employee',
    entityId: data.id,
    newData: data as Record<string, unknown>,
  })

  revalidatePath('/admin/employees')
  return { success: true, data }
}

export async function updateEmployee(
  id: string,
  formData: unknown
): Promise<ServerActionResult<Employee>> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const parsed = employeeSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validierungsfehler',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data: oldData } = await supabase
    .from('employees')
    .select()
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('employees')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'employee.updated',
    entityType: 'employee',
    entityId: id,
    oldData: oldData as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  })

  revalidatePath('/admin/employees')
  revalidatePath(`/admin/employees/${id}`)
  return { success: true, data }
}

export async function archiveEmployee(id: string): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nicht angemeldet' }

  const { error } = await supabase
    .from('employees')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await insertAuditLog({
    actorId: user.id,
    action: 'employee.archived',
    entityType: 'employee',
    entityId: id,
  })

  revalidatePath('/admin/employees')
  return { success: true }
}
