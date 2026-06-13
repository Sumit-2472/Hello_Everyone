import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError, HttpStatus } from '../config/appError';
import { rootLogger } from '../config/logger';
import { ApiResponse } from '../types';

// ── Re-export so services only need one import path ───────────
export { AppError, isAppError, HttpStatus } from '../config/appError';
export {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  externalServiceError,
} from '../config/appError';

// ── Async route handler wrapper ───────────────────────────────
/**
 * Wraps an async Express handler so thrown errors are forwarded to
 * the global error handler instead of causing unhandled rejections.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ── 404 handler ───────────────────────────────────────────────
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route ${req.originalUrl} not found`, HttpStatus.NOT_FOUND));
};

// ── Global error handler ──────────────────────────────────────
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Normalise to AppError
  let appError: AppError;

  if (isAppError(err)) {
    appError = err;
  } else if (err instanceof Error) {
    // Mongoose validation errors → 422
    if (err.name === 'ValidationError') {
      appError = new AppError(err.message, HttpStatus.UNPROCESSABLE_ENTITY, 'operational');
    }
    // Mongoose duplicate key → 409
    else if ((err as NodeJS.ErrnoException).code === '11000' || err.message.includes('E11000')) {
      const field = extractDuplicateKeyField(err.message);
      appError = new AppError(
        field ? `${field} already exists` : 'Duplicate entry',
        HttpStatus.CONFLICT,
        'operational'
      );
    }
    // Mongoose CastError (invalid ObjectId) → 400
    else if (err.name === 'CastError') {
      appError = new AppError('Invalid ID format', HttpStatus.BAD_REQUEST, 'operational');
    }
    // JWT errors → 401
    else if (err.name === 'JsonWebTokenError') {
      appError = new AppError('Invalid token', HttpStatus.UNAUTHORIZED, 'operational');
    }
    else if (err.name === 'TokenExpiredError') {
      appError = new AppError('Token expired', HttpStatus.UNAUTHORIZED, 'operational');
    }
    // Unknown Error instance
    else {
      appError = new AppError(err.message, HttpStatus.INTERNAL_SERVER_ERROR, 'programmer');
    }
  } else {
    appError = new AppError('An unexpected error occurred', HttpStatus.INTERNAL_SERVER_ERROR, 'programmer');
  }

  // ── Logging ──────────────────────────────────────────────
  if (appError.category === 'programmer' || appError.category === 'external') {
    rootLogger.error('Unhandled error', {
      message:    appError.message,
      statusCode: appError.statusCode,
      category:   appError.category,
      context:    appError.context,
      stack:      appError.stack,
      url:        req.originalUrl,
      method:     req.method,
    });
  } else if (appError.statusCode >= 500) {
    rootLogger.warn('Operational error with high status code', {
      message:    appError.message,
      statusCode: appError.statusCode,
      url:        req.originalUrl,
    });
  }

  // ── Response ─────────────────────────────────────────────
  const body: ApiResponse = {
    success: false,
    error: appError.isOperational
      ? appError.message
      : 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && appError.context
      ? { context: appError.context }
      : {}),
    timestamp: new Date().toISOString(),
  };

  res.status(appError.statusCode).json(body);
};

// ── Helper ────────────────────────────────────────────────────
function extractDuplicateKeyField(message: string): string | null {
  // MongoDB duplicate key error format: "E11000 ... index: collection.field_1 ..."
  const match = message.match(/index: \S+\.(\w+)_\d+/);
  return match ? match[1] : null;
}
