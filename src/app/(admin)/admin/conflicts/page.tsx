import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getAllShiftRequests } from '@/lib/queries/shift-requests'
import { getShiftsForMonth } from '@/lib/queries/shifts'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatTime, currentMonthYear, formatMonthYear } from '@/lib/utils/date'
import { detectShiftConflicts, detectVacationConflicts, describeConflict } from '@/lib/utils/conflict-detection'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Konfliktübersicht | Admin' }

const conflictTypeColors = {
  shift_overlap: 'bg-amber-50 border-amber-200',
  vacation_shift_overlap: 'bg-orange-50 border-orange-200',
  standby_overlap: 'bg-violet-50 border-violet-200',
  vacation_overlap: 'bg-red-50 border-red-200',
}

const conflictTypeBadgeColors = {
  shift_overlap: 'bg-amber-100 text-amber-800',
  vacation_shift_overlap: 'bg-orange-100 text-orange-800',
  standby_overlap: 'bg-violet-100 text-violet-800',
  vacation_overlap: 'bg-red-100 text-red-800',
}

export default async function AdminConflictsPage() {
  const { year, month } = currentMonthYear()
  const supabase = await getSupabaseServerClient()

  const [shifts, allRequests] = await Promise.all([
    getShiftsForMonth(year, month).catch(() => []),
    getAllShiftRequests().catch(() => []),
  ])

  const shiftConflicts = detectShiftConflicts(shifts)
  const vacationConflicts = detectVacationConflicts(
    allRequests.filter((r) => r.request_type === 'vacation')
  )

  const totalConflicts = shiftConflicts.length + vacationConflicts.length

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Konfliktübersicht"
        subtitle={totalConflicts === 0
          ? 'Keine Konflikte erkannt'
          : `${totalConflicts} Konflikt${totalConflicts !== 1 ? 'e' : ''} — ${formatMonthYear(year, month)}`
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {totalConflicts === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Keine Konflikte</h3>
              <p className="text-sm text-slate-500 mt-1">
                Im aktuellen Monat ({formatMonthYear(year, month)}) wurden keine Konflikte erkannt.
              </p>
            </div>
          ) : (
            <>
              {/* Dienst-Konflikte */}
              {shiftConflicts.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Dienst-Konflikte ({shiftConflicts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {shiftConflicts.map((c, i) => (
                      <div
                        key={i}
                        className={cn('border rounded-lg p-3', conflictTypeColors[c.type])}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                                conflictTypeBadgeColors[c.type]
                              )}>
                                {describeConflict(c)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{c.employeeName}</p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {formatDate(c.date)} · Überschneidung {formatTime(c.overlapStart)} – {formatTime(c.overlapEnd)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Urlaubs-Konflikte */}
              {vacationConflicts.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Gleichzeitige Urlaubsanträge ({vacationConflicts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vacationConflicts.map((c, i) => (
                      <div key={i} className="border border-red-200 bg-red-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">Überlappender Zeitraum</p>
                        <p className="text-sm text-slate-900 font-medium">
                          {formatDate(c.startDate)}
                          {c.endDate !== c.startDate && ` – ${formatDate(c.endDate)}`}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Betroffene Mitarbeiter: {c.employeeNames.join(', ')}
                        </p>
                        <p className="text-xs text-red-600 mt-1.5">
                          → Überprüfen Sie, ob die gleichzeitige Abwesenheit vertretbar ist.
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
