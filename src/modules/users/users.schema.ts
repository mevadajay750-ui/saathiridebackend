import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name too long')
      .trim()
      .optional(),
    avatar_url: z
      .string()
      .url('avatar_url must be a valid URL')
      .max(500)
      .optional(),
    role: z.enum(['driver', 'passenger', 'both'], {
      message: 'role must be driver, passenger, or both',
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const upsertVehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50).trim(),
  model: z.string().min(1, 'Model is required').max(50).trim(),
  year: z
    .number()
    .int()
    .min(1990, 'Vehicle year must be 1990 or later')
    .max(new Date().getFullYear() + 1, 'Invalid vehicle year'),
  color: z.string().min(1, 'Color is required').max(30).trim(),
  plate_number: z
    .string()
    .min(4, 'Invalid plate number')
    .max(20)
    .trim()
    .transform((v) => v.toUpperCase()),
  total_seats: z
    .number()
    .int()
    .min(1, 'Must have at least 1 seat')
    .max(6, 'Maximum 6 seats allowed'),
});

export const getUserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpsertVehicleInput = z.infer<typeof upsertVehicleSchema>;
