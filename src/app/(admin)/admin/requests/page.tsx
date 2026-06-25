import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getAllShiftRequests } from '@/lib/queries/shift-requests'
import { TopBar } from '@/components/layout/TopBar'
import { RequestCard } from '@/components/requests/RequestCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { RequestsClientWrapper } from './RequestsClientWrapper'
import { MessageSquare } from 'lucide-react'

export const metadata = { title: 'Wünsche | Admin' }

export default async function AdminRequestsPage() {
  const requests = await getAllShiftRequests().catch(() => [])

  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Mitarbeiter-Wünsche"
        subtitle={`${pending.length} offen, ${reviewed.length} bearbeitet`}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <RequestsClientWrapper initialRequests={requests} />
        </div>
      </main>
    </div>
  )
}
