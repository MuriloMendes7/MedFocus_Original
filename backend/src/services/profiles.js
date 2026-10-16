import { eq, sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { PLAN_IDS, ROLES } from '../config/plans.js';
import { db, schema } from '../db/index.js';

const { profiles, legacyPatients } = schema;

const isAdminEmail = (email) => env.adminEmails.includes(String(email).toLowerCase());

/** Tenta reaproveitar plano/papel/telefone de um cadastro da tabela legada `patients`. */
async function findLegacyPatient(email) {
  try {
    const [row] = await db
      .select()
      .from(legacyPatients)
      .where(sql`lower(${legacyPatients.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return row ?? null;
  } catch {
    // Tabela legada pode não existir em bancos novos.
    return null;
  }
}

/**
 * Garante que existe um perfil para o usuário autenticado no Neon Auth.
 * Cria no primeiro acesso e promove a admin se o e-mail estiver em ADMIN_EMAILS.
 */
export async function ensureProfile(claims) {
  const id = String(claims.sub);
  const email = String(claims.email ?? '').toLowerCase();
  const name = String(claims.name ?? '').trim();

  let [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);

  if (!profile) {
    // Mesmo e-mail com outro id (usuário recriado no Neon Auth): reatribui os dados ao novo id.
    const [byEmail] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    if (byEmail) {
      profile = await reassignProfileId(byEmail.id, id);
    } else {
      const legacy = await findLegacyPatient(email);
      [profile] = await db
        .insert(profiles)
        .values({
          id,
          email,
          name: name || legacy?.name || email.split('@')[0],
          phone: legacy?.phone ?? null,
          plan: PLAN_IDS.includes(legacy?.plan) ? legacy.plan : 'free',
          role: ROLES.includes(legacy?.role) ? legacy.role : 'student',
          isActive: legacy ? legacy.isActive !== 0 : true,
        })
        .onConflictDoNothing()
        .returning();
      // Corrida entre duas requisições simultâneas no primeiro acesso.
      if (!profile) {
        [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
      }
    }
  }

  if (isAdminEmail(profile.email) && profile.role !== 'admin') {
    [profile] = await db
      .update(profiles)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
  }

  return profile;
}

async function reassignProfileId(oldId, newId) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`UPDATE card_progress SET user_id = ${newId} WHERE user_id = ${oldId}`);
    await tx.execute(sql`UPDATE review_logs SET user_id = ${newId} WHERE user_id = ${oldId}`);
    await tx.execute(sql`UPDATE quiz_attempts SET user_id = ${newId} WHERE user_id = ${oldId}`);
    await tx.execute(sql`UPDATE flashcard_decks SET user_id = ${newId} WHERE user_id = ${oldId}`);
    await tx.execute(sql`UPDATE quizzes SET owner_id = ${newId} WHERE owner_id = ${oldId}`);
    const [updated] = await tx
      .update(profiles)
      .set({ id: newId, updatedAt: new Date() })
      .where(eq(profiles.id, oldId))
      .returning();
    return updated;
  });
}

export const toPublicProfile = (p) => ({
  id: p.id,
  email: p.email,
  name: p.name,
  phone: p.phone,
  plan: p.plan,
  role: p.role,
  isActive: p.isActive,
  lastLoginAt: p.lastLoginAt,
  createdAt: p.createdAt,
});
