'use client'

import { FileSpreadsheet } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  year: number
  month: number
}

export function TaxAdvisorExportButton({ year, month }: Props) {
  const url = `/api/export/tax-advisor?year=${year}&month=${month}`

  return (
    <a
      href={url}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700',
      )}
    >
      <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
      Steuerberater-Export
    </a>
  )
}
