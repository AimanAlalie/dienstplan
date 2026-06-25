import { redirect } from 'next/navigation'
import { currentMonthYear } from '@/lib/utils/date'

export default function PlanningIndexPage() {
  const { year, month } = currentMonthYear()
  redirect(`/admin/planning/${year}/${month}`)
}
