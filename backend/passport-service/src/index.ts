import 'dotenv/config';
import { validateEnv }            from '../../shared/config/env';
import { createLogger }           from '../../shared/config/logger';
import { connectMongoDB, registerShutdownHandlers } from '../../shared/config/mongodb';
import app from './app';

const config = validateEnv('passport');
const logger = createLogger('passport-service');

registerShutdownHandlers('passport-service');

const start = async (): Promise<void> => {
  await connectMongoDB('passport-service');

  const server = app.listen(config.PORT, () => {
    logger.info('passport-service started', { port: config.PORT, env: config.NODE_ENV });
  });

  process.on('SIGTERM', () => {
    server.close(() => logger.info('passport-service HTTP server closed'));
  });
};

start().catch((err: unknown) => {
  logger.error('passport-service failed to start', {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
