'use client'

import { ShiftRequestWithEmployee } from '@/types/database'
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_ICONS, PRIORITY_LABELS } from '@/lib/constants/labels'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { deleteShiftRequest, reviewShiftRequest } from '@/lib/actions/shift-requests'
import { toast } from 'sonner'
import { Check, X, Trash2 } from 'lucide-react'

interface RequestCardProps {
  request: ShiftRequestWithEmployee
  isAdmin?: boolean
  onUpdate?: () => void
}

export function RequestCard({ request, isAdmin, onUpdate }: RequestCardProps) {
  const emp = request.employee

  const handleReview = async (status: 'approved' | 'rejected') => {
    const result = await reviewShiftRequest(request.id, status)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(status === 'approved' ? 'Wunsch übernommen' : 'Wunsch abgelehnt')
    onUpdate?.()
  }

  const handleDelete = async () => {
    const result = await deleteShiftRequest(request.id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Wunsch gelöscht')
    onUpdate?.()
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Typ-Icon */}
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-base flex-shrink-0">
            {REQUEST_TYPE_ICONS[request.request_type]}
          </div>

          <div>
            {isAdmin && (
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: emp.color }}
                />
                <span className="text-sm font-semibold text-slate-900">
                  {emp.first_name} {emp.last_name}
                </span>
                <span className="text-xs text-slate-400">({emp.abbreviation})</span>
              </div>
            )}

            <p className="text-sm font-medium text-slate-800">
              {REQUEST_TYPE_LABELS[request.request_type]}
            </p>

            <p className="text-sm text-slate-600 mt-0.5">
              {formatDate(request.request_date)}
              {request.end_date && ` – ${formatDate(request.end_date)}`}
              {request.start_time && ` · ${request.start_time.substring(0, 5)}`}
              {request.end_time && `–${request.end_time.substring(0, 5)}`}
            </p>

            {request.notes && (
              <p className="text-xs text-slate-500 mt-1 italic">{request.notes}</p>
            )}

            {isAdmin && request.admin_notes && (
              <p className="text-xs text-indigo-600 mt-1 bg-indigo-50 px-2 py-1 rounded">
                Admin: {request.admin_notes}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusBadge status={request.status} variant="request" />
          <span className="text-xs text-slate-400">{PRIORITY_LABELS[request.priority]}</span>
        </div>
      </div>

      {/* Admin-Aktionen */}
      {isAdmin && request.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <Button
            size="sm"
            onClick={() => handleReview('approved')}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Übernehmen
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReview('rejected')}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Ablehnen
          </Button>
        </div>
      )}

      {/* Mitarbeiter kann eigene pending-Wünsche löschen */}
      {!isAdmin && request.status === 'pending' && (
        <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-7 text-xs">
                <Trash2 className="w-3 h-3 mr-1" /> Zurückziehen
              </Button>
            }
            title="Wunsch zurückziehen"
            description="Möchten Sie diesen Wunsch wirklich löschen?"
            confirmLabel="Löschen"
            confirmVariant="destructive"
            onConfirm={handleDelete}
          />
        </div>
      )}
    </div>
  )
}
