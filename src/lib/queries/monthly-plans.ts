import { getSupabaseServerClient } from '@/lib/supabase/server'
import { MonthlyPlan } from '@/types/database'

export async function getMonthlyPlan(
  year: number,
  month: number
): Promise<MonthlyPlan | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .single()

  if (error) return null
  return data
}

export async function getAllMonthlyPlans(): Promise<MonthlyPlan[]> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('monthly_plans')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) throw error
  return data ?? []
}
