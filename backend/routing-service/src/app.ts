import { createServer } from '../../shared/server/createServer';
import routingRoutes     from './routes/routing.routes';
import recoveryRoutes    from './routes/recovery.routes';

const app = createServer({
  serviceName: 'routing-service',
  bodyLimit:   '1mb',
  rateLimit:   { windowMs: 15 * 60 * 1000, max: 200 },
  routes: [
    { path: '/api/v1/routing',  router: routingRoutes },
    { path: '/api/v1/recovery', router: recoveryRoutes },
  ],
});

export default app;
