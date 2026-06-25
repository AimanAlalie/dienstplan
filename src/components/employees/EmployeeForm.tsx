'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { employeeSchema, EmployeeFormValues } from '@/lib/validations/employee'
import { createEmployee, updateEmployee } from '@/lib/actions/employees'
import { Employee } from '@/types/database'
import { LinkableProfile } from '@/lib/queries/employees'
import { EMPLOYEE_COLORS } from '@/lib/utils/color'
import { ColorPicker } from './ColorPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Link2 } from 'lucide-react'

interface EmployeeFormProps {
  employee?: Employee
  linkableProfiles?: LinkableProfile[]
  onSuccess?: () => void
}

function suggestAbbreviation(firstName: string, lastName: string): string {
  return (
    (firstName?.[0] ?? '') + (lastName?.[0] ?? '') + (lastName?.[1] ?? '')
  ).toUpperCase()
}

export function EmployeeForm({ employee, linkableProfiles = [], onSuccess }: EmployeeFormProps) {
  const router = useRouter()
  const isEdit = !!employee

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          profile_id: employee.profile_id ?? undefined,
          first_name: employee.first_name,
          last_name: employee.last_name,
          abbreviation: employee.abbreviation,
          color: employee.color,
          position: employee.position ?? '',
          department: employee.department ?? '',
          employment_type: employee.employment_type,
          weekly_hours: employee.weekly_hours ?? undefined,
          phone: employee.phone ?? '',
          employee_number: employee.employee_number ?? '',
          status: employee.status,
          notes: employee.notes ?? '',
          hired_at: employee.hired_at ?? '',
        }
      : {
          color: EMPLOYEE_COLORS[0],
          employment_type: 'full_time',
          status: 'active',
        },
  })

  const color = watch('color') ?? EMPLOYEE_COLORS[0]
  const firstName = watch('first_name') ?? ''
  const lastName = watch('last_name') ?? ''

  const onSubmit = async (values: EmployeeFormValues) => {
    const result = isEdit
      ? await updateEmployee(employee!.id, values)
      : await createEmployee(values)

    if (!result.success) {
      toast.error(result.error ?? 'Fehler beim Speichern')
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, msgs]) => {
          toast.error(`${field}: ${msgs.join(', ')}`)
        })
      }
      return
    }

    toast.success(isEdit ? 'Mitarbeiter aktualisiert' : 'Mitarbeiter angelegt')
    onSuccess?.()
    router.push('/admin/employees')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Vorname *</Label>
          <Input
            {...register('first_name')}
            placeholder="Max"
            onBlur={() => {
              if (!isEdit) {
                setValue('abbreviation', suggestAbbreviation(firstName, lastName))
              }
            }}
          />
          {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Nachname *</Label>
          <Input
            {...register('last_name')}
            placeholder="Mustermann"
            onBlur={() => {
              if (!isEdit) {
                setValue('abbreviation', suggestAbbreviation(firstName, lastName))
              }
            }}
          />
          {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Kürzel & Nummer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Kürzel * <span className="text-slate-400 text-xs">(im Kalender)</span></Label>
          <Input
            {...register('abbreviation')}
            placeholder="MMS"
            className="uppercase"
          />
          {errors.abbreviation && <p className="text-xs text-red-500">{errors.abbreviation.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Personalnummer</Label>
          <Input {...register('employee_number')} placeholder="001" />
        </div>
      </div>

      {/* Farbe */}
      <div className="space-y-2">
        <Label>Farbe im Kalender *</Label>
        <ColorPicker
          value={color}
          onChange={(c) => setValue('color', c)}
        />
      </div>

      {/* Position & Abteilung */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Position</Label>
          <Input {...register('position')} placeholder="Pflegefachkraft" />
        </div>
        <div className="space-y-1.5">
          <Label>Abteilung</Label>
          <Input {...register('department')} placeholder="Ambulant" />
        </div>
      </div>

      {/* Beschäftigung */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Beschäftigungsart *</Label>
          <Select
            defaultValue={employee?.employment_type ?? 'full_time'}
            onValueChange={(v) => setValue('employment_type', v as EmployeeFormValues['employment_type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Vollzeit</SelectItem>
              <SelectItem value="part_time">Teilzeit</SelectItem>
              <SelectItem value="mini_job">Minijob</SelectItem>
              <SelectItem value="trainee">Auszubildende/r</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Wochenstunden</Label>
          <Input
            {...register('weekly_hours')}
            type="number"
            placeholder="40"
            min="0"
            max="60"
          />
        </div>
      </div>

      {/* Kontakt & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input {...register('phone')} placeholder="+49 123 456789" />
        </div>
        <div className="space-y-1.5">
          <Label>Status *</Label>
          <Select
            defaultValue={employee?.status ?? 'active'}
            onValueChange={(v) => setValue('status', v as EmployeeFormValues['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="inactive">Inaktiv</SelectItem>
              <SelectItem value="archived">Archiviert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Einstellungsdatum */}
      <div className="space-y-1.5">
        <Label>Einstellungsdatum</Label>
        <Input {...register('hired_at')} type="date" />
      </div>

      {/* Notizen */}
      <div className="space-y-1.5">
        <Label>Notizen</Label>
        <Textarea
          {...register('notes')}
          placeholder="Interne Hinweise..."
          rows={3}
        />
      </div>

      {/* Benutzerkonto verknüpfen */}
      {(linkableProfiles.length > 0 || employee?.profile_id) && (
        <div className="space-y-1.5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
          <Label className="flex items-center gap-1.5 text-indigo-700">
            <Link2 className="w-3.5 h-3.5" />
            App-Benutzerkonto verknüpfen
          </Label>
          <Select
            defaultValue={employee?.profile_id ?? '__none__'}
            onValueChange={(v) => setValue('profile_id', v === '__none__' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kein Benutzerkonto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Kein Benutzerkonto —</SelectItem>
              {linkableProfiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name ? `${p.full_name} (${p.email})` : p.email}
                </SelectItem>
              ))}
              {/* Wenn ein bereits verlinktes Profil nicht mehr in linkableProfiles ist */}
              {employee?.profile_id && !linkableProfiles.find((p) => p.id === employee.profile_id) && (
                <SelectItem value={employee.profile_id}>
                  {employee.profile_id} (aktuell verknüpft)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            Verknüpftes Konto kann im Mitarbeiter-Kalender Dienste sehen und Wünsche eintragen.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
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
            isEdit ? 'Änderungen speichern' : 'Mitarbeiter anlegen'
          )}
        </Button>
      </div>
    </form>
  )
}
