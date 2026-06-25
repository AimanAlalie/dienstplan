'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShiftEventForm } from './ShiftEventForm'
import { Employee, ShiftType, ShiftWithEmployee } from '@/types/database'
import { deleteShift } from '@/lib/actions/shifts'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface ShiftDialogProps {
  open: boolean
  onClose: () => void
  monthlyPlanId: string
  employees: Employee[]
  shiftTypes: ShiftType[]
  initialDate?: string
  initialEmployeeId?: string
  existingShift?: ShiftWithEmployee
  onSaved: () => void
}

export function ShiftDialog({
  open,
  onClose,
  monthlyPlanId,
  employees,
  shiftTypes,
  initialDate,
  initialEmployeeId,
  existingShift,
  onSaved,
}: ShiftDialogProps) {
  const isEdit = !!existingShift

  const handleDelete = async () => {
    if (!existingShift) return
    const result = await deleteShift(existingShift.id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Dienst gelöscht')
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEdit ? 'Dienst bearbeiten' : 'Neuer Dienst'}
            </DialogTitle>
            {isEdit && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                }
                title="Dienst löschen"
                description="Möchten Sie diesen Dienst wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                confirmLabel="Löschen"
                confirmVariant="destructive"
                onConfirm={handleDelete}
              />
            )}
          </div>
        </DialogHeader>

        <ShiftEventForm
          monthlyPlanId={monthlyPlanId}
          employees={employees}
          shiftTypes={shiftTypes}
          initialDate={initialDate}
          initialEmployeeId={initialEmployeeId}
          existingShift={existingShift}
          onSuccess={() => {
            onSaved()
            onClose()
          }}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
