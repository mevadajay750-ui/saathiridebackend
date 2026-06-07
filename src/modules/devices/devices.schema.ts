import { z } from 'zod';

export const registerDeviceSchema = z.object({
  fcm_token: z
    .string({ error: 'fcm_token is required' })
    .min(10, 'Invalid FCM token')
    .max(500, 'Token too long'),
  platform: z.enum(['ios', 'android'], {
    message: 'platform must be ios or android',
  }),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
