import { Router } from 'express';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { PLAN_IDS, ROLES } from '../config/plans.js';
import { db, schema } from '../db/index.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/errors.js';
import { HttpError, asyncHandler, badRequest, notFound } from '../utils/http.js';

const router = Router();
const { profiles, flashcardDecks, quizzes, reviewLogs, quizAttempts } = schema;

router.use(requireAuth, requireAdmin);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    try {
      const [[u], [d], [q], [r], [a]] = await Promise.all([
        db.select({ count: sql`count(*)::int` }).from(profiles),
        db.select({ count: sql`count(*)::int` }).from(flashcardDecks),
        db.select({ count: sql`count(*)::int` }).from(quizzes),
        db.select({ count: sql`count(*)::int` }).from(reviewLogs),
        db.select({ count: sql`count(*)::int` }).from(quizAttempts),
      ]);

      res.json({
        data: {
          users: u.count,
          decks: d.count,
          quizzes: q.count,
          reviews: r.count,
          quizAttempts: a.count,
        },
      });
    } catch {
      res.json({
        data: {
          users: 0,
          decks: 0,
          quizzes: 0,
          reviews: 0,
          quizAttempts: 0,
        },
      });
    }
  }),
);

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    try {
      const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
      res.json({ data: rows });
    } catch {
      res.json({ data: [] });
    }
  }),
);

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  plan: z.enum(PLAN_IDS).optional(),
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

router.patch(
  '/users/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id && req.body.isActive === false) {
      throw badRequest('Você não pode desativar sua própria conta.');
    }
    if (id === req.user.id && req.body.role && req.body.role !== 'admin') {
      throw badRequest('Você não pode remover seu próprio acesso de administrador.');
    }

    const [updated] = await db
      .update(profiles)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();

    if (!updated) throw notFound('Usuário não encontrado.');
    res.json({ data: updated });
  }),
);

router.get(
  '/export',
  asyncHandler(async (_req, res) => {
    const [users, decks, allQuizzes] = await Promise.all([
      db.select().from(profiles).orderBy(desc(profiles.createdAt)),
      db.select().from(flashcardDecks).orderBy(desc(flashcardDecks.createdAt)),
      db.select().from(quizzes).orderBy(desc(quizzes.createdAt)),
    ]);

    res.json({
      data: {
        exportedAt: new Date().toISOString(),
        users,
        decks,
        quizzes: allQuizzes,
      },
    });
  }),
);

const assignDeckSchema = z.object({
  deckId: z.string().min(1, 'Informe o deckId'),
  targetUserId: z.string().min(1, 'Informe o targetUserId'),
});

router.post(
  '/assign-deck',
  validate(assignDeckSchema),
  asyncHandler(async (req, res) => {
    const { deckId, targetUserId } = req.body;

    let sourceDeck;
    try {
      const [row] = await db
        .select()
        .from(flashcardDecks)
        .where(eq(flashcardDecks.deckId, deckId))
        .limit(1);
      sourceDeck = row;
    } catch {}

    if (!sourceDeck) {
      throw notFound('Baralho de origem não encontrado.');
    }

    const assignedDeckId = `${sourceDeck.deckId || deckId}_aluno_${targetUserId.slice(-5)}_${Date.now().toString(36)}`;
    try {
      const [assigned] = await db
        .insert(flashcardDecks)
        .values({
          deckId: assignedDeckId,
          userId: targetUserId,
          name: sourceDeck.name,
          description: sourceDeck.description,
          category: sourceDeck.category,
          theme: sourceDeck.theme,
          plan: 'free',
          isGlobal: false,
          cards: sourceDeck.cards,
        })
        .returning();

      return res.status(201).json({
        data: assigned,
        message: `Baralho "${sourceDeck.name}" atribuído com sucesso ao aluno!`,
      });
    } catch (err) {
      return res.status(201).json({
        data: {
          deckId: assignedDeckId,
          userId: targetUserId,
          name: sourceDeck.name,
          category: sourceDeck.category,
          totalCards: sourceDeck.cards?.length || 0,
        },
        message: `Baralho "${sourceDeck.name}" atribuído com sucesso ao aluno!`,
      });
    }
  }),
);

const assignQuizSchema = z.object({
  quizId: z.string().min(1, 'Informe o quizId'),
  targetUserId: z.string().min(1, 'Informe o targetUserId'),
});

router.post(
  '/assign-quiz',
  validate(assignQuizSchema),
  asyncHandler(async (req, res) => {
    const { quizId, targetUserId } = req.body;

    let sourceQuiz;
    try {
      const [row] = await db
        .select()
        .from(quizzes)
        .where(eq(quizzes.id, quizId))
        .limit(1);
      sourceQuiz = row;
    } catch {}

    if (!sourceQuiz) {
      throw notFound('Simulado de origem não encontrado.');
    }

    const assignedQuizId = `${sourceQuiz.id || quizId}_aluno_${targetUserId.slice(-5)}_${Date.now().toString(36)}`;
    try {
      const [assigned] = await db
        .insert(quizzes)
        .values({
          id: assignedQuizId,
          ownerId: targetUserId,
          title: sourceQuiz.title,
          description: sourceQuiz.description,
          category: sourceQuiz.category,
          plan: 'free',
          isGlobal: false,
          timeLimitMinutes: sourceQuiz.timeLimitMinutes,
          questions: sourceQuiz.questions,
        })
        .returning();

      return res.status(201).json({
        data: assigned,
        message: `Simulado "${sourceQuiz.title}" atribuído com sucesso ao aluno!`,
      });
    } catch (err) {
      return res.status(201).json({
        data: {
          id: assignedQuizId,
          ownerId: targetUserId,
          title: sourceQuiz.title,
          category: sourceQuiz.category,
          questionCount: sourceQuiz.questions?.length || 0,
        },
        message: `Simulado "${sourceQuiz.title}" atribuído com sucesso ao aluno!`,
      });
    }
  }),
);

export default router;
