import { Router } from 'express';
import { and, desc, eq, gte, or } from 'drizzle-orm';
import { planAllows } from '../config/plans.js';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const { flashcardDecks, cardProgress, reviewLogs, quizzes, quizAttempts } = schema;

router.use(requireAuth);

const toDayKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function computeStreak(activeDaysSet) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!activeDaysSet.has(toDayKey(cursor))) {
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);
    if (!activeDaysSet.has(toDayKey(yesterday))) return 0;
    cursor.setDate(cursor.getDate() - 1);
  }

  while (activeDaysSet.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const since90d = new Date();
    since90d.setDate(since90d.getDate() - 90);

    const [decks, progressRows, reviews, attempts, allQuizzes] = await Promise.all([
      db
        .select()
        .from(flashcardDecks)
        .where(
          or(
            eq(flashcardDecks.userId, userId),
            eq(flashcardDecks.isGlobal, true),
            eq(flashcardDecks.userId, 'admin'),
          ),
        ),
      db.select().from(cardProgress).where(eq(cardProgress.userId, userId)),
      db
        .select()
        .from(reviewLogs)
        .where(and(eq(reviewLogs.userId, userId), gte(reviewLogs.createdAt, since90d)))
        .orderBy(desc(reviewLogs.createdAt)),
      db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, userId))
        .orderBy(desc(quizAttempts.createdAt))
        .limit(50),
      db
        .select({ id: quizzes.id, title: quizzes.title, category: quizzes.category })
        .from(quizzes),
    ]);

    const accessibleDecks = decks.filter(
      (d) =>
        d.userId === userId ||
        req.isAdmin ||
        planAllows(req.user.plan, d.plan),
    );

    const progressMap = new Map(progressRows.map((p) => [`${p.deckId}:${p.cardId}`, p]));
    const now = new Date();
    let totalCards = 0;
    let dueToday = 0;
    let learnedCards = 0;

    for (const deck of accessibleDecks) {
      const cards = Array.isArray(deck.cards) ? deck.cards : [];
      totalCards += cards.length;
      for (const c of cards) {
        const prog = progressMap.get(`${deck.deckId}:${c.id}`);
        if (prog && prog.repetitions > 0) learnedCards += 1;
        const next = prog?.nextReview ? new Date(prog.nextReview) : null;
        if (!next || next <= now) dueToday += 1;
      }
    }

    const activeDays = new Set();
    for (const r of reviews) activeDays.add(toDayKey(r.createdAt));
    for (const a of attempts) activeDays.add(toDayKey(a.createdAt));
    const streakDays = computeStreak(activeDays);

    const todayKey = toDayKey(now);
    const reviewsToday = reviews.filter((r) => toDayKey(r.createdAt) === todayKey).length;
    const totalReviews = reviews.length;
    const goodOrBetter = reviews.filter((r) => r.quality >= 3).length;
    const retentionRate =
      totalReviews > 0 ? Math.round((goodOrBetter / totalReviews) * 100) : 0;

    const reviewMinutes =
      reviews.reduce((sum, r) => sum + Math.min(r.durationMs ?? 8000, 120_000), 0) / 60_000;
    const quizMinutes = attempts.reduce((sum, a) => sum + (a.timeSpentSeconds ?? 0), 0) / 60;
    const studyHours = Number(((reviewMinutes + quizMinutes) / 60).toFixed(1));

    const last7Days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toDayKey(d);
      const dayReviews = reviews.filter((r) => toDayKey(r.createdAt) === key);
      const dayCorrect = dayReviews.filter((r) => r.quality >= 3).length;
      last7Days.push({
        date: key,
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        reviews: dayReviews.length,
        accuracy:
          dayReviews.length > 0 ? Math.round((dayCorrect / dayReviews.length) * 100) : 0,
      });
    }

    const deckCategory = new Map(decks.map((d) => [d.deckId, d.category || 'Geral']));
    const quizMeta = new Map(allQuizzes.map((q) => [q.id, q]));
    const catTotals = new Map();
    const bumpCategory = (cat, correct, total) => {
      const prev = catTotals.get(cat) ?? { correct: 0, total: 0 };
      prev.correct += correct;
      prev.total += total;
      catTotals.set(cat, prev);
    };

    for (const r of reviews) {
      bumpCategory(deckCategory.get(r.deckId) || 'Geral', r.quality >= 3 ? 1 : 0, 1);
    }
    for (const a of attempts) {
      bumpCategory(quizMeta.get(a.quizId)?.category || 'Geral', a.correct, a.total);
    }

    const byCategory = Array.from(catTotals.entries())
      .map(([category, v]) => ({
        category,
        total: v.total,
        percentage: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const recentAttempts = attempts.slice(0, 8).map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: quizMeta.get(a.quizId)?.title || 'Simulado',
      category: quizMeta.get(a.quizId)?.category || 'Geral',
      score: a.score,
      correct: a.correct,
      total: a.total,
      timeSpentSeconds: a.timeSpentSeconds,
      createdAt: a.createdAt,
    }));

    const avgQuizScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
        : 0;

    res.json({
      data: {
        summary: {
          totalDecks: accessibleDecks.length,
          totalCards,
          learnedCards,
          dueToday,
          reviewsToday,
          totalReviews,
          retentionRate,
          streakDays,
          studyHours,
          quizAttempts: attempts.length,
          avgQuizScore,
        },
        last7Days,
        byCategory,
        recentAttempts,
      },
    });
  }),
);

export default router;
