import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_VERSION: z.string().default('v1'),

  // Database — Supabase
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_DIRECT_URL: z.string().url('DATABASE_DIRECT_URL must be a valid URL'),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().default(30000),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().default(5000),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Firebase
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string(),

  // FCM
  FCM_SERVER_KEY: z.string().optional(),

  // MSG91
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),

  // Rate limits
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  OTP_RATE_LIMIT_MAX: z.coerce.number().default(5),

  // OTP
  OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  OTP_LENGTH: z.coerce.number().default(6),

  // Business rules
  MAX_SEATS: z.coerce.number().default(4),
  MIN_PRICE_INR: z.coerce.number().default(50),
  MAX_PRICE_INR: z.coerce.number().default(5000),
  BOOKING_CANCEL_CUTOFF_HOURS: z.coerce.number().default(2),
  BOOKING_AUTO_EXPIRE_HOURS: z.coerce.number().default(12),
  RATING_WINDOW_DAYS: z.coerce.number().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
