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
import quizzesRouter from './routes/quizzes.js';
import statsRouter from './routes/stats.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

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
