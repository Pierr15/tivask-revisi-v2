import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors,
      },
    });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: err.message || 'Unauthorized',
      },
    });
    return;
  }

  if (err.name === 'NotFoundError') {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'Not found',
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred',
    },
  });
}
