import { cn } from '@/lib/utils'
import {
  PLAN_STATUS_LABELS,
  PLAN_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  EMPLOYEE_STATUS_LABELS,
  SHIFT_STATUS_LABELS,
} from '@/lib/constants/labels'

type BadgeVariant = 'plan' | 'request' | 'employee' | 'shift'

interface StatusBadgeProps {
  status: string
  variant: BadgeVariant
  className?: string
}

const LABEL_MAP: Record<BadgeVariant, Record<string, string>> = {
  plan: PLAN_STATUS_LABELS,
  request: REQUEST_STATUS_LABELS,
  employee: EMPLOYEE_STATUS_LABELS,
  shift: SHIFT_STATUS_LABELS,
}

const COLOR_MAP: Record<string, Record<string, string>> = {
  plan: PLAN_STATUS_COLORS,
  request: REQUEST_STATUS_COLORS,
  employee: {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-amber-100 text-amber-700',
    archived: 'bg-slate-100 text-slate-500',
  },
  shift: {
    scheduled: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
  },
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const label = LABEL_MAP[variant][status] ?? status
  const colorClass = COLOR_MAP[variant][status] ?? 'bg-gray-100 text-gray-600'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
