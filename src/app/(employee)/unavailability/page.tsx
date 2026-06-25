import { getMyShiftRequests } from '@/lib/queries/shift-requests'
import { getDeadlineForMonth, computeDeadlineStatus } from '@/lib/queries/request-deadlines'
import { TopBar } from '@/components/layout/TopBar'
import { currentMonthYear } from '@/lib/utils/date'
import { UnavailabilityClient } from './UnavailabilityClient'

export const metadata = { title: 'Sperrtage | Dienstplan' }

export default async function UnavailabilityPage() {
  const { year, month } = currentMonthYear()
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const [allRequests, deadline] = await Promise.all([
    getMyShiftRequests().catch(() => []),
    getDeadlineForMonth(nextYear, nextMonth).catch(() => null),
  ])

  const unavailableRequests = allRequests.filter((r) => r.request_type === 'unavailability')
  const deadlineStatus = computeDeadlineStatus(deadline)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Sperrtage" subtitle="Nicht-verfügbare Tage einreichen" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <UnavailabilityClient
            initialRequests={unavailableRequests}
            deadlineStatus={deadlineStatus}
            nextYear={nextYear}
            nextMonth={nextMonth}
          />
        </div>
      </main>
    </div>
  )
}
