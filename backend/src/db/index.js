import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env.js';
import * as schema from './schema.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  // Neon exige SSL; a connection string já traz sslmode=require.
  ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// Evita derrubar o processo quando o Neon encerra conexões ociosas (scale-to-zero).
pool.on('error', (err) => {
  console.error('Erro inesperado em conexão ociosa do Postgres:', err.message);
});

export const db = drizzle(pool, { schema });
export { schema };
