import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Employee } from '@/types/database'

export async function getEmployees(includeInactive = false): Promise<Employee[]> {
  const supabase = await getSupabaseServerClient()
  let query = supabase.from('employees').select('*').order('last_name')

  if (!includeInactive) {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export interface LinkableProfile {
  id: string
  email: string
  full_name: string | null
}

export async function getLinkableProfiles(currentLinkedId?: string | null): Promise<LinkableProfile[]> {
  const supabase = await getSupabaseServerClient()

  const [{ data: allProfiles }, { data: linked }] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name').order('full_name'),
    supabase.from('employees').select('profile_id').not('profile_id', 'is', null),
  ])

  const linkedSet = new Set(
    (linked ?? [])
      .map((e: { profile_id: string | null }) => e.profile_id)
      .filter((id): id is string => !!id && id !== currentLinkedId)
  )

  return ((allProfiles ?? []) as LinkableProfile[]).filter((p) => !linkedSet.has(p.id))
}

export async function getMyEmployee(): Promise<Employee | null> {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  if (error) return null
  return data
}
