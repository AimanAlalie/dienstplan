'use client'

import { useState, useMemo } from 'react'
import { ShiftRequestWithEmployee } from '@/types/database'
import { reviewShiftRequest, deleteShiftRequest } from '@/lib/actions/shift-requests'
import { formatDate } from '@/lib/utils/date'
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, PRIORITY_LABELS } from '@/lib/constants/labels'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Check, X, Pencil, ChevronDown, ChevronUp, Umbrella } from 'lucide-react'
import { getContrastColor } from '@/lib/utils/color'

interface Props {
  vacationRequests: ShiftRequestWithEmployee[]
}

const STATUS_TABS = [
  { key: 'all', label: 'Alle' },
  { key: 'pending', label: 'Offen' },
  { key: 'approved', label: 'Genehmigt' },
  { key: 'modified', label: 'Geändert' },
  { key: 'rejected', label: 'Abgelehnt' },
]

export function LeavesClientWrapper({ vacationRequests }: Props) {
  const [activeTab, setActiveTab] = useState('pending')
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (activeTab === 'all') return vacationRequests
    return vacationRequests.filter((r) => r.status === activeTab)
  }, [vacationRequests, activeTab])

  const handleReview = async (
    id: string,
    status: 'approved' | 'modified' | 'rejected'
  ) => {
    setLoadingId(id)
    const result = await reviewShiftRequest(id, status, adminNotes[id])
    setLoadingId(null)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    const labels = { approved: 'genehmigt', modified: 'angepasst', rejected: 'abgelehnt' }
    toast.success(`Urlaubsantrag ${labels[status]}`)
    setExpandedId(null)
  }

  return (
    <div className="space-y-4">
      {/* Tab-Filter */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? vacationRequests.length
              : vacationRequests.filter((r) => r.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Umbrella}
          title="Keine Urlaubsanträge"
          description="In dieser Kategorie liegen keine Urlaubsanträge vor."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => {
            const emp = req.employee
            const isExpanded = expandedId === req.id
            const isLoading = loadingId === req.id
            const isPending = req.status === 'pending'
            const duration = req.end_date && req.end_date !== req.request_date
              ? Math.round((new Date(req.end_date).getTime() - new Date(req.request_date).getTime()) / 86400000) + 1
              : 1

            return (
              <Card key={req.id} className={cn(
                'border transition-shadow',
                isPending && 'border-amber-200 bg-amber-50/30'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Mitarbeiter-Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: emp.color,
                        color: getContrastColor(emp.color),
                      }}
                    >
                      {emp.abbreviation}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {emp.first_name} {emp.last_name}
                        </span>
                        <StatusBadge status={req.status} variant="request" />
                        {isPending && (
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                            Ausstehend
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mt-1">
                        <span className="font-medium">{formatDate(req.request_date)}</span>
                        {req.end_date && req.end_date !== req.request_date && (
                          <> – <span className="font-medium">{formatDate(req.end_date)}</span></>
                        )}
                        <span className="text-slate-400 ml-1.5">({duration} Tag{duration !== 1 ? 'e' : ''})</span>
                      </p>

                      {req.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{req.notes}"</p>
                      )}

                      {req.admin_notes && (
                        <p className="text-xs text-slate-500 mt-1 bg-slate-100 rounded px-2 py-1">
                          <span className="font-medium">Admin-Notiz:</span> {req.admin_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-400">
                        {new Date(req.created_at).toLocaleDateString('de-DE')}
                      </span>
                      {isPending && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="ml-2 p-1 rounded hover:bg-slate-100"
                        >
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4 text-slate-500" />
                            : <ChevronDown className="w-4 h-4 text-slate-500" />
                          }
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Aktionsbereich */}
                  {isPending && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">
                          Admin-Notiz (optional)
                        </label>
                        <Textarea
                          placeholder="Begründung oder Hinweis..."
                          value={adminNotes[req.id] ?? ''}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleReview(req.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Genehmigen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleReview(req.id, 'modified')}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Anpassen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleReview(req.id, 'rejected')}
                          className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
