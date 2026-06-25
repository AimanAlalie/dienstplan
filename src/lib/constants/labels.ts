// Deutsche Labels für alle Enums

export const PLAN_STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  review: 'In Prüfung',
  published: 'Veröffentlicht',
  archived: 'Archiviert',
}

export const PLAN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-slate-100 text-slate-500',
}

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  availability: 'Verfügbar',
  unavailability: 'Sperrtag',
  vacation: 'Urlaubswunsch',
  preference: 'Wunschdienst',
  block_shift: 'Blockdienst-Wunsch',
}

export const REQUEST_TYPE_ICONS: Record<string, string> = {
  availability: '✓',
  unavailability: '✗',
  vacation: '☀',
  preference: '★',
  block_shift: '⊞',
}

export const REQUEST_TYPE_COLORS: Record<string, string> = {
  availability: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unavailability: 'bg-red-50 text-red-700 border-red-200',
  vacation: 'bg-sky-50 text-sky-700 border-sky-200',
  preference: 'bg-violet-50 text-violet-700 border-violet-200',
  block_shift: 'bg-orange-50 text-orange-700 border-orange-200',
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'Offen',
  approved: 'Übernommen',
  modified: 'Geändert',
  rejected: 'Abgelehnt',
}

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  modified: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Vollzeit',
  part_time: 'Teilzeit',
  mini_job: 'Minijob',
  trainee: 'Auszubildende/r',
}

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  inactive: 'Inaktiv',
  archived: 'Archiviert',
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Normal',
  2: 'Hoch',
  3: 'Dringend',
}

export const SHIFT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Geplant',
  cancelled: 'Abgesagt',
  completed: 'Abgeschlossen',
}

export const SHIFT_CATEGORY_LABELS: Record<string, string> = {
  normal: 'Dienst',
  standby: 'Bereitschaft',
  vacation: 'Urlaub',
  sick: 'Krank',
  other: 'Sonstiges',
}

export const SHIFT_CATEGORY_COLORS: Record<string, string> = {
  normal: '',           // Mitarbeiterfarbe
  standby: '#8b5cf6',   // Violett – überschreibt Mitarbeiterfarbe im Chip
  vacation: '#0ea5e9',  // Sky-Blau
  sick: '#f97316',      // Orange
  other: '#94a3b8',     // Slate
}

export const ADMIN_EVENT_TYPE_LABELS: Record<string, string> = {
  internal: 'Intern',
  meeting: 'Besprechung',
  training: 'Schulung',
  absence: 'Abwesenheit',
  other: 'Sonstiges',
}

export const ADMIN_EVENT_TYPE_COLORS: Record<string, string> = {
  internal: '#64748b',
  meeting: '#3b82f6',
  training: '#10b981',
  absence: '#f59e0b',
  other: '#94a3b8',
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  shift_reminder: 'Dienst-Erinnerung',
  request_status: 'Antrag-Status',
  plan_published: 'Plan veröffentlicht',
  conflict_warning: 'Konflikt-Hinweis',
  general: 'Allgemein',
}
