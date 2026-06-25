'use client'

import { useRouter } from 'next/navigation'
import { getNextMonth, getPrevMonth, formatMonthYear } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PlanMonthNavProps {
  year: number
  month: number
}

export function PlanMonthNav({ year, month }: PlanMonthNavProps) {
  const router = useRouter()
  const prev = getPrevMonth(year, month)
  const next = getNextMonth(year, month)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/admin/planning/${prev.year}/${prev.month}`)}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <span className="text-sm font-semibold text-slate-900 w-36 text-center">
        {formatMonthYear(year, month)}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/admin/planning/${next.year}/${next.month}`)}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
