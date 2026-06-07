import { z } from 'zod';

export const postRideSchema = z
  .object({
    origin_city: z
      .string({ error: 'origin_city is required' })
      .min(2, 'Origin city too short')
      .max(100)
      .trim(),
    destination_city: z
      .string({ error: 'destination_city is required' })
      .min(2, 'Destination city too short')
      .max(100)
      .trim(),
    departure_time: z
      .string({ error: 'departure_time is required' })
      .datetime({ offset: true, message: 'departure_time must be a valid ISO 8601 datetime' }),
    price_per_seat: z
      .number({ error: 'price_per_seat is required' })
      .min(10, 'Minimum price is ₹10')
      .max(10000, 'Maximum price is ₹10,000'),
    total_seats: z
      .number({ error: 'total_seats is required' })
      .int()
      .min(1, 'At least 1 seat required')
      .max(6, 'Maximum 6 seats'),
    notes: z
      .string()
      .max(500, 'Notes too long')
      .trim()
      .optional(),
  })
  .refine(
    (data) => data.origin_city.toLowerCase() !== data.destination_city.toLowerCase(),
    { message: 'Origin and destination cannot be the same', path: ['destination_city'] },
  );

export const searchRidesSchema = z.object({
  origin: z
    .string({ error: 'origin is required' })
    .min(2)
    .trim(),
  destination: z
    .string({ error: 'destination is required' })
    .min(2)
    .trim(),
  date: z
    .string({ error: 'date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  seats: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1).max(6)),
});

export const rideParamsSchema = z.object({
  id: z.string().uuid('Invalid ride ID'),
});

export type PostRideInput = z.infer<typeof postRideSchema>;
export type SearchRidesQuery = z.infer<typeof searchRidesSchema>;
