import { createServer } from '../../shared/server/createServer';
import returnRoutes        from './routes/return.routes';
import sizeRoutes          from './routes/size.routes';
import compatibilityRoutes from './routes/compatibility.routes';

// return-service accepts slightly larger bodies because requests
// carry product specs and optional base64 thumbnail previews
const app = createServer({
  serviceName: 'return-service',
  bodyLimit:   '2mb',
  rateLimit:   { windowMs: 15 * 60 * 1000, max: 150 },
  routes: [
    { path: '/api/v1/returns',       router: returnRoutes },
    { path: '/api/v1/size-advisor',  router: sizeRoutes },
    { path: '/api/v1/compatibility', router: compatibilityRoutes },
  ],
});

export default app;
