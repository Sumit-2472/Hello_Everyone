import 'dotenv/config';
import { validateEnv }            from '../../shared/config/env';
import { createLogger }           from '../../shared/config/logger';
import { connectMongoDB, registerShutdownHandlers } from '../../shared/config/mongodb';
import app from './app';

const config = validateEnv('return');
const logger = createLogger('return-service');

registerShutdownHandlers('return-service');

const start = async (): Promise<void> => {
  await connectMongoDB('return-service');

  const server = app.listen(config.PORT, () => {
    logger.info('return-service started', { port: config.PORT, env: config.NODE_ENV });
  });

  process.on('SIGTERM', () => {
    server.close(() => logger.info('return-service HTTP server closed'));
  });
};

start().catch((err: unknown) => {
  logger.error('return-service failed to start', {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
