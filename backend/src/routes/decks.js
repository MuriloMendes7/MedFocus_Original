import crypto from 'node:crypto';
import { Router } from 'express';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { PLAN_IDS, getPlan, planAllows } from '../config/plans.js';
import { db, schema } from '../db/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/errors.js';
import { calculateSM2 } from '../services/sm2.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/http.js';

const router = Router();
const { flashcardDecks, cardProgress, reviewLogs } = schema;

/** Normaliza formato legado (`front`/`back`/`hint`) e novo (`question`/`answer`/`explanation`). */
function normalizeCards(cards = []) {
  return (Array.isArray(cards) ? cards : [])
    .map((raw) => {
      const question = String(raw?.question ?? raw?.front ?? '').trim();
      const answer = String(raw?.answer ?? raw?.back ?? '').trim();
      const explanation = String(raw?.explanation ?? raw?.hint ?? '').trim();
      if (!question || !answer) return null;
      const tags = Array.isArray(raw?.tags)
        ? raw.tags.map((t) => String(t).trim()).filter(Boolean)
        : [];
      return {
        id: String(raw?.id || crypto.randomUUID()),
        question,
        answer,
        explanation,
        tags,
      };
    })
    .filter(Boolean);
}

function attachProgress(deck, progressByCardId, user) {
  const cards = normalizeCards(deck.cards);
  const now = new Date();
  let dueCount = 0;

  const enrichedCards = cards.map((card) => {
    const prog = progressByCardId.get(card.id);
    const nextReview = prog?.nextReview ? new Date(prog.nextReview) : null;
    const isDue = !nextReview || nextReview <= now;
    if (isDue) dueCount += 1;
    return {
      ...card,
      interval: prog?.interval ?? 0,
      easeFactor: prog?.easeFactor ?? 2.5,
      repetitions: prog?.repetitions ?? 0,
      lapses: prog?.lapses ?? 0,
      nextReview: nextReview ? nextReview.toISOString() : null,
      lastReview: prog?.lastReview ? new Date(prog.lastReview).toISOString() : null,
    };
  });

  const isGlobal = Boolean(deck.isGlobal || deck.userId === 'admin');
  const isOwner = deck.userId === user.id;
  const locked =
    isGlobal && !isOwner && user.role !== 'admin' && !planAllows(user.plan, deck.plan);

  return {
    id: deck.deckId,
    deckId: deck.deckId,
    userId: deck.userId,
    name: deck.name,
    description: deck.description || '',
    category: deck.category || 'Geral',
    theme: deck.theme || '',
    plan: deck.plan || 'free',
    isGlobal,
    canEdit: isOwner || user.role === 'admin',
    locked,
    totalCards: enrichedCards.length,
    dueCount: locked ? 0 : dueCount,
    cards: locked ? [] : enrichedCards,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}

router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = req.user ?? { id: 'guest', role: 'student', plan: 'free' };
    const scope = req.query.scope;
    let rows = [];

    try {
      rows =
        scope === 'all' && req.isAdmin
          ? await db.select().from(flashcardDecks).orderBy(desc(flashcardDecks.createdAt))
          : await db
              .select()
              .from(flashcardDecks)
              .where(
                or(
                  eq(flashcardDecks.userId, user.id),
                  eq(flashcardDecks.isGlobal, true),
                  sql`${flashcardDecks.userId} LIKE 'admin%'`,
                ),
              )
              .orderBy(desc(flashcardDecks.createdAt));
    } catch {
      // Ignora erro de query ao banco
    }

    if (!rows) {
      rows = [];
    }

    let progressRows = [];
    try {
      const deckIds = rows.map((d) => d.deckId);
      if (user.id !== 'guest' && deckIds.length > 0) {
        progressRows = await db
          .select()
          .from(cardProgress)
          .where(and(eq(cardProgress.userId, user.id), inArray(cardProgress.deckId, deckIds)));
      }
    } catch {
      // Ignora erro ao buscar progresso
    }

    const byDeck = new Map();
    for (const p of progressRows) {
      if (!byDeck.has(p.deckId)) byDeck.set(p.deckId, new Map());
      byDeck.get(p.deckId).set(p.cardId, p);
    }

    const data = rows.map((d) => attachProgress(d, byDeck.get(d.deckId) ?? new Map(), user));
    res.json({ data });
  }),
);

router.get(
  '/:deckId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const user = req.user ?? { id: 'guest', role: 'student', plan: 'free' };
    let deck;

    try {
      const [row] = await db
        .select()
        .from(flashcardDecks)
        .where(eq(flashcardDecks.deckId, req.params.deckId))
        .limit(1);
      deck = row;
    } catch {
      // Ignora erro de query
    }

    if (!deck) throw notFound('Deck não encontrado.');
    const isGlobal = Boolean(deck.isGlobal || deck.userId === 'admin' || deck.userId?.startsWith('admin'));
    if (!isGlobal && deck.userId !== user.id && !req.isAdmin) {
      throw forbidden('Você não tem acesso a este deck.');
    }

    let progressRows = [];
    try {
      if (user.id !== 'guest') {
        progressRows = await db
          .select()
          .from(cardProgress)
          .where(
            and(eq(cardProgress.userId, user.id), eq(cardProgress.deckId, deck.deckId)),
          );
      }
    } catch {
      // Ignora erro de progresso
    }
    const map = new Map(progressRows.map((p) => [p.cardId, p]));

    res.json({ data: attachProgress(deck, map, user) });
  }),
);

const cardInputSchema = z
  .object({
    id: z.string().optional(),
    question: z.string().optional(),
    answer: z.string().optional(),
    front: z.string().optional(),
    back: z.string().optional(),
    explanation: z.string().optional(),
    hint: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((c) => Boolean((c.question ?? c.front)?.trim() && (c.answer ?? c.back)?.trim()), {
    message: 'Cada card precisa de pergunta e resposta.',
  });

const deckBodySchema = z.object({
  deckId: z.string().optional(),
  name: z.string().trim().min(1, 'Informe o nome do deck').max(160),
  description: z.string().trim().max(500).optional().default(''),
  category: z.string().trim().max(80).optional().default('Geral'),
  theme: z.string().trim().max(80).optional().default(''),
  plan: z.enum(PLAN_IDS).optional().default('free'),
  isGlobal: z.boolean().optional().default(false),
  targetUserId: z.string().optional(),
  cards: z.array(cardInputSchema).min(1, 'Adicione pelo menos 1 card').max(2000),
});

async function countUserOwnCards(userId, excludeDeckId = null) {
  const rows = await db
    .select({ deckId: flashcardDecks.deckId, cards: flashcardDecks.cards })
    .from(flashcardDecks)
    .where(and(eq(flashcardDecks.userId, userId), eq(flashcardDecks.isGlobal, false)));

  return rows
    .filter((r) => r.deckId !== excludeDeckId)
    .reduce((sum, r) => sum + (Array.isArray(r.cards) ? r.cards.length : 0), 0);
}

router.post(
  '/',
  validate(deckBodySchema),
  asyncHandler(async (req, res) => {
    const cards = normalizeCards(req.body.cards);
    if (cards.length === 0) throw badRequest('Nenhum card válido informado.');

    const targetUserId =
      req.isAdmin && req.body.targetUserId ? req.body.targetUserId : req.user.id;
    const isGlobal = req.isAdmin ? Boolean(req.body.isGlobal) : false;
    const plan = req.isAdmin ? req.body.plan : 'free';

    if (!isGlobal && !req.isAdmin) {
      const limit = getPlan(req.user.plan).limits.ownCards;
      if (limit !== null) {
        const current = await countUserOwnCards(req.user.id);
        if (current + cards.length > limit) {
          throw forbidden(
            `Limite do plano ${getPlan(req.user.plan).name} atingido (${limit} cards próprios). Faça upgrade para criar mais.`,
          );
        }
      }
    }

    const deckId = req.body.deckId || crypto.randomUUID();
    const [created] = await db
      .insert(flashcardDecks)
      .values({
        deckId,
        userId: targetUserId,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        theme: req.body.theme,
        plan,
        isGlobal,
        cards,
      })
      .returning();

    res.status(201).json({ data: attachProgress(created, new Map(), req.user) });
  }),
);

router.put(
  '/:deckId',
  validate(deckBodySchema.partial()),
  asyncHandler(async (req, res) => {
    const [existing] = await db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, req.params.deckId))
      .limit(1);

    if (!existing) throw notFound('Deck não encontrado.');
    if (existing.userId !== req.user.id && !req.isAdmin) {
      throw forbidden('Você não pode editar este deck.');
    }

    const cards = req.body.cards ? normalizeCards(req.body.cards) : normalizeCards(existing.cards);

    if (!existing.isGlobal && !req.isAdmin && req.body.cards) {
      const limit = getPlan(req.user.plan).limits.ownCards;
      if (limit !== null) {
        const otherCards = await countUserOwnCards(req.user.id, existing.deckId);
        if (otherCards + cards.length > limit) {
          throw forbidden(
            `Limite do plano ${getPlan(req.user.plan).name} atingido (${limit} cards próprios).`,
          );
        }
      }
    }

    const patch = {
      name: req.body.name ?? existing.name,
      description: req.body.description ?? existing.description,
      category: req.body.category ?? existing.category,
      theme: req.body.theme ?? existing.theme,
      cards,
      updatedAt: new Date(),
    };
    if (req.isAdmin) {
      if (req.body.plan !== undefined) patch.plan = req.body.plan;
      if (req.body.isGlobal !== undefined) patch.isGlobal = req.body.isGlobal;
    }

    const [updated] = await db
      .update(flashcardDecks)
      .set(patch)
      .where(eq(flashcardDecks.deckId, existing.deckId))
      .returning();

    const progressRows = await db
      .select()
      .from(cardProgress)
      .where(
        and(eq(cardProgress.userId, req.user.id), eq(cardProgress.deckId, existing.deckId)),
      );
    const map = new Map(progressRows.map((p) => [p.cardId, p]));

    res.json({ data: attachProgress(updated, map, req.user) });
  }),
);

router.delete(
  '/:deckId',
  asyncHandler(async (req, res) => {
    const [existing] = await db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, req.params.deckId))
      .limit(1);

    if (!existing) throw notFound('Deck não encontrado.');
    if (existing.userId !== req.user.id && !req.isAdmin) {
      throw forbidden('Você não pode excluir este deck.');
    }

    await db.transaction(async (tx) => {
      await tx.delete(cardProgress).where(eq(cardProgress.deckId, existing.deckId));
      await tx.delete(flashcardDecks).where(eq(flashcardDecks.deckId, existing.deckId));
    });

    res.json({ data: { deckId: existing.deckId, deleted: true } });
  }),
);

const reviewSchema = z.object({
  cardId: z.string().min(1),
  quality: z.number().int().min(1).max(4),
  durationMs: z.number().int().min(0).max(600_000).optional(),
});

router.post(
  '/:deckId/review',
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const { deckId } = req.params;
    const { cardId, quality, durationMs } = req.body;

    const [deck] = await db
      .select()
      .from(flashcardDecks)
      .where(eq(flashcardDecks.deckId, deckId))
      .limit(1);
    if (!deck) throw notFound('Deck não encontrado.');

    const isGlobal = Boolean(deck.isGlobal || deck.userId === 'admin');
    if (isGlobal && !req.isAdmin && !planAllows(req.user.plan, deck.plan)) {
      throw forbidden('Seu plano não permite estudar este deck.');
    }

    const [current] = await db
      .select()
      .from(cardProgress)
      .where(
        and(
          eq(cardProgress.userId, req.user.id),
          eq(cardProgress.deckId, deckId),
          eq(cardProgress.cardId, cardId),
        ),
      )
      .limit(1);

    const next = calculateSM2(current, quality);

    await db
      .insert(cardProgress)
      .values({
        userId: req.user.id,
        deckId,
        cardId,
        ...next,
      })
      .onConflictDoUpdate({
        target: [cardProgress.userId, cardProgress.deckId, cardProgress.cardId],
        set: next,
      });

    await db.insert(reviewLogs).values({
      userId: req.user.id,
      deckId,
      cardId,
      quality,
      durationMs: durationMs ?? null,
    });

    res.json({
      data: {
        cardId,
        interval: next.interval,
        easeFactor: next.easeFactor,
        repetitions: next.repetitions,
        lapses: next.lapses,
        nextReview: next.nextReview.toISOString(),
        lastReview: next.lastReview.toISOString(),
      },
    });
  }),
);

router.post(
  '/:deckId/reset-progress',
  asyncHandler(async (req, res) => {
    await db
      .delete(cardProgress)
      .where(
        and(
          eq(cardProgress.userId, req.user.id),
          eq(cardProgress.deckId, req.params.deckId),
        ),
      );
    res.json({ data: { reset: true } });
  }),
);

export default router;
