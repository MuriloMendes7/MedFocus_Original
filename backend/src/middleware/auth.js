import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { ensureProfile } from '../services/profiles.js';
import { forbidden, unauthorized } from '../utils/http.js';

// jose faz cache das chaves e busca novamente quando aparece um `kid` desconhecido.
const JWKS = createRemoteJWKSet(new URL(env.neonAuthJwksUrl), {
  cooldownDuration: 30_000,
  cacheMaxAge: 10 * 60_000,
});

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: env.neonAuthOrigin,
    audience: env.neonAuthOrigin,
  });
  return payload;
}

/** Exige um JWT válido do Neon Auth no header `Authorization: Bearer <token>`. */
export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw unauthorized();

    let claims;
    try {
      claims = await verifyToken(token);
    } catch {
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
