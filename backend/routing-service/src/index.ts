import 'dotenv/config';
import { validateEnv }            from '../../shared/config/env';
import { createLogger }           from '../../shared/config/logger';
import { connectMongoDB, registerShutdownHandlers } from '../../shared/config/mongodb';
import mongoose from 'mongoose';
import app from './app';

const config = validateEnv('routing');
const logger = createLogger('routing-service');

registerShutdownHandlers('routing-service');

const start = async (): Promise<void> => {
  await connectMongoDB('routing-service', undefined, mongoose);

  const server = app.listen(config.PORT, () => {
    logger.info('routing-service started', { port: config.PORT, env: config.NODE_ENV });
  });

  process.on('SIGTERM', () => {
    server.close(() => logger.info('routing-service HTTP server closed'));
  });
};

start().catch((err: unknown) => {
  logger.error('routing-service failed to start', {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
