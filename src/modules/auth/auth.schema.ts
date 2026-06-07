import { z } from 'zod';

export const verifyBodySchema = z.object({
  firebase_token: z
    .string()
    .min(10, 'Invalid token')
    .max(2048, 'Token too long'),
});

export const refreshBodySchema = z.object({
  refresh_token: z.string().min(10, 'Invalid token'),
});

export type VerifyInput = z.infer<typeof verifyBodySchema>;
export type RefreshInput = z.infer<typeof refreshBodySchema>;
