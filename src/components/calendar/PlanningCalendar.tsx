'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { ShiftWithEmployee, Employee, ShiftType, MonthlyPlan } from '@/types/database'
import { detectConflicts, getConflictingShiftIds } from '@/lib/utils/conflict-detection'
import { getContrastColor } from '@/lib/utils/color'
import { SHIFT_CATEGORY_LABELS, SHIFT_CATEGORY_COLORS } from '@/lib/constants/labels'
import { EmployeeLegend } from './EmployeeLegend'
import { ShiftDialog } from './ShiftDialog'
import { ConflictPanel } from '@/components/planning/ConflictPanel'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanningCalendarProps {
  plan: MonthlyPlan
  shifts: ShiftWithEmployee[]
  employees: Employee[]
  shiftTypes: ShiftType[]
  onRefresh: () => void
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function PlanningCalendar({
  plan,
  shifts,
  employees,
  shiftTypes,
  onRefresh,
}: PlanningCalendarProps) {
  const [filterEmployees, setFilterEmployees] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedShift, setSelectedShift] = useState<ShiftWithEmployee>()
  const [showConflicts, setShowConflicts] = useState(false)

  const conflicts = useMemo(() => detectConflicts(shifts), [shifts])
  const conflictIds = useMemo(() => getConflictingShiftIds(conflicts), [conflicts])

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (filterEmployees.length > 0 && !filterEmployees.includes(s.employee_id)) return false
      if (filterCategory !== 'all' && s.category !== filterCategory) return false
      return true
    })
  }, [shifts, filterEmployees, filterCategory])

  const year = plan.year
  const month = plan.month
  const daysCount = getDaysInMonth(new Date(year, month - 1, 1))
  const firstDayOfWeek = (getDay(startOfMonth(new Date(year, month - 1, 1))) + 6) % 7

  const days = useMemo(() => {
    return Array.from({ length: daysCount }, (_, i) => {
      const dayNum = i + 1
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      const dayShifts = filteredShifts.filter((s) => s.shift_date === dateStr)
      const dayConflicts = conflicts.filter((c) => c.date === dateStr)
      return { dayNum, dateStr, shifts: dayShifts, conflicts: dayConflicts }
    })
  }, [daysCount, year, month, filteredShifts, conflicts])

  const toggleFilter = useCallback((id: string) => {
    setFilterEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const openNewShift = (dateStr: string) => {
    setSelectedDate(dateStr)
    setSelectedShift(undefined)
    setDialogOpen(true)
  }

  const openEditShift = (shift: ShiftWithEmployee) => {
    setSelectedShift(shift)
    setSelectedDate(undefined)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <EmployeeLegend
          employees={employees.filter(e => e.status === 'active')}
          activeFilter={filterEmployees}
          onToggle={toggleFilter}
        />

        {/* Kategorie-Filter */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
          {(['all', 'normal', 'standby', 'vacation', 'sick', 'other'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors border',
                filterCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              )}
            >
              {cat === 'all' ? 'Alle' : SHIFT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {conflicts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConflicts(!showConflicts)}
            className="text-amber-600 border-amber-300 hover:bg-amber-50 ml-auto flex-shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            {conflicts.length} Konflikt{conflicts.length !== 1 ? 'e' : ''}
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Kalender-Grid */}
        <div className="flex-1 overflow-auto p-4">
          {/* Wochentag-Header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  'text-center text-xs font-semibold py-1.5 rounded',
                  i >= 5 ? 'text-slate-400 bg-slate-50' : 'text-slate-600 bg-white'
                )}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px]" />
            ))}

            {days.map(({ dayNum, dateStr, shifts: dayShifts, conflicts: dayConflicts }) => {
              const weekdayIndex = (firstDayOfWeek + dayNum - 1) % 7
              const isWeekend = weekdayIndex >= 5
              const today = format(new Date(), 'yyyy-MM-dd')
              const isToday = dateStr === today

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[100px] rounded-lg p-1.5 border group cursor-pointer hover:border-indigo-300 transition-colors',
                    isWeekend ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200',
                    isToday && 'ring-2 ring-indigo-400 ring-offset-1',
                    dayConflicts.length > 0 && 'border-amber-300'
                  )}
                  onClick={() => openNewShift(dateStr)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full',
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isWeekend
                          ? 'text-slate-400'
                          : 'text-slate-700'
                      )}
                    >
                      {dayNum}
                    </span>
                    <div className="flex items-center gap-1">
                      {dayConflicts.length > 0 && (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openNewShift(dateStr) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded text-indigo-500 hover:bg-indigo-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    {dayShifts.map((shift) => (
                      <ShiftChip
                        key={shift.id}
                        shift={shift}
                        hasConflict={conflictIds.has(shift.id)}
                        onClick={(e) => { e.stopPropagation(); openEditShift(shift) }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Konflikt-Panel */}
        {showConflicts && (
          <ConflictPanel
            conflicts={conflicts}
            onClose={() => setShowConflicts(false)}
          />
        )}
      </div>

      <ShiftDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        monthlyPlanId={plan.id}
        employees={employees.filter(e => e.status === 'active')}
        shiftTypes={shiftTypes}
        initialDate={selectedDate}
        existingShift={selectedShift}
        onSaved={onRefresh}
      />
    </div>
  )
}

function ShiftChip({
  shift,
  hasConflict,
  onClick,
}: {
  shift: ShiftWithEmployee
  hasConflict: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const emp = shift.employee
  const start = shift.start_time.substring(11, 16)
  const end = shift.end_time.substring(11, 16)
  const durationMin = Math.round(
    (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 60000
  )

  // Kategorien wie Bereitschaft/Urlaub/Krank bekommen eine eigene Hintergrundfarbe
  const categoryOverrideColor = SHIFT_CATEGORY_COLORS[shift.category]
  const bgColor = categoryOverrideColor || emp.color

  const categoryLabel =
    shift.category !== 'normal' ? ` · ${SHIFT_CATEGORY_LABELS[shift.category]}` : ''

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded px-1.5 py-0.5 text-xs font-medium transition-all hover:opacity-80 hover:scale-[1.02] border',
        shift.status === 'cancelled' && 'opacity-50 line-through',
        hasConflict && 'ring-1 ring-amber-400'
      )}
      style={{
        backgroundColor: bgColor,
        color: getContrastColor(bgColor),
        borderColor: hasConflict ? '#f59e0b' : bgColor,
      }}
      title={`${emp.first_name} ${emp.last_name}\n${SHIFT_CATEGORY_LABELS[shift.category]}\n${start}–${end} (${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}min` : ''})`}
    >
      <span className="font-bold">{emp.abbreviation}</span>
      <span className="ml-1 opacity-90">{start}–{end}</span>
      {categoryLabel && <span className="ml-1 opacity-75 text-[10px]">{categoryLabel}</span>}
    </button>
  )
}
