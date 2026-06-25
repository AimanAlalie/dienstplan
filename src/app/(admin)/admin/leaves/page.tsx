import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getAllShiftRequests } from '@/lib/queries/shift-requests'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/date'
import { detectVacationConflicts } from '@/lib/utils/conflict-detection'
import { reviewShiftRequest } from '@/lib/actions/shift-requests'
import { LeavesClientWrapper } from './LeavesClientWrapper'
import { Umbrella, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Urlaubsübersicht | Admin' }

export default async function AdminLeavesPage() {
  const supabase = await getSupabaseServerClient()

  // Alle Urlaubsanträge laden
  const allRequests = await getAllShiftRequests().catch(() => [])
  const vacationRequests = allRequests.filter((r) => r.request_type === 'vacation')

  // Konflikte erkennen
  const conflicts = detectVacationConflicts(vacationRequests)

  const pending = vacationRequests.filter((r) => r.status === 'pending')
  const approved = vacationRequests.filter((r) => r.status === 'approved')
  const rejected = vacationRequests.filter((r) => r.status === 'rejected')

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Urlaubsübersicht"
        subtitle={`${pending.length} offen · ${approved.length} genehmigt · ${conflicts.length > 0 ? `${conflicts.length} Konflikte` : 'keine Konflikte'}`}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Konflikt-Banner */}
          {conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">
                    {conflicts.length} Urlaubskonflikt{conflicts.length !== 1 ? 'e' : ''} erkannt
                  </h3>
                  <div className="space-y-2">
                    {conflicts.map((c, i) => (
                      <div key={i} className="text-xs text-amber-800">
                        <span className="font-medium">
                          {formatDate(c.startDate)}
                          {c.endDate !== c.startDate && ` – ${formatDate(c.endDate)}`}:
                        </span>{' '}
                        {c.employeeNames.join(', ')} haben gleichzeitig Urlaub beantragt.
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Antrags-Liste */}
          <LeavesClientWrapper vacationRequests={vacationRequests} />
        </div>
      </main>
    </div>
  )
}
