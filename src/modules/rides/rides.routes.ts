import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  postRideSchema,
  searchRidesSchema,
  rideParamsSchema,
} from './rides.schema';
import {
  postRideHandler,
  searchRidesHandler,
  getMyRidesHandler,
  getRideByIdHandler,
  cancelRideHandler,
} from './rides.controller';

const router = Router();

router.use(authenticate);

router.get('/search', validate(searchRidesSchema, 'query'), searchRidesHandler);
router.get('/my', getMyRidesHandler);

router.post('/', validate(postRideSchema), postRideHandler);
router.get('/:id', validate(rideParamsSchema, 'params'), getRideByIdHandler);
router.delete('/:id', validate(rideParamsSchema, 'params'), cancelRideHandler);

export default router;
