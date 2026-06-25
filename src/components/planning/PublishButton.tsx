'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { publishMonthlyPlan, unpublishMonthlyPlan } from '@/lib/actions/monthly-plans'
import { MonthlyPlan } from '@/types/database'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Globe, Lock, Loader2 } from 'lucide-react'

interface PublishButtonProps {
  plan: MonthlyPlan
  onUpdate: (plan: MonthlyPlan) => void
}

export function PublishButton({ plan, onUpdate }: PublishButtonProps) {
  const [loading, setLoading] = useState(false)
  const isPublished = plan.status === 'published'

  const handlePublish = async () => {
    setLoading(true)
    const result = await publishMonthlyPlan(plan.id)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Plan veröffentlicht — Mitarbeiter können ihn jetzt sehen')
    onUpdate(result.data!)
  }

  const handleUnpublish = async () => {
    setLoading(true)
    const result = await unpublishMonthlyPlan(plan.id)
    setLoading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Plan zurückgezogen')
    onUpdate(result.data!)
  }

  if (isPublished) {
    return (
      <ConfirmDialog
        trigger={
          <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            Zurückziehen
          </Button>
        }
        title="Plan zurückziehen"
        description="Der Plan wird auf Entwurf zurückgesetzt. Mitarbeiter können ihn nicht mehr sehen."
        confirmLabel="Zurückziehen"
        onConfirm={handleUnpublish}
      />
    )
  }

  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 mr-1.5" />}
          Veröffentlichen
        </Button>
      }
      title="Plan veröffentlichen"
      description="Der Dienstplan wird für alle Mitarbeiter sichtbar. Sie können ihn danach immer noch bearbeiten."
      confirmLabel="Jetzt veröffentlichen"
      onConfirm={handlePublish}
    />
  )
}
