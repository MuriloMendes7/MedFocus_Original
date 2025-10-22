// MedFocus Cards - Flashcards Timer Integration
// Integração entre o sistema de flashcards e o cronômetro de estudo

const FlashcardsTimerIntegration = {
    // Estado
    state: {
        currentDeck: null,
        currentCard: null,
        cardStartTime: null,
        isStudySessionActive: false
    },

    // Inicializar integração
    init() {
        this.setupEventListeners();
        this.setupFlashcardHooks();
    },

    // Configurar event listeners
    setupEventListeners() {
        // Interceptar início de estudo de deck
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="startStudy"]') || e.target.matches('[onclick*="startDeck"]')) {
                this.handleStudyStart(e);
            }
        });

        // Interceptar respostas de cards
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="answerCard"]') || e.target.matches('[data-quality]')) {
                this.handleCardAnswer(e);
            }
        });

        // Interceptar mudança de card
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="nextCard"]') || e.target.matches('[onclick*="flipCard"]')) {
                this.handleCardChange(e);
            }
        });

        // Detectar quando a página de estudo é mostrada
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const studyPage = document.getElementById('studyModePage');
                    if (studyPage && !studyPage.classList.contains('hidden')) {
                        // Página de estudo foi mostrada
                        setTimeout(() => this.autoStartTimer(), 100);
                    }
                }
            });
        });

        // Observar mudanças na página de estudo
        const studyPage = document.getElementById('studyModePage');
        if (studyPage) {
            observer.observe(studyPage, { attributes: true, attributeFilter: ['class'] });
        }
    },

    // Configurar hooks nos flashcards
    setupFlashcardHooks() {
        // Hook para quando um deck é iniciado
        if (typeof Flashcards !== 'undefined') {
            const originalStartStudy = Flashcards.startStudy;
            if (originalStartStudy) {
                Flashcards.startStudy = (deckId) => {
                    this.onDeckStart(deckId);
                    return originalStartStudy.call(Flashcards, deckId);
                };
            }
        }

        // Hook para quando um card é respondido
        if (typeof Flashcards !== 'undefined') {
            const originalAnswerCard = Flashcards.answerCard;
            if (originalAnswerCard) {
                Flashcards.answerCard = (quality) => {
                    this.onCardAnswer(quality);
                    return originalAnswerCard.call(Flashcards, quality);
                };
            }
        }
    },

    // Manipular início de estudo
    handleStudyStart(event) {
        // Verificar se estamos na página de estudo de flashcards
        const studyPage = document.getElementById('studyModePage');
        if (!studyPage || studyPage.classList.contains('hidden')) {
            return; // Só funciona na página de estudo
        }

        const deckElement = event.target.closest('[data-deck-id]');
        const deckId = deckElement ? deckElement.getAttribute('data-deck-id') : 'unknown';
        
        this.onDeckStart(deckId);
    },

    // Manipular resposta de card
    handleCardAnswer(event) {
        const quality = parseInt(event.target.getAttribute('data-quality')) || 
                       parseInt(event.target.getAttribute('data-answer')) || 0;
        
        this.onCardAnswer(quality);
    },

    // Manipular mudança de card
    handleCardChange(event) {
        this.onCardChange();
    },

    // Quando um deck é iniciado
    onDeckStart(deckId) {
        if (!deckId) return;

        this.state.currentDeck = deckId;
        this.state.isStudySessionActive = true;

        // Iniciar cronômetro se não estiver rodando
        if (typeof StudyTimer !== 'undefined' && !StudyTimer.state.isRunning) {
            StudyTimer.startTimer(deckId);
        }

        console.log(`[Timer Integration] Deck iniciado: ${deckId}`);
    },

    // Iniciar cronômetro automaticamente quando entrar na página de estudo
    autoStartTimer() {
        const studyPage = document.getElementById('studyModePage');
        if (studyPage && !studyPage.classList.contains('hidden')) {
            // Verificar se há um deck sendo estudado
            const deckTitle = document.getElementById('studyDeckTitle');
            if (deckTitle && deckTitle.textContent !== 'Anatomia Humana') {
                const deckId = deckTitle.textContent;
                if (typeof StudyTimer !== 'undefined' && !StudyTimer.state.isRunning) {
                    StudyTimer.startTimer(deckId);
                }
            }
        }
    },

    // Quando um card é respondido
    onCardAnswer(quality) {
        if (!this.state.isStudySessionActive || !this.state.currentCard) return;

        const responseTime = this.state.cardStartTime ? 
            Date.now() - this.state.cardStartTime : 0;

        // Registrar estudo do card no cronômetro
        if (typeof StudyTimer !== 'undefined') {
            StudyTimer.recordCardStudy(this.state.currentCard, quality, responseTime);
        }

        console.log(`[Timer Integration] Card respondido: ${this.state.currentCard}, qualidade: ${quality}, tempo: ${responseTime}ms`);
    },

    // Quando um card muda
    onCardChange() {
        // Resetar tempo do card atual
        this.state.cardStartTime = Date.now();
        
        // Obter ID do card atual (se disponível)
        const currentCardElement = document.querySelector('.flashcard.current, .card.current, [data-card-id]');
        if (currentCardElement) {
            this.state.currentCard = currentCardElement.getAttribute('data-card-id') || 
                                   currentCardElement.id || 
                                   'card_' + Date.now();
        }

        console.log(`[Timer Integration] Card mudou: ${this.state.currentCard}`);
    },

    // Quando uma sessão de estudo termina
    onStudyEnd() {
        this.state.currentDeck = null;
        this.state.currentCard = null;
        this.state.cardStartTime = null;
        this.state.isStudySessionActive = false;

        // Parar cronômetro
        if (typeof StudyTimer !== 'undefined' && StudyTimer.state.isRunning) {
            StudyTimer.stopTimer();
        }

        console.log('[Timer Integration] Sessão de estudo finalizada');
    },

    // Obter estatísticas de tempo para um deck específico
    getDeckTimeStats(deckId, period = 30) {
        if (typeof StudyTimer !== 'undefined') {
            return StudyTimer.getTimeStats(Auth.current?.id, deckId, period);
        }
        return { totalTime: 0, totalSessions: 0, averageTime: 0 };
    },

    // Obter tempo médio por card
    getAverageCardTime(deckId, period = 30) {
        const stats = this.getDeckTimeStats(deckId, period);
        if (stats.totalSessions > 0) {
            // Assumindo que cada sessão tem em média 20 cards
            const averageCardsPerSession = 20;
            const totalCards = stats.totalSessions * averageCardsPerSession;
            return totalCards > 0 ? stats.totalTime / totalCards : 0;
        }
        return 0;
    },

    // Formatar tempo médio por card
    formatAverageCardTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) {
            return `${seconds}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
        }
    },

    // Adicionar informações de tempo aos cards de deck
    enhanceDeckCards() {
        const deckCards = document.querySelectorAll('.deck-card, .deck-item');
        
        deckCards.forEach(card => {
            const deckId = card.getAttribute('data-deck-id') || card.id;
            if (!deckId) return;

            const stats = this.getDeckTimeStats(deckId);
            const averageCardTime = this.getAverageCardTime(deckId);

            // Adicionar informações de tempo se não existirem
            let timeInfo = card.querySelector('.deck-time-info');
            if (!timeInfo) {
                timeInfo = document.createElement('div');
                timeInfo.className = 'deck-time-info';
                card.appendChild(timeInfo);
            }

            timeInfo.innerHTML = `
                <div class="time-stats">
                    <span class="time-stat">
                        <i class="fas fa-clock"></i>
                        ${StudyTimer.formatTime(stats.totalTime)}
                    </span>
                    <span class="time-stat">
                        <i class="fas fa-play"></i>
                        ${stats.totalSessions} sessões
                    </span>
                    <span class="time-stat">
                        <i class="fas fa-stopwatch"></i>
                        ${this.formatAverageCardTime(averageCardTime)}/card
                    </span>
                </div>
            `;
        });
    },

    // Atualizar informações de tempo periodicamente
    startPeriodicUpdate() {
        setInterval(() => {
            if (this.state.isStudySessionActive) {
                this.enhanceDeckCards();
            }
        }, 30000); // Atualizar a cada 30 segundos
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    FlashcardsTimerIntegration.init();
    FlashcardsTimerIntegration.startPeriodicUpdate();
});

// Exportar para uso global
window.FlashcardsTimerIntegration = FlashcardsTimerIntegration;
