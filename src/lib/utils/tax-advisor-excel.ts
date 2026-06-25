import ExcelJS from 'exceljs'
import { Employee, ShiftWithEmployee } from '@/types/database'

// ------- Vergütungssätze (Standardwerte – können angepasst werden) -------
export const COMPENSATION_RATES = {
  tagdienst: 18.00,
  nachtdienst: 22.00,
  nzs: 4.00,           // Nachtzuschlag (zusätzlich zur Nacht-Grundvergütung)
  rufbereitschaft: 4.50,
  zsFeiertageTag: 5.00,
  zsFeiertageNacht: 7.00,
}

// ------- Feiertags-Berechnung (deutsche Bundesfeiertage) -------
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function shiftDate(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getGermanHolidays(year: number): Set<string> {
  const easter = easterSunday(year)
  return new Set([
    `${year}-01-01`, // Neujahr
    `${year}-05-01`, // Tag der Arbeit
    `${year}-10-03`, // Tag der Deutschen Einheit
    `${year}-12-25`, // 1. Weihnachtstag
    `${year}-12-26`, // 2. Weihnachtstag
    isoDate(shiftDate(easter, -2)),  // Karfreitag
    isoDate(shiftDate(easter, 1)),   // Ostermontag
    isoDate(shiftDate(easter, 39)),  // Christi Himmelfahrt
    isoDate(shiftDate(easter, 50)),  // Pfingstmontag
  ])
}

// ------- Stunden-Berechnung (Tag / Nacht) -------
function overlapMinutes(s1: Date, e1: Date, s2: Date, e2: Date): number {
  const start = Math.max(s1.getTime(), s2.getTime())
  const end = Math.min(e1.getTime(), e2.getTime())
  return Math.max(0, (end - start) / 60_000)
}

function calcShiftHours(startIso: string, endIso: string, breakMinutes: number) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const totalRawMin = (end.getTime() - start.getTime()) / 60_000
  const netMin = Math.max(0, totalRawMin - breakMinutes)
  if (totalRawMin <= 0) return { dayH: 0, nightH: 0, totalH: 0 }

  // Nacht = 22:00-06:00; Über alle Tage der Schicht summieren
  let nightMin = 0
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const cur = new Date(startDay)
  while (cur <= endDay) {
    const ns = new Date(cur); ns.setHours(22, 0, 0, 0)
    const ne = new Date(cur); ne.setDate(ne.getDate() + 1); ne.setHours(6, 0, 0, 0)
    nightMin += overlapMinutes(start, end, ns, ne)
    cur.setDate(cur.getDate() + 1)
  }

  const ratio = netMin / totalRawMin
  const nightH = (nightMin * ratio) / 60
  const dayH = netMin / 60 - nightH
  return {
    dayH: Math.round(dayH * 100) / 100,
    nightH: Math.round(nightH * 100) / 100,
    totalH: Math.round(netMin / 60 * 100) / 100,
  }
}

// ------- Aggregation pro Mitarbeiter -------
export interface EmployeeStats {
  employee: Employee
  dayHours: number          // geleistet Tag (ohne Feiertage)
  nightHours: number        // geleistet Nacht – ND (ohne Feiertage)
  allNightHours: number     // NZS = alle Nachtstunden inkl. Feiertage
  standbyHours: number      // Rufbereitschaft
  holidayDayHours: number   // ZS Feiertage (Tag)
  holidayNightHours: number // ZS Feiertage (Nacht)
}

export function aggregateStats(
  employees: Employee[],
  shifts: ShiftWithEmployee[],
  year: number,
): EmployeeStats[] {
  const holidays = getGermanHolidays(year)
  const map = new Map<string, EmployeeStats>()

  for (const emp of employees) {
    map.set(emp.id, {
      employee: emp,
      dayHours: 0, nightHours: 0, allNightHours: 0,
      standbyHours: 0, holidayDayHours: 0, holidayNightHours: 0,
    })
  }

  for (const shift of shifts) {
    if (shift.status === 'cancelled') continue
    const s = map.get(shift.employee_id)
    if (!s) continue
    const { dayH, nightH, totalH } = calcShiftHours(shift.start_time, shift.end_time, shift.break_minutes)
    const onHoliday = holidays.has(shift.shift_date)

    if (shift.category === 'standby') {
      s.standbyHours += totalH
    } else if (shift.category === 'normal') {
      if (onHoliday) {
        s.holidayDayHours += dayH
        s.holidayNightHours += nightH
      } else {
        s.dayHours += dayH
        s.nightHours += nightH
      }
      s.allNightHours += nightH // NZS gilt für alle Nachtstunden
    }
  }

  return employees.map(emp => map.get(emp.id)!)
}

// ------- Farb-Hilfsfunktionen für ExcelJS (ARGB) -------
function toArgb(hex: string): string {
  return `FF${hex.replace('#', '').toUpperCase()}`
}

function tintArgb(hex: string, lightness: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const tr = Math.round(r + (255 - r) * lightness)
  const tg = Math.round(g + (255 - g) * lightness)
  const tb = Math.round(b + (255 - b) * lightness)
  return `FF${tr.toString(16).padStart(2, '0').toUpperCase()}${tg.toString(16).padStart(2, '0').toUpperCase()}${tb.toString(16).padStart(2, '0').toUpperCase()}`
}

function contrastArgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.5 ? 'FF1A1A1A' : 'FFFFFFFF'
}

type FillColor = { argb: string }

function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } as FillColor }
}

// ------- Excel-Datei generieren -------
const MONTH_NAMES_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export async function generateTaxAdvisorExcel(
  stats: EmployeeStats[],
  year: number,
  month: number,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dienstplan'
  wb.created = new Date()

  const ws = wb.addWorksheet('Steuerberater-Auswertung', {
    pageSetup: { orientation: 'portrait', fitToPage: true },
  })

  ws.columns = [
    { key: 'a', width: 30 },
    { key: 'b', width: 13 },
    { key: 'c', width: 13 },
    { key: 'd', width: 16 },
  ]

  const NAVY = 'FF1E3A5F'
  const SLATE = 'FF64748B'

  // ── Titel ──
  const titleRow = ws.addRow([`Steuerberater-Auswertung — ${MONTH_NAMES_DE[month - 1]} ${year}`])
  ws.mergeCells(`A${titleRow.number}:D${titleRow.number}`)
  titleRow.font = { bold: true, size: 14, color: { argb: NAVY } }
  titleRow.height = 26

  const subRow = ws.addRow([`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`])
  ws.mergeCells(`A${subRow.number}:D${subRow.number}`)
  subRow.font = { size: 9, color: { argb: SLATE } }

  ws.addRow([])

  // ── Vergütungssätze ──
  const rateHdr = ws.addRow(['Vergütungssätze', '', 'Satz', ''])
  ws.mergeCells(`A${rateHdr.number}:B${rateHdr.number}`)
  rateHdr.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
  rateHdr.eachCell(cell => { cell.fill = solidFill(NAVY) })
  rateHdr.getCell(3).alignment = { horizontal: 'center' }

  const rateData: [string, string][] = [
    ['Tagdienst', `${COMPENSATION_RATES.tagdienst.toFixed(2)} €/h`],
    ['Nachtdienst (ND)', `${COMPENSATION_RATES.nachtdienst.toFixed(2)} €/h`],
    ['Nachtzuschlag (NZS)', `${COMPENSATION_RATES.nzs.toFixed(2)} €/h`],
    ['Rufbereitschaft', `${COMPENSATION_RATES.rufbereitschaft.toFixed(2)} €/h`],
    ['ZS Feiertage (Tag)', `${COMPENSATION_RATES.zsFeiertageTag.toFixed(2)} €/h`],
    ['ZS Feiertage (Nacht)', `${COMPENSATION_RATES.zsFeiertageNacht.toFixed(2)} €/h`],
  ]
  for (const [label, rate] of rateData) {
    const r = ws.addRow([label, '', rate, ''])
    ws.mergeCells(`A${r.number}:B${r.number}`)
    r.font = { size: 9, color: { argb: 'FF334155' } }
    r.getCell(3).font = { size: 9, bold: true, color: { argb: NAVY } }
    r.getCell(3).alignment = { horizontal: 'center' }
    r.eachCell(cell => {
      cell.fill = solidFill('FFF8FAFC')
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
    })
  }

  ws.addRow([])

  // ── Spalten-Überschriften ──
  const colHdrRow = ws.addRow(['Position', 'Stunden', 'Satz (€/h)', 'Gesamt (€)'])
  colHdrRow.font = { bold: true, size: 9, color: { argb: SLATE } }
  colHdrRow.eachCell((cell, col) => {
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFE2E8F0' } } }
    cell.alignment = { horizontal: col === 1 ? 'left' : 'right', vertical: 'middle' }
  })

  ws.addRow([])

  // ── Mitarbeiter-Blöcke ──
  for (const stat of stats) {
    const emp = stat.employee
    const color = emp.color?.startsWith('#') ? emp.color : '#6366f1'
    const fullArgb = toArgb(color)
    const lightArgb = tintArgb(color, 0.88)
    const midArgb = tintArgb(color, 0.45)
    const textArgb = contrastArgb(color)

    // Name-Zeile
    const nameRow = ws.addRow([`${emp.first_name} ${emp.last_name}  (${emp.abbreviation})`])
    ws.mergeCells(`A${nameRow.number}:D${nameRow.number}`)
    nameRow.font = { bold: true, size: 11, color: { argb: textArgb } }
    nameRow.getCell(1).fill = solidFill(fullArgb)
    nameRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    nameRow.height = 22

    const addMetricRow = (label: string, hours: number, rate: number) => {
      const total = hours > 0 ? Math.round(hours * rate * 100) / 100 : 0
      const r = ws.addRow([
        label,
        hours > 0 ? hours : '',
        rate,
        hours > 0 ? total : '',
      ])
      r.font = { size: 10 }
      r.getCell(1).font = { size: 10, color: { argb: 'FF334155' } }
      r.eachCell((cell, col) => {
        cell.fill = solidFill(lightArgb)
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
        if (col > 1) cell.alignment = { horizontal: 'right' }
      })
      r.getCell(3).numFmt = '#,##0.00'
      r.getCell(4).numFmt = '#,##0.00'
      r.height = 17
    }

    addMetricRow('geleistet Tag', stat.dayHours, COMPENSATION_RATES.tagdienst)
    addMetricRow('geleistet Nacht (ND)', stat.nightHours, COMPENSATION_RATES.nachtdienst)
    addMetricRow('NZS (Nachtzuschlag)', stat.allNightHours, COMPENSATION_RATES.nzs)
    addMetricRow('Rufbereitschaft', stat.standbyHours, COMPENSATION_RATES.rufbereitschaft)
    addMetricRow('ZS Feiertage (Tag)', stat.holidayDayHours, COMPENSATION_RATES.zsFeiertageTag)
    addMetricRow('ZS Feiertage (Nacht)', stat.holidayNightHours, COMPENSATION_RATES.zsFeiertageNacht)

    // Summen-Zeile
    const totalH =
      stat.dayHours + stat.nightHours + stat.standbyHours +
      stat.holidayDayHours + stat.holidayNightHours
    const totalEur =
      stat.dayHours * COMPENSATION_RATES.tagdienst +
      stat.nightHours * COMPENSATION_RATES.nachtdienst +
      stat.allNightHours * COMPENSATION_RATES.nzs +
      stat.standbyHours * COMPENSATION_RATES.rufbereitschaft +
      stat.holidayDayHours * COMPENSATION_RATES.zsFeiertageTag +
      stat.holidayNightHours * COMPENSATION_RATES.zsFeiertageNacht

    const sumRow = ws.addRow([
      'Summe',
      Math.round(totalH * 100) / 100,
      '',
      Math.round(totalEur * 100) / 100,
    ])
    sumRow.font = { bold: true, size: 10, color: { argb: contrastArgb(tintArgb(color, 0.45).slice(2)) } }
    sumRow.eachCell((cell, col) => {
      cell.fill = solidFill(midArgb)
      cell.border = {
        top: { style: 'thin', color: { argb: fullArgb } },
        bottom: { style: 'thin', color: { argb: fullArgb } },
      }
      if (col > 1) cell.alignment = { horizontal: 'right' }
    })
    sumRow.getCell(2).numFmt = '#,##0.00'
    sumRow.getCell(4).numFmt = '#,##0.00'
    sumRow.getCell(4).font = { bold: true, size: 10, color: { argb: NAVY } }
    sumRow.height = 18

    ws.addRow([])
  }

  // ── Zusammenfassung ──
  ws.addRow([])
  const summaryTitleRow = ws.addRow(['Übersicht — Alle Mitarbeiter'])
  ws.mergeCells(`A${summaryTitleRow.number}:D${summaryTitleRow.number}`)
  summaryTitleRow.font = { bold: true, size: 13, color: { argb: NAVY } }
  summaryTitleRow.height = 26

  const summaryHdrRow = ws.addRow(['Mitarbeiter', 'Nachtstunden (ND)', 'Tagstunden', 'Gesamt'])
  summaryHdrRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
  summaryHdrRow.eachCell((cell, col) => {
    cell.fill = solidFill(NAVY)
    cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF334155' } } }
  })
  summaryHdrRow.height = 20

  let totalND = 0, totalTag = 0, totalGesamt = 0

  for (const stat of stats) {
    const emp = stat.employee
    const color = emp.color?.startsWith('#') ? emp.color : '#6366f1'
    const fullArgb = toArgb(color)
    const textArgb = contrastArgb(color)

    const nd = Math.round((stat.nightHours + stat.holidayNightHours) * 100) / 100
    const tag = Math.round((stat.dayHours + stat.holidayDayHours) * 100) / 100
    const gesamt = Math.round((nd + tag) * 100) / 100

    totalND += nd
    totalTag += tag
    totalGesamt += gesamt

    const r = ws.addRow([`${emp.first_name} ${emp.last_name}`, nd, tag, gesamt])
    r.font = { size: 10, color: { argb: textArgb } }
    r.eachCell((cell, col) => {
      cell.fill = solidFill(fullArgb)
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
      if (col > 1) cell.alignment = { horizontal: 'right' }
    })
    r.getCell(1).alignment = { horizontal: 'left', indent: 1 }
    r.height = 18
  }

  const totalRow = ws.addRow([
    'Gesamt',
    Math.round(totalND * 100) / 100,
    Math.round(totalTag * 100) / 100,
    Math.round(totalGesamt * 100) / 100,
  ])
  totalRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
  totalRow.eachCell((cell, col) => {
    cell.fill = solidFill(NAVY)
    cell.border = { top: { style: 'medium', color: { argb: NAVY } } }
    if (col > 1) cell.alignment = { horizontal: 'right' }
  })
  totalRow.getCell(1).alignment = { horizontal: 'left', indent: 1 }
  totalRow.height = 22

  const data = await wb.xlsx.writeBuffer()
  return Buffer.from(data)
}
