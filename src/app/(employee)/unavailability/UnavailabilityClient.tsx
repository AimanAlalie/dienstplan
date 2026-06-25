'use client'

import { useState } from 'react'
import { ShiftRequestWithEmployee } from '@/types/database'
import { DeadlineStatus } from '@/types/app'
import { createShiftRequest, deleteShiftRequest } from '@/lib/actions/shift-requests'
import { formatDate, formatMonthYear } from '@/lib/utils/date'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { BanIcon, Plus, Trash2, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialRequests: ShiftRequestWithEmployee[]
  deadlineStatus: DeadlineStatus
  nextYear: number
  nextMonth: number
}

export function UnavailabilityClient({ initialRequests, deadlineStatus, nextYear, nextMonth }: Props) {
  const [requests, setRequests] = useState(initialRequests)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blockDate, setBlockDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!blockDate) { toast.error('Bitte Datum wählen'); return }
    setIsSubmitting(true)
    const result = await createShiftRequest({
      request_type: 'unavailability',
      request_date: blockDate,
      end_date: endDate || null,
      priority: 1,
      notes,
    })
    setIsSubmitting(false)
    if (!result.success) { toast.error(result.error); return }
    if (result.data) {
      setRequests((prev) => [result.data as any, ...prev])
    }
    toast.success('Sperrtag eingetragen')
    setDialogOpen(false)
    setBlockDate('')
    setEndDate('')
    setNotes('')
  }

  const handleDelete = async (id: string) => {
    const result = await deleteShiftRequest(id)
    if (!result.success) { toast.error(result.error); return }
    setRequests((prev) => prev.filter((r) => r.id !== id))
    toast.success('Sperrtag entfernt')
  }

  return (
    <>
      {/* Frist-Banner */}
      {deadlineStatus.hasDeadline && (
        <div className={cn(
          'rounded-xl border p-4 mb-5 flex items-start gap-3',
          deadlineStatus.isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        )}>
          <Clock className={cn('w-4 h-4 flex-shrink-0 mt-0.5', deadlineStatus.isExpired ? 'text-red-500' : 'text-blue-500')} />
          <div>
            <p className={cn('text-sm font-semibold', deadlineStatus.isExpired ? 'text-red-800' : 'text-blue-800')}>
              {deadlineStatus.isExpired
                ? 'Eingabefrist abgelaufen'
                : `Frist für ${formatMonthYear(nextYear, nextMonth)}`
              }
            </p>
            <p className={cn('text-xs mt-0.5', deadlineStatus.isExpired ? 'text-red-600' : 'text-blue-600')}>
              {deadlineStatus.isExpired
                ? 'Sperrtage können für diesen Monat nicht mehr eingetragen werden.'
                : `Bis ${new Date(deadlineStatus.deadlineAt!).toLocaleString('de-DE')}${deadlineStatus.daysLeft !== null ? ` (noch ${deadlineStatus.daysLeft} Tag${deadlineStatus.daysLeft !== 1 ? 'e' : ''})` : ''}`
              }
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-700">
          {requests.length} Sperrtag{requests.length !== 1 ? 'e' : ''}
        </h2>
        <Button
          onClick={() => setDialogOpen(true)}
          size="sm"
          disabled={deadlineStatus.isExpired}
          className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Sperrtag eintragen
        </Button>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={BanIcon}
          title="Keine Sperrtage"
          description="Tragen Sie Tage ein, an denen Sie nicht verfügbar sind."
          action={
            <Button onClick={() => setDialogOpen(true)} size="sm" disabled={deadlineStatus.isExpired} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Sperrtag eintragen
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id} className="border border-slate-200">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <BanIcon className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatDate(req.request_date)}
                    {req.end_date && req.end_date !== req.request_date && ` – ${formatDate(req.end_date)}`}
                  </span>
                  {req.notes && <p className="text-xs text-slate-500 mt-0.5">{req.notes}</p>}
                  {req.admin_notes && (
                    <p className="text-xs text-slate-500 mt-1 bg-slate-100 rounded px-2 py-1">
                      Rückmeldung: {req.admin_notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={req.status} variant="request" />
                  {req.status === 'pending' && (
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                      title="Sperrtag entfernen"
                      description="Möchten Sie diesen Sperrtag zurückziehen?"
                      confirmLabel="Entfernen"
                      confirmVariant="destructive"
                      onConfirm={() => handleDelete(req.id)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BanIcon className="w-4 h-4 text-red-500" />
              Sperrtag eintragen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Sperrtage sind Tage, an denen Sie grundsätzlich nicht für Dienste eingeplant werden möchten.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Datum *</Label>
                <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Bis (optional)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={blockDate} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Begründung (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="z. B. Arzttermin, Familienangelegenheit..." />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Abbrechen</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !blockDate} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eintragen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
