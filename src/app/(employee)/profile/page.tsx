import { getSupabaseServerClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyEmployee } from '@/lib/queries/employees'
import { getContrastColor } from '@/lib/utils/color'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants/labels'
import { formatDate } from '@/lib/utils/date'

export const metadata = { title: 'Mein Profil | Dienstplan' }

export default async function ProfilePage() {
  const [employee] = await Promise.all([
    getMyEmployee().catch(() => null),
  ])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Mein Profil" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {employee ? (
            <>
              {/* Banner */}
              <div
                className="rounded-xl px-6 py-5 flex items-center gap-4"
                style={{
                  backgroundColor: employee.color,
                  color: getContrastColor(employee.color),
                }}
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {employee.abbreviation}
                </div>
                <div>
                  <p className="text-xl font-bold">{employee.first_name} {employee.last_name}</p>
                  {employee.position && <p className="opacity-80">{employee.position}</p>}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Meine Daten</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    {[
                      { label: 'Personalnummer', value: employee.employee_number },
                      { label: 'Kürzel', value: employee.abbreviation },
                      { label: 'Abteilung', value: employee.department },
                      { label: 'Beschäftigung', value: EMPLOYMENT_TYPE_LABELS[employee.employment_type] },
                      { label: 'Wochenstunden', value: employee.weekly_hours ? `${employee.weekly_hours}h` : null },
                      { label: 'Telefon', value: employee.phone },
                      { label: 'Eingestellt am', value: employee.hired_at ? formatDate(employee.hired_at) : null },
                    ].map(({ label, value }) =>
                      value ? (
                        <div key={label} className="flex items-center gap-4">
                          <dt className="text-xs font-medium text-slate-500 w-36 flex-shrink-0">{label}</dt>
                          <dd className="text-sm text-slate-900">{value}</dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-400 text-sm">
                  Kein Mitarbeiterprofil verknüpft. Bitte wenden Sie sich an den Administrator.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
