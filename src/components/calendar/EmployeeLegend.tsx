'use client'

import { Employee } from '@/types/database'
import { getContrastColor } from '@/lib/utils/color'

interface EmployeeLegendProps {
  employees: Employee[]
  activeFilter: string[]
  onToggle: (id: string) => void
}

export function EmployeeLegend({ employees, activeFilter, onToggle }: EmployeeLegendProps) {
  const isFiltered = activeFilter.length > 0

  return (
    <div className="flex flex-wrap gap-2">
      {employees.map((emp) => {
        const isActive = !isFiltered || activeFilter.includes(emp.id)
        return (
          <button
            key={emp.id}
            onClick={() => onToggle(emp.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
              isActive ? 'opacity-100' : 'opacity-40'
            }`}
            style={{
              backgroundColor: isActive ? emp.color : '#e2e8f0',
              color: isActive ? getContrastColor(emp.color) : '#64748b',
              borderColor: isActive ? emp.color : '#cbd5e1',
            }}
            title={`${emp.first_name} ${emp.last_name}`}
          >
            <span className="font-bold">{emp.abbreviation}</span>
            <span className="hidden sm:inline">{emp.first_name} {emp.last_name}</span>
          </button>
        )
      })}

      {isFiltered && (
        <button
          onClick={() => activeFilter.forEach(onToggle)}
          className="px-2.5 py-1 rounded-full text-xs font-medium border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Alle anzeigen
        </button>
      )}
    </div>
  )
}
