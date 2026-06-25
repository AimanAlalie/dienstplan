import { getSupabaseServerClient } from '@/lib/supabase/server'
import { RequestDeadline } from '@/types/database'
import { DeadlineStatus } from '@/types/app'
import { differenceInDays, parseISO } from 'date-fns'

export async function getAllDeadlines(): Promise<RequestDeadline[]> {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('request_deadlines')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return data ?? []
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

export function computeDeadlineStatus(deadline: RequestDeadline | null): DeadlineStatus {
  if (!deadline) {
    return { hasDeadline: false, isExpired: false, deadlineAt: null, daysLeft: null }
  }

  const now = new Date()
  const deadlineDate = parseISO(deadline.deadline_at)
  const isExpired = deadlineDate < now
  const daysLeft = isExpired ? 0 : differenceInDays(deadlineDate, now)

  return {
    hasDeadline: true,
    isExpired,
    deadlineAt: deadline.deadline_at,
    daysLeft,
  }
}
