import * as z from 'zod';

// ============================================================
// Amazon ReLife — Environment Validation
//
// Call validateEnv() once at service startup (before anything
// else) so the process exits immediately with a clear message
// if a required variable is missing or malformed.
//
// Usage (in each service's src/index.ts):
//   import { validateEnv, env } from '../../shared/config/env';
//   validateEnv();           // exits on failure
//   console.log(env.PORT);   // fully typed after validation
// ============================================================

// ── Base schema shared by every service ───────────────────────

// 1. Pehle sirf Fields define karo (ZodObject)
const BaseFields = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(65535)),
  MONGODB_URI: z.string().min(1).regex(/^mongodb(\+srv)?:\/\//),
  DB_NAME: z.string().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  AWS_ACCESS_KEY: z.string().min(16).optional(),
  AWS_SECRET: z.string().min(1).optional(),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

// 2. Ab refine apply karo (Yeh final schema hai jise tum validate karoge)
const BaseEnvSchema = BaseFields.refine(
  (data) => {
    const hasKey = Boolean(data.AWS_ACCESS_KEY);
    const hasSecret = Boolean(data.AWS_SECRET);
    return hasKey === hasSecret;
  },
  { message: 'AWS_ACCESS_KEY and AWS_SECRET must both be set', path: ['AWS_SECRET'] }
);

// 3. Ab extend karo (BaseFields ko, kyunki wo ZodObject hai)
const PassportServiceSchema = BaseFields.extend({
  GEMINI_API_KEY: z.string().min(1),
  AWS_ACCESS_KEY: z.string().min(16),
  AWS_SECRET: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
});

const ReturnServiceSchema = BaseFields.extend({
  GEMINI_API_KEY: z.string().min(1),
});
const RoutingServiceSchema  = BaseEnvSchema;
const MarketplaceSchema     = BaseEnvSchema;

// ── Inferred types ────────────────────────────────────────────
export type BaseEnv              = z.infer<typeof BaseEnvSchema>;
export type PassportServiceEnv   = z.infer<typeof PassportServiceSchema>;
export type ReturnServiceEnv     = z.infer<typeof ReturnServiceSchema>;

// The validated env object (populated by validateEnv)
export let env: BaseEnv;

// ── Validation function ───────────────────────────────────────
/**
 * Parse and validate process.env against the appropriate schema.
 * Exits the process with exit code 1 if validation fails.
 *
 * @param service - Which service schema to use. Defaults to 'base'.
 */
export function validateEnv(
  service:
    | 'base'
    | 'auth'
    | 'passport'
    | 'return'
    | 'routing'
    | 'marketplace' = 'base'
): BaseEnv {
  const schemaMap: Record<string, z.ZodTypeAny> = {
    base:        BaseEnvSchema,
    auth:        AuthServiceSchema,
    passport:    PassportServiceSchema,
    return:      ReturnServiceSchema,
    routing:     RoutingServiceSchema,
    marketplace: MarketplaceSchema,
  };

  const schema = schemaMap[service] ?? BaseEnvSchema;
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    // stderr so it appears even when stdout is piped
    process.stderr.write(
      `\n❌ [env] Environment validation failed for "${service}":\n${formatted}\n\n`
    );
    process.exit(1);
  }

  env = result.data as BaseEnv;
  return env;
}

// ── Convenience re-exports ────────────────────────────────────
export const isDev        = (): boolean => env?.NODE_ENV === 'development';
export const isProduction = (): boolean => env?.NODE_ENV === 'production';
export const isTest       = (): boolean => env?.NODE_ENV === 'test';
