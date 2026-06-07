import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { registerDeviceSchema } from './devices.schema';
import { registerDeviceHandler, removeDeviceHandler } from './devices.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(registerDeviceSchema), registerDeviceHandler);
router.delete('/', removeDeviceHandler);

export default router;
