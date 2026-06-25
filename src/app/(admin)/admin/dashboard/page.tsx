import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate, formatMonthYear, currentMonthYear } from '@/lib/utils/date'
import { Users, CalendarDays, MessageSquare, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Dashboard | Admin' }

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient()
  const { year, month } = currentMonthYear()

  // Parallele Datenabfragen
  const [
    { count: employeeCount },
    { count: pendingRequestCount },
    { data: recentPlans },
    { data: recentAuditLogs },
    { count: shiftCount },
  ] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('shift_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('monthly_plans').select('*').order('year', { ascending: false }).order('month', { ascending: false }).limit(6),
    supabase.from('audit_logs').select('*, actor:profiles(full_name, email)').order('created_at', { ascending: false }).limit(10),
    supabase.from('shifts').select('*', { count: 'exact', head: true })
      .gte('shift_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('shift_date', `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`),
  ])

  const kpis = [
    {
      title: 'Aktive Mitarbeiter',
      value: employeeCount ?? 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      href: '/admin/employees',
    },
    {
      title: 'Dienste diesen Monat',
      value: shiftCount ?? 0,
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: `/admin/planning/${year}/${month}`,
    },
    {
      title: 'Offene Wünsche',
      value: pendingRequestCount ?? 0,
      icon: MessageSquare,
      color: pendingRequestCount ? 'text-amber-600' : 'text-slate-500',
      bg: pendingRequestCount ? 'bg-amber-50' : 'bg-slate-50',
      href: '/admin/requests',
    },
  ]

  const actionLabels: Record<string, string> = {
    'employee.created': 'Mitarbeiter angelegt',
    'employee.updated': 'Mitarbeiter geändert',
    'employee.archived': 'Mitarbeiter archiviert',
    'shift.created': 'Dienst eingetragen',
    'shift.updated': 'Dienst geändert',
    'shift.deleted': 'Dienst gelöscht',
    'monthly_plan.created': 'Monatsplan erstellt',
    'monthly_plan.published': 'Plan veröffentlicht',
    'monthly_plan.unpublished': 'Plan zurückgezogen',
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Dashboard"
        subtitle={`Übersicht — ${formatMonthYear(year, month)}`}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* KPI-Karten */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kpis.map(({ title, value, icon: Icon, color, bg, href }) => (
              <Link key={title} href={href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monatspläne */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  Monatspläne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentPlans && recentPlans.length > 0 ? (
                  recentPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/admin/planning/${plan.year}/${plan.month}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                        {formatMonthYear(plan.year, plan.month)}
                      </span>
                      <StatusBadge status={plan.status} variant="plan" />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">Noch keine Pläne</p>
                )}
                <Link
                  href={`/admin/planning/${year}/${month}`}
                  className="block text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium pt-2"
                >
                  Aktuellen Monat öffnen →
                </Link>
              </CardContent>
            </Card>

            {/* Aktivitäts-Feed */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Letzte Aktionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAuditLogs && recentAuditLogs.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentAuditLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-2.5 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-slate-700">
                            {actionLabels[log.action] ?? log.action}
                          </span>
                          <span className="text-slate-400 ml-1.5">
                            {log.actor?.full_name ?? log.actor?.email ?? 'System'}
                          </span>
                          <p className="text-slate-400 mt-0.5">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">Noch keine Aktivitäten</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
