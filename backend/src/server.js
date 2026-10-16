import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { PLANS } from './config/plans.js';
import { pool } from './db/index.js';
import { runMigrations } from './db/migrate.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import adminRouter from './routes/admin.js';
import decksRouter from './routes/decks.js';
import meRouter from './routes/me.js';
import patientsRouter from './routes/patients.js';
import quizzesRouter from './routes/quizzes.js';
import statsRouter from './routes/stats.js';

import { securityHeaders, createRateLimiter } from './middleware/security.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Aplica cabeçalhos de segurança HTTP (OWASP)
app.use(securityHeaders);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !env.isProduction) return callback(null, true);
      if (env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.options('*', cors());

// Rate Limiting para proteção contra DoS e abuso de chamadas
const apiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 240 });
const adminLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 60 });

app.use('/api', apiLimiter);
app.use('/api/admin', adminLimiter);

app.use(express.json({ limit: '5mb' }));

app.get('/', (_req, res) => {
  res.json({
    service: 'MedFocus API',
    version: '2.0.0',
    status: 'online',
    authConfigured: Boolean(env.neonAuthJwksUrl),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (_req, res) => {
  try {
    if (env.DATABASE_URL) {
      await pool.query('SELECT 1');
    }
    res.json({
      status: 'ok',
      database: env.DATABASE_URL ? 'connected' : 'not_configured',
      authConfigured: Boolean(env.neonAuthJwksUrl),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(200).json({
      status: 'degraded',
      database: 'unreachable',
      message: error.message,
    });
  }
});

app.get('/api/plans', (_req, res) => {
  res.json({ data: PLANS });
});

app.use('/api/me', meRouter);
app.use('/api/decks', decksRouter);
app.use('/api/flashcards', decksRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/patients', patientsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`🚀 MedFocus API rodando na porta ${env.PORT}`);
  if (env.RUN_MIGRATIONS_ON_START && env.DATABASE_URL) {
    runMigrations().catch((err) => {
      console.error('⚠️ Erro ao executar migração inicial:', err.message);
    });
  }
});

const shutdown = (signal) => {
  console.log(`\n${signal} recebido. Encerrando servidor...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
