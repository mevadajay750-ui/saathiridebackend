import { Pool, PoolClient } from 'pg';
import { env } from './env';
import { logger } from '@/utils/logger';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

/** Run a single query */
export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development') {
      logger.debug('Query executed', { text: text.slice(0, 80), duration });
    }
    return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
  } catch (error: any) {
    logger.error('Query failed', { text: text.slice(0, 80), error: error.message });
    throw error;
  }
}

/** Get a client for transactions */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/** Run multiple queries in a transaction */
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  client.release();
  logger.info('✅ PostgreSQL connected');
}
