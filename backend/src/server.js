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
      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
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
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', message: error.message });
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

async function start() {
  if (env.RUN_MIGRATIONS_ON_START) {
    await runMigrations();
  }

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 MedFocus API rodando em http://localhost:${env.PORT}`);
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
}

start().catch((error) => {
  console.error('❌ Falha ao iniciar o servidor:', error);
  process.exit(1);
});
