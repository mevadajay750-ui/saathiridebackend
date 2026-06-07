import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { ApiError } from '@/utils/ApiError';

/**
 * Verifies the Bearer JWT in Authorization header.
 * Attaches decoded payload to req.user.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing authorization header');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (payload.type === 'refresh') {
    throw ApiError.unauthorized('Refresh token cannot be used as access token');
  }

  req.user = payload;
  next();
}

/**
 * Restrict endpoint to a specific role.
 * Must be used after `authenticate`.
 */
export function requireRole(role: 'driver' | 'passenger') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (req.user.role !== role) {
      throw ApiError.forbidden(`Only ${role}s can access this endpoint`);
    }
    next();
  };
}
