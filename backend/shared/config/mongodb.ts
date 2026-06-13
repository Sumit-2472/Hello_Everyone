import mongoose, { ConnectOptions } from 'mongoose';
import { rootLogger } from './logger';
import { externalServiceError } from './appError';

// ============================================================
// Amazon ReLife — MongoDB Connection Manager
//
// Usage (each service's src/index.ts):
//   import { connectMongoDB, disconnectMongoDB } from '../../shared/config/mongodb';
//   await connectMongoDB('auth-service');
// ============================================================

// ── Retry configuration ───────────────────────────────────────
const RETRY_CONFIG = {
  maxRetries:     5,
  initialDelayMs: 1_000,   // 1 s
  maxDelayMs:     30_000,  // 30 s cap
  backoffFactor:  2,        // exponential backoff multiplier
} as const;

// ── Connection state ──────────────────────────────────────────
interface ConnectionState {
  isConnected: boolean;
  serviceName: string;
  retryCount: number;
}

const state: ConnectionState = {
  isConnected: false,
  serviceName: 'unknown',
  retryCount:  0,
};

// ── Mongoose connect options ──────────────────────────────────
const BASE_OPTIONS: ConnectOptions = {
  // Let Mongoose manage connection pooling
  maxPoolSize:          10,
  minPoolSize:          2,
  socketTimeoutMS:      45_000,
  connectTimeoutMS:     10_000,
  serverSelectionTimeoutMS: 10_000,
  heartbeatFrequencyMS: 10_000,
  // Automatically retry failed reads and writes once
  retryReads:           true,
  retryWrites:          true,
  // Avoids deprecated URL parser warnings
  family:               4,  // Force IPv4
};

// ── Event listeners ───────────────────────────────────────────
function attachConnectionListeners(serviceName: string): void {
  const conn = mongoose.connection;

  conn.on('connected', () => {
    state.isConnected = true;
    state.retryCount  = 0;
    rootLogger.info(`[${serviceName}] MongoDB connected`, {
      host: conn.host,
      port: conn.port,
      name: conn.name,
    });
  });

  conn.on('disconnected', () => {
    state.isConnected = false;
    rootLogger.warn(`[${serviceName}] MongoDB disconnected`);
  });

  conn.on('reconnected', () => {
    state.isConnected = true;
    rootLogger.info(`[${serviceName}] MongoDB reconnected`);
  });

  conn.on('error', (err: Error) => {
    state.isConnected = false;
    rootLogger.error(`[${serviceName}] MongoDB connection error`, {
      message: err.message,
    });
  });

  // Log slow queries in development
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', (collectionName: string, method: string, query: object) => {
      rootLogger.debug(`[${serviceName}] Mongoose: ${collectionName}.${method}`, { query });
    });
  }
}

// ── Delay helper ──────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number): number {
  const exponential = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffFactor, attempt);
  // Add ±20% jitter to prevent thundering herd
  const jitter = exponential * 0.2 * (Math.random() * 2 - 1);
  return Math.min(exponential + jitter, RETRY_CONFIG.maxDelayMs);
}

// ── Main connect function ─────────────────────────────────────
/**
 * Connect to MongoDB with exponential-backoff retry logic.
 * Safe to call multiple times — skips if already connected.
 *
 * @param serviceName - Identifies the calling service in logs.
 * @param dbName      - Override DB name (defaults to env.DB_NAME or serviceName).
 */
export async function connectMongoDB(
  serviceName: string,
  dbName?: string
): Promise<void> {
  // Already connected — nothing to do
  if (state.isConnected && mongoose.connection.readyState === 1) {
    rootLogger.debug(`[${serviceName}] Reusing existing MongoDB connection`);
    return;
  }

  state.serviceName = serviceName;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw externalServiceError(
      'MongoDB',
      'MONGODB_URI environment variable is not set'
    );
  }

  const resolvedDbName =
    dbName ??
    process.env.DB_NAME ??
    serviceName.toLowerCase().replace(/-/g, '_');

  // Attach listeners once
  attachConnectionListeners(serviceName);

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      rootLogger.info(
        `[${serviceName}] Connecting to MongoDB (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`
      );

      await mongoose.connect(uri, {
        ...BASE_OPTIONS,
        dbName: resolvedDbName,
      });

      state.isConnected = true;
      state.retryCount  = 0;
      rootLogger.info(`[${serviceName}] MongoDB ready — db: ${resolvedDbName}`);
      return;

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      state.retryCount = attempt + 1;

      if (attempt === RETRY_CONFIG.maxRetries) {
        rootLogger.error(
          `[${serviceName}] MongoDB connection failed after ${RETRY_CONFIG.maxRetries + 1} attempts`,
          { message }
        );
        // Throw so the service process can exit cleanly (caught in index.ts)
        throw externalServiceError('MongoDB', message);
      }

      const waitMs = calculateDelay(attempt);
      rootLogger.warn(
        `[${serviceName}] MongoDB connection attempt ${attempt + 1} failed. ` +
        `Retrying in ${Math.round(waitMs / 1000)}s…`,
        { message }
      );
      await delay(waitMs);
    }
  }
}

// ── Graceful disconnect ───────────────────────────────────────
/**
 * Cleanly close the MongoDB connection.
 * Call this in SIGTERM / SIGINT handlers.
 */
export async function disconnectMongoDB(): Promise<void> {
  if (!state.isConnected && mongoose.connection.readyState === 0) {
    return;
  }

  try {
    await mongoose.connection.close();
    state.isConnected = false;
    rootLogger.info(`[${state.serviceName}] MongoDB connection closed`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    rootLogger.error(`[${state.serviceName}] Error closing MongoDB connection`, { message });
  }
}

// ── Health check ──────────────────────────────────────────────
export interface MongoHealthStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting';
  readyState: number;
  host: string | undefined;
  dbName: string | undefined;
  retryCount: number;
}

export function getMongoHealth(): MongoHealthStatus {
  const readyStateMap: Record<number, MongoHealthStatus['status']> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const rs = mongoose.connection.readyState;
  return {
    status:     readyStateMap[rs] ?? 'disconnected',
    readyState: rs,
    host:       mongoose.connection.host,
    dbName:     mongoose.connection.name,
    retryCount: state.retryCount,
  };
}

// ── Process signal handlers ───────────────────────────────────
/**
 * Register SIGTERM and SIGINT handlers for graceful shutdown.
 * Call once in each service's index.ts after startup.
 */
export function registerShutdownHandlers(serviceName: string): void {
  const shutdown = async (signal: string): Promise<void> => {
    rootLogger.info(`[${serviceName}] ${signal} received — shutting down gracefully`);
    await disconnectMongoDB();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));

  // Log unhandled rejections instead of crashing silently
  process.on('unhandledRejection', (reason: unknown) => {
    rootLogger.error(`[${serviceName}] Unhandled Promise Rejection`, {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (err: Error) => {
    rootLogger.error(`[${serviceName}] Uncaught Exception — shutting down`, {
      message: err.message,
      stack:   err.stack,
    });
    process.exit(1);
  });
}
