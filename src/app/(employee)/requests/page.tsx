import { TopBar } from '@/components/layout/TopBar'
import { getMyShiftRequests } from '@/lib/queries/shift-requests'
import { getDeadlineForMonth, computeDeadlineStatus } from '@/lib/queries/request-deadlines'
import { EmployeeRequestsClient } from './EmployeeRequestsClient'
import { currentMonthYear } from '@/lib/utils/date'

export const metadata = { title: 'Meine Wünsche | Dienstplan' }

export default async function EmployeeRequestsPage() {
  const { year, month } = currentMonthYear()
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const [requests, deadline] = await Promise.all([
    getMyShiftRequests().catch(() => []),
    getDeadlineForMonth(nextYear, nextMonth).catch(() => null),
  ])

  // Urlaub und Sperrtage werden auf dedizierten Seiten verwaltet
  const generalRequests = requests.filter(
    (r) => !['vacation', 'unavailability'].includes(r.request_type)
  )

  const deadlineStatus = computeDeadlineStatus(deadline)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Wünsche & Anträge" subtitle="Wunschdienste & Verfügbarkeiten" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <EmployeeRequestsClient
            initialRequests={generalRequests}
            deadlineStatus={deadlineStatus}
            nextYear={nextYear}
            nextMonth={nextMonth}
          />
        </div>
      </main>
    </div>
  )
}
