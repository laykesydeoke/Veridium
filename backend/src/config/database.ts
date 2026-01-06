import { Pool, PoolConfig } from 'pg';
import { env } from './env';

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: unknown[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  const timeout = setTimeout(() => {
    console.error('Client has been checked out for more than 5 seconds!');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = release;
    return release();
  };

  return client;
};
