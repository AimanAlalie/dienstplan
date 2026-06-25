// ============================================================
// Datenbank-Typen (manuell gepflegt; idealerweise via
// `supabase gen types typescript` automatisch generiert)
// ============================================================

export type UserRole = 'admin' | 'employee'
export type EmployeeStatus = 'active' | 'inactive' | 'archived'
export type EmploymentType = 'full_time' | 'part_time' | 'mini_job' | 'trainee'
export type PlanStatus = 'draft' | 'review' | 'published' | 'archived'
export type ShiftStatus = 'scheduled' | 'cancelled' | 'completed'
export type ShiftCategory = 'normal' | 'standby' | 'vacation' | 'sick' | 'other'
export type RequestType = 'availability' | 'unavailability' | 'vacation' | 'preference' | 'block_shift'
export type RequestStatus = 'pending' | 'approved' | 'modified' | 'rejected'
export type NotificationType = 'shift_reminder' | 'request_status' | 'plan_published' | 'conflict_warning' | 'general'
export type AdminEventType = 'internal' | 'meeting' | 'training' | 'absence' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  profile_id: string | null
  employee_number: string | null
  first_name: string
  last_name: string
  abbreviation: string
  color: string
  position: string | null
  department: string | null
  employment_type: EmploymentType
  weekly_hours: number | null
  phone: string | null
  status: EmployeeStatus
  notes: string | null
  hired_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface MonthlyPlan {
  id: string
  year: number
  month: number
  status: PlanStatus
  notes: string | null
  published_at: string | null
  published_by: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ShiftType {
  id: string
  name: string
  abbreviation: string
  default_start: string
  default_end: string
  color: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Shift {
  id: string
  monthly_plan_id: string
  employee_id: string
  shift_type_id: string | null
  shift_date: string
  start_time: string
  end_time: string
  break_minutes: number
  category: ShiftCategory
  location: string | null
  notes: string | null
  status: ShiftStatus
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface ShiftRequest {
  id: string
  employee_id: string
  monthly_plan_id: string | null
  request_type: RequestType
  request_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  priority: 1 | 2 | 3
  notes: string | null
  status: RequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface EmployeeSettings {
  id: string
  employee_id: string
  notify_shift_reminder: boolean
  notify_request_status: boolean
  notify_plan_published: boolean
  notify_via_email: boolean
  created_at: string
  updated_at: string
}

export interface RequestDeadline {
  id: string
  year: number
  month: number
  deadline_at: string
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface AdminEvent {
  id: string
  title: string
  event_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  event_type: AdminEventType
  description: string | null
  is_visible_to_employees: boolean
  monthly_plan_id: string | null
  color: string
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Notification {
  id: string
  employee_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

// Erweiterte Typen mit Joins
export interface ShiftWithEmployee extends Shift {
  employee: Employee
  shift_type: ShiftType | null
}

export interface ShiftRequestWithEmployee extends ShiftRequest {
  employee: Employee
}

export interface AuditLogWithActor extends AuditLog {
  actor: Profile | null
}
