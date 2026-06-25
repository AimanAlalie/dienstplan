'use client'

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
import { Loader2, UserCheck } from 'lucide-react'

interface EmployeeFormProps {
  employee?: Employee
  linkableProfiles?: LinkableProfile[]
  onSuccess?: () => void
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
    defaultValues: {
      profile_id: employee?.profile_id ?? null,
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      phone: employee?.phone ?? '',
      color: employee?.color ?? EMPLOYEE_COLORS[0],
      employee_number: employee?.employee_number ?? '',
      hired_at: employee?.hired_at ?? '',
      notes: employee?.notes ?? '',
    },
  })

  const color = watch('color') ?? EMPLOYEE_COLORS[0]

  const handleProfileSelect = (profileId: string | null) => {
    if (!profileId || profileId === '__none__') {
      setValue('profile_id', null)
      return
    }
    const profile = linkableProfiles.find((p) => p.id === profileId)
    setValue('profile_id', profileId)
    if (profile) {
      // Namen aus Registrierung vorausfüllen (editierbar)
      const parts = (profile.full_name ?? '').trim().split(/\s+/)
      setValue('first_name', parts[0] ?? '')
      setValue('last_name', parts.slice(1).join(' ') ?? '')
      if (profile.phone) setValue('phone', profile.phone)
    }
  }

  const onSubmit = async (values: EmployeeFormValues) => {
    const result = isEdit
      ? await updateEmployee(employee!.id, values)
      : await createEmployee(values)

    if (!result.success) {
      toast.error(result.error ?? 'Fehler beim Speichern')
      return
    }

    toast.success(isEdit ? 'Mitarbeiter aktualisiert' : 'Mitarbeiter angelegt')
    onSuccess?.()
    router.push('/admin/employees')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Benutzerkonto verknüpfen (optional) */}
      {linkableProfiles.length > 0 && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
          <Label className="flex items-center gap-1.5 text-indigo-700 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            Aus Registrierung übernehmen
            <span className="text-slate-400 font-normal text-xs">(optional)</span>
          </Label>
          <Select
            defaultValue={employee?.profile_id ?? '__none__'}
            onValueChange={handleProfileSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Registriertes Konto wählen…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Kein Konto verknüpfen —</SelectItem>
              {linkableProfiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex flex-col">
                    <span>{p.full_name ?? p.email}</span>
                    <span className="text-xs text-slate-400">{p.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            Felder werden automatisch ausgefüllt — du kannst sie danach noch anpassen.
          </p>
        </div>
      )}

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Vorname <span className="text-red-500">*</span></Label>
          <Input
            {...register('first_name')}
            placeholder="Max"
            className={errors.first_name ? 'border-red-400' : ''}
          />
          {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Nachname <span className="text-red-500">*</span></Label>
          <Input
            {...register('last_name')}
            placeholder="Mustermann"
            className={errors.last_name ? 'border-red-400' : ''}
          />
          {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Telefon */}
      <div className="space-y-1.5">
        <Label>
          Telefonnummer <span className="text-slate-400 text-xs">(optional)</span>
        </Label>
        <Input {...register('phone')} type="tel" placeholder="+49 123 456789" />
      </div>

      {/* Farbe */}
      <div className="space-y-2">
        <Label>Farbe im Kalender <span className="text-red-500">*</span></Label>
        <ColorPicker value={color} onChange={(c) => setValue('color', c)} />
      </div>

      {/* Personalnummer */}
      <div className="space-y-1.5">
        <Label>Personalnummer <span className="text-slate-400 text-xs">(optional)</span></Label>
        <Input {...register('employee_number')} placeholder="001" />
      </div>

      {/* Einstellungsdatum */}
      <div className="space-y-1.5">
        <Label>Einstellungsdatum <span className="text-slate-400 text-xs">(optional)</span></Label>
        <Input {...register('hired_at')} type="date" />
      </div>

      {/* Notizen */}
      <div className="space-y-1.5">
        <Label>Notizen <span className="text-slate-400 text-xs">(optional)</span></Label>
        <Textarea {...register('notes')} placeholder="Interne Hinweise..." rows={3} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Speichern...</>
            : isEdit ? 'Änderungen speichern' : 'Mitarbeiter anlegen'}
        </Button>
      </div>
    </form>
  )
}
