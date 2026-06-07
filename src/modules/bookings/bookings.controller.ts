import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess, sendCreated } from '@/utils/response';
import {
  requestBooking,
  getMyBookings,
  getRideBookings,
  acceptBooking,
  declineBooking,
  cancelBooking,
} from './bookings.service';
import type { RequestBookingInput } from './bookings.schema';

export const requestBookingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await requestBooking(
      req.user!.userId,
      req.body as RequestBookingInput,
    );
    return sendCreated(res, booking, 'Booking request sent');
  },
);

export const getMyBookingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const bookings = await getMyBookings(req.user!.userId);
    return sendSuccess(res, bookings, 200, 'Bookings fetched');
  },
);

export const getRideBookingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const bookings = await getRideBookings(req.params.rideId as string, req.user!.userId);
    return sendSuccess(res, bookings, 200, 'Ride bookings fetched');
  },
);

export const acceptBookingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const booking = await acceptBooking(req.params.id as string, req.user!.userId);
    return sendSuccess(res, booking, 200, 'Booking accepted');
  },
);

export const declineBookingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await declineBooking(req.params.id as string, req.user!.userId);
    return sendSuccess(res, null, 200, 'Booking declined');
  },
);

export const cancelBookingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await cancelBooking(req.params.id as string, req.user!.userId);
    return sendSuccess(res, null, 200, 'Booking cancelled');
  },
);
