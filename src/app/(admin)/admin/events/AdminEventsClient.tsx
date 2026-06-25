'use client'

import { useState } from 'react'
import { AdminEvent } from '@/types/database'
import { createAdminEvent, updateAdminEvent, deleteAdminEvent } from '@/lib/actions/admin-events'
import { adminEventSchema, AdminEventFormValues } from '@/lib/validations/shift'
import { ADMIN_EVENT_TYPE_LABELS, ADMIN_EVENT_TYPE_COLORS } from '@/lib/constants/labels'
import { formatDate } from '@/lib/utils/date'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, CalendarClock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getContrastColor } from '@/lib/utils/color'

interface Props {
  initialEvents: AdminEvent[]
  year: number
  month: number
}

export function AdminEventsClient({ initialEvents, year, month }: Props) {
  const [events, setEvents] = useState<AdminEvent[]>(initialEvents)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminEventFormValues>({
    resolver: zodResolver(adminEventSchema),
    defaultValues: { event_type: 'internal', is_visible_to_employees: false, color: '#64748b' },
  })

  const openNew = () => {
    setEditingEvent(null)
    reset({
      event_type: 'internal',
      is_visible_to_employees: false,
      color: '#64748b',
      event_date: `${year}-${String(month).padStart(2, '0')}-01`,
    })
    setDialogOpen(true)
  }

  const openEdit = (event: AdminEvent) => {
    setEditingEvent(event)
    reset({
      title: event.title,
      event_date: event.event_date,
      end_date: event.end_date ?? undefined,
      start_time: event.start_time ?? undefined,
      end_time: event.end_time ?? undefined,
      event_type: event.event_type,
      description: event.description ?? '',
      is_visible_to_employees: event.is_visible_to_employees,
      color: event.color,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: AdminEventFormValues) => {
    const result = editingEvent
      ? await updateAdminEvent(editingEvent.id, values)
      : await createAdminEvent(values)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    if (result.data) {
      if (editingEvent) {
        setEvents((prev) => prev.map((e) => e.id === editingEvent.id ? result.data! : e))
      } else {
        setEvents((prev) => [...prev, result.data!])
      }
    }

    toast.success(editingEvent ? 'Termin aktualisiert' : 'Termin angelegt')
    setDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    const result = await deleteAdminEvent(id)
    if (!result.success) { toast.error(result.error); return }
    setEvents((prev) => prev.filter((e) => e.id !== id))
    toast.success('Termin gelöscht')
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-700">{events.length} Termin{events.length !== 1 ? 'e' : ''}</h2>
        <Button onClick={openNew} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Neuer Termin
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Keine Admin-Termine"
          description="Legen Sie interne Termine für diesen Monat an."
          action={<Button onClick={openNew} size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />Erster Termin</Button>}
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{event.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {ADMIN_EVENT_TYPE_LABELS[event.event_type]}
                      </Badge>
                      {event.is_visible_to_employees ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                          <Eye className="w-3 h-3" /> Für MA sichtbar
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <EyeOff className="w-3 h-3" /> Intern
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(event.event_date)}
                      {event.end_date && event.end_date !== event.event_date && ` – ${formatDate(event.end_date)}`}
                      {event.start_time && ` · ${event.start_time.substring(0,5)}`}
                      {event.end_time && `–${event.end_time.substring(0,5)}`}
                    </p>
                    {event.description && (
                      <p className="text-xs text-slate-500 mt-1">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(event)} className="h-8 w-8 p-0">
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      }
                      title="Termin löschen"
                      description="Möchten Sie diesen Termin wirklich löschen?"
                      confirmLabel="Löschen"
                      confirmVariant="destructive"
                      onConfirm={() => handleDelete(event.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Termin bearbeiten' : 'Neuer Admin-Termin'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Titel *</Label>
              <Input {...register('title')} placeholder="Termin-Bezeichnung" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Datum *</Label>
                <Input {...register('event_date')} type="date" />
              </div>
              <div className="space-y-1.5">
                <Label>Bis (optional)</Label>
                <Input {...register('end_date')} type="date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Uhrzeit von</Label>
                <Input {...register('start_time')} type="time" />
              </div>
              <div className="space-y-1.5">
                <Label>Uhrzeit bis</Label>
                <Input {...register('end_time')} type="time" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Typ</Label>
                <Select
                  defaultValue={editingEvent?.event_type ?? 'internal'}
                  onValueChange={(v) => setValue('event_type', v as AdminEventFormValues['event_type'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ADMIN_EVENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Farbe</Label>
                <Input {...register('color')} type="color" className="h-10 p-1 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Beschreibung</Label>
              <Textarea {...register('description')} rows={2} placeholder="Interne Beschreibung..." />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="visible"
                {...register('is_visible_to_employees')}
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="visible" className="cursor-pointer">
                Für Mitarbeiter sichtbar
              </Label>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingEvent ? 'Aktualisieren' : 'Anlegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
