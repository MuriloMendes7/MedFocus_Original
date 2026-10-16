import crypto from 'node:crypto';
import { Router } from 'express';
import { and, desc, eq, gte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { PLAN_IDS, getPlan, planAllows } from '../config/plans.js';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/errors.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/http.js';

const router = Router();
const { quizzes, quizAttempts } = schema;

router.use(requireAuth);

function normalizeQuestions(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((q) => {
      const question = String(q?.question ?? '').trim();
      const rawOptions = Array.isArray(q?.options)
        ? q.options
        : q?.options && typeof q.options === 'object'
          ? [q.options.A, q.options.B, q.options.C, q.options.D]
          : [];
      const options = rawOptions.slice(0, 4).map((o) => String(o ?? '').trim());
      const correct = String(q?.correct ?? q?.correctAnswer ?? 'A')
        .trim()
        .toUpperCase();
      if (!question || options.length < 4 || options.some((o) => !o)) return null;
      if (!['A', 'B', 'C', 'D'].includes(correct)) return null;
      return {
        id: String(q?.id || crypto.randomUUID()),
        question,
        options,
        correct,
        explanation: String(q?.explanation ?? '').trim(),
      };
    })
    .filter(Boolean);
}

function serializeQuiz(quiz, attemptsForQuiz, user, includeQuestions = false) {
  const questions = normalizeQuestions(quiz.questions);
  const locked =
    quiz.isGlobal &&
    quiz.ownerId !== user.id &&
    user.role !== 'admin' &&
    !planAllows(user.plan, quiz.plan);

  const attempts = attemptsForQuiz.length;
  const bestScore = attempts > 0 ? Math.max(...attemptsForQuiz.map((a) => a.score)) : null;
  const lastScore = attempts > 0 ? attemptsForQuiz[0].score : null;

  return {
    id: quiz.id,
    ownerId: quiz.ownerId,
    title: quiz.title,
    description: quiz.description || '',
    category: quiz.category || 'Geral',
    plan: quiz.plan || 'free',
    isGlobal: quiz.isGlobal,
    canEdit: quiz.ownerId === user.id || user.role === 'admin',
    locked,
    timeLimitMinutes: quiz.timeLimitMinutes,
    questionCount: questions.length,
    attempts,
    bestScore,
    lastScore,
    ...(includeQuestions && !locked ? { questions } : {}),
    createdAt: quiz.createdAt,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const scope = req.query.scope;
    const rows =
      scope === 'all' && req.isAdmin
        ? await db.select().from(quizzes).orderBy(desc(quizzes.createdAt))
        : await db
            .select()
            .from(quizzes)
            .where(or(eq(quizzes.ownerId, req.user.id), eq(quizzes.isGlobal, true)))
            .orderBy(desc(quizzes.createdAt));

    const userAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, req.user.id))
      .orderBy(desc(quizAttempts.createdAt));

    const byQuiz = new Map();
    for (const a of userAttempts) {
      if (!byQuiz.has(a.quizId)) byQuiz.set(a.quizId, []);
      byQuiz.get(a.quizId).push(a);
    }

    res.json({
      data: rows.map((q) => serializeQuiz(q, byQuiz.get(q.id) ?? [], req.user, false)),
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, req.params.id)).limit(1);
    if (!quiz) throw notFound('Simulado não encontrado.');
    if (!quiz.isGlobal && quiz.ownerId !== req.user.id && !req.isAdmin) {
      throw forbidden('Você não tem acesso a este simulado.');
    }

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, req.user.id), eq(quizAttempts.quizId, quiz.id)))
      .orderBy(desc(quizAttempts.createdAt));

    res.json({ data: serializeQuiz(quiz, attempts, req.user, true) });
  }),
);

const questionSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correct: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional().default(''),
});

const quizBodySchema = z.object({
  title: z.string().trim().min(1, 'Informe o título do simulado').max(160),
  description: z.string().trim().max(500).optional().default(''),
  category: z.string().trim().max(80).optional().default('Geral'),
  plan: z.enum(PLAN_IDS).optional().default('free'),
  isGlobal: z.boolean().optional().default(false),
  timeLimitMinutes: z.coerce.number().int().min(1).max(300).optional().default(30),
  questions: z.array(questionSchema).min(1, 'Adicione pelo menos 1 questão').max(500),
});

router.post(
  '/',
  validate(quizBodySchema),
  asyncHandler(async (req, res) => {
    const questions = normalizeQuestions(req.body.questions);
    if (questions.length === 0) throw badRequest('Nenhuma questão válida.');

    const [created] = await db
      .insert(quizzes)
      .values({
        id: crypto.randomUUID(),
        ownerId: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        plan: req.isAdmin ? req.body.plan : 'free',
        isGlobal: req.isAdmin ? Boolean(req.body.isGlobal) : false,
        timeLimitMinutes: req.body.timeLimitMinutes,
        questions,
      })
      .returning();

    res.status(201).json({ data: serializeQuiz(created, [], req.user, true) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const [existing] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, req.params.id))
      .limit(1);
    if (!existing) throw notFound('Simulado não encontrado.');
    if (existing.ownerId !== req.user.id && !req.isAdmin) {
      throw forbidden('Você não pode excluir este simulado.');
    }

    await db.transaction(async (tx) => {
      await tx.delete(quizAttempts).where(eq(quizAttempts.quizId, existing.id));
      await tx.delete(quizzes).where(eq(quizzes.id, existing.id));
    });

    res.json({ data: { id: existing.id, deleted: true } });
  }),
);

const attemptSchema = z.object({
  answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
  timeSpentSeconds: z.coerce.number().int().min(0).max(86_400).optional().default(0),
});

router.post(
  '/:id/attempts',
  validate(attemptSchema),
  asyncHandler(async (req, res) => {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, req.params.id)).limit(1);
    if (!quiz) throw notFound('Simulado não encontrado.');
    if (quiz.isGlobal && !req.isAdmin && !planAllows(req.user.plan, quiz.plan)) {
      throw forbidden('Seu plano não permite realizar este simulado.');
    }

    if (!req.isAdmin) {
      const monthlyLimit = getPlan(req.user.plan).limits.quizAttemptsPerMonth;
      if (monthlyLimit !== null) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const [{ count }] = await db
          .select({ count: sql`count(*)::int` })
          .from(quizAttempts)
          .where(
            and(
              eq(quizAttempts.userId, req.user.id),
              gte(quizAttempts.createdAt, startOfMonth),
            ),
          );
        if (count >= monthlyLimit) {
          throw forbidden(
            `Limite mensal de ${monthlyLimit} simulados do plano ${getPlan(req.user.plan).name} atingido.`,
          );
        }
      }
    }

    const questions = normalizeQuestions(quiz.questions);
    let correctCount = 0;
    const review = questions.map((q) => {
      const selected = req.body.answers[q.id] ?? null;
      const isCorrect = selected === q.correct;
      if (isCorrect) correctCount += 1;
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        selected,
        correct: q.correct,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: req.user.id,
        quizId: quiz.id,
        correct: correctCount,
        total,
        score,
        timeSpentSeconds: req.body.timeSpentSeconds,
        answers: req.body.answers,
      })
      .returning();

    res.status(201).json({
      data: {
        attemptId: attempt.id,
        quizId: quiz.id,
        title: quiz.title,
        correct: correctCount,
        total,
        score,
        passed: score >= 70,
        timeSpentSeconds: attempt.timeSpentSeconds,
        createdAt: attempt.createdAt,
        review,
      },
    });
  }),
);

export default router;
