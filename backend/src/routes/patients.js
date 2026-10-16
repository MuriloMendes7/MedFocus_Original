import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const { profiles, legacyPatients } = schema;

// Memória local para fallback caso Postgres ainda não esteja configurado
const inMemoryPatients = new Map();

/**
 * GET /api/patients
 * Lista todos os pacientes/perfis.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      const rows = await db.select().from(profiles);
      const data = rows.map((p) => ({
        id: p.id,
        userId: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        plan: p.plan,
        role: p.role,
        isActive: p.isActive ? 1 : 0,
      }));

      return res.json({
        data,
        count: data.length,
        message: `${data.length} paciente(s) encontrado(s)`,
      });
    } catch {
      const fallbackList = Array.from(inMemoryPatients.values());
      return res.json({
        data: fallbackList,
        count: fallbackList.length,
        message: `${fallbackList.length} paciente(s) encontrado(s) (modo compatibilidade)`,
      });
    }
  }),
);

/**
 * GET /api/patients/:email
 * Retorna um paciente pelo e-mail (usado pelo app.js legado).
 */
router.get(
  '/:email',
  asyncHandler(async (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();

    try {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(sql`lower(${profiles.email}) = ${email}`)
        .limit(1);

      if (profile) {
        return res.json({
          data: {
            id: profile.id,
            userId: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            plan: profile.plan,
            role: profile.role,
            isActive: profile.isActive ? 1 : 0,
          },
        });
      }

      const [legacy] = await db
        .select()
        .from(legacyPatients)
        .where(sql`lower(${legacyPatients.email}) = ${email}`)
        .limit(1);

      if (legacy) {
        return res.json({ data: legacy });
      }
    } catch {
      // Ignora erro de query e recorre ao fallback
    }

    if (inMemoryPatients.has(email)) {
      return res.json({ data: inMemoryPatients.get(email) });
    }

    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }),
);

/**
 * POST /api/patients
 * Cria ou sincroniza paciente (usado pelo app.js legado).
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { userId, name, email, phone, plan = 'premium', role = 'student', isActive = 1 } =
      req.body ?? {};

    if (!email) {
      return res.status(400).json({ error: 'O campo email é obrigatório.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name || cleanEmail.split('@')[0]).trim();

    const patientRecord = {
      id: Math.floor(Math.random() * 100000),
      userId: userId || `patient-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: phone || null,
      plan,
      role,
      isActive: isActive ? 1 : 0,
      updatedAt: new Date().toISOString(),
    };

    inMemoryPatients.set(cleanEmail, patientRecord);

    try {
      await db
        .insert(profiles)
        .values({
          id: patientRecord.userId,
          email: cleanEmail,
          name: cleanName,
          phone: phone || null,
          plan,
          role,
          isActive: Boolean(isActive),
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            name: cleanName,
            phone: phone || null,
            plan,
            role,
            isActive: Boolean(isActive),
            updatedAt: new Date(),
          },
        });
    } catch {
      // Continua graciosamente
    }

    return res.status(201).json({
      success: true,
      message: 'Paciente sincronizado com sucesso.',
      data: patientRecord,
    });
  }),
);

export default router;
