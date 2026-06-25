import { getSupabaseServerClient } from '@/lib/supabase/server'
import { AdminEvent } from '@/types/database'

export async function getAdminEvents(
  year?: number,
  month?: number,
  includeHidden = true
): Promise<AdminEvent[]> {
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('admin_events')
    .select('*')
    .order('event_date')

  if (year && month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
    query = query.gte('event_date', from).lte('event_date', to)
  }

  if (!includeHidden) {
    query = query.eq('is_visible_to_employees', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getAdminEventById(id: string): Promise<AdminEvent | null> {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('admin_events')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}
