import { z } from 'zod';

export const requestBookingSchema = z.object({
  ride_id: z
    .string({ error: 'ride_id is required' })
    .uuid('ride_id must be a valid UUID'),
  seats: z
    .number({ error: 'seats is required' })
    .int()
    .min(1, 'Must request at least 1 seat')
    .max(6, 'Maximum 6 seats per booking'),
});

export const bookingParamsSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

export const rideBookingsParamsSchema = z.object({
  rideId: z.string().uuid('Invalid ride ID'),
});

export type RequestBookingInput = z.infer<typeof requestBookingSchema>;
