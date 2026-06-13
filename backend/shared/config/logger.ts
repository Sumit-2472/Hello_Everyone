import winston, { Logger, LoggerOptions } from 'winston';

// ============================================================
// Amazon ReLife — Winston Logger
//
// Usage:
//   import { createLogger } from '../../shared/config/logger';
//   const logger = createLogger('auth-service');
//   logger.info('Server started', { port: 4001 });
//   logger.error('DB connection failed', { err });
// ============================================================

// ── Log levels ────────────────────────────────────────────────
// error > warn > info > http > debug
// In production only error/warn/info are emitted.
// In development all levels including debug are emitted.

const LOG_LEVEL = process.env.LOG_LEVEL
  ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// ── Custom format ─────────────────────────────────────────────
const { combine, timestamp, errors, json, colorize, printf } = winston.format;

/**
 * Pretty format for local development.
 * Example: [2024-01-15 14:30:22] [auth-service] INFO  Server started
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, service, stack, ...meta }) => {
    const svc    = service ? `[${service}] ` : '';
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} ${svc}${level.toUpperCase().padEnd(5)} ${message}${metaStr}${stackStr}`;
  })
);

/**
 * Structured JSON for production — plays well with CloudWatch / Datadog.
 * Every log line is a single JSON object with timestamp, level, service,
 * message and optional metadata.
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ── HTTP request format (Morgan integration helper) ───────────
export const httpFormat = combine(
  timestamp(),
  printf(({ message }) => message as string)
);

// ── Factory ───────────────────────────────────────────────────
/**
 * Create a named logger scoped to a specific microservice.
 * Each service should create exactly one logger at startup
 * and export it as a singleton.
 *
 * @param serviceName - Added to every log line as `service` field.
 */
export function createLogger(serviceName: string): Logger {
  const isProduction = process.env.NODE_ENV === 'production';

  const options: LoggerOptions = {
    level:            LOG_LEVEL,
    defaultMeta:      { service: serviceName },
    format:           isProduction ? prodFormat : devFormat,
    exitOnError:      false,
    transports: [
      // Console — always active
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
  };

  // Production: also write to rotating log files
  if (isProduction) {
    // Requires `winston-daily-rotate-file` if you want rotation.
    // Using plain File transport here to avoid adding a dependency.
    options.transports = [
      ...(options.transports as winston.transport[]),
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level:    'error',
        maxsize:  10 * 1024 * 1024,  // 10 MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        maxsize:  10 * 1024 * 1024,
        maxFiles: 5,
      }),
    ];
  }

  const logger = winston.createLogger(options);

  // Silence all output during test runs
  if (process.env.NODE_ENV === 'test') {
    logger.silent = true;
  }

  return logger;
}

// ── Morgan stream adapter ─────────────────────────────────────
/**
 * Returns a stream object Morgan can write HTTP logs into.
 * Usage:  app.use(morgan('combined', { stream: morganStream(logger) }))
 */
export function morganStream(logger: Logger): { write: (message: string) => void } {
  return {
    write: (message: string): void => {
      // Morgan appends a trailing newline — strip it before logging
      logger.http(message.trimEnd());
    },
  };
}

// ── Default root logger ───────────────────────────────────────
// Used by shared infrastructure (database, env validation, etc.)
// before a service-specific logger is available.
export const rootLogger = createLogger('relife-shared');
