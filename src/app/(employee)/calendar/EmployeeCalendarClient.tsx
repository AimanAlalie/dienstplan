'use client'

import { useState, useMemo } from 'react'
import { ShiftWithEmployee, Employee, ShiftRequest } from '@/types/database'
import { getDaysArray, formatMonthYear } from '@/lib/utils/date'
import { getContrastColor } from '@/lib/utils/color'
import { SHIFT_CATEGORY_LABELS, SHIFT_CATEGORY_COLORS } from '@/lib/constants/labels'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Plus } from 'lucide-react'
import { RequestEntryDialog } from '@/components/calendar/RequestEntryDialog'

const REQUEST_TYPE_STYLES: Record<string, { bg: string; label: string }> = {
  vacation:       { bg: '#0ea5e9', label: 'Urlaub' },
  unavailability: { bg: '#ef4444', label: 'Sperrtag' },
  preference:     { bg: '#8b5cf6', label: 'Wunsch' },
  availability:   { bg: '#10b981', label: 'Verfügbar' },
  block_shift:    { bg: '#f97316', label: 'Block' },
}

function getRequestDaysInMonth(req: ShiftRequest, year: number, month: number): string[] {
  const start = parseISO(req.request_date)
  const end = req.end_date ? parseISO(req.end_date) : start
  const days: string[] = []
  const cur = new Date(Math.max(start.getTime(), new Date(year, month - 1, 1).getTime()))
  const monthEnd = new Date(year, month, 0)
  while (cur <= end && cur <= monthEnd) {
    days.push(format(cur, 'yyyy-MM-dd'))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

interface Props {
  shifts: ShiftWithEmployee[]
  employees: Employee[]
  myEmployeeId: string | null
  myRequests: ShiftRequest[]
  year: number
  month: number
}

export function EmployeeCalendarClient({ shifts, employees, myEmployeeId, myRequests, year, month }: Props) {
  const [filterMine, setFilterMine] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const days = getDaysArray(year, month)
  const today = format(new Date(), 'yyyy-MM-dd')

  const filteredShifts = useMemo(() => {
    if (filterMine && myEmployeeId) {
      return shifts.filter((s) => s.employee_id === myEmployeeId)
    }
    return shifts
  }, [shifts, filterMine, myEmployeeId])

  const shiftsByDay = useMemo(() => {
    return filteredShifts.reduce<Record<string, ShiftWithEmployee[]>>((acc, shift) => {
      acc[shift.shift_date] = [...(acc[shift.shift_date] ?? []), shift]
      return acc
    }, {})
  }, [filteredShifts])

  const requestsByDay = useMemo(() => {
    const map: Record<string, ShiftRequest[]> = {}
    for (const req of myRequests) {
      for (const day of getRequestDaysInMonth(req, year, month)) {
        map[day] = [...(map[day] ?? []), req]
      }
    }
    return map
  }, [myRequests, year, month])

  const myShifts = useMemo(() =>
    shifts.filter((s) => s.employee_id === myEmployeeId)
      .filter((s) => s.shift_date >= today)
      .slice(0, 5),
    [shifts, myEmployeeId, today]
  )

  const activeEmployees = employees.filter((e) => e.status === 'active')

  const handleDayClick = (dateStr: string) => {
    if (!myEmployeeId) return
    setSelectedDay(dateStr)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Filter + Legende */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setFilterMine(false)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !filterMine
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-slate-600 border-slate-200 hover:border-indigo-300'
          )}
        >
          Alle Mitarbeiter
        </button>
        {myEmployeeId && (
          <button
            onClick={() => setFilterMine(true)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filterMine
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-slate-600 border-slate-200 hover:border-indigo-300'
            )}
          >
            Nur meine Dienste
          </button>
        )}

        {myEmployeeId && (
          <div className="flex items-center gap-1.5 ml-2 text-xs text-slate-500 border-l border-slate-200 pl-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />Urlaub
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block ml-1" />Sperr
            <span className="w-2.5 h-2.5 rounded-sm bg-violet-400 inline-block ml-1" />Wunsch
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {activeEmployees.slice(0, 6).map((emp) => (
            <div key={emp.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: emp.color }} />
              <span className="text-xs text-slate-600">{emp.abbreviation}</span>
            </div>
          ))}
          {activeEmployees.length > 6 && (
            <span className="text-xs text-slate-400">+{activeEmployees.length - 6}</span>
          )}
        </div>
      </div>

      {/* Kalender-Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Wochentag-Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => (
            <div
              key={d}
              className={cn(
                'text-center text-xs font-semibold py-2.5',
                i >= 5 ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Tage */}
        <div className="grid grid-cols-7">
          {Array.from({ length: (days[0].getDay() + 6) % 7 }, (_, i) => (
            <div key={`e-${i}`} className="min-h-[90px] border-b border-r border-slate-100 bg-slate-50/50" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayShifts = shiftsByDay[dateStr] ?? []
            const dayRequests = requestsByDay[dateStr] ?? []
            const isToday = dateStr === today
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const hasMyShift = dayShifts.some((s) => s.employee_id === myEmployeeId)
            const isPast = dateStr < today
            const isClickable = !!myEmployeeId && !isPast

            return (
              <div
                key={dateStr}
                onClick={isClickable ? () => handleDayClick(dateStr) : undefined}
                className={cn(
                  'relative min-h-[90px] p-1.5 border-b border-r border-slate-100 group transition-colors',
                  isWeekend && 'bg-slate-50/50',
                  isToday && 'ring-2 ring-inset ring-indigo-400',
                  hasMyShift && !isToday && 'bg-indigo-50/30',
                  isClickable && 'cursor-pointer hover:bg-indigo-50/20'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : isWeekend
                      ? 'text-slate-400'
                      : 'text-slate-700'
                  )}>
                    {day.getDate()}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasMyShift && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Mein Dienst" />
                    )}
                    {isClickable && (
                      <Plus
                        className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  {dayShifts.map((shift) => {
                    const isMine = shift.employee_id === myEmployeeId
                    const overrideColor = SHIFT_CATEGORY_COLORS[shift.category]
                    const bgColor = overrideColor || shift.employee.color

                    return (
                      <div
                        key={shift.id}
                        className={cn(
                          'rounded px-1 py-0.5 text-[10px] font-medium truncate',
                          isMine && 'ring-1 ring-white ring-offset-0.5'
                        )}
                        style={{
                          backgroundColor: bgColor,
                          color: getContrastColor(bgColor),
                          opacity: isMine ? 1 : 0.8,
                        }}
                        title={`${shift.employee.first_name} ${shift.employee.last_name} · ${SHIFT_CATEGORY_LABELS[shift.category]} · ${shift.start_time.substring(11,16)}–${shift.end_time.substring(11,16)}`}
                      >
                        <span className="font-bold">{shift.employee.abbreviation}</span>
                        {' '}
                        <span className="opacity-80">{shift.start_time.substring(11,16)}</span>
                      </div>
                    )
                  })}

                  {/* Meine Wünsche / Urlaub / Sperrtage */}
                  {dayRequests.map((req) => {
                    const style = REQUEST_TYPE_STYLES[req.request_type] ?? { bg: '#94a3b8', label: req.request_type }
                    const isRejected = req.status === 'rejected'
                    const isPending = req.status === 'pending'

                    return (
                      <div
                        key={`${req.id}-${dateStr}`}
                        className={cn(
                          'rounded px-1 py-0.5 text-[10px] font-medium truncate border',
                          isRejected && 'opacity-40 line-through',
                          isPending && 'border-dashed'
                        )}
                        style={{
                          backgroundColor: style.bg + '22',
                          borderColor: style.bg,
                          color: style.bg,
                        }}
                        title={`${style.label} · ${req.status === 'pending' ? 'ausstehend' : req.status === 'approved' ? 'genehmigt' : 'abgelehnt'}${req.notes ? ' · ' + req.notes : ''}`}
                      >
                        {style.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Meine nächsten Dienste */}
      {myShifts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Meine nächsten Dienste</h2>
          <div className="space-y-2">
            {myShifts.map((shift) => {
              const overrideColor = SHIFT_CATEGORY_COLORS[shift.category]
              const bgColor = overrideColor || shift.employee.color
              const durationMin = Math.round(
                (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 60000
              )
              return (
                <div
                  key={shift.id}
                  className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: bgColor, color: getContrastColor(bgColor) }}
                  >
                    {new Date(shift.shift_date).getDate()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {format(parseISO(shift.shift_date), 'EEEE, d. MMMM', { locale: de })}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {shift.start_time.substring(11, 16)} – {shift.end_time.substring(11, 16)}
                      <span className="text-slate-400">({Math.floor(durationMin / 60)}h{durationMin % 60 ? ` ${durationMin % 60}min` : ''})</span>
                      {shift.location && (
                        <>
                          <MapPin className="w-3 h-3 ml-1" />
                          {shift.location}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                    {SHIFT_CATEGORY_LABELS[shift.category]}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dialog */}
      {selectedDay && (
        <RequestEntryDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          date={selectedDay}
        />
      )}
    </div>
  )
}
