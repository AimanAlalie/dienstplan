import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getContrastColor } from '@/lib/utils/color'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants/labels'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Plus, Pencil } from 'lucide-react'

export const metadata = { title: 'Mitarbeiter | Admin' }

export default async function EmployeesPage() {
  const supabase = await getSupabaseServerClient()
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('last_name')

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Mitarbeiter"
        subtitle={`${employees?.length ?? 0} Einträge`}
        actions={
          <Link href="/admin/employees/new">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Neu anlegen
            </Button>
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {employees && employees.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide">
                      Mitarbeiter
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide hidden md:table-cell">
                      Position
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide hidden lg:table-cell">
                      Beschäftigung
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Farb-Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{
                              backgroundColor: emp.color,
                              color: getContrastColor(emp.color),
                            }}
                          >
                            {emp.abbreviation}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {emp.first_name} {emp.last_name}
                            </p>
                            {emp.employee_number && (
                              <p className="text-xs text-slate-400">Nr. {emp.employee_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-slate-700">{emp.position ?? '—'}</p>
                        {emp.department && (
                          <p className="text-xs text-slate-400">{emp.department}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-slate-700">
                          {EMPLOYMENT_TYPE_LABELS[emp.employment_type]}
                        </p>
                        {emp.weekly_hours && (
                          <p className="text-xs text-slate-400">{emp.weekly_hours}h/Woche</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={emp.status} variant="employee" />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/employees/${emp.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="Noch keine Mitarbeiter"
              description="Legen Sie Mitarbeiter an, um mit der Planung zu beginnen."
              action={
                <Link href="/admin/employees/new">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Ersten Mitarbeiter anlegen
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}
