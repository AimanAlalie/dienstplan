import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ShiftRequestWithEmployee } from '@/types/database'

export async function getAllShiftRequests(
  month?: number,
  year?: number,
  status?: string
): Promise<ShiftRequestWithEmployee[]> {
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('shift_requests')
    .select('*, employee:employees(*)')
    .order('request_date')

  if (year && month) {
    query = query
      .gte('request_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte(
        'request_date',
        `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
      )
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ShiftRequestWithEmployee[]
}

export async function getMyShiftRequests(
  year?: number,
  month?: number
): Promise<ShiftRequestWithEmployee[]> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return []

  let query = supabase
    .from('shift_requests')
    .select('*, employee:employees(*)')
    .eq('employee_id', employee.id)
    .order('request_date', { ascending: false })

  if (year && month) {
    query = query
      .gte('request_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte(
        'request_date',
        `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
      )
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ShiftRequestWithEmployee[]
}
