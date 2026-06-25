'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { createShiftRequest } from '@/lib/actions/shift-requests'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

const schema = z.object({
  request_type: z.enum(['vacation', 'unavailability', 'preference', 'availability', 'block_shift']),
  request_date: z.string().min(1),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  priority: z.number().int().min(1).max(3).default(1),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const REQUEST_TYPES = [
  { value: 'vacation',       label: 'Urlaub',       icon: '☀️', color: 'bg-sky-50 border-sky-300 text-sky-700',    active: 'bg-sky-500 border-sky-500 text-white' },
  { value: 'unavailability', label: 'Sperrtag',     icon: '🚫', color: 'bg-red-50 border-red-300 text-red-700',    active: 'bg-red-500 border-red-500 text-white' },
  { value: 'preference',     label: 'Wunschdienst', icon: '⭐', color: 'bg-violet-50 border-violet-300 text-violet-700', active: 'bg-violet-500 border-violet-500 text-white' },
  { value: 'availability',   label: 'Verfügbar',    icon: '✅', color: 'bg-emerald-50 border-emerald-300 text-emerald-700', active: 'bg-emerald-500 border-emerald-500 text-white' },
] as const

interface Props {
  open: boolean
  onClose: () => void
  date: string
  deadlineExpired?: boolean
}

export function RequestEntryDialog({ open, onClose, date, deadlineExpired }: Props) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<FormValues['request_type'] | null>(null)

  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { request_date: date, priority: 1 },
    })

  const requestType = watch('request_type')
  const showEndDate = requestType === 'vacation' || requestType === 'block_shift'
  const showTimes   = requestType === 'preference' || requestType === 'availability'

  const handleTypeSelect = (type: FormValues['request_type']) => {
    setSelectedType(type)
    setValue('request_type', type)
  }

  const handleClose = () => {
    reset()
    setSelectedType(null)
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    const result = await createShiftRequest(values)
    if (!result.success) {
      toast.error(result.error ?? 'Fehler beim Speichern')
      return
    }
    if ((result.data as any)?.hasVacationConflict) {
      toast.warning('Eingetragen – ein anderer Mitarbeiter hat für diesen Zeitraum ebenfalls Urlaub beantragt.')
    } else {
      toast.success('Eingetragen!')
    }
    handleClose()
    router.refresh()
  }

  const dateLabel = date
    ? format(parseISO(date), 'EEEE, d. MMMM yyyy', { locale: de })
    : ''

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eintrag für {dateLabel}</DialogTitle>
        </DialogHeader>

        {deadlineExpired && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            Die Wunschfrist für diesen Monat ist abgelaufen.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Typ-Auswahl */}
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_TYPES.map(({ value, label, icon, color, active }) => (
              <button
                key={value}
                type="button"
                disabled={deadlineExpired}
                onClick={() => handleTypeSelect(value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 ${
                  selectedType === value ? active : color
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          {errors.request_type && (
            <p className="text-xs text-red-500">Bitte eine Art auswählen</p>
          )}

          {selectedType && (
            <>
              {/* Datum */}
              <div className={`grid gap-3 ${showEndDate ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-1.5">
                  <Label>{showEndDate ? 'Von' : 'Datum'}</Label>
                  <Input {...register('request_date')} type="date" defaultValue={date} />
                </div>
                {showEndDate && (
                  <div className="space-y-1.5">
                    <Label>Bis</Label>
                    <Input {...register('end_date')} type="date" defaultValue={date} />
                  </div>
                )}
              </div>

              {/* Uhrzeiten (optional) */}
              {showTimes && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Von Uhrzeit</Label>
                    <Input {...register('start_time')} type="time" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bis Uhrzeit</Label>
                    <Input {...register('end_time')} type="time" />
                  </div>
                </div>
              )}

              {/* Notiz */}
              <div className="space-y-1.5">
                <Label>Notiz <span className="text-slate-400 text-xs">(optional)</span></Label>
                <Textarea {...register('notes')} placeholder="Begründung oder Hinweis..." rows={2} />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || deadlineExpired}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Speichern…</>
                    : 'Eintragen'}
                </Button>
              </div>
            </>
          )}

          {!selectedType && (
            <Button type="button" variant="outline" onClick={handleClose} className="w-full">
              Abbrechen
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
