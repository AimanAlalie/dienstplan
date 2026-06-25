'use client'

import { useState } from 'react'
import { ShiftRequestWithEmployee } from '@/types/database'
import { DeadlineStatus } from '@/types/app'
import { RequestForm } from '@/components/requests/RequestForm'
import { RequestCard } from '@/components/requests/RequestCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMonthYear } from '@/lib/utils/date'
import { MessageSquare, Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  initialRequests: ShiftRequestWithEmployee[]
  deadlineStatus: DeadlineStatus
  nextYear: number
  nextMonth: number
}

export function EmployeeRequestsClient({ initialRequests, deadlineStatus, nextYear, nextMonth }: Props) {
  const [requests, setRequests] = useState(initialRequests)
  const [showForm, setShowForm] = useState(false)

  const handleUpdate = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-5">
      {/* Frist-Banner */}
      {deadlineStatus.hasDeadline && (
        <div className={cn(
          'rounded-xl border p-4 flex items-start gap-3',
          deadlineStatus.isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        )}>
          <Clock className={cn('w-4 h-4 flex-shrink-0 mt-0.5', deadlineStatus.isExpired ? 'text-red-500' : 'text-blue-500')} />
          <div>
            <p className={cn('text-sm font-semibold', deadlineStatus.isExpired ? 'text-red-800' : 'text-blue-800')}>
              {deadlineStatus.isExpired
                ? `Wunschfrist für ${formatMonthYear(nextYear, nextMonth)} abgelaufen`
                : `Wunschfrist für ${formatMonthYear(nextYear, nextMonth)}`
              }
            </p>
            <p className={cn('text-xs mt-0.5', deadlineStatus.isExpired ? 'text-red-600' : 'text-blue-600')}>
              {deadlineStatus.isExpired
                ? 'Neue Wünsche können für diesen Monat nicht mehr eingereicht werden.'
                : `Einreichung möglich bis ${new Date(deadlineStatus.deadlineAt!).toLocaleString('de-DE')}${deadlineStatus.daysLeft !== null ? ` · noch ${deadlineStatus.daysLeft} Tag${deadlineStatus.daysLeft !== 1 ? 'e' : ''}` : ''}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Schnell-Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/leave"
          className="flex items-center gap-2.5 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
        >
          <span className="text-xl">☀️</span>
          <div>
            <p className="text-sm font-semibold text-sky-900">Urlaub beantragen</p>
            <p className="text-xs text-sky-600">Urlaubswünsche</p>
          </div>
        </Link>
        <Link
          href="/unavailability"
          className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
        >
          <span className="text-xl">🚫</span>
          <div>
            <p className="text-sm font-semibold text-red-900">Sperrtag eintragen</p>
            <p className="text-xs text-red-600">Nicht verfügbar</p>
          </div>
        </Link>
      </div>

      {/* Formular für andere Wünsche */}
      {showForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Wunsch eintragen</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestForm
              onSuccess={() => { setShowForm(false); handleUpdate() }}
              onCancel={() => setShowForm(false)}
              excludeTypes={['vacation', 'unavailability']}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setShowForm(true)}
          disabled={deadlineStatus.isExpired}
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Wunschdienst / Präferenz eintragen
        </Button>
      )}

      {/* Liste */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Meine Wünsche ({requests.length})
        </h2>
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                isAdmin={false}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Noch keine Wünsche"
            description="Tragen Sie Ihre Wunschdienste oder Präferenzen ein."
          />
        )}
      </div>
    </div>
  )
}
