// MedFocus Cards - Modern FSRS with short-term queue
// Novo motor de repetição espaçada baseado em FSRS e fila imediata adaptativa.

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const S_MIN = 0.001;
const DEFAULT_RETENTION = 0.9;
const DEFAULT_NEW_LIMIT = 10;

const AGAIN_STEPS_MS = [60000]; // 1 minuto
const HARD_STEPS_MS = [180000]; // 3 minutos
const GOOD_STEPS_MS = [600000]; // 10 minutos
const EASY_STEPS_MS = [1800000]; // 30 minutos

const DEFAULT_PARAMETERS = [
  0.212,
  1.2931,
  2.3065,
  8.2956,
  6.4133,
  0.8334,
  3.0194,
  0.001,
  1.8722,
  0.1666,
  0.796,
  1.4835,
  0.0614,
  0.2629,
  1.6483,
  0.6014,
  1.8729,
  0.5425,
  0.0912,
  0.0658,
  0.5
];

const PARAM_BOUNDS = [
  [0.001, 100],
  [0.001, 100],
  [0.001, 100],
  [0.001, 100],
  [1, 10],
  [0.001, 5],
  [0, 5],
  [0, 1],
  [0, 3],
  [0, 1],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 5],
  [0, 1],
  [0, 1],
  [0.05, 5]
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function differenceInDays(start, end) {
  if (!start || !end) return 0;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.max((endTime - startTime) / DAY_MS, 0);
}

function generateCardId() {
  return 'card_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createEmptyCard(question, answer, explanation) {
  const now = new Date().toISOString();
  return {
    id: generateCardId(),
    question: question,
    answer: answer,
    explanation: explanation || '',
    difficulty: 5,
    stability: S_MIN,
    retrievability: 0,
    lastReview: null,
    nextReview: null,
    lapses: 0,
    learningState: 'new',
    shortTermReps: 0,
    createdAt: now,
    updatedAt: now,
    history: []
  };
}

class SimplePriorityQueue {
  constructor() {
    this.items = [];
  }

  push(card, due) {
    this.items.push({ card, due });
    this.items.sort((a, b) => a.due - b.due);
  }

  shift() {
    return this.items.shift() || null;
  }

  peek() {
    return this.items.length ? this.items[0] : null;
  }

  remove(cardId) {
    this.items = this.items.filter(entry => entry.card.id !== cardId);
  }

  clear() {
    this.items = [];
  }

  get length() {
    return this.items.length;
  }
}

function computeDecay(weights, retention) {
  const decay = typeof weights === 'number' ? -weights : -weights[20];
  const targetRetention = retention || DEFAULT_RETENTION;
  const factor = Math.exp((1 / decay) * Math.log(targetRetention)) - 1;
  return { decay, factor };
}

class FSRSModel {
  constructor(options = {}) {
    this.retention = options.retention || DEFAULT_RETENTION;
    this.paramsKey = 'medFocusFsrsParams';
    this.params = this.loadParameters();
    this.updateDecayFactor();
  }

  loadParameters() {
    try {
      const raw = localStorage.getItem(this.paramsKey);
      if (!raw) {
        return { w: [...DEFAULT_PARAMETERS] };
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.w) || parsed.w.length !== 21) {
        return { w: [...DEFAULT_PARAMETERS] };
      }
      const bounded = parsed.w.map((value, index) => {
        const [min, max] = PARAM_BOUNDS[index];
        return clamp(Number(value) || 0, min, max);
      });
      return { w: bounded };
    } catch (err) {
      console.warn('FSRS params load failed, using defaults', err);
      return { w: [...DEFAULT_PARAMETERS] };
    }
  }

  saveParameters() {
    try {
      localStorage.setItem(this.paramsKey, JSON.stringify(this.params));
    } catch (err) {
      console.warn('FSRS params persist failed', err);
    }
    this.updateDecayFactor();
  }

  updateDecayFactor() {
    const { decay, factor } = computeDecay(this.params.w, this.retention);
    this.decay = decay;
    this.factor = factor;
  }

  forgettingCurve(elapsedDays, stability) {
    if (stability <= S_MIN) return 0;
    const value = Math.pow(1 + (this.factor * elapsedDays) / stability, this.decay);
    return clamp(value, 0, 1);
  }

  initStability(grade) {
    const index = clamp(grade, 0, 3);
    return Math.max(this.params.w[index], S_MIN);
  }

  initDifficulty(gradeIndex) {
    const base = this.params.w[4] - Math.exp((gradeIndex - 1) * this.params.w[5]) + 1;
    return clamp(+base.toFixed(8), 1, 10);
  }

  meanReversion(initial, current) {
    const mix = clamp(this.params.w[7], 0, 1);
    return +(mix * initial + (1 - mix) * current).toFixed(8);
  }

  linearDamping(delta, oldDifficulty) {
    return +((delta * (10 - oldDifficulty)) / 9).toFixed(8);
  }

  nextDifficulty(difficulty, quality) {
    const delta = -this.params.w[6] * (quality - 3);
    const damped = difficulty + this.linearDamping(delta, difficulty);
    const reverted = this.meanReversion(this.initDifficulty(4), damped);
    return clamp(reverted, 1, 10);
  }

  nextRecallStability(difficulty, stability, retrievability, quality) {
    const hardPenalty = quality === 2 ? this.params.w[15] : 1;
    const easyBonus = quality === 3 ? this.params.w[16] : 1;
    const growth = Math.exp(this.params.w[8]) *
      (11 - difficulty) *
      Math.pow(stability, -this.params.w[9]) *
      (Math.exp((1 - retrievability) * this.params.w[10]) - 1) *
      hardPenalty *
      easyBonus;
    const newStability = stability * (1 + growth);
    return clamp(+newStability.toFixed(8), S_MIN, 36500);
  }

  nextForgetStability(difficulty, stability, retrievability) {
    const newStability = this.params.w[11] *
      Math.pow(difficulty, -this.params.w[12]) *
      (Math.pow(stability + 1, this.params.w[13]) - 1) *
      Math.exp((1 - retrievability) * this.params.w[14]);
    return clamp(+newStability.toFixed(8), S_MIN, 36500);
  }

  nextShortTermStability(stability, quality) {
    const sinc = Math.pow(stability, -this.params.w[19]) *
      Math.exp(this.params.w[17] * (quality - 3 + this.params.w[18]));
    const tuned = quality >= 2 ? Math.max(sinc, 1) : sinc;
    const value = stability * tuned;
    return clamp(+value.toFixed(8), S_MIN, 36500);
  }

  nextState(card, elapsedDays, quality) {
    const gradeIndex = quality + 1;
    const difficulty = card && card.difficulty ? card.difficulty : 0;
    const stability = card && card.stability ? card.stability : 0;

    if (!card || !card.lastReview || card.learningState === 'new' || stability <= S_MIN) {
      return {
        difficulty: this.initDifficulty(gradeIndex),
        stability: this.initStability(gradeIndex)
      };
    }

    if (quality === 0) {
      return {
        difficulty,
        stability
      };
    }

    const retrievability = this.forgettingCurve(elapsedDays, stability);
    const recallStability = this.nextRecallStability(difficulty, stability, retrievability, quality);
    const forgetStability = this.nextForgetStability(difficulty, stability, retrievability);
    const shortTermStability = this.nextShortTermStability(stability, quality);

    let chosen = recallStability;
    if (quality === 1) {
      chosen = clamp(Math.min(recallStability, forgetStability), S_MIN, recallStability);
    }
    if (elapsedDays === 0 && quality >= 2) {
      chosen = shortTermStability;
    }

    return {
      difficulty: this.nextDifficulty(difficulty, quality),
      stability: chosen
    };
  }

  solveNextInterval(stability) {
    let low = 1;
    let high = Math.max(stability * 3, 1);
    for (let i = 0; i < 25; i++) {
      const mid = (low + high) / 2;
      const retention = this.forgettingCurve(mid, stability);
      if (retention > this.retention) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return Math.max(1, Math.round(high));
  }

  optimize(card, quality, now) {
    if (!card.lastReview) return;
    const elapsed = differenceInDays(card.lastReview, now.toISOString());
    const predicted = this.forgettingCurve(elapsed, Math.max(card.stability, S_MIN));
    const target = quality >= 2 ? 1 : 0;
    const error = target - predicted;
    const learningRate = 0.0005;

    this.params.w = this.params.w.map((value, index) => {
      const updated = value + learningRate * error;
      const [min, max] = PARAM_BOUNDS[index];
      return clamp(updated, min, max);
    });

    this.saveParameters();
  }
}

class StudyEngine {
  constructor(deck, options = {}) {
    this.deck = deck;
    this.userId = options.userId;
    this.retention = options.retention || DEFAULT_RETENTION;
    this.newLimit = options.newLimit || DEFAULT_NEW_LIMIT;
    this.newIntroduced = 0;

    this.fsrs = new FSRSModel({ retention: this.retention });
    this.cardsById = new Map();
    this.shortTermQueue = new SimplePriorityQueue();
    this.reviewQueue = new SimplePriorityQueue();
    this.newQueue = [];
    this.activeCardSource = null;
    this.activeCardId = null;

    this.normalizeDeck();
  }

  normalizeDeck() {
    const now = Date.now();
    (this.deck.cards || []).forEach(rawCard => {
      const card = this.normalizeCard(rawCard);
      this.cardsById.set(card.id, card);
      if (card.learningState === 'new') {
        this.newQueue.push(card.id);
      } else if (card.learningState === 'learning') {
        const due = card.nextReview ? new Date(card.nextReview).getTime() : now;
        this.shortTermQueue.push(card, due);
      } else {
        const due = card.nextReview ? new Date(card.nextReview).getTime() : now;
        this.reviewQueue.push(card, due);
      }
    });

    this.newQueue.sort((a, b) => {
      const cardA = this.cardsById.get(a);
      const cardB = this.cardsById.get(b);
      return new Date(cardA.createdAt || 0) - new Date(cardB.createdAt || 0);
    });
  }

  normalizeCard(card) {
    const normalized = Object.assign({}, card);
    if (!normalized.id) {
      normalized.id = generateCardId();
    }
    normalized.difficulty = clamp(Number(normalized.difficulty) || (normalized.easeFactor ? 10 - normalized.easeFactor : 5), 1, 10);
    normalized.stability = Math.max(Number(normalized.stability) || (normalized.interval ? normalized.interval : S_MIN), S_MIN);
    if (normalized.retrievability === undefined) {
      normalized.retrievability = 0;
    }
    if (!Array.isArray(normalized.history)) {
      normalized.history = [];
    }
    if (typeof normalized.lapses !== 'number') {
      normalized.lapses = 0;
    }
    if (typeof normalized.shortTermReps !== 'number') {
      normalized.shortTermReps = 0;
    }
    if (!normalized.learningState) {
      normalized.learningState = normalized.nextReview ? 'review' : 'new';
    }
    normalized.updatedAt = new Date().toISOString();
    return normalized;
  }

  persist() {
    if (!this.userId) return;
    const decks = Storage.getUserDecks(this.userId);
    const index = decks.findIndex(d => d.id === this.deck.id);
    if (index !== -1) {
      decks[index] = this.deck;
      Storage.setUserDecks(this.userId, decks);
    }
  }

  removeFromQueues(cardId) {
    this.shortTermQueue.remove(cardId);
    this.reviewQueue.remove(cardId);
    this.newQueue = this.newQueue.filter(id => id !== cardId);
  }

  enqueueShortTerm(card, dueDate) {
    const due = dueDate ? dueDate.getTime() : Date.now();
    this.shortTermQueue.push(card, due);
  }

  enqueueReview(card, dueDate) {
    const due = dueDate ? dueDate.getTime() : Date.now();
    this.reviewQueue.push(card, due);
  }

  getShortTermDelay(card, quality) {
    const steps = quality === 0 ? AGAIN_STEPS_MS : HARD_STEPS_MS;
    const reps = Math.max(card.shortTermReps || 1, 1);
    const index = Math.min(reps - 1, steps.length - 1);
    return steps[index];
  }

  getQueueStats() {
    return {
      short: this.shortTermQueue.length,
      review: this.reviewQueue.length,
      newCards: this.newQueue.length
    };
  }

  nextCard(now = new Date()) {
    const nowMs = now.getTime();
    
    // Prioridade 1: Cards em aprendizado que precisam ser repetidos (short-term)
    const shortPeek = this.shortTermQueue.peek();
    if (shortPeek && shortPeek.due <= nowMs) {
      const entry = this.shortTermQueue.shift();
      this.activeCardSource = 'learning';
      this.activeCardId = entry.card.id;
      return { card: entry.card, source: 'learning' };
    }

    // Prioridade 2: Cards em revisão que estão devidos
    const reviewPeek = this.reviewQueue.peek();
    if (reviewPeek && reviewPeek.due <= nowMs) {
      const entry = this.reviewQueue.shift();
      this.activeCardSource = 'review';
      this.activeCardId = entry.card.id;
      return { card: entry.card, source: 'review' };
    }

    // Prioridade 3: Cards novos (dentro do limite diário)
    if (this.newIntroduced < this.newLimit && this.newQueue.length > 0) {
      const cardId = this.newQueue.shift();
      const card = this.cardsById.get(cardId);
      if (card) {
        card.learningState = 'learning';
        card.lastReview = null;
        card.nextReview = null;
        card.shortTermReps = 0;
        this.newIntroduced += 1;
        this.activeCardSource = 'new';
        this.activeCardId = card.id;
        return { card, source: 'new' };
      }
    }

    // Se há cards aguardando, mostrar quando será o próximo
    if (shortPeek) {
      return { card: null, waitUntil: shortPeek.due, reason: 'short-term' };
    }

    if (reviewPeek) {
      return { card: null, waitUntil: reviewPeek.due, reason: 'review' };
    }

    // Nenhum card disponível
    return { card: null, waitUntil: null };
  }

  rate(cardId, quality, timeSpentSeconds, now = new Date()) {
    const card = this.cardsById.get(cardId);
    if (!card) return;

    this.removeFromQueues(cardId);

    const ratingLog = {
      timestamp: now.toISOString(),
      quality,
      timeSpent: timeSpentSeconds,
      previousStability: card.stability,
      previousDifficulty: card.difficulty
    };

    // Para cards novos ou em aprendizado, usar sistema de repetição espaçada simples
    if (card.learningState === 'new' || card.learningState === 'learning') {
      card.learningState = 'learning';
      card.shortTermReps = (card.shortTermReps || 0) + 1;
      card.lastReview = now.toISOString();
      
      // Definir próximo intervalo baseado na qualidade
      let delay;
      switch(quality) {
        case 0: // Again
          delay = AGAIN_STEPS_MS[0]; // 1 minuto
          card.lapses = (card.lapses || 0) + 1;
          break;
        case 1: // Hard
          delay = HARD_STEPS_MS[0]; // 3 minutos
          break;
        case 2: // Good
          delay = GOOD_STEPS_MS[0]; // 10 minutos
          break;
        case 3: // Easy
          delay = EASY_STEPS_MS[0]; // 30 minutos
          break;
        default:
          delay = AGAIN_STEPS_MS[0];
      }
      
      const due = new Date(now.getTime() + delay);
      card.nextReview = due.toISOString();
      this.enqueueShortTerm(card, due);
      
      // Se foi "Good" ou "Easy", marcar como pronto para revisão
      if (quality >= 2) {
        card.learningState = 'review';
        // Agendar para revisão em 1 dia
        const reviewDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        card.nextReview = reviewDue.toISOString();
        this.enqueueReview(card, reviewDue);
      }
    } else {
      // Para cards em revisão, usar algoritmo FSRS
      const elapsed = card.lastReview ? differenceInDays(card.lastReview, now.toISOString()) : 0;
      const nextState = this.fsrs.nextState(card, elapsed, quality);
      card.difficulty = nextState.difficulty;
      card.stability = nextState.stability;
      card.retrievability = 1;
      card.learningState = 'review';
      card.shortTermReps = 0;
      card.lastReview = now.toISOString();
      
      // Se foi "Again", voltar para aprendizado
      if (quality === 0) {
        card.learningState = 'learning';
        card.shortTermReps = 1;
        card.lapses = (card.lapses || 0) + 1;
        const delay = AGAIN_STEPS_MS[0]; // 1 minuto
        const due = new Date(now.getTime() + delay);
        card.nextReview = due.toISOString();
        this.enqueueShortTerm(card, due);
      } else {
        const intervalDays = clamp(this.fsrs.solveNextInterval(card.stability), 1, 3650);
        const due = new Date(now.getTime() + intervalDays * DAY_MS);
        card.nextReview = due.toISOString();
        this.enqueueReview(card, due);
        this.fsrs.optimize(card, quality, now);
      }
    }

    card.updatedAt = now.toISOString();
    if (Array.isArray(card.history)) {
      card.history.push(ratingLog);
    } else {
      card.history = [ratingLog];
    }

    this.persist();
    return card;
  }
}

const Flashcards = {
  createEmptyCard,
  studyQueue: { length: 0 },

  updateLegacyQueueIndicator() {
    const engine = Flashcards.currentEngine;
    const total = engine
      ? engine.shortTermQueue.length + engine.reviewQueue.length + engine.newQueue.length
      : 0;
    Flashcards.studyQueue.length = total;
  },

  import: {
    preview(file, callback) {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target.result;
        const cards = Flashcards.import.parseContent(content);
        callback(cards);
      };
      reader.readAsText(file);
    },

    parseContent(content) {
      const lines = String(content || '').split(/\r?\n/);
      const cards = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const parts = trimmed.split('|');
        if (parts.length >= 2) {
          cards.push(createEmptyCard(parts[0].trim(), parts[1].trim(), (parts[2] || '').trim()));
        }
      });
      return cards;
    },

    createDeck(name, cards, userId) {
      const deck = {
        id: UI.utils.generateId(),
        name,
        userId,
        cards,
        category: 'geral',
        description: '',
        created: new Date().toISOString(),
        lastStudied: null,
        stats: {
          totalReviews: 0,
          correctReviews: 0,
          averageTime: 0,
          streak: 0
        }
      };
      const decks = Storage.getUserDecks(userId);
      decks.push(deck);
      Storage.setUserDecks(userId, decks);
      return deck;
    }
  },

  utils: {
    ensureCard(card) {
      const ensured = Object.assign({}, card);
      if (!ensured.id) ensured.id = generateCardId();
      ensured.difficulty = clamp(Number(ensured.difficulty) || 5, 1, 10);
      ensured.stability = Math.max(Number(ensured.stability) || S_MIN, S_MIN);
      if (ensured.retrievability === undefined) ensured.retrievability = 0;
      if (typeof ensured.lapses !== 'number') ensured.lapses = 0;
      if (typeof ensured.shortTermReps !== 'number') ensured.shortTermReps = 0;
      if (!Array.isArray(ensured.history)) ensured.history = [];
      if (!ensured.learningState) ensured.learningState = ensured.nextReview ? 'review' : 'new';
      return ensured;
    },

    calculateDeckStats(deck) {
      let totalCards = 0;
      let dueCards = 0;
      let newCards = 0;
      let learningCards = 0;
      let reviewCards = 0;
      let totalReviews = 0;
      let correctReviews = 0;
      const now = Date.now();

      (deck.cards || []).forEach(card => {
        const normalized = Flashcards.utils.ensureCard(card);
        totalCards += 1;
        if (normalized.learningState === 'new') {
          newCards += 1;
        } else if (normalized.learningState === 'learning') {
          learningCards += 1;
        } else {
          reviewCards += 1;
        }
        if (normalized.nextReview && new Date(normalized.nextReview).getTime() <= now) {
          dueCards += 1;
        }
        if (Array.isArray(normalized.history)) {
          normalized.history.forEach(entry => {
            totalReviews += 1;
            if (entry.quality >= 2) correctReviews += 1;
          });
        }
      });

      const correctRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
      return {
        totalCards,
        dueCards,
        newCards,
        learningCards,
        reviewCards,
        correctRate
      };
    },

    countDue(deck) {
      const now = Date.now();
      return (deck.cards || []).reduce((total, card) => {
        const normalized = Flashcards.utils.ensureCard(card);
        if (normalized.learningState === 'new') return total;
        if (!normalized.nextReview) return total + 1;
        return total + (new Date(normalized.nextReview).getTime() <= now ? 1 : 0);
      }, 0);
    }
  },

  currentDeck: null,
  currentCard: null,
  currentEngine: null,
  studySession: null,
  cardStartTime: null,
  waitTimer: null,

  study: {
    start(deckId) {
      const decks = Storage.getUserDecks(Auth.current.id);
      const deck = decks.find(d => d.id === deckId);
      if (!deck) {
        UI.notifications.show('Baralho não encontrado', 'error');
        return false;
      }

      Flashcards.currentDeck = deck;
      Flashcards.currentEngine = new StudyEngine(deck, {
        userId: Auth.current.id,
        retention: DEFAULT_RETENTION,
        newLimit: DEFAULT_NEW_LIMIT
      });
      Flashcards.updateLegacyQueueIndicator();

      Flashcards.studySession = {
        startTime: new Date(),
        cardsStudied: 0,
        correctAnswers: 0,
        totalTime: 0,
        deckId
      };

      Flashcards.study.showNextCard();
      return true;
    },

    advance() {
      if (Flashcards.waitTimer) {
        clearTimeout(Flashcards.waitTimer);
        Flashcards.waitTimer = null;
      }
      const now = new Date();
      const next = Flashcards.currentEngine.nextCard(now);
      Flashcards.updateLegacyQueueIndicator();

      if (!next.card) {
        if (next.waitUntil) {
          Flashcards.study.renderWaiting(next.waitUntil);
          const delay = Math.max(next.waitUntil - Date.now(), 1000);
          Flashcards.waitTimer = setTimeout(() => {
            Flashcards.waitTimer = null;
            Flashcards.study.advance();
          }, delay);
          return;
        }
        Flashcards.study.finishSession();
        return;
      }

      Flashcards.currentCard = next.card;
      Flashcards.cardStartTime = Date.now();
      Flashcards.study.displayCard(next.card);
    },

    showNextCard() {
      Flashcards.study.advance();
    },

    displayCard(card) {
      const container = document.getElementById('studyCard');
      if (!container) return;
      const stats = Flashcards.currentEngine ? Flashcards.currentEngine.getQueueStats() : { short: 0, review: 0, newCards: 0 };
      const remainingNew = Flashcards.currentEngine ? Math.max(Flashcards.currentEngine.newLimit - Flashcards.currentEngine.newIntroduced, 0) : 0;

      container.innerHTML = `
        <div class="study-card">
          <div class="card-counter">
            Card ${Flashcards.studySession.cardsStudied + 1}
          </div>
          <div class="queue-meta">
            <span>Curto prazo: ${stats.short}</span>
            <span>Revisões: ${stats.review}</span>
            <span>Novos restantes: ${remainingNew}</span>
          </div>
          <div class="card-question">
            <h3>${card.question}</h3>
          </div>
          <div class="card-answer hidden" id="cardAnswer">
            <div class="answer-content">
              <h4>Resposta:</h4>
              <p>${card.answer}</p>
              ${card.explanation ? `<div class="card-explanation"><h4>Justificativa:</h4><p>${card.explanation}</p></div>` : ''}
            </div>
            <div class="answer-buttons">
              <button class="btn btn--outline" onclick="Flashcards.study.answerCard(0)">
                <i class="fas fa-times"></i> Again
              </button>
              <button class="btn btn--secondary" onclick="Flashcards.study.answerCard(1)">
                <i class="fas fa-minus"></i> Hard
              </button>
              <button class="btn btn--primary" onclick="Flashcards.study.answerCard(2)">
                <i class="fas fa-check"></i> Good
              </button>
              <button class="btn btn--success" onclick="Flashcards.study.answerCard(3)">
                <i class="fas fa-thumbs-up"></i> Easy
              </button>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn--primary btn--lg" onclick="Flashcards.study.showAnswer()" id="showAnswerBtn">
              <i class="fas fa-eye"></i> Mostrar Resposta
            </button>
          </div>
        </div>
      `;
    },

    renderWaiting(waitUntil) {
      const container = document.getElementById('studyCard');
      if (!container) return;
      const diff = Math.max(waitUntil - Date.now(), 0);
      const minutes = Math.ceil(diff / MINUTE_MS);
      container.innerHTML = `
        <div class="study-card waiting">
          <h3>Fila de curto prazo em andamento</h3>
          <p>Próxima revisão disponível em aproximadamente ${minutes} minuto(s).</p>
        </div>
      `;
      Flashcards.updateLegacyQueueIndicator();
    },

    showAnswer() {
      const answer = document.getElementById('cardAnswer');
      const button = document.getElementById('showAnswerBtn');
      if (answer && button) {
        answer.classList.remove('hidden');
        button.style.display = 'none';
      }
    },

    answerCard(quality) {
      if (!Flashcards.currentCard || !Flashcards.studySession) {
        return;
      }
      const now = new Date();
      const timeSpent = Flashcards.cardStartTime ? Math.round((Date.now() - Flashcards.cardStartTime) / 1000) : 0;
      Flashcards.currentEngine.rate(Flashcards.currentCard.id, quality, timeSpent, now);

      Flashcards.studySession.cardsStudied += 1;
      if (quality >= 2) {
        Flashcards.studySession.correctAnswers += 1;
      }
      Flashcards.studySession.totalTime += timeSpent;
      Flashcards.currentDeck.lastStudied = now.toISOString();
      Flashcards.currentCard = null;
      Flashcards.cardStartTime = null;
      Flashcards.updateLegacyQueueIndicator();
      Flashcards.study.advance();
    },

    finishSession() {
      const session = Flashcards.studySession;
      if (!session) return;
      const accuracy = session.cardsStudied > 0 ? Math.round((session.correctAnswers / session.cardsStudied) * 100) : 0;
      Flashcards.study.saveSessionStats(session);
      Flashcards.currentEngine?.persist();
      UI.notifications.show(`Sessão concluída! ${session.cardsStudied} cards estudados (${accuracy}% de acerto)`, 'success');
      Flashcards.currentDeck = null;
      Flashcards.currentEngine = null;
      Flashcards.studySession = null;
      Flashcards.currentCard = null;
      Flashcards.cardStartTime = null;
      Flashcards.updateLegacyQueueIndicator();
      const onStudyPage = typeof window !== 'undefined' && window.location && /study\.html$/i.test(window.location.pathname || '');
      if (!onStudyPage) {
        window.location.href = 'flashcards.html';
      }
    },

    saveSessionStats(session) {
      const userId = Auth.current.id;
      const today = new Date().toISOString().split('T')[0];
      const stats = Storage.getUserStats(userId);
      if (!stats[today]) {
        stats[today] = {
          date: today,
          reviews: 0,
          correct: 0,
          timeSpent: 0,
          decksStudied: []
        };
      }
      const dayStats = stats[today];
      dayStats.reviews += session.cardsStudied;
      dayStats.correct += session.correctAnswers;
      dayStats.timeSpent += session.totalTime;
      if (!dayStats.decksStudied.includes(session.deckId)) {
        dayStats.decksStudied.push(session.deckId);
      }
      Storage.setUserStats(userId, stats);
    }
  },

  init() {
    const params = new URLSearchParams(window.location.search);
    const deckId = params.get('study');
    if (deckId) {
      Flashcards.study.start(deckId);
    }
  }
};

// Função para processar resposta do card
function answerCard(quality) {
  // quality: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
  
  // Usar o sistema unificado do Flashcards
  if (Flashcards.study && Flashcards.study.answerCard) {
    Flashcards.study.answerCard(quality - 1); // Converter para 0-3 (Again=0, Hard=1, Good=2, Easy=3)
    return;
  }
  
  // Fallback para o sistema antigo se necessário
  if (!Flashcards.currentCard) {
    console.log('Nenhum card ativo para responder');
    return;
  }

  const card = Flashcards.currentCard;
  const now = Date.now();
  
  // Calcular próximo intervalo baseado na qualidade
  let nextInterval = 0;
  
  switch(quality) {
    case 1: // Again - 1 minuto
      nextInterval = AGAIN_STEPS_MS[0];
      break;
    case 2: // Hard - 3 minutos
      nextInterval = HARD_STEPS_MS[0];
      break;
    case 3: // Good - 10 minutos
      nextInterval = GOOD_STEPS_MS[0];
      break;
    case 4: // Easy - 30 minutos
      nextInterval = EASY_STEPS_MS[0];
      break;
    default:
      nextInterval = AGAIN_STEPS_MS[0];
  }

  // Atualizar card
  card.lastReview = now;
  card.nextReview = now + nextInterval;
  card.lapses = quality === 1 ? (card.lapses || 0) + 1 : (card.lapses || 0);
  
  // Registrar no histórico
  if (!card.history) card.history = [];
  card.history.push({
    timestamp: now,
    quality: quality,
    interval: nextInterval,
    lapses: card.lapses
  });

  // Salvar no storage
  if (Flashcards.saveCard) {
    Flashcards.saveCard(card);
  }

  // Registrar no cronômetro se disponível
  if (typeof FlashcardsTimerIntegration !== 'undefined') {
    FlashcardsTimerIntegration.onCardAnswer(quality);
  }

  console.log(`Card respondido: qualidade ${quality}, próximo em ${nextInterval/60000} minutos`);
  
  // Próximo card ou finalizar sessão
  if (Flashcards.study && Flashcards.study.advance) {
    Flashcards.study.advance();
  }
}

// Função para virar o card
function flipCard() {
  const flashcard = document.getElementById('flashcard');
  if (flashcard) {
    flashcard.classList.toggle('flipped');
  }
}

window.Flashcards = Flashcards;
window.createEmptyFlashcard = createEmptyCard;
window.answerCard = answerCard;
window.flipCard = flipCard;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Flashcards.init);
} else {
  Flashcards.init();
}


