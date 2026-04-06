// MedFocus Cards - Sistema de Repetição Espaçada (FSRS + Short-term)
// Corrigido: Garante que cards agendados tenham prioridade total após o tempo passar.

const MINUTE_MS = 60000;
const AGAIN_MS = 2 * MINUTE_MS;
const HARD_MS = 5 * MINUTE_MS;
const GOOD_MS = 15 * MINUTE_MS;
const EASY_MS = 30 * MINUTE_MS;

class StudyEngine {
  constructor(deck, options = {}) {
    this.deck = deck;
    this.userId = options.userId;
    this.cardsById = new Map();
    this.shortTermQueue = []; // Fila simples para facilitar a manipulação
    this.newQueue = [];
    this.normalizeDeck();
  }

  normalizeDeck() {
    const now = Date.now();
    (this.deck.cards || []).forEach(card => {
      this.cardsById.set(card.id, card);
      if (!card.nextReview || card.learningState === 'new') {
        this.newQueue.push(card.id);
      } else {
        const due = new Date(card.nextReview).getTime();
        this.shortTermQueue.push({ card, due });
      }
    });
    this.sortShortTerm();
  }

  sortShortTerm() {
    this.shortTermQueue.sort((a, b) => a.due - b.due);
  }

  nextCard(now = Date.now()) {
    // 1. PRIORIDADE MÁXIMA: Verificar se algum card de curto prazo já venceu o tempo
    if (this.shortTermQueue.length > 0) {
      if (this.shortTermQueue[0].due <= now) {
        return { card: this.shortTermQueue.shift().card, source: 'learning' };
      }
    }

    // 2. PRIORIDADE SECUNDÁRIA: Se não houver nada urgente, mostrar cards novos
    if (this.newQueue.length > 0) {
      const cardId = this.newQueue.shift();
      const card = this.cardsById.get(cardId);
      return { card, source: 'new' };
    }

    // 3. Se não houver nada agora, mas houver algo no futuro
    if (this.shortTermQueue.length > 0) {
      return { card: null, waitUntil: this.shortTermQueue[0].due };
    }

    return { card: null, waitUntil: null };
  }

  rate(cardId, quality, now = Date.now()) {
    const card = this.cardsById.get(cardId);
    if (!card) return;

    let delay = 0;
    switch (quality) {
      case 0: delay = AGAIN_MS; break; // Again (1) -> 2m
      case 1: delay = HARD_MS; break;  // Hard (2) -> 5m
      case 2: delay = GOOD_MS; break;  // Good (3) -> 15m
      case 3: delay = EASY_MS; break;  // Easy (4) -> 30m
    }

    const dueTime = now + delay;
    card.learningState = 'learning';
    card.nextReview = new Date(dueTime).toISOString();
    card.lastReview = new Date(now).toISOString();

    // Remove se já estiver na fila e adiciona novamente com novo tempo
    this.shortTermQueue = this.shortTermQueue.filter(item => item.card.id !== cardId);
    this.shortTermQueue.push({ card, due: dueTime });
    this.sortShortTerm();

    this.persist();
  }

  // Dentro da classe StudyEngine no seu flashcards.js

  async persist() {
    const userId = window.Auth?.current?.id || (window.app && window.app.currentUser ? window.app.currentUser.id : null);
    if (!userId || !window.app || !window.app.backendUrl) return;

    // 1. Salva no LocalStorage (Backup rápido)
    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const idx = decks.findIndex(d => d.id === this.deck.id);
    if (idx !== -1) {
      decks[idx] = this.deck;
      localStorage.setItem('medFocusDecks', JSON.stringify(decks));
    }

    // 2. Envia para o Banco de Dados Neon (Sincronização real)
    try {
      const payload = {
          deckId: this.deck.id,
          userId: userId,
          name: this.deck.name || 'Deck',
          description: this.deck.description || '',
          category: this.deck.category || 'geral',
          theme: this.deck.theme || '',
          plan: this.deck.plan || 'free',
          cards: this.deck.cards || []
      };
      await fetch(`${window.app.backendUrl}/api/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('✅ Sincronizado com o backend com sucesso');
    } catch (err) {
      console.error('❌ Erro ao sincronizar com o banco:', err);
    }
  }
}

const Flashcards = {
  currentEngine: null,
  currentCard: null,
  refreshTimer: null,
  study: {
    start(deckId) {
      const userId = window.Auth?.current?.id;
      if (!userId) return;
      const decks = Storage.getUserDecks(userId);
      const deck = decks.find(d => d.id === deckId);
      if (!deck) return;

      Flashcards.currentEngine = new StudyEngine(deck, { userId });
      Flashcards.study.advance();

      // Inicia o verificador automático a cada 5 segundos
      if (Flashcards.refreshTimer) clearInterval(Flashcards.refreshTimer);
      Flashcards.refreshTimer = setInterval(() => {
        if (!Flashcards.currentCard) Flashcards.study.advance();
      }, 5000);
    },

    advance() {
      const next = Flashcards.currentEngine.nextCard();

      if (!next.card) {
        if (next.waitUntil) {
          Flashcards.study.renderWaiting(next.waitUntil);
        } else {
          Flashcards.study.finishSession();
        }
        return;
      }

      if (Flashcards.study._waitInterval) {
        clearInterval(Flashcards.study._waitInterval);
      }

      Flashcards.currentCard = next.card;
      Flashcards.study.displayCard(next.card);
    },

    displayCard(card) {
      const container = document.getElementById('studyCard');
      if (!container) return;
      container.innerHTML = `
                <div class="study-card">
                    <div class="card-question"><h3>${card.question}</h3></div>
                    <div class="card-answer hidden" id="cardAnswer">
                        <p>${card.answer}</p>
                        <div class="difficulty-buttons">
                            <button class="again-btn" onclick="handleFSRSAnswer(1)">
                                Again <small>2m</small>
                            </button>
                            <button class="hard-btn" onclick="handleFSRSAnswer(2)">
                                Hard <small>5m</small>
                            </button>
                            <button class="good-btn" onclick="handleFSRSAnswer(3)">
                                Good <small>15m</small>
                            </button>
                            <button class="easy-btn" onclick="handleFSRSAnswer(4)">
                                Easy <small>30m</small>
                            </button>
                        </div>
                    </div>
                    <button class="btn btn--primary show-answer-btn" id="showBtn" style="width: 100%; margin-top: 15px;" onclick="Flashcards.study.showAnswer()">Ver Resposta</button>
                </div>`;
    },

    showAnswer() {
      const ans = document.getElementById('cardAnswer');
      const btn = document.getElementById('showBtn');
      if (ans) ans.classList.remove('hidden');
      if (btn) btn.classList.add('hidden');
    },

    renderWaiting(until) {
      const container = document.getElementById('studyCard');
      if (!container) return;

      if (Flashcards.study._waitInterval) clearInterval(Flashcards.study._waitInterval);

      const updateTimer = () => {
        const diff = until - Date.now();
        if (diff <= 0) {
          if (Flashcards.study._waitInterval) clearInterval(Flashcards.study._waitInterval);
          Flashcards.study.advance();
          return;
        }
        const totalSec = Math.ceil(diff / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        const timeStr = m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;

        const timeElem = document.getElementById('waitTimeDisplay');
        if (timeElem) {
          timeElem.textContent = timeStr;
        } else {
          container.innerHTML = `
                      <div class="study-card waiting">
                          <h3>Aguardando revisão...</h3>
                          <p>O card voltará em <strong id="waitTimeDisplay">${timeStr}</strong>.</p>
                          <p style="font-size: 0.8rem; color: var(--color-text-secondary, #888);">Os cards de 2, 5, 15 e 30 min aparecerão automaticamente.</p>
                      </div>`;
        }
      };
      updateTimer();
      Flashcards.study._waitInterval = setInterval(updateTimer, 1000);
    },

    finishSession() {
      if (Flashcards.refreshTimer) clearInterval(Flashcards.refreshTimer);
      if (Flashcards.study._waitInterval) clearInterval(Flashcards.study._waitInterval);
      UI.notifications.show('Sessão finalizada!');
      setTimeout(() => window.location.href = 'flashcards.html', 2000);
    }
  },

  init() {
    const params = new URLSearchParams(window.location.search);
    const deckId = params.get('study');
    if (deckId) Flashcards.study.start(deckId);
  }
};
  



function handleFSRSAnswer(quality) {
  if (!Flashcards.currentCard || !Flashcards.currentEngine) return;
  const cardId = Flashcards.currentCard.id;
  Flashcards.currentCard = null; // Limpa o card atual antes de processar
  Flashcards.currentEngine.rate(cardId, quality - 1);
  Flashcards.study.advance();
}

if (typeof window.answerCard === 'undefined') {
  window.answerCard = handleFSRSAnswer;
} else {
  window.handleFSRSAnswer = handleFSRSAnswer;
}
window.Flashcards = Flashcards;
document.addEventListener('DOMContentLoaded', Flashcards.init);