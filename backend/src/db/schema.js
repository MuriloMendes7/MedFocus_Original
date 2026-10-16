import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

/** Perfil da aplicação. `id` = id do usuário no Neon Auth (neon_auth.user.id). */
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull().default(''),
  phone: text('phone'),
  plan: text('plan').notNull().default('free'),
  role: text('role').notNull().default('student'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Decks. Tabela legada mantida (flashcard_decks) para não perder dados em produção.
 * `cards` = [{ id, question, answer, explanation?, tags? }]
 */
export const flashcardDecks = pgTable(
  'flashcard_decks',
  {
    id: serial('id').primaryKey(),
    deckId: text('deck_id').notNull().unique(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'),
    theme: text('theme'),
    plan: text('plan').default('free'),
    isGlobal: boolean('is_global').notNull().default(false),
    cards: jsonb('cards').notNull().default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => [index('flashcard_decks_user_idx').on(t.userId)],
);

/** Progresso de repetição espaçada por usuário (antes era salvo dentro do deck, compartilhado entre todos). */
export const cardProgress = pgTable(
  'card_progress',
  {
    userId: text('user_id').notNull(),
    deckId: text('deck_id').notNull(),
    cardId: text('card_id').notNull(),
    interval: integer('interval').notNull().default(0),
    easeFactor: real('ease_factor').notNull().default(2.5),
    repetitions: integer('repetitions').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    nextReview: timestamp('next_review', { withTimezone: true }),
    lastReview: timestamp('last_review', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.deckId, t.cardId] })],
);

export const reviewLogs = pgTable(
  'review_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    deckId: text('deck_id').notNull(),
    cardId: text('card_id').notNull(),
    quality: integer('quality').notNull(),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('review_logs_user_created_idx').on(t.userId, t.createdAt)],
);

/** `questions` = [{ id, question, options: [A,B,C,D], correct: 'A'|'B'|'C'|'D', explanation? }] */
export const quizzes = pgTable(
  'quizzes',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category'),
    plan: text('plan').notNull().default('free'),
    isGlobal: boolean('is_global').notNull().default(false),
    timeLimitMinutes: integer('time_limit_minutes').notNull().default(30),
    questions: jsonb('questions').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('quizzes_owner_idx').on(t.ownerId)],
);

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    quizId: text('quiz_id').notNull(),
    correct: integer('correct').notNull(),
    total: integer('total').notNull(),
    score: integer('score').notNull(),
    timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
    answers: jsonb('answers').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('quiz_attempts_user_created_idx').on(t.userId, t.createdAt)],
);

/** Tabelas legadas (somente leitura, usadas para migrar dados antigos para `profiles`). */
export const legacyPatients = pgTable('patients', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  plan: text('plan'),
  role: text('role'),
  isActive: integer('is_active'),
});
