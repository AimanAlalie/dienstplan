import { notFound } from 'next/navigation'
import { getEmployeeById, getLinkableProfiles } from '@/lib/queries/employees'
import { TopBar } from '@/components/layout/TopBar'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getContrastColor } from '@/lib/utils/color'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params
  const employee = await getEmployeeById(id)
  if (!employee) notFound()

  const linkableProfiles = await getLinkableProfiles(employee.profile_id).catch(() => [])

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={`${employee.first_name} ${employee.last_name}`}
        subtitle="Mitarbeiter bearbeiten"
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Kurzinfo-Banner */}
          <div
            className="rounded-xl px-5 py-4 flex items-center gap-4"
            style={{
              backgroundColor: employee.color,
              color: getContrastColor(employee.color),
            }}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {employee.abbreviation}
            </div>
            <div>
              <p className="font-semibold text-lg">{employee.first_name} {employee.last_name}</p>
              {employee.position && <p className="opacity-80 text-sm">{employee.position}</p>}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stammdaten</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeForm employee={employee} linkableProfiles={linkableProfiles} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
