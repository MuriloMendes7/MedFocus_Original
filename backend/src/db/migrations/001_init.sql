-- Migração idempotente: pode ser executada várias vezes sem efeitos colaterais.
-- Mantém as tabelas legadas (patients, login_events, flashcard_decks) para não perder dados.

CREATE TABLE IF NOT EXISTS profiles (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL DEFAULT '',
  phone          TEXT,
  plan           TEXT NOT NULL DEFAULT 'free',
  role           TEXT NOT NULL DEFAULT 'student',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  notes          TEXT,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcard_decks (
  id          SERIAL PRIMARY KEY,
  deck_id     TEXT NOT NULL UNIQUE,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  theme       TEXT,
  plan        TEXT DEFAULT 'free',
  cards       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

ALTER TABLE flashcard_decks ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT FALSE;
-- Decks criados por administradores (user_id = 'admin' ou 'admin_%') passam a ser globais.
UPDATE flashcard_decks SET is_global = TRUE WHERE (user_id LIKE 'admin%' OR user_id = 'admin') AND is_global = FALSE;
CREATE INDEX IF NOT EXISTS flashcard_decks_user_idx ON flashcard_decks (user_id);

CREATE TABLE IF NOT EXISTS card_progress (
  user_id     TEXT NOT NULL,
  deck_id     TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  interval    INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  lapses      INTEGER NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ,
  last_review TIMESTAMPTZ,
  PRIMARY KEY (user_id, deck_id, card_id)
);

CREATE TABLE IF NOT EXISTS review_logs (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  deck_id     TEXT NOT NULL,
  card_id     TEXT NOT NULL,
  quality     INTEGER NOT NULL,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS review_logs_user_created_idx ON review_logs (user_id, created_at);

CREATE TABLE IF NOT EXISTS quizzes (
  id                 TEXT PRIMARY KEY,
  owner_id           TEXT NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  category           TEXT,
  plan               TEXT NOT NULL DEFAULT 'free',
  is_global          BOOLEAN NOT NULL DEFAULT FALSE,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  questions          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quizzes_owner_idx ON quizzes (owner_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                 SERIAL PRIMARY KEY,
  user_id            TEXT NOT NULL,
  quiz_id            TEXT NOT NULL,
  correct            INTEGER NOT NULL,
  total              INTEGER NOT NULL,
  score              INTEGER NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  answers            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_created_idx ON quiz_attempts (user_id, created_at);
