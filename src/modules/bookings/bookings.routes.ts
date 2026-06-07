import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  requestBookingSchema,
  bookingParamsSchema,
  rideBookingsParamsSchema,
} from './bookings.schema';
import {
  requestBookingHandler,
  getMyBookingsHandler,
  getRideBookingsHandler,
  acceptBookingHandler,
  declineBookingHandler,
  cancelBookingHandler,
} from './bookings.controller';

const router = Router();

router.use(authenticate);

router.get('/my', getMyBookingsHandler);
router.get('/ride/:rideId', validate(rideBookingsParamsSchema, 'params'), getRideBookingsHandler);

router.post('/', validate(requestBookingSchema), requestBookingHandler);
router.patch('/:id/accept', validate(bookingParamsSchema, 'params'), acceptBookingHandler);
router.patch('/:id/decline', validate(bookingParamsSchema, 'params'), declineBookingHandler);
router.patch('/:id/cancel', validate(bookingParamsSchema, 'params'), cancelBookingHandler);

export default router;
