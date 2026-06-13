import { createServer } from '../../shared/server/createServer';
import listingRoutes        from './routes/listing.routes';
import creditRoutes         from './routes/credit.routes';
import sustainabilityRoutes from './routes/sustainability.routes';

const app = createServer({
  serviceName: 'marketplace-service',
  bodyLimit:   '1mb',
  rateLimit:   { windowMs: 15 * 60 * 1000, max: 200 },
  routes: [
    { path: '/api/v1/listings',       router: listingRoutes },
    { path: '/api/v1/credits',        router: creditRoutes },
    { path: '/api/v1/sustainability', router: sustainabilityRoutes },
  ],
});

export default app;
