import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '@/utils/ApiError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validates request body/query/params against a Zod schema.
 * Replaces the source with the parsed (typed + sanitised) data.
 */
export function validate(
  schema: ZodSchema,
  target: ValidationTarget = 'body',
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError =
        (Object.values(errors).flat()[0] as string | undefined) ?? 'Validation error';
      throw ApiError.badRequest(firstError, 'VALIDATION_ERROR');
    }
    // Replace with parsed data (strips unknown fields, applies defaults)
    (req as any)[target] = result.data;
    next();
  };
}
