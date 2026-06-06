import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import { env } from '@/config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known operational errors
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error('Operational error', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
    }
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // PostgreSQL constraint violations
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: 'A record with this data already exists',
    });
    return;
  }

  // Unexpected errors
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message:
      env.NODE_ENV === 'production'
        ? 'Something went wrong. Please try again.'
        : err.message,
  });
}
