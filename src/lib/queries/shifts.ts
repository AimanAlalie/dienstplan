import { getSupabaseServerClient } from '@/lib/supabase/server'
import { ShiftWithEmployee } from '@/types/database'

export async function getShiftsForMonth(
  year: number,
  month: number
): Promise<ShiftWithEmployee[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      employee:employees(*),
      shift_type:shift_types(*)
    `)
    .gte('shift_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lte(
      'shift_date',
      `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
    )
    .order('shift_date')
    .order('start_time')

  if (error) throw error
  return (data ?? []) as ShiftWithEmployee[]
}

export async function getShiftsByPlanId(
  planId: string
): Promise<ShiftWithEmployee[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      employee:employees(*),
      shift_type:shift_types(*)
    `)
    .eq('monthly_plan_id', planId)
    .order('shift_date')
    .order('start_time')

  if (error) throw error
  return (data ?? []) as ShiftWithEmployee[]
}

export async function getMyShiftsForMonth(
  year: number,
  month: number
): Promise<ShiftWithEmployee[]> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!employee) return []

  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      employee:employees(*),
      shift_type:shift_types(*)
    `)
    .eq('employee_id', employee.id)
    .gte('shift_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lte(
      'shift_date',
      `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
    )
    .order('shift_date')

  if (error) throw error
  return (data ?? []) as ShiftWithEmployee[]
}

// Alle veröffentlichten Dienste eines Monats für Mitarbeiter-Kalender
export async function getPublishedShiftsForMonth(
  year: number,
  month: number
): Promise<ShiftWithEmployee[]> {
  const supabase = await getSupabaseServerClient()

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  // Nur Dienste aus veröffentlichten Plänen
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      employee:employees(*),
      shift_type:shift_types(*),
      monthly_plan:monthly_plans!monthly_plan_id(status)
    `)
    .gte('shift_date', from)
    .lte('shift_date', to)
    .order('shift_date')
    .order('start_time')

  if (error) throw error

  // Clientseitig filtern: nur published Plans
  return ((data ?? []) as (ShiftWithEmployee & { monthly_plan: { status: string } | null })[])
    .filter((s) => s.monthly_plan?.status === 'published') as ShiftWithEmployee[]
}

// Urlaubsanträge aus shift_requests für Übersicht (Admin)
export async function getVacationRequests(): Promise<any[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('shift_requests')
    .select('*, employee:employees(*)')
    .eq('request_type', 'vacation')
    .order('request_date', { ascending: false })

  if (error) throw error
  return data ?? []
}
