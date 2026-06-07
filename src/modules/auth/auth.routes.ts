import { Router } from 'express';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimiter';
import { verifyBodySchema, refreshBodySchema } from './auth.schema';
import { verify, refresh, logoutHandler } from './auth.controller';

const router = Router();

router.use(authLimiter);

router.post('/verify', validate(verifyBodySchema), verify);
router.post('/refresh', validate(refreshBodySchema), refresh);
router.post('/logout', authenticate, logoutHandler);

export default router;
