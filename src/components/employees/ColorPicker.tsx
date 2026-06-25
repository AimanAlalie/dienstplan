'use client'

import { EMPLOYEE_COLORS } from '@/lib/utils/color'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {EMPLOYEE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center',
              value === color ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color }}
          >
            {value === color && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
          </button>
        ))}
      </div>
      {/* Eigene Farbe */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full border-2 border-slate-300 overflow-hidden cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
            title="Eigene Farbe wählen"
          />
        </div>
        <span className="text-sm text-slate-500">Eigene Farbe</span>
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{value}</code>
      </div>
    </div>
  )
}
