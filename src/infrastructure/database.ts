import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

// ─── Connection Pool ───────────────────────────────────────────────────────────
// Uses the POOLED Supabase URL (port 6543 / pgBouncer).
// SSL is required — Supabase rejects unencrypted connections.

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase managed SSL
  },
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
});

// Log pool-level errors (e.g. a client goes idle and throws)
pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

// ─── Query Helper ──────────────────────────────────────────────────────────────
// Preferred for all simple SELECT / INSERT / UPDATE / DELETE queries.
// Automatically acquires and releases a client from the pool.

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  logger.debug('DB query executed', {
    query: text.substring(0, 100), // Truncate long queries in logs
    rows: result.rowCount,
    duration_ms: duration,
  });

  return result;
}

// ─── Client Helper ─────────────────────────────────────────────────────────────
// Use when you need a dedicated client (e.g. for LISTEN/NOTIFY or
// when you want manual control over the connection lifecycle).
// Caller MUST call client.release() when done.

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

// ─── Transaction Helper ────────────────────────────────────────────────────────
// Wraps a callback in BEGIN / COMMIT / ROLLBACK.
// Automatically rolls back and re-throws on any error.
// Use for multi-step operations (e.g. create booking + update seat count).

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Startup Health Check ──────────────────────────────────────────────────────
// Called once during app startup in src/app.ts or src/index.ts.
// Verifies that Supabase is reachable before accepting traffic.

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ now: string }>('SELECT NOW() as now');
    logger.info('✅ Supabase PostgreSQL connected', {
      server_time: result.rows[0].now,
      database_url: env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'), // Mask password in logs
    });
  } finally {
    client.release();
  }
}

export { pool };
