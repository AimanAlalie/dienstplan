'use client'

import { useState } from 'react'
import { ShiftRequestWithEmployee } from '@/types/database'
import { RequestCard } from '@/components/requests/RequestCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  initialRequests: ShiftRequestWithEmployee[]
}

type FilterTab = 'pending' | 'all'

export function RequestsClientWrapper({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests)
  const [tab, setTab] = useState<FilterTab>('pending')

  const displayed = tab === 'pending'
    ? requests.filter((r) => r.status === 'pending')
    : requests

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  const handleUpdate = () => {
    // Simple page reload — Server Component re-fetches
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {[
          { id: 'pending' as FilterTab, label: `Offen${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { id: 'all' as FilterTab, label: 'Alle' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Karten */}
      {displayed.length > 0 ? (
        <div className="grid gap-3">
          {displayed.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isAdmin
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title={tab === 'pending' ? 'Keine offenen Wünsche' : 'Keine Wünsche vorhanden'}
          description={
            tab === 'pending'
              ? 'Alle Mitarbeiter-Wünsche wurden bearbeitet.'
              : 'Noch keine Wünsche eingegangen.'
          }
        />
      )}
    </div>
  )
}
