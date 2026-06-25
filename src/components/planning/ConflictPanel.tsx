'use client'

import { ConflictEntry } from '@/types/app'
import { formatDate, formatTime } from '@/lib/utils/date'
import { describeConflict } from '@/lib/utils/conflict-detection'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConflictPanelProps {
  conflicts: ConflictEntry[]
  onClose: () => void
}

const conflictTypeColors: Record<ConflictEntry['type'], string> = {
  shift_overlap: 'bg-amber-50 border-amber-200 text-amber-800',
  vacation_shift_overlap: 'bg-orange-50 border-orange-200 text-orange-800',
  standby_overlap: 'bg-violet-50 border-violet-200 text-violet-800',
  vacation_overlap: 'bg-red-50 border-red-200 text-red-800',
}

export function ConflictPanel({ conflicts, onClose }: ConflictPanelProps) {
  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-900">
            {conflicts.length} Konflikt{conflicts.length !== 1 ? 'e' : ''}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conflicts.map((conflict, idx) => {
          const colorClass = conflictTypeColors[conflict.type] ?? conflictTypeColors.shift_overlap
          return (
            <div
              key={idx}
              className={`border rounded-lg p-3 text-xs ${colorClass}`}
            >
              <p className="font-semibold mb-0.5">{describeConflict(conflict)}</p>
              <p className="font-medium">{conflict.employeeName}</p>
              <p className="opacity-80 mt-0.5">
                {formatDate(conflict.date)} · {formatTime(conflict.overlapStart)}–{formatTime(conflict.overlapEnd)}
              </p>
            </div>
          )
        })}

        {conflicts.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Keine Konflikte</p>
        )}
      </div>
    </div>
  )
}
