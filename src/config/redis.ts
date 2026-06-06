import { createClient } from 'redis';
import { env } from './env';
import { logger } from '@/utils/logger';

export const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  password: env.REDIS_PASSWORD || undefined,
});

redis.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

// ── Redis key helpers ────────────────────────────────────────────────────────
export const RedisKeys = {
  fcmToken: (userId: string) => `fcm:${userId}`,
  userSession: (userId: string) => `session:${userId}`,
  rideSeats: (rideId: string) => `seats:${rideId}`,
  rateLimit: (ip: string) => `rl:${ip}`,
} as const;
