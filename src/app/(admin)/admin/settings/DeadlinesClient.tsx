'use client'

import { useState } from 'react'
import { RequestDeadline } from '@/types/database'
import { upsertRequestDeadline, deleteRequestDeadline } from '@/lib/actions/request-deadlines'
import { formatDateTime, formatMonthYear } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialDeadlines: RequestDeadline[]
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function DeadlinesClient({ initialDeadlines }: Props) {
  const [deadlines, setDeadlines] = useState<RequestDeadline[]>(initialDeadlines)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<RequestDeadline | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentYear = new Date().getFullYear()
  const [formYear, setFormYear] = useState(currentYear)
  const [formMonth, setFormMonth] = useState(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2)
  const [formDeadline, setFormDeadline] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const openNew = () => {
    setEditingDeadline(null)
    setFormYear(currentYear)
    setFormMonth(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2)
    setFormDeadline('')
    setFormNotes('')
    setDialogOpen(true)
  }

  const openEdit = (d: RequestDeadline) => {
    setEditingDeadline(d)
    setFormYear(d.year)
    setFormMonth(d.month)
    // ISO zu datetime-local konvertieren
    const dt = new Date(d.deadline_at)
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setFormDeadline(local)
    setFormNotes(d.notes ?? '')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formDeadline) { toast.error('Bitte Frist-Zeitpunkt wählen'); return }
    setIsSubmitting(true)
    const result = await upsertRequestDeadline({
      year: formYear,
      month: formMonth,
      deadline_at: new Date(formDeadline).toISOString(),
      notes: formNotes,
    })
    setIsSubmitting(false)
    if (!result.success) { toast.error(result.error); return }
    if (result.data) {
      setDeadlines((prev) => {
        const filtered = prev.filter((d) => !(d.year === result.data!.year && d.month === result.data!.month))
        return [...filtered, result.data!].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
      })
    }
    toast.success('Wunschfrist gespeichert')
    setDialogOpen(false)
  }

  const handleDelete = async (d: RequestDeadline) => {
    const result = await deleteRequestDeadline(d.year, d.month)
    if (!result.success) { toast.error(result.error); return }
    setDeadlines((prev) => prev.filter((x) => !(x.year === d.year && x.month === d.month)))
    toast.success('Frist entfernt')
  }

  const isExpired = (d: RequestDeadline) => new Date(d.deadline_at) < new Date()

  return (
    <>
      <div className="divide-y divide-slate-100">
        {deadlines.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Noch keine Wunschfristen definiert.</p>
        ) : (
          deadlines.map((d) => {
            const expired = isExpired(d)
            return (
              <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  {expired
                    ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  }
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {formatMonthYear(d.year, d.month)}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Frist: {formatDateTime(d.deadline_at)}
                      {expired && <span className="text-amber-600 ml-1.5 font-medium">· Abgelaufen</span>}
                    </p>
                    {d.notes && <p className="text-xs text-slate-400 mt-0.5">{d.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(d)} className="h-8 w-8 p-0">
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    }
                    title="Frist löschen"
                    description={`Wunschfrist für ${formatMonthYear(d.year, d.month)} wirklich entfernen?`}
                    confirmLabel="Löschen"
                    confirmVariant="destructive"
                    onConfirm={() => handleDelete(d)}
                  />
                </div>
              </div>
            )
          })
        )}
        <div className="px-5 py-3">
          <Button onClick={openNew} size="sm" variant="outline" className="gap-1.5 w-full justify-center">
            <Plus className="w-3.5 h-3.5" />
            Neue Wunschfrist
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              {editingDeadline ? 'Wunschfrist bearbeiten' : 'Neue Wunschfrist'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Legt fest, bis wann Mitarbeiter ihre Wünsche für den gewählten Monat einreichen können.
              Nach Ablauf ist die Eingabe gesperrt.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Jahr</Label>
                <Input
                  type="number"
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  min={currentYear}
                  max={currentYear + 3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monat (Planungsmonat)</Label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Frist-Zeitpunkt *</Label>
              <Input
                type="datetime-local"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                Beispiel: Für Maiplanlegen Sie Frist auf "15. April 23:59"
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Notiz (optional)</Label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="z. B. Bitte bis 15. April einreichen"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
