import { ShiftWithEmployee, ShiftRequestWithEmployee } from '@/types/database'
import { ConflictEntry } from '@/types/app'
import { parseISO } from 'date-fns'

// Prüft ob zwei Zeiträume sich überschneiden
function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && endA > startB
}

// Prüft ob zwei Datumsbereiche (ohne Zeit) sich überschneiden
function dateRangeOverlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && endA >= startB
}

// ---- Dienst-Konflikte (gleicher Mitarbeiter, überschneidende Zeiten) --------

export function detectShiftConflicts(shifts: ShiftWithEmployee[]): ConflictEntry[] {
  const conflicts: ConflictEntry[] = []

  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const a = shifts[i]
      const b = shifts[j]

      if (a.employee_id !== b.employee_id) continue

      const startA = parseISO(a.start_time)
      const endA = parseISO(a.end_time)
      const startB = parseISO(b.start_time)
      const endB = parseISO(b.end_time)

      if (overlaps(startA, endA, startB, endB)) {
        const conflictType =
          a.category === 'vacation' || b.category === 'vacation'
            ? 'vacation_shift_overlap'
            : a.category === 'standby' || b.category === 'standby'
            ? 'standby_overlap'
            : 'shift_overlap'

        conflicts.push({
          type: conflictType,
          shiftA: a.id,
          shiftB: b.id,
          employeeId: a.employee_id,
          employeeName: `${a.employee.first_name} ${a.employee.last_name}`,
          date: a.shift_date,
          overlapStart: startA > startB ? startA : startB,
          overlapEnd: endA < endB ? endA : endB,
        })
      }
    }
  }

  return conflicts
}

// ---- Urlaubsantrags-Konflikte (anonymisiert für Mitarbeiter) ----------------
// Erkennt, wenn mehrere Mitarbeiter für denselben Zeitraum Urlaub beantragt haben.
// ACHTUNG: Gibt NUR Zeiträume zurück, NIEMALS Namen anderer Mitarbeiter!

export interface VacationConflictGroup {
  startDate: string
  endDate: string
  count: number           // Anzahl der Anträge (für Admin)
  employeeNames: string[] // NUR für Admin sichtbar machen!
}

export function detectVacationConflicts(
  requests: ShiftRequestWithEmployee[]
): VacationConflictGroup[] {
  const vacationRequests = requests.filter((r) => r.request_type === 'vacation')
  const groups: VacationConflictGroup[] = []

  for (let i = 0; i < vacationRequests.length; i++) {
    for (let j = i + 1; j < vacationRequests.length; j++) {
      const a = vacationRequests[i]
      const b = vacationRequests[j]

      if (a.employee_id === b.employee_id) continue

      const aStart = a.request_date
      const aEnd = a.end_date ?? a.request_date
      const bStart = b.request_date
      const bEnd = b.end_date ?? b.request_date

      if (dateRangeOverlaps(aStart, aEnd, bStart, bEnd)) {
        // Überlappendes Segment berechnen
        const overlapStart = aStart > bStart ? aStart : bStart
        const overlapEnd = aEnd < bEnd ? aEnd : bEnd

        const existingGroup = groups.find(
          (g) => g.startDate === overlapStart && g.endDate === overlapEnd
        )

        if (existingGroup) {
          if (!existingGroup.employeeNames.includes(`${a.employee.first_name} ${a.employee.last_name}`)) {
            existingGroup.employeeNames.push(`${a.employee.first_name} ${a.employee.last_name}`)
          }
          if (!existingGroup.employeeNames.includes(`${b.employee.first_name} ${b.employee.last_name}`)) {
            existingGroup.employeeNames.push(`${b.employee.first_name} ${b.employee.last_name}`)
          }
          existingGroup.count = existingGroup.employeeNames.length
        } else {
          groups.push({
            startDate: overlapStart,
            endDate: overlapEnd,
            count: 2,
            employeeNames: [
              `${a.employee.first_name} ${a.employee.last_name}`,
              `${b.employee.first_name} ${b.employee.last_name}`,
            ],
          })
        }
      }
    }
  }

  return groups
}

// ---- Kombinierte Erkennung für Admin-Dashboard --------------------------------

export function detectConflicts(shifts: ShiftWithEmployee[]): ConflictEntry[] {
  return detectShiftConflicts(shifts)
}

// IDs aller Dienste, die an einem Konflikt beteiligt sind
export function getConflictingShiftIds(conflicts: ConflictEntry[]): Set<string> {
  const ids = new Set<string>()
  conflicts.forEach((c) => {
    ids.add(c.shiftA)
    ids.add(c.shiftB)
  })
  return ids
}

// Konflikte für einen bestimmten Tag
export function getConflictsForDate(
  conflicts: ConflictEntry[],
  date: string
): ConflictEntry[] {
  return conflicts.filter((c) => c.date === date)
}

// Menschenlesbare Beschreibung eines Konflikts
export function describeConflict(conflict: ConflictEntry): string {
  const typeLabels: Record<ConflictEntry['type'], string> = {
    shift_overlap: 'Überschneidende Dienste',
    vacation_overlap: 'Gleichzeitige Urlaubsanträge',
    vacation_shift_overlap: 'Urlaub überschneidet sich mit Dienst',
    standby_overlap: 'Überschneidende Bereitschaftsdienste',
  }
  return typeLabels[conflict.type] ?? 'Konflikt'
}
