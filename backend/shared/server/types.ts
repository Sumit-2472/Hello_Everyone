import { Router } from 'express';

// ── Route registration entry ──────────────────────────────────
export interface RouteDefinition {
  /** Path prefix, e.g. '/api/v1/auth' */
  path: string;
  /** Express Router containing the route handlers */
  router: Router;
  /**
   * Optional per-route middleware applied before the router.
   * Useful for auth-specific rate limiters, role guards, etc.
   */
  middleware?: import('express').RequestHandler[];
}

// ── Body-size override per service ───────────────────────────
export type BodySizeLimit =
  | '1mb'   // default — most JSON APIs
  | '2mb'   // return-service (form data + images metadata)
  | '10mb'  // general upload metadata
  | '50mb'; // passport-service (base64 images in body)

// ── CORS config ───────────────────────────────────────────────
export interface CorsConfig {
  origins: string[];
  credentials: boolean;
}

// ── Rate-limit config per service ────────────────────────────
export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

// ── Full createServer options ─────────────────────────────────
export interface ServerOptions {
  /** Human-readable service name used in logs and /health response */
  serviceName: string;
  /** Route definitions to mount */
  routes: RouteDefinition[];
  /** Max body size (default: '1mb') */
  bodyLimit?: BodySizeLimit;
  /** CORS origins (default: process.env.ALLOWED_ORIGINS) */
  cors?: Partial<CorsConfig>;
  /** Global rate-limit (default: 200 req / 15 min) */
  rateLimit?: Partial<RateLimitConfig>;
  /** Disable Helmet (not recommended — only for testing) */
  disableHelmet?: boolean;
  /** Disable Morgan HTTP logging */
  disableMorgan?: boolean;
}

// ── /health response shape ────────────────────────────────────
export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptime: number;           // seconds
  timestamp: string;
  db: {
    status: string;
    readyState: number;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
}
