import 'dotenv/config';
import { z } from 'zod';

const csv = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  NEON_AUTH_URL: z.string().url('NEON_AUTH_URL deve ser a Auth Base URL do Neon'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  ADMIN_EMAILS: z.string().default(''),
  RUN_MIGRATIONS_ON_START: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('   Copie backend/.env.example para backend/.env e preencha os valores.');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  corsOrigins: csv(raw.CORS_ORIGINS),
  adminEmails: csv(raw.ADMIN_EMAILS).map((e) => e.toLowerCase()),
  neonAuthOrigin: new URL(raw.NEON_AUTH_URL).origin,
  neonAuthJwksUrl: `${raw.NEON_AUTH_URL.replace(/\/$/, '')}/.well-known/jwks.json`,
};
