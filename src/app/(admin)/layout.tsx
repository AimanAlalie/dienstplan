import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        {children}
      </div>
    </div>
  )
}
