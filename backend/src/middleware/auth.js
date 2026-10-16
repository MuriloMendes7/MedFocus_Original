import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { ensureProfile } from '../services/profiles.js';
import { forbidden, HttpError, unauthorized } from '../utils/http.js';

const JWKS = env.neonAuthJwksUrl
  ? createRemoteJWKSet(new URL(env.neonAuthJwksUrl), {
      cooldownDuration: 30_000,
      cacheMaxAge: 10 * 60_000,
    })
  : null;

async function verifyToken(token) {
  if (!JWKS || !env.neonAuthOrigin) {
    throw new HttpError(
      503,
      'NEON_AUTH_URL não está configurada no servidor (Render Environment Variables).',
    );
  }
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: env.neonAuthOrigin,
    audience: env.neonAuthOrigin,
  });
  return payload;
}

const DEMO_STUDENT = {
  id: 'demo-user-123',
  email: 'aluno@medfocus.com',
  name: 'Aluno Demonstrativo',
  phone: null,
  plan: 'premium',
  role: 'student',
  isActive: true,
  createdAt: new Date(),
};

/** Permite autenticação opcional (para rotas públicas de decks e quizzes). */
export const optionalAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      req.user = null;
      req.isAdmin = false;
      return next();
    }

    if (token === 'demo-token' || token.startsWith('demo-')) {
      if (env.isProduction && !env.ALLOW_DEMO_LOGIN) {
        req.user = null;
        req.isAdmin = false;
        return next();
      }
      // Em produção, nunca concede papel de admin via cabeçalho demo arbitrário
      const role =
        !env.isProduction && req.headers['x-demo-role'] === 'admin' ? 'admin' : 'student';
      req.user = { ...DEMO_STUDENT, role };
      req.isAdmin = role === 'admin';
      return next();
    }

    if (!JWKS) {
      req.user = null;
      req.isAdmin = false;
      return next();
    }

    const claims = await verifyToken(token);
    const profile = await ensureProfile(claims);
    req.user = profile;
    req.isAdmin = profile.role === 'admin';
    next();
  } catch {
    req.user = null;
    req.isAdmin = false;
    next();
  }
};

/** Exige um JWT válido do Neon Auth no header `Authorization: Bearer <token>`. */
export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (token === 'demo-token' || token?.startsWith('demo-')) {
      if (env.isProduction && !env.ALLOW_DEMO_LOGIN) {
        throw unauthorized('Modo de demonstração desativado em produção.');
      }
      const role =
        !env.isProduction && req.headers['x-demo-role'] === 'admin' ? 'admin' : 'student';
      req.user = { ...DEMO_STUDENT, role };
      req.isAdmin = role === 'admin';
      return next();
    }

    if (!JWKS) {
      if (!env.isProduction) {
        req.user = { ...DEMO_STUDENT, role: 'admin' };
        req.isAdmin = true;
        return next();
      }
      throw new HttpError(
        503,
        'Configure a variável NEON_AUTH_URL no painel do Render para habilitar a autenticação.',
      );
    }

    if (scheme !== 'Bearer' || !token) throw unauthorized();

    let claims;
    try {
      claims = await verifyToken(token);
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw unauthorized('Sessão inválida ou expirada. Faça login novamente.');
    }

    if (claims.banned) throw forbidden('Sua conta foi bloqueada.');
    if (!claims.sub || !claims.email) throw unauthorized('Token sem identificação do usuário.');

    const profile = await ensureProfile(claims);
    if (!profile.isActive) throw forbidden('Sua conta está desativada. Fale com o suporte.');

    req.user = profile;
    req.isAdmin = profile.role === 'admin';
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, _res, next) => {
  if (!req.isAdmin) return next(forbidden('Apenas administradores.'));
  next();
};
