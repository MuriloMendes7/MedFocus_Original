import { createAuthClient } from '@neondatabase/neon-js/auth';

const DEFAULT_NEON_AUTH_URL =
  'https://ep-fancy-pond-acs7t66a.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

const neonAuthUrl = (
  import.meta.env.VITE_NEON_AUTH_URL || DEFAULT_NEON_AUTH_URL
).trim();

export const isNeonAuthConfigured = Boolean(neonAuthUrl);

export const authClient = isNeonAuthConfigured
  ? createAuthClient(neonAuthUrl, {
      fetchOptions: { credentials: 'include' },
    })
  : null;

let cachedToken = null;
let cachedTokenExp = 0;

function readJwtExp(token) {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return (decoded.exp ?? 0) * 1000;
  } catch {
    return Date.now() + 10 * 60_000;
  }
}

export function clearTokenCache() {
  cachedToken = null;
  cachedTokenExp = 0;
}

/**
 * Obtém um JWT válido do Neon Auth (com cache até 30s antes de expirar).
 */
export async function getAccessToken(forceRefresh = false) {
  const demoToken = localStorage.getItem('medfocus_demo_token');
  if (demoToken) return demoToken;

  if (!authClient) return null;
  if (!forceRefresh && cachedToken && Date.now() < cachedTokenExp - 30_000) {
    return cachedToken;
  }

  const { data, error } = await authClient.token();
  if (error || !data?.token) {
    clearTokenCache();
    return null;
  }

  cachedToken = data.token;
  cachedTokenExp = readJwtExp(data.token);
  return cachedToken;
}
