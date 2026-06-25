'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { shiftSchema, ShiftFormValues } from '@/lib/validations/shift'
import { createShift, updateShift } from '@/lib/actions/shifts'
import { Employee, ShiftWithEmployee } from '@/types/database'
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
import { getContrastColor } from '@/lib/utils/color'
import { SHIFT_CATEGORY_LABELS } from '@/lib/constants/labels'

interface ShiftEventFormProps {
  monthlyPlanId: string
  employees: Employee[]
  initialDate?: string
  initialEmployeeId?: string
  existingShift?: ShiftWithEmployee
  onSuccess: () => void
  onCancel: () => void
}

export function ShiftEventForm({
  monthlyPlanId,
  employees,
  initialDate,
  initialEmployeeId,
  existingShift,
  onSuccess,
  onCancel,
}: ShiftEventFormProps) {
  const isEdit = !!existingShift

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: existingShift
      ? {
          employee_id: existingShift.employee_id,
          shift_type_id: existingShift.shift_type_id ?? undefined,
          shift_date: existingShift.shift_date,
          start_time: existingShift.start_time.substring(11, 16),
          end_time: existingShift.end_time.substring(11, 16),
          category: existingShift.category,
          notes: existingShift.notes ?? '',
          status: existingShift.status,
        }
      : {
          shift_date: initialDate ?? '',
          employee_id: initialEmployeeId ?? '',
          start_time: '08:00',
          end_time: '16:00',
          category: 'normal',
          status: 'scheduled',
        },
  })

  const selectedEmployeeId = watch('employee_id')
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  const onSubmit = async (values: ShiftFormValues) => {
    const result = isEdit
      ? await updateShift(existingShift!.id, values)
      : await createShift(monthlyPlanId, values)

    if (!result.success) {
      toast.error(result.error ?? 'Fehler beim Speichern')
      return
    }

    toast.success(isEdit ? 'Dienst aktualisiert' : 'Dienst angelegt')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Mitarbeiter */}
      <div className="space-y-1.5">
        <Label>Mitarbeiter *</Label>
        <Select
          defaultValue={(existingShift?.employee_id ?? initialEmployeeId ?? '') as string}
          onValueChange={(v) => v && setValue('employee_id', v as any)}
        >
          <SelectTrigger className={errors.employee_id ? 'border-red-400' : ''}>
            <SelectValue placeholder="Mitarbeiter wählen..." />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: emp.color }}
                  />
                  {emp.first_name} {emp.last_name}
                  <span className="text-slate-400 text-xs">({emp.abbreviation})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.employee_id && <p className="text-xs text-red-500">{errors.employee_id.message}</p>}
      </div>

      {/* Farbvorschau */}
      {selectedEmployee && (
        <div
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            backgroundColor: selectedEmployee.color,
            color: getContrastColor(selectedEmployee.color),
          }}
        >
          {selectedEmployee.first_name} {selectedEmployee.last_name} — {selectedEmployee.abbreviation}
        </div>
      )}

      {/* Kategorie */}
      <div className="space-y-1.5">
        <Label>Dienstkategorie *</Label>
        <Select
          defaultValue={existingShift?.category ?? 'normal'}
          onValueChange={(v) => setValue('category', v as ShiftFormValues['category'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SHIFT_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* Datum */}
      <div className="space-y-1.5">
        <Label>Datum *</Label>
        <Input
          {...register('shift_date')}
          type="date"
          className={errors.shift_date ? 'border-red-400' : ''}
        />
        {errors.shift_date && <p className="text-xs text-red-500">{errors.shift_date.message}</p>}
      </div>

      {/* Zeiten */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Startzeit *</Label>
          <Input
            {...register('start_time')}
            type="time"
            className={errors.start_time ? 'border-red-400' : ''}
          />
          {errors.start_time && <p className="text-xs text-red-500">{errors.start_time.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Endzeit *</Label>
          <Input
            {...register('end_time')}
            type="time"
            className={errors.end_time ? 'border-red-400' : ''}
          />
          <p className="text-xs text-slate-400">Selbe Zeit = 24h-Dienst</p>
        </div>
      </div>


      {/* Status */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            defaultValue={existingShift?.status ?? 'scheduled'}
            onValueChange={(v) => setValue('status', v as ShiftFormValues['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Geplant</SelectItem>
              <SelectItem value="cancelled">Abgesagt</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notizen <span className="text-slate-400 text-xs">(nur Admin sichtbar)</span></Label>
        <Textarea {...register('notes')} placeholder="Interne Hinweise zum Dienst..." rows={2} />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichern...</>
          ) : (
            isEdit ? 'Dienst aktualisieren' : 'Dienst eintragen'
          )}
        </Button>
      </div>
    </form>
  )
}
