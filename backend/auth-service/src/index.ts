import 'dotenv/config';
import { validateEnv }            from '../../shared/config/env';
import { createLogger }           from '../../shared/config/logger';
import { connectMongoDB, registerShutdownHandlers } from '../../shared/config/mongodb';
import app from './app';

// ── 1. Validate environment first — exits on misconfiguration ─
const config = validateEnv('auth');
const logger = createLogger('auth-service');

// ── 2. Register SIGTERM / SIGINT / unhandledRejection handlers ─
registerShutdownHandlers('auth-service');

// ── 3. Connect to MongoDB with retry, then start HTTP server ──
const start = async (): Promise<void> => {
  await connectMongoDB('auth-service');

  const server = app.listen(config.PORT, () => {
    logger.info('auth-service started', { port: config.PORT, env: config.NODE_ENV });
  });

  // Allow in-flight requests to complete before SIGTERM closes the DB
  process.on('SIGTERM', () => {
    server.close(() => logger.info('auth-service HTTP server closed'));
  });
};

start().catch((err: unknown) => {
  logger.error('auth-service failed to start', {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
