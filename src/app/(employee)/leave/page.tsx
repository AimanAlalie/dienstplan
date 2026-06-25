import { getMyShiftRequests } from '@/lib/queries/shift-requests'
import { getDeadlineForMonth } from '@/lib/queries/request-deadlines'
import { computeDeadlineStatus } from '@/lib/queries/request-deadlines'
import { TopBar } from '@/components/layout/TopBar'
import { currentMonthYear, formatMonthYear } from '@/lib/utils/date'
import { LeaveClient } from './LeaveClient'

export const metadata = { title: 'Mein Urlaub | Dienstplan' }

export default async function EmployeeLeavePage() {
  const { year, month } = currentMonthYear()

  // Nächster Monat als Planungsmonat
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const [allRequests, deadline] = await Promise.all([
    getMyShiftRequests().catch(() => []),
    getDeadlineForMonth(nextYear, nextMonth).catch(() => null),
  ])

  const vacationRequests = allRequests.filter((r) => r.request_type === 'vacation')
  const deadlineStatus = computeDeadlineStatus(deadline)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Mein Urlaub" subtitle="Urlaubswünsche einreichen & Status verfolgen" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <LeaveClient
            initialRequests={vacationRequests}
            deadlineStatus={deadlineStatus}
            nextYear={nextYear}
            nextMonth={nextMonth}
          />
        </div>
      </main>
    </div>
  )
}
