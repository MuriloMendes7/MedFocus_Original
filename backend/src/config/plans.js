/**
 * Planos e limites. Fonte única da verdade — o frontend lê isso via GET /api/me.
 * `null` significa ilimitado.
 */
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    rank: 0,
    limits: { ownCards: 50, quizAttemptsPerMonth: 5 },
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 29.9,
    rank: 1,
    limits: { ownCards: 500, quizAttemptsPerMonth: 50 },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 49.9,
    rank: 2,
    limits: { ownCards: null, quizAttemptsPerMonth: null },
  },
};

export const PLAN_IDS = Object.keys(PLANS);
export const ROLES = ['student', 'admin'];

export const getPlan = (planId) => PLANS[planId] ?? PLANS.free;

/** O usuário com `userPlan` pode acessar conteúdo que exige `requiredPlan`? */
export const planAllows = (userPlan, requiredPlan) =>
  getPlan(userPlan).rank >= getPlan(requiredPlan || 'free').rank;
