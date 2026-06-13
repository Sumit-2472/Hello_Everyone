import 'dotenv/config';
import { validateEnv }            from '../../shared/config/env';
import { createLogger }           from '../../shared/config/logger';
import { connectMongoDB, registerShutdownHandlers } from '../../shared/config/mongodb';
import app from './app';

const config = validateEnv('marketplace');
const logger = createLogger('marketplace-service');

registerShutdownHandlers('marketplace-service');

const start = async (): Promise<void> => {
  await connectMongoDB('marketplace-service');

  const server = app.listen(config.PORT, () => {
    logger.info('marketplace-service started', { port: config.PORT, env: config.NODE_ENV });
  });

  process.on('SIGTERM', () => {
    server.close(() => logger.info('marketplace-service HTTP server closed'));
  });
};

start().catch((err: unknown) => {
  logger.error('marketplace-service failed to start', {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
