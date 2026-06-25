import { z } from 'zod'

export const shiftSchema = z.object({
  employee_id: z.string().uuid('Mitarbeiter wählen'),
  shift_type_id: z.string().uuid().optional().nullable(),
  shift_date: z.string().min(1, 'Datum wählen'),
  start_time: z.string().min(1, 'Startzeit wählen'),
  end_time: z.string().min(1, 'Endzeit wählen'),
  break_minutes: z.coerce.number().min(0).max(480).default(0),
  category: z.enum(['normal', 'standby', 'vacation', 'sick', 'other']).default('normal'),
  location: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['scheduled', 'cancelled', 'completed']).default('scheduled'),
})

export type ShiftFormValues = z.infer<typeof shiftSchema>

export const shiftRequestSchema = z.object({
  request_type: z.enum([
    'availability',
    'unavailability',
    'vacation',
    'preference',
    'block_shift',
  ]),
  request_date: z.string().min(1, 'Datum wählen'),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  priority: z.coerce.number().min(1).max(3).default(1),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type ShiftRequestFormValues = z.infer<typeof shiftRequestSchema>

export const requestDeadlineSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
  deadline_at: z.string().min(1, 'Frist-Zeitpunkt wählen'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type RequestDeadlineFormValues = z.infer<typeof requestDeadlineSchema>

export const adminEventSchema = z.object({
  title: z.string().min(1, 'Titel eingeben').max(200),
  event_date: z.string().min(1, 'Datum wählen'),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  event_type: z.enum(['internal', 'meeting', 'training', 'absence', 'other']).default('internal'),
  description: z.string().max(1000).optional().or(z.literal('')),
  is_visible_to_employees: z.boolean().default(false),
  color: z.string().default('#64748b'),
})

export type AdminEventFormValues = z.infer<typeof adminEventSchema>

export const employeeSettingsSchema = z.object({
  notify_shift_reminder: z.boolean().default(true),
  notify_request_status: z.boolean().default(true),
  notify_plan_published: z.boolean().default(true),
  notify_via_email: z.boolean().default(false),
})

export type EmployeeSettingsFormValues = z.infer<typeof employeeSettingsSchema>
