// Anwendungsweite Typen (nicht direkt DB-gebunden)

import { ShiftCategory } from './database'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  employeeId: string
  employeeName: string
  employeeAbbreviation: string
  employeeColor: string
  shiftId: string
  shiftStatus: string
  shiftCategory: ShiftCategory
  notes?: string | null
  location?: string | null
}

export interface ConflictEntry {
  type: 'shift_overlap' | 'vacation_overlap' | 'vacation_shift_overlap' | 'standby_overlap'
  shiftA: string
  shiftB: string
  employeeId: string
  employeeName: string
  date: string
  overlapStart: Date
  overlapEnd: Date
}

export interface VacationConflictWarning {
  hasConflict: boolean
  message: string
}

export interface ServerActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export interface FilterState {
  employeeIds: string[]
  status: string[]
  dateFrom?: string
  dateTo?: string
}

export interface MonthYear {
  year: number
  month: number
}

export type NavigationItem = {
  label: string
  href: string
  icon: string
  badge?: number
}

export interface DeadlineStatus {
  hasDeadline: boolean
  isExpired: boolean
  deadlineAt: string | null
  daysLeft: number | null
}
