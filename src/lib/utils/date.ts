import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
  isWeekend,
  getDaysInMonth,
  setHours,
  setMinutes,
} from 'date-fns'
import { de } from 'date-fns/locale'

export const LOCALE = de

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy', { locale: de })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy HH:mm', { locale: de })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm', { locale: de })
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: de })
}

export function getMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

export function getNextMonth(year: number, month: number) {
  const next = addMonths(new Date(year, month - 1, 1), 1)
  return { year: next.getFullYear(), month: next.getMonth() + 1 }
}

export function getPrevMonth(year: number, month: number) {
  const prev = subMonths(new Date(year, month - 1, 1), 1)
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 }
}

export function buildShiftDateTime(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const base = parseISO(date)
  return setMinutes(setHours(base, hours), minutes)
}

export function calculateShiftDuration(startTime: string, endTime: string): number {
  const start = parseISO(startTime)
  const end = parseISO(endTime)
  return Math.round((end.getTime() - start.getTime()) / 1000 / 60)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function isWeekendDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isWeekend(d)
}

export function getDaysArray(year: number, month: number): Date[] {
  const days = getDaysInMonth(new Date(year, month - 1, 1))
  return Array.from({ length: days }, (_, i) => new Date(year, month - 1, i + 1))
}

export function currentMonthYear(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
