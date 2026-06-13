// ============================================================
// Amazon ReLife — Ambient Module Declarations
//
// Tells TypeScript the shape (or that it exists) for packages
// that ship without bundled type definitions.
// ============================================================

// ── AWS SDK ───────────────────────────────────────────────────
// These have built-in types in recent versions — declarations
// here act as a safety net in case version resolution fails.
declare module '@aws-sdk/client-s3';
declare module '@aws-sdk/s3-request-presigner';

// ── Google Generative AI ──────────────────────────────────────
declare module '@google/generative-ai';

// ── UUID ──────────────────────────────────────────────────────
declare module 'uuid';

// ── Express augmentation ──────────────────────────────────────
// Extends the Express Request interface across the whole backend
// so req.user is available in every service without re-declaring it.
declare global {
  namespace Express {
    interface Request {
      /** Populated by authenticate() middleware after JWT verification */
      user?: import('./types').AuthTokenPayload;
      /** Unique request ID injected by createServer() */
      requestId?: string;
    }
  }
}

// Required so this file is treated as a module (not a script)
// and the global augmentation above takes effect.
export {};
