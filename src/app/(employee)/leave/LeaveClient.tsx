'use client'

import { useState } from 'react'
import { ShiftRequestWithEmployee } from '@/types/database'
import { DeadlineStatus } from '@/types/app'
import { createShiftRequest, deleteShiftRequest } from '@/lib/actions/shift-requests'
import { formatDate, formatMonthYear } from '@/lib/utils/date'
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/lib/constants/labels'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { Umbrella, Plus, Trash2, AlertTriangle, Clock, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialRequests: ShiftRequestWithEmployee[]
  deadlineStatus: DeadlineStatus
  nextYear: number
  nextMonth: number
}

export function LeaveClient({ initialRequests, deadlineStatus, nextYear, nextMonth }: Props) {
  const [requests, setRequests] = useState(initialRequests)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [vacationConflictWarning, setVacationConflictWarning] = useState(false)

  const handleSubmit = async () => {
    if (!startDate) { toast.error('Bitte Startdatum wählen'); return }
    setIsSubmitting(true)
    const result = await createShiftRequest({
      request_type: 'vacation',
      request_date: startDate,
      end_date: endDate || startDate,
      priority: 1,
      notes,
    })
    setIsSubmitting(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    if (result.data?.hasVacationConflict) {
      setVacationConflictWarning(true)
    }

    if (result.data) {
      setRequests((prev) => [result.data as any, ...prev])
    }
    toast.success('Urlaubswunsch eingereicht')
    setDialogOpen(false)
    setStartDate('')
    setEndDate('')
    setNotes('')
  }

  const handleDelete = async (id: string) => {
    const result = await deleteShiftRequest(id)
    if (!result.success) { toast.error(result.error); return }
    setRequests((prev) => prev.filter((r) => r.id !== id))
    toast.success('Urlaubswunsch zurückgezogen')
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const reviewedRequests = requests.filter((r) => r.status !== 'pending')

  return (
    <>
      {/* Wunschfrist-Banner */}
      {deadlineStatus.hasDeadline && (
        <div className={cn(
          'rounded-xl border p-4 mb-5 flex items-start gap-3',
          deadlineStatus.isExpired
            ? 'bg-red-50 border-red-200'
            : deadlineStatus.daysLeft !== null && deadlineStatus.daysLeft <= 3
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
        )}>
          <Clock className={cn(
            'w-4 h-4 flex-shrink-0 mt-0.5',
            deadlineStatus.isExpired ? 'text-red-500' : 'text-blue-500'
          )} />
          <div>
            <p className={cn(
              'text-sm font-semibold',
              deadlineStatus.isExpired ? 'text-red-800' : 'text-blue-800'
            )}>
              {deadlineStatus.isExpired
                ? 'Wunschfrist abgelaufen'
                : `Wunschfrist für ${formatMonthYear(nextYear, nextMonth)}`
              }
            </p>
            <p className={cn(
              'text-xs mt-0.5',
              deadlineStatus.isExpired ? 'text-red-600' : 'text-blue-600'
            )}>
              {deadlineStatus.isExpired
                ? 'Neue Urlaubswünsche können für diesen Monat nicht mehr eingereicht werden.'
                : `Einreichung möglich bis ${new Date(deadlineStatus.deadlineAt!).toLocaleString('de-DE')}${deadlineStatus.daysLeft !== null ? ` (noch ${deadlineStatus.daysLeft} Tag${deadlineStatus.daysLeft !== 1 ? 'e' : ''})` : ''}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Urlaubskonflikt-Warnung (anonym) */}
      {vacationConflictWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Hinweis zu Ihrem Urlaubswunsch</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Für den gewählten Zeitraum liegt bereits ein anderer Antrag vor.
              Die endgültige Entscheidung trifft die Planung.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-amber-600 mt-1 h-auto p-0"
              onClick={() => setVacationConflictWarning(false)}
            >
              Hinweis schließen
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-700">
          {requests.length} Urlaubswunsch{requests.length !== 1 ? 'e' : ''}
        </h2>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          disabled={deadlineStatus.isExpired}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Urlaub beantragen
        </Button>
      </div>

      {/* Offene Anträge */}
      {pendingRequests.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Offen</h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <LeaveCard key={req.id} request={req} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Bearbeitete Anträge */}
      {reviewedRequests.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bearbeitet</h3>
          <div className="space-y-2">
            {reviewedRequests.map((req) => (
              <LeaveCard key={req.id} request={req} onDelete={handleDelete} showDelete={false} />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <EmptyState
          icon={Umbrella}
          title="Keine Urlaubswünsche"
          description="Reichen Sie Ihren ersten Urlaubswunsch ein."
          action={
            <Button onClick={() => setDialogOpen(true)} size="sm" disabled={deadlineStatus.isExpired} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Urlaub beantragen
            </Button>
          }
        />
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Umbrella className="w-4 h-4 text-sky-500" />
              Urlaubswunsch einreichen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Von *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Bis (optional)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notiz (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Begründung oder Hinweis..."
                rows={2}
              />
            </div>
            <p className="text-xs text-slate-400">
              Ihr Urlaubswunsch wird an die Planung übermittelt.
              Eine Genehmigung ist damit nicht verbunden.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Abbrechen</Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !startDate}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Einreichen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function LeaveCard({
  request,
  onDelete,
  showDelete = true,
}: {
  request: ShiftRequestWithEmployee
  onDelete: (id: string) => void
  showDelete?: boolean
}) {
  const duration = request.end_date && request.end_date !== request.request_date
    ? Math.round((new Date(request.end_date).getTime() - new Date(request.request_date).getTime()) / 86400000) + 1
    : 1

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
          <Umbrella className="w-4 h-4 text-sky-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              {formatDate(request.request_date)}
              {request.end_date && request.end_date !== request.request_date && ` – ${formatDate(request.end_date)}`}
            </span>
            <span className="text-xs text-slate-400">({duration} Tag{duration !== 1 ? 'e' : ''})</span>
          </div>
          {request.notes && (
            <p className="text-xs text-slate-500 mt-0.5">{request.notes}</p>
          )}
          {request.admin_notes && (
            <p className="text-xs text-slate-500 mt-1 bg-slate-100 rounded px-2 py-1">
              Rückmeldung: {request.admin_notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={request.status} variant="request" />
          {showDelete && request.status === 'pending' && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              }
              title="Urlaubswunsch zurückziehen"
              description="Möchten Sie diesen Urlaubswunsch zurückziehen?"
              confirmLabel="Zurückziehen"
              confirmVariant="destructive"
              onConfirm={() => onDelete(request.id)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
