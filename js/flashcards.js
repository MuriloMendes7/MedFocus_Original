// MedFocus Cards - Sistema de Repetição Espaçada (FSRS + Short-term)
// Corrigido: Garante que cards agendados tenham prioridade total após o tempo passar.

const MINUTE_MS = 60000;
const AGAIN_MS = 1 * MINUTE_MS;
const HARD_MS = 5 * MINUTE_MS;
const GOOD_MS = 10 * MINUTE_MS;
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
        switch(quality) {
            case 0: delay = AGAIN_MS; break;
            case 1: delay = HARD_MS; break;
            case 2: delay = GOOD_MS; break;
            case 3: delay = EASY_MS; break;
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

    persist() {
        if (this.userId && window.Storage) {
            const decks = Storage.getUserDecks(this.userId);
            const idx = decks.findIndex(d => d.id === this.deck.id);
            if (idx !== -1) {
                decks[idx] = this.deck;
                Storage.setUserDecks(this.userId, decks);
            }
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
                        <div class="answer-buttons">
                            <button class="btn btn--danger" onclick="answerCard(1)">Again (1m)</button>
                            <button class="btn btn--warning" onclick="answerCard(2)">Hard (5m)</button>
                            <button class="btn btn--primary" onclick="answerCard(3)">Good (10m)</button>
                            <button class="btn btn--success" onclick="answerCard(4)">Easy (30m)</button>
                        </div>
                    </div>
                    <button class="btn btn--primary" id="showBtn" onclick="Flashcards.study.showAnswer()">Ver Resposta</button>
                </div>`;
        },

        showAnswer() {
            const ans = document.getElementById('cardAnswer');
            const btn = document.getElementById('showBtn');
            if(ans) ans.classList.remove('hidden');
            if(btn) btn.classList.add('hidden');
        },

        renderWaiting(until) {
            const container = document.getElementById('studyCard');
            if (!container) return;

            const updateTimer = () => {
                const diff = until - Date.now();
                if (diff <= 0) {
                    Flashcards.study.advance();
                    return;
                }
                const sec = Math.ceil(diff / 1000);
                container.innerHTML = `
                    <div class="study-card waiting">
                        <h3>Aguardando revisão...</h3>
                        <p>O card voltará em <strong>${sec}s</strong>.</p>
                        <p style="font-size: 0.8rem; color: #666;">Os cards de 1, 5, 10 e 30 min aparecerão automaticamente.</p>
                    </div>`;
            };
            updateTimer();
        },

        finishSession() {
            if (Flashcards.refreshTimer) clearInterval(Flashcards.refreshTimer);
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

function answerCard(quality) {
    if (!Flashcards.currentCard || !Flashcards.currentEngine) return;
    const cardId = Flashcards.currentCard.id;
    Flashcards.currentCard = null; // Limpa o card atual antes de processar
    Flashcards.currentEngine.rate(cardId, quality - 1);
    Flashcards.study.advance();
}

window.Flashcards = Flashcards;
window.answerCard = answerCard;
document.addEventListener('DOMContentLoaded', Flashcards.init);