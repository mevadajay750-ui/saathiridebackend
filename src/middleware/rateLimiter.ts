import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

/** General API rate limiter */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many requests. Please slow down.'));
  },
});

/** Strict limiter for auth/OTP endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.OTP_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests('Too many OTP requests. Wait 15 minutes.'));
  },
});
