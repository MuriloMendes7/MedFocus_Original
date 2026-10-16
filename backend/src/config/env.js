import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Carrega backend/.env mesmo quando o servidor é iniciado a partir da raiz do repositório
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const csv = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().optional().default(''),
  NEON_AUTH_URL: z.string().optional().default(''),
  CORS_ORIGINS: z.string().default('*'),
  ADMIN_EMAILS: z.string().default('admin@medfocus.com'),
  RUN_MIGRATIONS_ON_START: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

const raw = schema.parse(process.env);

if (!raw.DATABASE_URL) {
  console.warn('⚠️ AVISO: DATABASE_URL não está configurada nas variáveis de ambiente!');
}

let neonAuthOrigin = null;
let neonAuthJwksUrl = null;
if (raw.NEON_AUTH_URL) {
  try {
    neonAuthOrigin = new URL(raw.NEON_AUTH_URL).origin;
    neonAuthJwksUrl = `${raw.NEON_AUTH_URL.replace(/\/$/, '')}/.well-known/jwks.json`;
  } catch {
    console.warn('⚠️ AVISO: NEON_AUTH_URL inválida:', raw.NEON_AUTH_URL);
  }
} else {
  console.warn('⚠️ AVISO: NEON_AUTH_URL ainda não foi configurada nas variáveis de ambiente.');
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  corsOrigins: csv(raw.CORS_ORIGINS),
  adminEmails: csv(raw.ADMIN_EMAILS).map((e) => e.toLowerCase()),
  neonAuthOrigin,
  neonAuthJwksUrl,
};
