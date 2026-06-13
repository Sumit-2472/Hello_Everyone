// ============================================================
// Amazon ReLife — AppError
// Single source of truth for all application errors.
// Imported by errorHandler middleware and all services.
// ============================================================

/**
 * HTTP status codes used across all services.
 * Using a const enum keeps the numeric values inlined at compile time.
 */
export const enum HttpStatus {
  OK                    = 200,
  CREATED               = 201,
  NO_CONTENT            = 204,
  BAD_REQUEST           = 400,
  UNAUTHORIZED          = 401,
  FORBIDDEN             = 403,
  NOT_FOUND             = 404,
  CONFLICT              = 409,
  UNPROCESSABLE_ENTITY  = 422,
  TOO_MANY_REQUESTS     = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY           = 502,
  SERVICE_UNAVAILABLE   = 503,
}

/**
 * Error categories let the error handler decide how to log and respond.
 *
 * - operational : expected, user-facing errors (400, 401, 404, 409 …)
 * - programmer  : bugs — should never reach production users
 * - external    : third-party failures (DB, AWS S3, Gemini API)
 */
export type ErrorCategory = 'operational' | 'programmer' | 'external';

// ── AppError ──────────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly category: ErrorCategory;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    category: ErrorCategory = 'operational',
    context?: Record<string, unknown>
  ) {
    super(message);

    // Restore prototype chain (required when extending built-in Error in TS)
    Object.setPrototypeOf(this, new.target.prototype);

    this.name        = this.constructor.name;
    this.statusCode  = statusCode;
    this.category    = category;
    this.isOperational = category === 'operational';
    this.context     = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Typed factory helpers ─────────────────────────────────────
// Use these instead of `new AppError(…, 400)` everywhere — 
// intent is clearer and statusCode can't be mistyped.

export const badRequest = (
  message: string,
  context?: Record<string, unknown>
): AppError =>
  new AppError(message, HttpStatus.BAD_REQUEST, 'operational', context);

export const unauthorized = (
  message = 'Authentication required'
): AppError =>
  new AppError(message, HttpStatus.UNAUTHORIZED, 'operational');

export const forbidden = (
  message = 'You do not have permission to perform this action'
): AppError =>
  new AppError(message, HttpStatus.FORBIDDEN, 'operational');

export const notFound = (
  resource: string,
  id?: string
): AppError => {
  const msg = id
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;
  return new AppError(msg, HttpStatus.NOT_FOUND, 'operational');
};

export const conflict = (message: string): AppError =>
  new AppError(message, HttpStatus.CONFLICT, 'operational');

export const tooManyRequests = (
  message = 'Too many requests. Please try again later.'
): AppError =>
  new AppError(message, HttpStatus.TOO_MANY_REQUESTS, 'operational');

export const internalError = (
  message = 'An unexpected error occurred',
  context?: Record<string, unknown>
): AppError =>
  new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, 'programmer', context);

export const externalServiceError = (
  service: string,
  detail?: string
): AppError => {
  const msg = detail
    ? `External service error [${service}]: ${detail}`
    : `External service error [${service}]`;
  return new AppError(msg, HttpStatus.BAD_GATEWAY, 'external');
};

// ── Type guard ────────────────────────────────────────────────
export const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError;
