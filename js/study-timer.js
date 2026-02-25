// MedFocus Cards - Study Timer System
// Sistema completo de cronometragem para flashcards com integração às estatísticas

const StudyTimer = {
    // Estado do cronômetro
    state: {
        isRunning: false,
        startTime: null,
        currentSession: null,
        totalTime: 0,
        deckId: null,
        cardId: null,
        sessionHistory: []
    },

    // Configurações
    config: {
        autoSaveInterval: 30000, // Salvar a cada 30 segundos
        minSessionTime: 1000, // Mínimo 1 segundo para contar como sessão
        maxIdleTime: 300000, // 5 minutos de inatividade para pausar
        lastActivity: null
    },

    // Inicializar
    init() {
        console.log('Inicializando StudyTimer...');
        this.loadState();
        this.setupEventListeners();
        this.startAutoSave();
        this.trackActivity();
        this.updateDisplay();
        this.updateTimerButtons();
        console.log('StudyTimer inicializado com sucesso');
    },

    // Carregar estado salvo
    loadState() {
        const savedState = localStorage.getItem('medFocusStudyTimer');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                this.state = { ...this.state, ...parsed };
            } catch (error) {
                console.error('Erro ao carregar estado do cronômetro:', error);
            }
        }
    },

    // Salvar estado
    saveState() {
        try {
            localStorage.setItem('medFocusStudyTimer', JSON.stringify(this.state));
        } catch (error) {
            console.error('Erro ao salvar estado do cronômetro:', error);
        }
    },

    // Configurar event listeners
    setupEventListeners() {
        // Detectar mudanças de página/aba
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseTimer();
            } else if (this.state.isRunning) {
                this.resumeTimer();
            }
        });

        // Detectar cliques e teclas para atividade
        document.addEventListener('click', () => this.trackActivity());
        document.addEventListener('keydown', () => this.trackActivity());

        // Detectar quando o usuário sai da página
        window.addEventListener('beforeunload', () => {
            this.stopTimer();
        });

        // Configurar botões do cronômetro
        const startBtn = document.getElementById('timerStartBtn');
        const pauseBtn = document.getElementById('timerPauseBtn');
        const stopBtn = document.getElementById('timerStopBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (!this.state.isRunning) {
                    this.startTimer('current');
                }
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.state.isRunning) {
                    this.pauseTimer();
                } else {
                    this.resumeTimer();
                }
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTimer();
            });
        }
    },

    // Rastrear atividade do usuário
    trackActivity() {
        this.config.lastActivity = Date.now();
    },

    // Verificar se o usuário está inativo
    isUserInactive() {
        if (!this.config.lastActivity) return false;
        return (Date.now() - this.config.lastActivity) > this.config.maxIdleTime;
    },

    // Iniciar cronômetro para um deck
    startTimer(deckId, cardId = null) {
        const studyPage = document.getElementById('studyModePage');
        if (!studyPage || studyPage.classList.contains('hidden')) {
            console.log('Cronômetro só funciona na página de estudo de flashcards');
            return;
        }

        if (this.state.isRunning && this.state.deckId === deckId) {
            return;
        }

        if (this.state.isRunning) {
            this.stopTimer();
        }

        if (deckId === 'current') {
            const deckTitle = document.getElementById('studyDeckTitle');
            deckId = deckTitle ? deckTitle.textContent : 'unknown_deck';
        }

        this.state.deckId = deckId;
        this.state.cardId = cardId;
        this.state.startTime = Date.now();
        this.state.isRunning = true;
        this.config.lastActivity = Date.now();

        this.state.currentSession = {
            id: 'session_' + Date.now(),
            deckId: deckId,
            startTime: this.state.startTime,
            endTime: null,
            totalTime: 0,
            cardsStudied: [],
            pauses: []
        };

        this.startVisualTimer();
        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerStart();
    },

    // Iniciar cronômetro visual
    startVisualTimer() {
        if (this.visualTimer) {
            clearInterval(this.visualTimer);
            this.visualTimer = null;
        }

        const timerElement = document.getElementById('studyTimer');
        if (!timerElement) return;

        const updateTimer = () => {
            if (!this.state.isRunning || !this.state.startTime) return;

            const elapsed = (Date.now() - this.state.startTime) + this.state.totalTime;
            timerElement.textContent = this.formatTime(elapsed);
        };

        updateTimer();
        this.visualTimer = setInterval(updateTimer, 1000);
    },

    // Pausar cronômetro
    pauseTimer() {
        if (!this.state.isRunning) return;

        const now = Date.now();
        const sessionTime = now - this.state.startTime;
        this.state.totalTime += sessionTime;

        if (this.state.currentSession) {
            this.state.currentSession.pauses.push({
                start: this.state.startTime,
                end: now,
                duration: sessionTime
            });
        }

        this.state.isRunning = false;
        if (this.visualTimer) clearInterval(this.visualTimer);
        
        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerPause();
    },

    // Retomar cronômetro
    resumeTimer() {
        if (this.state.isRunning || !this.state.deckId) return;

        this.state.startTime = Date.now();
        this.state.isRunning = true;
        this.config.lastActivity = Date.now();

        this.startVisualTimer();
        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerResume();
    },

    // Parar cronômetro
    stopTimer() {
        if (!this.state.isRunning && !this.state.currentSession) return;

        const now = Date.now();
        if (this.state.isRunning) {
            const sessionTime = now - this.state.startTime;
            this.state.totalTime += sessionTime;
        }

        if (this.state.currentSession) {
            this.state.currentSession.endTime = now;
            this.state.currentSession.totalTime = this.state.totalTime;

            if (this.state.totalTime >= this.config.minSessionTime) {
                this.saveSession(this.state.currentSession);
            }
        }

        this.state.isRunning = false;
        this.state.startTime = null;
        this.state.currentSession = null;
        this.state.totalTime = 0;
        this.state.deckId = null;
        this.state.cardId = null;

        if (this.visualTimer) {
            clearInterval(this.visualTimer);
            this.visualTimer = null;
        }

        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerStop();
    },

    // Salvar sessão de estudo
    saveSession(session) {
        // Verifica se existe o objeto Auth global (comum no seu projeto)
        const userId = window.Auth?.current?.id || 'guest';
        
        this.state.sessionHistory.push(session);

        if (typeof Storage !== 'undefined' && Storage.saveStudySession) {
            Storage.saveStudySession(userId, {
                deckId: session.deckId,
                duration: session.totalTime,
                startTime: session.startTime,
                endTime: session.endTime,
                cardsStudied: session.cardsStudied.length,
                sessionId: session.id
            });
        }

        const userSessions = JSON.parse(localStorage.getItem(`medFocusSessions_${userId}`) || '[]');
        userSessions.push(session);
        localStorage.setItem(`medFocusSessions_${userId}`, JSON.stringify(userSessions));

        console.log('Sessão de estudo salva localmente');
    },

    recordCardStudy(cardId, quality, responseTime) {
        if (!this.state.currentSession) return;

        const cardRecord = {
            cardId: cardId,
            quality: quality,
            responseTime: responseTime,
            timestamp: Date.now()
        };

        this.state.currentSession.cardsStudied.push(cardRecord);
        this.saveState();
    },

    getCurrentSessionTime() {
        if (!this.state.isRunning || !this.state.startTime) {
            return this.state.totalTime;
        }
        return this.state.totalTime + (Date.now() - this.state.startTime);
    },

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    updateDisplay() {
        const timerElement = document.getElementById('studyTimer');
        if (!timerElement) return;

        const currentTime = this.getCurrentSessionTime();
        timerElement.textContent = this.formatTime(currentTime);

        timerElement.classList.toggle('timer-running', this.state.isRunning);
        timerElement.classList.toggle('timer-paused', !this.state.isRunning && this.state.currentSession);
    },

    updateTimerButtons() {
        const startBtn = document.getElementById('timerStartBtn');
        const pauseBtn = document.getElementById('timerPauseBtn');
        const stopBtn = document.getElementById('timerStopBtn');

        if (!startBtn || !pauseBtn || !stopBtn) return;

        if (this.state.isRunning) {
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            stopBtn.classList.remove('hidden');
        } else if (this.state.currentSession) {
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
        } else {
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.add('hidden');
        }
    },

    startAutoSave() {
        setInterval(() => {
            if (this.state.isRunning) this.saveState();
        }, this.config.autoSaveInterval);
    },

    showNotification(message, type = 'info') {
        if (window.Notifications && typeof window.Notifications.show === 'function') {
            window.Notifications.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    notifyTimerStart() { this.showNotification('Cronômetro iniciado', 'success'); },
    notifyTimerPause() { this.showNotification('Cronômetro pausado', 'info'); },
    notifyTimerResume() { this.showNotification('Cronômetro retomado', 'success'); },
    notifyTimerStop() { 
        const formattedTime = this.formatTime(this.state.totalTime);
        this.showNotification(`Sessão finalizada: ${formattedTime}`, 'info'); 
    }
};

// Inicialização segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StudyTimer.init());
} else {
    StudyTimer.init();
}

window.StudyTimer = StudyTimer;