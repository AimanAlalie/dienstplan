import { TopBar } from '@/components/layout/TopBar'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import { getLinkableProfiles } from '@/lib/queries/employees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Neuer Mitarbeiter | Admin' }

export default async function NewEmployeePage() {
  const linkableProfiles = await getLinkableProfiles().catch(() => [])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Neuer Mitarbeiter" subtitle="Mitarbeiterprofil anlegen" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stammdaten</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeForm linkableProfiles={linkableProfiles} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
