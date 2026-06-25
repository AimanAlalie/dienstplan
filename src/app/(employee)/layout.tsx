import { EmployeeSidebar } from '@/components/layout/EmployeeSidebar'

export default function EmployeeGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <EmployeeSidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-60">
        {children}
      </div>
    </div>
  )
}
