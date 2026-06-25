import { z } from 'zod'

export const employeeSchema = z.object({
  profile_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(2, 'Mindestens 2 Zeichen').max(50),
  last_name: z.string().min(2, 'Mindestens 2 Zeichen').max(50),
  abbreviation: z
    .string()
    .min(2, 'Mindestens 2 Zeichen')
    .max(5, 'Maximal 5 Zeichen')
    .toUpperCase(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültige Farbe'),
  position: z.string().max(100).optional().or(z.literal('')),
  department: z.string().max(100).optional().or(z.literal('')),
  employment_type: z.enum(['full_time', 'part_time', 'mini_job', 'trainee']),
  weekly_hours: z.coerce
    .number()
    .min(0)
    .max(60)
    .optional()
    .nullable(),
  phone: z.string().max(20).optional().or(z.literal('')),
  employee_number: z.string().max(20).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  notes: z.string().max(500).optional().or(z.literal('')),
  hired_at: z.string().optional().nullable(),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>
