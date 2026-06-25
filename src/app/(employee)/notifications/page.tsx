import { getMyNotifications } from '@/lib/actions/notifications'
import { getMyEmployeeSettings } from '@/lib/actions/employee-settings'
import { TopBar } from '@/components/layout/TopBar'
import { NotificationsClient } from './NotificationsClient'

export const metadata = { title: 'Benachrichtigungen | Dienstplan' }

export default async function NotificationsPage() {
  const [notifications, settings] = await Promise.all([
    getMyNotifications().catch(() => []),
    getMyEmployeeSettings().catch(() => null),
  ])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Benachrichtigungen" subtitle="Mitteilungen & Einstellungen" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <NotificationsClient
            initialNotifications={notifications}
            initialSettings={settings}
          />
        </div>
      </main>
    </div>
  )
}
