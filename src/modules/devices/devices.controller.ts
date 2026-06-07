import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/response';
import { registerDevice, removeDevice } from './devices.service';
import type { RegisterDeviceInput } from './devices.schema';

export const registerDeviceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await registerDevice(req.user!.userId, req.body as RegisterDeviceInput);
    return sendSuccess(res, null, 200, 'Device registered');
  },
);

export const removeDeviceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await removeDevice(req.user!.userId);
    return sendSuccess(res, null, 200, 'Device removed');
  },
);
