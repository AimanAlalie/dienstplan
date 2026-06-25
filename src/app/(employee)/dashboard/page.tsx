import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyShiftsForMonth } from '@/lib/queries/shifts'
import { getMyShiftRequests } from '@/lib/queries/shift-requests'
import { formatDate, formatTime, currentMonthYear, formatMonthYear } from '@/lib/utils/date'
import { getContrastColor } from '@/lib/utils/color'
import { CalendarDays, Clock, MessageSquare } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Meine Übersicht | Dienstplan' }

export default async function EmployeeDashboardPage() {
  const { year, month } = currentMonthYear()

  const [myShifts, myRequests] = await Promise.all([
    getMyShiftsForMonth(year, month).catch(() => []),
    getMyShiftRequests(year, month).catch(() => []),
  ])

  const upcomingShifts = myShifts
    .filter((s) => s.shift_date >= new Date().toISOString().substring(0, 10))
    .slice(0, 5)

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Meine Übersicht" subtitle={formatMonthYear(year, month)} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Nächste Dienste */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  Meine nächsten Dienste
                </CardTitle>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                    Alle anzeigen →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingShifts.length > 0 ? (
                <div className="space-y-2">
                  {upcomingShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: shift.employee.color,
                          color: getContrastColor(shift.employee.color),
                        }}
                      >
                        {new Date(shift.shift_date).getDate()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(shift.shift_date)}
                        </p>
                        <p className="text-xs text-slate-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {shift.start_time.substring(11, 16)} – {shift.end_time.substring(11, 16)}
                          {shift.location && ` · ${shift.location}`}
                        </p>
                      </div>
                      <StatusBadge status={shift.status} variant="shift" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Keine bevorstehenden Dienste in diesem Monat.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Meine Wünsche */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Meine Wünsche diesen Monat
                </CardTitle>
                <Link href="/requests">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                    Alle & Neu →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {myRequests.length > 0 ? (
                <div className="space-y-2">
                  {myRequests.slice(0, 4).map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{formatDate(req.request_date)}</p>
                        <p className="text-xs text-slate-500">{req.request_type}</p>
                      </div>
                      <StatusBadge status={req.status} variant="request" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">
                  Noch keine Wünsche eingetragen.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
