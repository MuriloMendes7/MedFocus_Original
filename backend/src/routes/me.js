import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { PLANS, getPlan } from '../config/plans.js';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/errors.js';
import { toPublicProfile } from '../services/profiles.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const { profiles } = schema;

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const now = new Date();
    try {
      const last = req.user.lastLoginAt ? new Date(req.user.lastLoginAt) : null;
      if (!last || now.getTime() - last.getTime() > 5 * 60_000) {
        await db
          .update(profiles)
          .set({ lastLoginAt: now })
          .where(eq(profiles.id, req.user.id));
        req.user.lastLoginAt = now;
      }
    } catch {
      // Ignora erro de gravação se banco estiver offline
    }

    res.json({
      data: {
        user: toPublicProfile(req.user),
        planDetails: getPlan(req.user.plan),
        plans: PLANS,
      },
    });
  }),
);

const updateSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo').max(120).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
});

router.patch(
  '/',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const patch = { updatedAt: new Date() };
    if (req.body.name !== undefined) patch.name = req.body.name;
    if (req.body.phone !== undefined) patch.phone = req.body.phone || null;

    const [updated] = await db
      .update(profiles)
      .set(patch)
      .where(eq(profiles.id, req.user.id))
      .returning();

    res.json({ data: toPublicProfile(updated) });
  }),
);

export default router;
