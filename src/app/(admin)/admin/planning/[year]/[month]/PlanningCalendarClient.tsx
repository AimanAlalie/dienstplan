'use client'

import { useState, useCallback } from 'react'
import { Employee, MonthlyPlan, ShiftType, ShiftWithEmployee } from '@/types/database'
import { PlanningCalendar } from '@/components/calendar/PlanningCalendar'
import { PublishButton } from '@/components/planning/PublishButton'
import { TaxAdvisorExportButton } from '@/components/planning/TaxAdvisorExportButton'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Props {
  plan: MonthlyPlan
  initialShifts: ShiftWithEmployee[]
  employees: Employee[]
  shiftTypes: ShiftType[]
}

export function PlanningCalendarClient({ plan: initialPlan, initialShifts, employees, shiftTypes }: Props) {
  const [plan, setPlan] = useState<MonthlyPlan>(initialPlan)
  const [shifts, setShifts] = useState<ShiftWithEmployee[]>(initialShifts)
  const supabase = getSupabaseBrowserClient()

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('shifts')
      .select('*, employee:employees(*), shift_type:shift_types(*)')
      .eq('monthly_plan_id', plan.id)
      .order('shift_date')
      .order('start_time')

    if (data) setShifts(data as ShiftWithEmployee[])
  }, [plan.id, supabase])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Publish-Aktion oben rechts in der Toolbar-Area */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-end gap-2">
        <TaxAdvisorExportButton year={plan.year} month={plan.month} />
        <PublishButton plan={plan} onUpdate={setPlan} />
      </div>

      <div className="flex-1 overflow-hidden">
        <PlanningCalendar
          plan={plan}
          shifts={shifts}
          employees={employees}
          shiftTypes={shiftTypes}
          onRefresh={refresh}
        />
      </div>
    </div>
  )
}
