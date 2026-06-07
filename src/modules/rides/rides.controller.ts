import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess, sendCreated } from '@/utils/response';
import {
  postRide,
  searchRides,
  getMyRides,
  getRideById,
  cancelRide,
} from './rides.service';
import type { PostRideInput, SearchRidesQuery } from './rides.schema';

export const postRideHandler = asyncHandler(async (req: Request, res: Response) => {
  const ride = await postRide(req.user!.userId, req.body as PostRideInput);
  return sendCreated(res, ride, 'Ride posted successfully');
});

export const searchRidesHandler = asyncHandler(async (req: Request, res: Response) => {
  const rides = await searchRides(req.query as unknown as SearchRidesQuery);
  return sendSuccess(res, rides, 200, `${rides.length} ride(s) found`);
});

export const getMyRidesHandler = asyncHandler(async (req: Request, res: Response) => {
  const rides = await getMyRides(req.user!.userId);
  return sendSuccess(res, rides, 200, 'Your rides fetched');
});

export const getRideByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const ride = await getRideById(req.params.id as string);
  return sendSuccess(res, ride, 200, 'Ride fetched');
});

export const cancelRideHandler = asyncHandler(async (req: Request, res: Response) => {
  await cancelRide(req.params.id as string, req.user!.userId);
  return sendSuccess(res, null, 200, 'Ride cancelled successfully');
});
