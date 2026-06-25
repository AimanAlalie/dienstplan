import { notFound } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateMonthlyPlan } from '@/lib/actions/monthly-plans'
import { getShiftsByPlanId } from '@/lib/queries/shifts'
import { getEmployees } from '@/lib/queries/employees'
import { TopBar } from '@/components/layout/TopBar'
import { PlanningCalendarClient } from './PlanningCalendarClient'
import { PlanMonthNav } from '@/components/planning/PlanMonthNav'
import { PublishButton } from '@/components/planning/PublishButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatMonthYear } from '@/lib/utils/date'

interface Props {
  params: Promise<{ year: string; month: string }>
}

export default async function PlanningPage({ params }: Props) {
  const { year: yearStr, month: monthStr } = await params
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    notFound()
  }

  const supabase = await getSupabaseServerClient()

  // Sicherstellen dass ein Plan für diesen Monat existiert
  const planResult = await getOrCreateMonthlyPlan(year, month)

  const DEMO_PLAN = {
    id: 'demo',
    year,
    month,
    status: 'draft' as const,
    notes: null,
    published_at: null,
    published_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  }

  const plan = planResult.success && planResult.data ? planResult.data : DEMO_PLAN

  const [shifts, employees, { data: shiftTypes }] = await Promise.all([
    planResult.success && planResult.data
      ? getShiftsByPlanId(plan.id).catch(() => [])
      : Promise.resolve([]),
    getEmployees(true).catch(() => []),
    supabase.from('shift_types').select('*').eq('is_active', true).order('sort_order'),
  ])

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={formatMonthYear(year, month)}
        subtitle="Dienstplanung"
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={plan.status} variant="plan" />
            <PlanMonthNav year={year} month={month} />
          </div>
        }
      />

      <PlanningCalendarClient
        plan={plan}
        initialShifts={shifts}
        employees={employees}
        shiftTypes={shiftTypes ?? []}
      />
    </div>
  )
}
