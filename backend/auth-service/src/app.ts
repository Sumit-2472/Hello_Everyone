import rateLimit from 'express-rate-limit';

import { createServer } from '../../shared/server/createServer';
import authRoutes        from './routes/auth.routes';
import userRoutes        from './routes/user.routes';

// ── Auth-specific rate limiter ────────────────────────────────
// Tighter window on login / register to block brute-force attacks.
// Applied only to /api/v1/auth — not to /api/v1/users.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:   false,
    error:     'Too many authentication attempts. Please try again later.',
    timestamp: new Date().toISOString(),
  },
  skip: () => process.env.NODE_ENV === 'test',
});

// ── App ───────────────────────────────────────────────────────
const app = createServer({
  serviceName: 'auth-service',
  bodyLimit:   '1mb',
  rateLimit:   { windowMs: 15 * 60 * 1000, max: 100 },
  routes: [
    {
      path:       '/api/v1/auth',
      router:     authRoutes,
      middleware: [authRateLimiter], // stricter limiter on auth endpoints
    },
    {
      path:   '/api/v1/users',
      router: userRoutes,
    },
  ],
});

export default app;
