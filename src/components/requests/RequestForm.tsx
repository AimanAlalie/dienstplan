'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { shiftRequestSchema, ShiftRequestFormValues } from '@/lib/validations/shift'
import { createShiftRequest } from '@/lib/actions/shift-requests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface RequestFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  excludeTypes?: string[]
}

const requestTypeLabels = [
  { value: 'availability', label: 'Verfügbar', icon: '✓', description: 'Ich bin verfügbar' },
  { value: 'unavailability', label: 'Nicht verfügbar', icon: '✗', description: 'Ich kann nicht' },
  { value: 'vacation', label: 'Urlaub', icon: '☀', description: 'Urlaubswunsch' },
  { value: 'preference', label: 'Wunschdienst', icon: '★', description: 'Ich möchte diesen Dienst' },
  { value: 'block_shift', label: 'Blockdienst', icon: '⊞', description: 'Mehrere Tage am Stück' },
]

export function RequestForm({ onSuccess, onCancel, excludeTypes = [] }: RequestFormProps) {
  const filteredTypes = requestTypeLabels.filter((t) => !excludeTypes.includes(t.value))
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftRequestFormValues>({
    resolver: zodResolver(shiftRequestSchema),
    defaultValues: { priority: 1 },
  })

  const requestType = watch('request_type')
  const showTimeFields = requestType === 'availability' || requestType === 'preference'
  const showEndDate = requestType === 'vacation' || requestType === 'block_shift'

  const onSubmit = async (values: ShiftRequestFormValues) => {
    const result = await createShiftRequest(values)

    if (!result.success) {
      toast.error(result.error ?? 'Fehler beim Speichern')
      return
    }

    toast.success('Wunsch eingetragen')
    reset()
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Typ */}
      <div className="space-y-2">
        <Label>Art des Wunsches *</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filteredTypes.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('request_type', value as ShiftRequestFormValues['request_type'])}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                requestType === value
                  ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {errors.request_type && (
          <p className="text-xs text-red-500">Art des Wunsches wählen</p>
        )}
      </div>

      {/* Datum */}
      <div className={`grid gap-4 ${showEndDate ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-1.5">
          <Label>{showEndDate ? 'Von' : 'Datum'} *</Label>
          <Input
            {...register('request_date')}
            type="date"
            className={errors.request_date ? 'border-red-400' : ''}
          />
          {errors.request_date && (
            <p className="text-xs text-red-500">{errors.request_date.message}</p>
          )}
        </div>
        {showEndDate && (
          <div className="space-y-1.5">
            <Label>Bis</Label>
            <Input {...register('end_date')} type="date" />
          </div>
        )}
      </div>

      {/* Zeitfelder (optional) */}
      {showTimeFields && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Von (Uhrzeit)</Label>
            <Input {...register('start_time')} type="time" />
          </div>
          <div className="space-y-1.5">
            <Label>Bis (Uhrzeit)</Label>
            <Input {...register('end_time')} type="time" />
          </div>
        </div>
      )}

      {/* Priorität */}
      <div className="space-y-1.5">
        <Label>Priorität</Label>
        <Select
          defaultValue="1"
          onValueChange={(v) => setValue('priority', Number(v) as 1 | 2 | 3)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Normal</SelectItem>
            <SelectItem value="2">Hoch</SelectItem>
            <SelectItem value="3">Dringend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notiz */}
      <div className="space-y-1.5">
        <Label>Notiz / Begründung</Label>
        <Textarea
          {...register('notes')}
          placeholder="Optionale Begründung oder Hinweis..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichern...</>
          ) : (
            'Wunsch eintragen'
          )}
        </Button>
      </div>
    </form>
  )
}
