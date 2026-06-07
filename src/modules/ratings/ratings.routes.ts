import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { submitRatingSchema, userRatingsParamsSchema } from './ratings.schema';
import { submitRatingHandler, getUserRatingsHandler } from './ratings.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(submitRatingSchema), submitRatingHandler);
router.get(
  '/user/:userId',
  validate(userRatingsParamsSchema, 'params'),
  getUserRatingsHandler,
);

export default router;
