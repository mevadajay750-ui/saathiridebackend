import { z } from 'zod';

export const submitRatingSchema = z.object({
  ride_id: z
    .string({ error: 'ride_id is required' })
    .uuid('ride_id must be a valid UUID'),
  ratee_id: z
    .string({ error: 'ratee_id is required' })
    .uuid('ratee_id must be a valid UUID'),
  score: z
    .number({ error: 'score is required' })
    .int()
    .min(1, 'Minimum score is 1')
    .max(5, 'Maximum score is 5'),
  comment: z
    .string()
    .max(500, 'Comment too long')
    .trim()
    .optional(),
});

export const userRatingsParamsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;
