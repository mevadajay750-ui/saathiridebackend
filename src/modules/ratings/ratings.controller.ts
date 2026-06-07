import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess, sendCreated } from '@/utils/response';
import { submitRating, getUserRatings } from './ratings.service';
import type { SubmitRatingInput } from './ratings.schema';

export const submitRatingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const rating = await submitRating(
      req.user!.userId,
      req.body as SubmitRatingInput,
    );
    return sendCreated(res, rating, 'Rating submitted');
  },
);

export const getUserRatingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getUserRatings(req.params.userId as string);
    return sendSuccess(res, data, 200, 'Ratings fetched');
  },
);
