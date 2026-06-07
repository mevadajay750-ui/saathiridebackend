import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/response';
import { getMe, updateMe, upsertVehicle, getUserById } from './users.service';
import type { UpdateProfileInput, UpsertVehicleInput } from './users.schema';

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getMe(req.user!.userId);
  return sendSuccess(res, profile, 200, 'Profile fetched');
});

export const updateMeHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await updateMe(req.user!.userId, req.body as UpdateProfileInput);
  return sendSuccess(res, profile, 200, 'Profile updated');
});

export const upsertVehicleHandler = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await upsertVehicle(req.user!.userId, req.body as UpsertVehicleInput);
  return sendSuccess(res, vehicle, 200, 'Vehicle saved');
});

export const getUserByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getUserById(req.params.id as string);
  return sendSuccess(res, profile, 200, 'User profile fetched');
});
