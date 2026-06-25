import { TopBar } from '@/components/layout/TopBar'
import { getPublishedShiftsForMonth } from '@/lib/queries/shifts'
import { getEmployees } from '@/lib/queries/employees'
import { getMyShiftRequests } from '@/lib/queries/shift-requests'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { currentMonthYear, formatMonthYear } from '@/lib/utils/date'
import { EmployeeCalendarClient } from './EmployeeCalendarClient'

export const metadata = { title: 'Mein Kalender | Dienstplan' }

export default async function EmployeeCalendarPage() {
  const { year, month } = currentMonthYear()
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  let myEmployeeId: string | null = null
  if (user) {
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('profile_id', user.id)
      .single()
    myEmployeeId = emp?.id ?? null
  }

  const [shifts, employees, myRequests] = await Promise.all([
    getPublishedShiftsForMonth(year, month).catch(() => []),
    getEmployees(true).catch(() => []),
    getMyShiftRequests(year, month).catch(() => []),
  ])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Mein Kalender" subtitle={formatMonthYear(year, month)} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <EmployeeCalendarClient
            shifts={shifts}
            employees={employees}
            myEmployeeId={myEmployeeId}
            myRequests={myRequests}
            year={year}
            month={month}
          />
        </div>
      </main>
    </div>
  )
}
