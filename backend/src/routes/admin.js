import { Router } from 'express';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { PLAN_IDS, ROLES } from '../config/plans.js';
import { db, schema } from '../db/index.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/errors.js';
import { asyncHandler, badRequest, notFound } from '../utils/http.js';

const router = Router();
const { profiles, flashcardDecks, quizzes, reviewLogs, quizAttempts } = schema;

router.use(requireAuth, requireAdmin);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
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
  }),
);

router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    res.json({ data: rows });
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

export default router;
