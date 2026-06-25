import { getAdminEvents } from '@/lib/queries/admin-events'
import { TopBar } from '@/components/layout/TopBar'
import { currentMonthYear, formatMonthYear } from '@/lib/utils/date'
import { AdminEventsClient } from './AdminEventsClient'

export const metadata = { title: 'Admin-Termine | Admin' }

export default async function AdminEventsPage() {
  const { year, month } = currentMonthYear()
  const events = await getAdminEvents(year, month).catch(() => [])

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Admin-Termine"
        subtitle={`Interne Termine — ${formatMonthYear(year, month)}`}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AdminEventsClient initialEvents={events} year={year} month={month} />
        </div>
      </main>
    </div>
  )
}
