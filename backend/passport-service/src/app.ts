import { createServer } from '../../shared/server/createServer';
import passportRoutes    from './routes/passport.routes';

// passport-service receives base64-encoded images in JSON bodies
// (multer memoryStorage) — needs a large body limit
const app = createServer({
  serviceName: 'passport-service',
  bodyLimit:   '50mb',
  // Lower rate limit: Gemini Vision calls are expensive
  rateLimit:   { windowMs: 15 * 60 * 1000, max: 50 },
  routes: [
    { path: '/api/v1/passports', router: passportRoutes },
  ],
});

export default app;
