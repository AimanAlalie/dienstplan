import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getAllDeadlines } from '@/lib/queries/request-deadlines'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeadlinesClient } from './DeadlinesClient'
import { Calendar, Clock, Cog } from 'lucide-react'

export const metadata = { title: 'Einstellungen | Admin' }

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient()
  const [shiftTypes, deadlines] = await Promise.all([
    supabase
      .from('shift_types')
      .select('*')
      .order('sort_order')
      .then((res) => res.data ?? []),
    getAllDeadlines().catch(() => []),
  ])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Einstellungen & Fristen" subtitle="Diensttypen, Wunschfristen und Konfiguration" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Wunschfristen */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Wunschfristen</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <DeadlinesClient initialDeadlines={deadlines} />
              </CardContent>
            </Card>
          </section>

          {/* Diensttypen */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Cog className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Diensttypen / Vorlagen</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                {shiftTypes.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {shiftTypes.map((type: any) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900">{type.name}</span>
                            <span className="text-xs text-slate-400 ml-2">({type.abbreviation})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {type.default_start} – {type.default_end}
                          </span>
                          <Badge variant={type.is_active ? 'default' : 'secondary'} className="text-xs">
                            {type.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    Keine Diensttypen. Führen Sie das Seed-Skript aus.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
