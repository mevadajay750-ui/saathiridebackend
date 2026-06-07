import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess, sendCreated } from '@/utils/response';
import {
  verifyFirebaseAndUpsertUser,
  refreshAccessToken,
  logout,
} from './auth.service';
import type { VerifyInput, RefreshInput } from './auth.schema';

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const { firebase_token } = req.body as VerifyInput;
  const result = await verifyFirebaseAndUpsertUser(firebase_token);

  if (result.isNewUser) {
    return sendCreated(res, result, 'Account created successfully');
  }
  return sendSuccess(res, result, 200, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refresh_token } = req.body as RefreshInput;
  const tokens = await refreshAccessToken(refresh_token);
  return sendSuccess(res, tokens, 200, 'Token refreshed');
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await logout(userId);
  return sendSuccess(res, null, 200, 'Logged out successfully');
});
