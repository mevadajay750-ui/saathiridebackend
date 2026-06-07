import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  updateProfileSchema,
  upsertVehicleSchema,
  getUserParamsSchema,
} from './users.schema';
import {
  getMeHandler,
  updateMeHandler,
  upsertVehicleHandler,
  getUserByIdHandler,
} from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMeHandler);
router.put('/me', validate(updateProfileSchema), updateMeHandler);
router.put('/me/vehicle', validate(upsertVehicleSchema), upsertVehicleHandler);

router.get('/:id', validate(getUserParamsSchema, 'params'), getUserByIdHandler);

export default router;
