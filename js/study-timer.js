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
        this.loadState();
        this.setupEventListeners();
        this.startAutoSave();
        this.trackActivity();
        this.updateDisplay();
        this.updateTimerButtons();
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
        // Verificar se estamos na página de estudo de flashcards
        const studyPage = document.getElementById('studyModePage');
        if (!studyPage || studyPage.classList.contains('hidden')) {
            console.log('Cronômetro só funciona na página de estudo de flashcards');
            return;
        }

        if (this.state.isRunning && this.state.deckId === deckId) {
            return; // Já está rodando para este deck
        }

        // Parar cronômetro anterior se houver
        if (this.state.isRunning) {
            this.stopTimer();
        }

        // Obter ID do deck atual se não fornecido
        if (deckId === 'current') {
            const deckTitle = document.getElementById('studyDeckTitle');
            deckId = deckTitle ? deckTitle.textContent : 'unknown_deck';
        }

        this.state.deckId = deckId;
        this.state.cardId = cardId;
        this.state.startTime = Date.now();
        this.state.isRunning = true;
        this.config.lastActivity = Date.now();

        // Criar nova sessão
        this.state.currentSession = {
            id: 'session_' + Date.now(),
            deckId: deckId,
            startTime: this.state.startTime,
            endTime: null,
            totalTime: 0,
            cardsStudied: [],
            pauses: []
        };

        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerStart();
    },

    // Pausar cronômetro
    pauseTimer() {
        if (!this.state.isRunning) return;

        const now = Date.now();
        const sessionTime = now - this.state.startTime;
        this.state.totalTime += sessionTime;

        // Registrar pausa
        if (this.state.currentSession) {
            this.state.currentSession.pauses.push({
                start: this.state.startTime,
                end: now,
                duration: sessionTime
            });
        }

        this.state.isRunning = false;
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

        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerResume();
    },

    // Parar cronômetro
    stopTimer() {
        if (!this.state.isRunning && !this.state.currentSession) return;

        const now = Date.now();
        let sessionTime = 0;

        if (this.state.isRunning) {
            sessionTime = now - this.state.startTime;
            this.state.totalTime += sessionTime;
        }

        // Finalizar sessão atual
        if (this.state.currentSession) {
            this.state.currentSession.endTime = now;
            this.state.currentSession.totalTime = this.state.totalTime;

            // Salvar sessão se tiver tempo mínimo
            if (this.state.totalTime >= this.config.minSessionTime) {
                this.saveSession(this.state.currentSession);
            }
        }

        // Resetar estado
        this.state.isRunning = false;
        this.state.startTime = null;
        this.state.currentSession = null;
        this.state.totalTime = 0;
        this.state.deckId = null;
        this.state.cardId = null;

        this.updateDisplay();
        this.updateTimerButtons();
        this.saveState();
        this.notifyTimerStop();
    },

    // Salvar sessão de estudo
    saveSession(session) {
        const userId = Auth.current?.id;
        if (!userId) return;

        // Adicionar à lista de sessões
        this.state.sessionHistory.push(session);

        // Salvar no sistema de estatísticas
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

        // Salvar no localStorage como backup
        const userSessions = JSON.parse(localStorage.getItem(`medFocusSessions_${userId}`) || '[]');
        userSessions.push(session);
        localStorage.setItem(`medFocusSessions_${userId}`, JSON.stringify(userSessions));

        console.log('Sessão de estudo salva:', session);
    },

    // Registrar estudo de um card
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

    // Obter tempo atual da sessão
    getCurrentSessionTime() {
        if (!this.state.isRunning || !this.state.startTime) {
            return this.state.totalTime;
        }

        const currentTime = Date.now() - this.state.startTime;
        return this.state.totalTime + currentTime;
    },

    // Formatar tempo em formato legível
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    },

    // Atualizar display do cronômetro
    updateDisplay() {
        const timerElement = document.getElementById('studyTimer');
        if (!timerElement) return;

        const currentTime = this.getCurrentSessionTime();
        const formattedTime = this.formatTime(currentTime);

        timerElement.textContent = formattedTime;

        // Adicionar classe de estado
        timerElement.classList.toggle('timer-running', this.state.isRunning);
        timerElement.classList.toggle('timer-paused', !this.state.isRunning && this.state.currentSession);
    },

    // Atualizar botões do cronômetro
    updateTimerButtons() {
        const startBtn = document.getElementById('timerStartBtn');
        const pauseBtn = document.getElementById('timerPauseBtn');
        const stopBtn = document.getElementById('timerStopBtn');

        if (!startBtn || !pauseBtn || !stopBtn) return;

        if (this.state.isRunning) {
            // Cronômetro rodando
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
            stopBtn.classList.remove('hidden');
        } else if (this.state.currentSession) {
            // Cronômetro pausado
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
        } else {
            // Cronômetro parado
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            stopBtn.classList.add('hidden');
        }
    },

    // Iniciar auto-save
    startAutoSave() {
        setInterval(() => {
            if (this.state.isRunning) {
                this.saveState();
            }
        }, this.config.autoSaveInterval);
    },

    // Verificar inatividade periodicamente
    checkInactivity() {
        setInterval(() => {
            if (this.state.isRunning && this.isUserInactive()) {
                this.pauseTimer();
            }
        }, 60000); // Verificar a cada minuto
    },

    // Notificações
    notifyTimerStart() {
        this.showNotification('Cronômetro iniciado', 'success');
    },

    notifyTimerPause() {
        this.showNotification('Cronômetro pausado', 'info');
    },

    notifyTimerResume() {
        this.showNotification('Cronômetro retomado', 'success');
    },

    notifyTimerStop() {
        const sessionTime = this.state.totalTime;
        const formattedTime = this.formatTime(sessionTime);
        this.showNotification(`Sessão finalizada: ${formattedTime}`, 'info');
    },

    // Mostrar notificação
    showNotification(message, type = 'info') {
        if (typeof Notifications !== 'undefined' && Notifications.show) {
            Notifications.show(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    // Obter estatísticas de tempo
    getTimeStats(userId, deckId = null, period = 30) {
        const sessions = JSON.parse(localStorage.getItem(`medFocusSessions_${userId}`) || '[]');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const filteredSessions = sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            const matchesDeck = !deckId || session.deckId === deckId;
            const matchesPeriod = sessionDate >= startDate && sessionDate <= endDate;
            return matchesDeck && matchesPeriod;
        });

        const totalTime = filteredSessions.reduce((sum, session) => sum + session.totalTime, 0);
        const totalSessions = filteredSessions.length;
        const averageTime = totalSessions > 0 ? totalTime / totalSessions : 0;

        return {
            totalTime: totalTime,
            totalSessions: totalSessions,
            averageTime: averageTime,
            formattedTotalTime: this.formatTime(totalTime),
            formattedAverageTime: this.formatTime(averageTime),
            sessions: filteredSessions
        };
    },

    // Obter tempo total de estudo hoje
    getTodayStudyTime(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessions = JSON.parse(localStorage.getItem(`medFocusSessions_${userId}`) || '[]');
        const todaySessions = sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate >= today && sessionDate < tomorrow;
        });

        const totalTime = todaySessions.reduce((sum, session) => sum + session.totalTime, 0);
        return {
            totalTime: totalTime,
            formattedTime: this.formatTime(totalTime),
            sessions: todaySessions
        };
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    StudyTimer.init();
});

// Exportar para uso global
window.StudyTimer = StudyTimer;
