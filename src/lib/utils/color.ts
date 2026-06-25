// Berechnet ob heller oder dunkler Text besser lesbar ist
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Luminanz-Berechnung nach WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

// Macht eine Farbe transparenter (für Hintergründe)
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Vordefinierte Mitarbeiter-Farben
export const EMPLOYEE_COLORS = [
  '#ef4444', // Rot
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Grün
  '#06b6d4', // Cyan
  '#3b82f6', // Blau
  '#6366f1', // Indigo
  '#8b5cf6', // Violett
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f43f5e', // Rose
]
