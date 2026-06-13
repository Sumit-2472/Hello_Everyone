import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { createLogger, morganStream }    from '../config/logger';
import { getMongoHealth }                from '../config/mongodb';
import {
  ServerOptions,
  HealthResponse,
  RouteDefinition,
} from './types';

// ── Package version (shown in /health) ───────────────────────
const PKG_VERSION: string = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (require('../../package.json') as { version: string }).version;
  } catch {
    return '1.0.0';
  }
})();

// ============================================================
// createServer
//
// Factory function that assembles a fully-configured Express
// Application for any Amazon ReLife microservice.
//
// Usage (each service's app.ts):
//
//   import { createServer } from '../../shared/server/createServer';
//   import authRoutes        from './routes/auth.routes';
//   import userRoutes        from './routes/user.routes';
//
//   const app = createServer({
//     serviceName: 'auth-service',
//     routes: [
//       { path: '/api/v1/auth',  router: authRoutes },
//       { path: '/api/v1/users', router: userRoutes },
//     ],
//   });
//
//   export default app;
// ============================================================

export function createServer(options: ServerOptions): Application {
  const {
    serviceName,
    routes,
    bodyLimit     = '1mb',
    disableHelmet = false,
    disableMorgan = false,
    rateLimit: rlConfig,
    cors: corsConfig,
  } = options;

  const logger = createLogger(serviceName);
  const app: Application = express();

  // ── 1. Trust proxy (needed behind AWS ALB / nginx) ──────────
  app.set('trust proxy', 1);

  // ── 2. Security headers ─────────────────────────────────────
  if (!disableHelmet) {
    app.use(
      helmet({
        // Allow inline styles/scripts in development only
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
        crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
      })
    );
  }

  // ── 3. CORS ─────────────────────────────────────────────────
  const allowedOrigins =
    corsConfig?.origins ??
    (process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [
      'http://localhost:3000',
    ]);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server (no origin) and whitelisted origins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: corsConfig?.credentials ?? true,
      methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
      ],
      exposedHeaders: ['X-Request-ID'],
      maxAge: 86_400, // Cache preflight for 24 hours
    })
  );

  // ── 4. Global rate limiting ──────────────────────────────────
  const windowMs = rlConfig?.windowMs ?? 15 * 60 * 1000; // 15 min
  const max      = rlConfig?.max      ?? 200;

  app.use(
    rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders:   false,
      message: {
        success: false,
        error:   'Too many requests. Please slow down.',
        timestamp: new Date().toISOString(),
      },
      // Skip rate limiting in test environment
      skip: () => process.env.NODE_ENV === 'test',
    })
  );

  // ── 5. Request ID ────────────────────────────────────────────
  // Attach a unique request ID so logs can be correlated
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId =
      (req.headers['x-request-id'] as string) ??
      `${serviceName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // ── 6. Body parsing ──────────────────────────────────────────
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

  // ── 7. HTTP request logging ──────────────────────────────────
  if (!disableMorgan) {
    const morganFormat =
      process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

    app.use(
      morgan(morganFormat, {
        stream: morganStream(logger),
        // Skip health check spam in production
        skip: (req) =>
          process.env.NODE_ENV === 'production' && req.url === '/health',
      })
    );
  }

  // ── 8. Health check ──────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    const mongoHealth = getMongoHealth();
    const memUsage   = process.memoryUsage();

    const isDegraded = mongoHealth.status !== 'connected';

    const body: HealthResponse = {
      status:    isDegraded ? 'degraded' : 'ok',
      service:   serviceName,
      version:   PKG_VERSION,
      uptime:    Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      db: {
        status:     mongoHealth.status,
        readyState: mongoHealth.readyState,
      },
      memory: {
        heapUsedMB:  +(memUsage.heapUsed  / 1_048_576).toFixed(2),
        heapTotalMB: +(memUsage.heapTotal / 1_048_576).toFixed(2),
        rssMB:       +(memUsage.rss       / 1_048_576).toFixed(2),
      },
    };

    res.status(isDegraded ? 503 : 200).json(body);
  });

  // ── 9. Application routes ─────────────────────────────────────
  mountRoutes(app, routes, logger);

  // ── 10. 404 + global error handler ───────────────────────────
  //  Must be registered AFTER all routes
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info(`${serviceName} Express app configured`, {
    bodyLimit,
    routes: routes.map((r) => r.path),
    rateLimit: { windowMs, max },
  });

  return app;
}

// ── Route mounting helper ─────────────────────────────────────
function mountRoutes(
  app: Application,
  routes: RouteDefinition[],
  logger: ReturnType<typeof createLogger>
): void {
  for (const { path, router, middleware = [] } of routes) {
    if (middleware.length > 0) {
      app.use(path, ...middleware, router);
    } else {
      app.use(path, router);
    }
    logger.debug(`Route mounted: ${path}`);
  }
}

// ── Re-export types ───────────────────────────────────────────
export type { ServerOptions, RouteDefinition, HealthResponse } from './types';
