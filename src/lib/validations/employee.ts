import { z } from 'zod'

export const employeeSchema = z.object({
  profile_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(2, 'Mindestens 2 Zeichen').max(50),
  last_name: z.string().min(2, 'Mindestens 2 Zeichen').max(50),
  phone: z.string().max(20).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültige Farbe'),
  employee_number: z.string().max(20).optional().or(z.literal('')),
  hired_at: z.string().optional().nullable(),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>
