// MedFocus Cards - Sistema Avançado de Repetição Espaçada
// Implementação completa do algoritmo SM-2 do Anki



class MedFocusApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'homePage';
        this.currentDashboardView = 'overview';
        this.currentDeck = null;
        this.studySession = null;
        this.quizSession = null;
        this.quizTimer = null;
        this.sidebarExpanded = false;
        this.charts = {};
        this.currentFlashcardsCategory = null;
        this.currentQuizzesCategory = null;

        // Bind this context to global functions
        window.app = this;

        this.init();
    }

    init() {
        console.log('Inicializando MedFocus Cards...');

        // Load theme first
        this.loadTheme();

        // Initialize data
        this.initializeData();

        // Setup event listeners
        this.setupEventListeners();

        // Check authentication after short delay
        setTimeout(() => {
            console.log('Iniciando checkAuth...');
            this.checkAuth();
            // Restaurar estado após autenticação
            setTimeout(() => {
                console.log('Iniciando restoreState...');
                this.restoreState();
            }, 200);
        }, 100);
    }

    // === DATA INITIALIZATION ===
    initializeData() {
        console.log('Inicializando dados...');

        if (!localStorage.getItem('medFocusUsers')) {
            console.log('Criando usuários iniciais...');
            const initialUsers = [
                {
                    id: "admin_001",
                    name: "Administrador Sistema",
                    email: "admin@medfocus.com",
                    password: "admin123",
                    role: "admin",
                    plan: "premium",
                    phone: "",
                    isActive: true, // <-- CORREÇÃO APLICADA: De "true" (string) para true (booleano)
                    created: "2025-01-01T00:00:00Z",
                    lastLogin: "2025-09-08T10:00:00Z"
                },
                {
                    id: "user_001",
                    name: "João Silva",
                    email: "joao@email.com",
                    password: "123456",
                    role: "student",
                    plan: "premium",
                    phone: "(11) 99999-9999",
                    isActive: true,
                    created: "2025-08-15T00:00:00Z",
                    lastLogin: "2025-09-07T18:30:00Z"
                }
            ];
            localStorage.setItem('medFocusUsers', JSON.stringify(initialUsers));
            console.log('Usuários iniciais criados:', initialUsers);
        } else {
            console.log('Usuários já existem no localStorage');
        }

        if (!localStorage.getItem('medFocusDecks')) {
            const initialDecks = [
                {
                    id: "deck_001",
                    name: "Anatomia Cardiovascular",
                    description: "Sistema cardiovascular e circulatório sanguínea",
                    category: "anatomia",
                    userId: "user_001",
                    created: "2025-03-01T00:00:00Z",
                    cards: [
                        {
                            id: "card_001",
                            question: "Qual é o maior osso do corpo humano?",
                            answer: "Fêmur",
                            explanation: "O fêmur é o osso da coxa, sendo o mais longo e resistente do esqueleto humano.",
                            interval: 1,
                            repetitions: 0,
                            easeFactor: 2.5,
                            nextReview: "2025-09-08",
                            reviews: []
                        },
                        {
                            id: "card_002",
                            question: "Quantas câmaras possui o coração humano?",
                            answer: "4 câmaras",
                            explanation: "O coração humano possui 4 câmaras: 2 átrios (direito e esquerdo) e 2 ventrículos (direito e esquerdo).",
                            interval: 6,
                            repetitions: 2,
                            easeFactor: 2.6,
                            nextReview: "2025-09-09",
                            reviews: [
                                {
                                    date: "2025-09-01T14:30:00Z",
                                    quality: 3,
                                    timeSpent: 12,
                                    previousInterval: 1,
                                    newInterval: 6,
                                    previousEase: 2.5,
                                    newEase: 2.6
                                }
                            ]
                        },
                        {
                            id: "card_003",
                            question: "Qual é a função das válvulas cardíacas?",
                            answer: "Impedir o refluxo de sangue",
                            explanation: "As válvulas cardíacas impedem que o sangue retorne na direção oposta durante o ciclo cardíaco.",
                            interval: 15,
                            repetitions: 3,
                            easeFactor: 2.8,
                            nextReview: "2025-09-15",
                            reviews: [
                                {
                                    date: "2025-08-20T09:15:00Z",
                                    quality: 4,
                                    timeSpent: 8,
                                    previousInterval: 6,
                                    newInterval: 15,
                                    previousEase: 2.6,
                                    newEase: 2.8
                                }
                            ]
                        },
                        {
                            id: "card_004",
                            question: "Onde se localiza a válvula mitral?",
                            answer: "Entre átrio e ventrículo esquerdos",
                            explanation: "A válvula mitral (bicúspide) está localizada entre o átrio esquerdo e o ventrículo esquerdo.",
                            interval: 1,
                            repetitions: 0,
                            easeFactor: 2.5,
                            nextReview: "2025-09-08",
                            reviews: []
                        }
                    ]
                },
                {
                    id: "deck_002",
                    name: "Farmacologia Básica",
                    description: "Princípios fundamentais da farmacologia",
                    category: "farmacologia",
                    userId: "admin_001",
                    created: "2025-04-01T00:00:00Z",
                    cards: [
                        {
                            id: "card_005",
                            question: "O que é biodisponibilidade?",
                            answer: "Fração do medicamento que atinge a circulação sistêmica",
                            explanation: "É a proporção e velocidade com que o princípio ativo é absorvido e fica disponível no local de ação",
                            interval: 1,
                            repetitions: 0,
                            easeFactor: 2.5,
                            nextReview: "2025-09-08",
                            reviews: []
                        }
                    ]
                }
            ];
            localStorage.setItem('medFocusDecks', JSON.stringify(initialDecks));
        }

        if (!localStorage.getItem('medFocusQuizzes')) {
            const initialQuizzes = [
                {
                    id: "quiz_001",
                    title: "Anatomia Básica",
                    subject: "anatomia",
                    description: "Questões fundamentais sobre anatomia humana",
                    timeLimit: 15,
                    userId: "user_001",
                    created: "2025-09-01T00:00:00Z",
                    questions: [
                        {
                            id: "q_001",
                            question: "Qual é a menor unidade funcional do rim?",
                            options: ["A) Glomérulo", "B) Néfron", "C) Ureter", "D) Bexiga"],
                            correct: "B",
                            explanation: "O néfron é a unidade funcional básica do rim, composto pelo glomérulo e túbulos."
                        },
                        {
                            id: "q_002",
                            question: "Quantas câmaras tem o coração humano?",
                            options: ["A) 2", "B) 3", "C) 4", "D) 5"],
                            correct: "C",
                            explanation: "O coração tem 4 câmaras: 2 átrios e 2 ventrículos."
                        },
                        {
                            id: "q_003",
                            question: "Qual é a função principal do coração?",
                            options: ["A) Filtrar sangue", "B) Bombear sangue", "C) Produzir hemácias", "D) Armazenar oxigênio"],
                            correct: "B",
                            explanation: "O coração bombeia sangue para todo o corpo através do sistema circulatório."
                        }
                    ]
                }
            ];
            localStorage.setItem('medFocusQuizzes', JSON.stringify(initialQuizzes));
        }

        // Initialize user statistics
        if (!localStorage.getItem('medFocusUserStats')) {
            const stats = {
                "user_001": {
                    "2025-09-01": { reviews: 12, correct: 10, timeSpent: 180 },
                    "2025-09-02": { reviews: 8, correct: 6, timeSpent: 240 },
                    "2025-09-03": { reviews: 15, correct: 13, timeSpent: 320 },
                    "2025-09-04": { reviews: 6, correct: 5, timeSpent: 150 },
                    "2025-09-05": { reviews: 10, correct: 8, timeSpent: 200 },
                    "2025-09-06": { reviews: 14, correct: 12, timeSpent: 280 },
                    "2025-09-07": { reviews: 5, correct: 5, timeSpent: 120 }
                },
                "admin_001": {
                    "2025-09-05": { reviews: 20, correct: 18, timeSpent: 360 },
                    "2025-09-06": { reviews: 16, correct: 14, timeSpent: 300 },
                    "2025-09-07": { reviews: 8, correct: 7, timeSpent: 180 }
                }
            };
            localStorage.setItem('medFocusUserStats', JSON.stringify(stats));
        }

        console.log('Dados inicializados');
    }

    // === EVENT LISTENERS ===
    setupEventListeners() {
        // Auth forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const importForm = document.getElementById('importForm');
        const createUserForm = document.getElementById('createUserForm');
        const editFlashcardForm = document.getElementById('editFlashcardForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        if (importForm) {
            importForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createDeck();
            });
        }

        if (createUserForm) {
            createUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createUserFromAdmin();
            });
        }

        if (editFlashcardForm) {
            editFlashcardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                window.saveEditedFlashcard();
            });
        }

        // Study settings listeners
        const dailyLimitInput = document.getElementById('dailyCardLimit');
        const allowOverstudyInput = document.getElementById('allowOverstudy');
        if (dailyLimitInput) {
            dailyLimitInput.addEventListener('change', () => this.saveStudySettingsFromUI());
        }
        if (allowOverstudyInput) {
            allowOverstudyInput.addEventListener('change', () => this.saveStudySettingsFromUI());
        }

        // Keyboard shortcuts for study mode
        document.addEventListener('keydown', (e) => {
            if (this.currentPage === 'studyModePage' && this.studySession) {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.flipCard();
                } else if (['1', '2', '3', '4'].includes(e.key)) {
                    e.preventDefault();
                    this.answerCard(parseInt(e.key));
                }
            }
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        const orbitIcons = document.querySelectorAll('.orbit-icon[data-flip]');
        if (orbitIcons.length) {
            const canHover = typeof window.matchMedia === 'function' ? window.matchMedia('(hover: hover)').matches : false;
            orbitIcons.forEach(icon => {
                if (!icon.hasAttribute('tabindex')) {
                    icon.tabIndex = 0;
                }
                if (!icon.hasAttribute('role')) {
                    icon.setAttribute('role', 'button');
                }
                icon.setAttribute('aria-pressed', 'false');

                const setFlipped = (state) => {
                    icon.classList.toggle('is-flipped', state);
                    icon.setAttribute('aria-pressed', String(state));
                };

                if (!canHover) {
                    icon.addEventListener('click', (event) => {
                        event.preventDefault();
                        setFlipped(!icon.classList.contains('is-flipped'));
                    });
                }

                icon.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setFlipped(!icon.classList.contains('is-flipped'));
                    }
                });

                icon.addEventListener('blur', () => setFlipped(false));
            });
        }
        console.log('Event listeners configurados');
    }

    // === AUTHENTICATION ===
    checkAuth() {
        const currentUser = localStorage.getItem('medFocusCurrentUser');
        if (currentUser) {
            this.currentUser = JSON.parse(currentUser);
            // Não chamar showPage aqui - será feito pelo restoreState
            this.updateUIForLoggedUser();
        } else {
            this.showPage('homePage');
            this.updateUIForGuest();
        }
    }

    handleLogin() {
        const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
        const passwordInput = document.getElementById('loginPassword').value.trim();
        const errorDiv = document.getElementById('loginError');

        if (!emailInput || !passwordInput) {
            this.showError(errorDiv, 'Por favor, preencha todos os campos!');
            return;
        }

        const usersData = localStorage.getItem('medFocusUsers');
        if (!usersData) {
            this.showError(errorDiv, 'Nenhum usuário cadastrado!');
            return;
        }

        let users;
        try {
            users = JSON.parse(usersData);
        } catch (e) {
            this.showError(errorDiv, 'Erro ao carregar usuários!');
            return;
        }

        // Busca usuário tratando email e senha com case insensitive e trim
        const user = users.find(u => u.email.toLowerCase().trim() === emailInput && u.password === passwordInput);

        if (!user) {
            this.showError(errorDiv, 'Email ou senha incorretos!');
            return;
        }

        // Checagem de ativação robusta
        if (user.isActive === false || user.isActive === 'false') {
            this.showError(errorDiv, 'Usuário inativo!');
            return;
        }


        // Login bem-sucedido
        user.lastLogin = new Date().toISOString();

        // Atualiza localStorage com data de último login
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            localStorage.setItem('medFocusUsers', JSON.stringify(users));
            
            // Notify userAdmin to reload the user list if it exists
            if (window.userAdmin && typeof window.userAdmin.loadUsers === 'function') {
                window.userAdmin.loadUsers();
            }
        }

        this.currentUser = user;
        localStorage.setItem('medFocusCurrentUser', JSON.stringify(user));
        this.showPage('dashboardPage');
        this.updateUIForLoggedUser();
        this.showNotification('Login realizado com sucesso!', 'success');
    }

    handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerPasswordConfirm').value.trim();
        const plan = document.getElementById('registerPlan').value;
        const errorDiv = document.getElementById('registerError');

        if (!name || !email || !password || !confirmPassword) {
            this.showError(errorDiv, 'Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        if (password !== confirmPassword) {
            this.showError(errorDiv, 'As senhas não coincidem!');
            return;
        }

        if (password.length < 6) {
            this.showError(errorDiv, 'A senha deve ter pelo menos 6 caracteres!');
            return;
        }

        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');

        if (users.find(u => u.email === email)) {
            this.showError(errorDiv, 'Este email já está em uso!');
            return;
        }

        const newUser = {
            id: 'user_' + Date.now(),
            name,
            email,
            phone,
            password,
            role: 'student',
            plan,
            isActive: true,
            created: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('medFocusUsers', JSON.stringify(users));

        this.currentUser = newUser;
        localStorage.setItem('medFocusCurrentUser', JSON.stringify(newUser));

        // Notify userAdmin to reload the user list if it exists
        if (window.userAdmin && typeof window.userAdmin.loadUsers === 'function') {
            window.userAdmin.loadUsers();
        }

        this.showPage('dashboardPage');
        this.updateUIForLoggedUser();
        this.showNotification('Cadastro realizado com sucesso!', 'success');
    }

    logout() {
        localStorage.removeItem('medFocusCurrentUser');
        localStorage.removeItem('medFocusAppState'); // Limpar estado salvo
        this.currentUser = null;
        this.showPage('homePage');
        this.updateUIForGuest();
        this.showNotification('Logout realizado com sucesso!', 'info');
    }

    // === UI MANAGEMENT ===
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const navbar = document.getElementById('navbar');
        if (loadingScreen) loadingScreen.classList.remove('hidden');
        if (navbar) navbar.classList.add('hidden');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const navbar = document.getElementById('navbar');
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (navbar) navbar.classList.remove('hidden');
    }

    updateUIForLoggedUser() {
        const navMenu = document.getElementById('navMenu');
        const userMenu = document.getElementById('userMenu');

        if (navMenu) navMenu.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');

        // Show samples content
        const samplesAuthMessage = document.getElementById('samplesAuthMessage');
        const samplesContent = document.getElementById('samplesContent');

        if (samplesAuthMessage) samplesAuthMessage.classList.add('hidden');
        if (samplesContent) samplesContent.classList.remove('hidden');

        // Show admin menu if admin (CÓDIGO CORRIGIDO PARA MAIOR ROBUSTEZ)
        const adminMenuItem = document.querySelector('.admin-only');
        
        const isAdmin = this.currentUser && this.currentUser.role === 'admin'; 
        
        if (adminMenuItem) {
            if (isAdmin) {
                adminMenuItem.classList.remove('hidden');
                adminMenuItem.style.display = 'list-item'; // Garante que o CSS não o esconde por padrão
                console.log('Admin menu: MOSTRADO para:', this.currentUser.email);
            } else {
                adminMenuItem.classList.add('hidden');
                adminMenuItem.style.display = 'none'; // Garante que está oculto
                console.log('Admin menu: OCULTO. Role:', this.currentUser ? this.currentUser.role : 'no user');
            }
        }
    }

    updateUIForGuest() {
        const navMenu = document.getElementById('navMenu');
        const userMenu = document.getElementById('userMenu');

        if (navMenu) navMenu.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');

        // Hide samples content
        const samplesAuthMessage = document.getElementById('samplesAuthMessage');
        const samplesContent = document.getElementById('samplesContent');

        if (samplesAuthMessage) samplesAuthMessage.classList.remove('hidden');
        if (samplesContent) samplesContent.classList.add('hidden');

        // Hide admin menu
        const adminMenuItem = document.querySelector('.admin-only');
        if (adminMenuItem) {
            adminMenuItem.classList.add('hidden');
            adminMenuItem.style.display = 'none';
        }
    }

    showPage(pageId) {
        console.log('Showing page:', pageId);

        // Hide all pages
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target page
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            this.currentPage = pageId;

            // Salvar estado atual no localStorage
            this.saveCurrentState();

            // Load page-specific data
            if (pageId === 'dashboardPage') {
                this.loadDashboard();
            }

            console.log('Page shown:', pageId);
        } else {
            console.error('Page not found:', pageId);
        }
    }

    showDashboardView(viewId) {
        console.log('Showing dashboard view:', viewId);

        // Update sidebar
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-view="${viewId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all views
        document.querySelectorAll('.dashboard-view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view (handle id mismatch for 'statistics' -> 'statsContent')
        let contentId = viewId + 'Content';
        if (viewId === 'statistics') contentId = 'statsContent';
        const view = document.getElementById(contentId);
        if (view) {
            view.classList.add('active');
            this.currentDashboardView = viewId;
            // Auto-close sidebar after navigation
            this.closeSidebar();

            // Update title
            const titles = {
                overview: 'Overview',
                flashcards: 'Flashcards',
                quizzes: 'Simulados',
                statistics: 'Estatísticas',
                profile: 'Perfil',
                admin: 'Administração'
            };

            const titleElement = document.getElementById('dashboardTitle');
            if (titleElement) {
                titleElement.textContent = titles[viewId] || 'Dashboard';
            }

            // Salvar estado atual no localStorage
            this.saveCurrentState();

            // Load view-specific data
            switch (viewId) {
                case 'overview':
                    this.loadOverview();
                    break;
                case 'flashcards':
                    this.loadFlashcards();
                    break;
                case 'quizzes':
                    this.loadQuizzes();
                    break;
                case 'statistics':
                    this.loadStatistics();
                    break;
                case 'profile':
                    this.loadProfile();
                    break;
                case 'admin':
                    this.loadAdmin();
                    break;
            }

            console.log('Dashboard view shown:', viewId);
        } else {
            console.error('Dashboard view not found:', viewId);
        }
    }

    // === DASHBOARD LOADING ===
    loadDashboard() {
        if (!this.currentUser) return;

        // Default to overview
        this.showDashboardView('overview');
    }

    loadOverview() {
        this.loadDashboardStats();
        this.loadRecentDecks();

        // Load progress chart after a short delay
        setTimeout(() => {
            this.loadProgressChart();
        }, 100);
    }

    loadDashboardStats() {
        if (!this.currentUser) return;

        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        const userDecks = this.currentUser.role === 'admin'
            ? decks
            : decks.filter(d => d.userId === this.currentUser.id);

        let totalCards = 0;
        let studiedToday = 0;

        const today = new Date().toISOString().split('T')[0];
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const todayStats = stats[this.currentUser.id]?.[today];

        studiedToday = todayStats?.reviews || 0;

        userDecks.forEach(deck => {
            if (deck.cards) {
                totalCards += deck.cards.length;
            }
        });

        const streakDays = this.calculateStreak();
        const accuracyRate = this.calculateAccuracy();

        // Update UI
        const elements = {
            totalCards: document.getElementById('totalCards'),
            studiedToday: document.getElementById('studiedToday'),
            streakDays: document.getElementById('streakDays'),
            accuracyRate: document.getElementById('accuracyRate')
        };

        if (elements.totalCards) elements.totalCards.textContent = totalCards;
        if (elements.studiedToday) elements.studiedToday.textContent = studiedToday;
        if (elements.streakDays) elements.streakDays.textContent = streakDays;
        if (elements.accuracyRate) elements.accuracyRate.textContent = accuracyRate + '%';
    }

    loadRecentDecks() {
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        const userDecks = this.currentUser.role === 'admin'
            ? decks
            : decks.filter(d => d.userId === this.currentUser.id);

        const recentDecks = userDecks
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5);

        const container = document.getElementById('recentDecks');
        if (!container) return;

        if (recentDecks.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum baralho criado ainda.</p>';
            return;
        }

        let html = '';
        recentDecks.forEach(deck => {
            const dueCards = this.getDueCardsCount(deck);
            html += `
                <div class="recent-deck-item" onclick="app.startStudy('${deck.id}')">
                    <h4>${deck.name}</h4>
                    <span>${deck.cards?.length || 0} cards &bull; ${dueCards} devidos</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    loadProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = stats[this.currentUser.id] || {};

        const labels = [];
        const reviewsData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
            reviewsData.push(userStats[dateStr]?.reviews || 0);
        }

        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Reviews',
                    data: reviewsData,
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                }
            }
        });
    }

    // === FLASHCARDS MANAGEMENT ===
    loadFlashcards() {
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        const userDecks = this.currentUser.role === 'admin'
            ? decks
            : decks.filter(d => d.userId === this.currentUser.id);

        const container = document.getElementById('decksGrid');
        if (!container) return;

        if (userDecks.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum baralho encontrado. Crie seu primeiro baralho!</div>';
            return;
        }

        // Usar sistema de hierarquia se disponível
        if (window.DeckHierarchy) {
            this.loadFlashcardsWithHierarchy(userDecks, container);
            return;
        }

        let html = '';

        if (!this.currentFlashcardsCategory) {
            // Show subjects (categories)
            const categories = Array.from(new Set(userDecks.map(d => d.category)));
            categories.forEach(cat => {
                const decksInCat = userDecks.filter(d => d.category === cat);
                const totalCards = decksInCat.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
                html += `
                    <div class="deck-card" onclick="app.selectFlashcardsCategory('${cat}')">
                        <div class="deck-header">
                            <span class="deck-category">${this.getCategoryName(cat)}</span>
                        </div>
                        <h3>${this.getCategoryName(cat)}</h3>
                        <p>${decksInCat.length} baralhos &bull; ${totalCards} cards</p>
                    </div>
                `;
            });
        } else {
            // Back button
            html += `
                <div class="deck-card" onclick="app.selectFlashcardsCategory(null)">
                    <div class="deck-header"><span class="deck-category">Voltar</span></div>
                    <h3>&larr; Todas as matérias</h3>
                    <p>Voltar para a lista de matérias</p>
                </div>
            `;

            // Show decks inside selected category
            const filtered = userDecks
                .filter(d => d.category === this.currentFlashcardsCategory)
                .sort((a, b) => (a.theme || 'Geral').localeCompare(b.theme || 'Geral') || a.name.localeCompare(b.name));
            let lastTheme = null;
            filtered.forEach(deck => {
                const theme = deck.theme || 'Geral';
                if (theme !== lastTheme) {
                    html += `
                        <div class="deck-card" style="cursor:default;">
                            <div class="deck-header"><span class="deck-category">Tema</span></div>
                            <h3>${theme}</h3>
                            <p>Baralhos deste tema</p>
                        </div>
                    `;
                    lastTheme = theme;
                }
                const cardCount = deck.cards?.length || 0;
                const dueCards = this.getDueCardsCount(deck);
                const accuracy = this.getDeckAccuracy(deck);
                html += `
                    <div class="deck-card" onclick="app.startStudy('${deck.id}')">
                        <div class="deck-header">
                            <span class="deck-category">${this.getCategoryName(deck.category)}</span>
                        </div>
                        <h3>${deck.name}</h3>
                        <p>${deck.description}</p>
                        <div class="deck-stats">
                            <div class="deck-stat">
                                <span class="deck-stat-value">${cardCount}</span>
                                <span class="deck-stat-label">Cards</span>
                            </div>
                            <div class="deck-stat">
                                <span class="deck-stat-value">${dueCards}</span>
                                <span class="deck-stat-label">Devidos</span>
                            </div>
                            <div class="deck-stat">
                                <span class="deck-stat-value">${accuracy}%</span>
                                <span class="deck-stat-label">Precisão</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    selectFlashcardsCategory(cat) {
        this.currentFlashcardsCategory = cat;
        this.loadFlashcards();
    }

    // === HIERARCHY SYSTEM ===
    loadFlashcardsWithHierarchy(decks, container) {
        console.log('Carregando hierarquia com', decks.length, 'decks');
        
        const hierarchy = new DeckHierarchy();
        const hierarchyData = hierarchy.buildHierarchy(decks);
        
        console.log('Dados da hierarquia:', hierarchyData);
        
        container.innerHTML = `
            <div class="hierarchy-container">
                <div class="hierarchy-actions">
                    <button class="btn-hierarchy-primary" onclick="app.startCombinedStudy()" id="studySelectedBtn">
                        <i class="fas fa-play"></i>
                        <span>Estudar Selecionados</span>
                        <span class="selected-count" id="selectedCount">(0)</span>
                    </button>
                    <button class="btn-hierarchy-secondary" onclick="app.selectAllDecks()">
                        <i class="fas fa-check-square"></i>
                        Selecionar Todos
                    </button>
                    <button class="btn-hierarchy-secondary" onclick="app.clearSelection()">
                        <i class="fas fa-square"></i>
                        Limpar Seleção
                    </button>
                    <button class="btn-hierarchy-secondary" onclick="createExampleHierarchy()">
                        <i class="fas fa-plus"></i>
                        Criar Exemplo
                    </button>
                    <button class="btn-hierarchy-secondary" onclick="app.showCreateDeckModal()">
                        <i class="fas fa-plus-circle"></i>
                        Novo Deck
                    </button>
                    <button class="btn-hierarchy-secondary" onclick="app.exportFlashcards()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
                <div class="hierarchy-content">
                    ${hierarchy.generateHierarchyHTML(hierarchyData.root)}
                </div>
            </div>
        `;
        
        // Adicionar event listeners para atualizar contador
        this.setupSelectionListeners();
    }

    startCombinedStudy() {
        const selectedDecks = this.getSelectedDecks();
        if (selectedDecks.length === 0) {
            this.showNotification('Selecione pelo menos um deck para estudar!', 'error', 'study');
            return;
        }

        // Verificar se há cards nos decks selecionados
        const totalCards = selectedDecks.reduce((sum, deck) => sum + (deck.cards?.length || 0), 0);
        if (totalCards === 0) {
            this.showNotification('Nenhum card encontrado nos decks selecionados!', 'error', 'study');
            return;
        }

        if (selectedDecks.length === 1) {
            // Estudar deck único
            this.startStudy(selectedDecks[0].id);
            this.showNotification(`Iniciando estudo do deck: ${selectedDecks[0].name}`, 'success', 'study');
        } else {
            // Estudar múltiplos decks
            this.startCombinedStudySession(selectedDecks);
        }
    }

    getSelectedDecks() {
        const selectedElements = document.querySelectorAll('.deck-item.selected');
        const selectedDecks = [];
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        
        selectedElements.forEach(element => {
            const hierarchyDeck = element.closest('.hierarchy-deck');
            if (hierarchyDeck) {
                const deckId = hierarchyDeck.dataset.deckId;
                const deck = decks.find(d => d.id === deckId);
                if (deck) {
                    selectedDecks.push(deck);
                }
            }
        });

        return selectedDecks;
    }

    startCombinedStudySession(decks) {
        // Combinar todos os cards dos decks selecionados
        const allCards = [];
        decks.forEach(deck => {
            if (deck.cards) {
                deck.cards.forEach(card => {
                    allCards.push({
                        ...card,
                        sourceDeck: deck.name,
                        sourceDeckId: deck.id
                    });
                });
            }
        });

        if (allCards.length === 0) {
            this.showNotification('Nenhum card encontrado nos decks selecionados!', 'error');
            return;
        }

        // Embaralhar cards
        const shuffledCards = this.shuffleArray([...allCards]);

        // Criar sessão de estudo combinada
        this.currentDeck = {
            id: 'combined_' + Date.now(),
            name: `Estudo Combinado (${decks.length} decks)`,
            cards: shuffledCards
        };

        this.studySession = {
            cards: shuffledCards,
            currentIndex: 0,
            isCombined: true,
            sourceDecks: decks,
            startTime: new Date(),
            reviewed: 0,
            cardsStudied: 0
        };

        this.showPage('studyModePage');
        this.loadCurrentCard();
        this.showNotification(`Iniciando estudo com ${allCards.length} cards de ${decks.length} decks!`, 'success', 'study');
    }

    selectAllDecks() {
        const deckItems = document.querySelectorAll('.deck-item');
        deckItems.forEach(item => {
            item.classList.add('selected');
        });
        
        this.updateSelectionCounter();
        const selectedCount = deckItems.length;
        this.showNotification(`${selectedCount} decks selecionados!`, 'success', 'study');
    }

    clearSelection() {
        const selectedItems = document.querySelectorAll('.deck-item.selected');
        selectedItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        this.updateSelectionCounter();
        this.showNotification('Seleção limpa!', 'info', 'study');
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createDeck() {
        const name = document.getElementById('deckName').value.trim();
        const category = document.getElementById('deckCategory').value;
        const theme = (document.getElementById('deckTheme')?.value || '').trim();
        const flashcardsText = document.getElementById('flashcardsText').value.trim();

        if (!name || !category) {
            this.showNotification('Nome e categoria são obrigatórios!', 'error');
            return;
        }

        // Validar nome do deck para hierarquia
        if (window.DeckHierarchy) {
            const hierarchy = new DeckHierarchy();
            const validation = hierarchy.validateDeckName(name);
            if (!validation.valid) {
                this.showNotification(validation.error, 'error');
                return;
            }
        }

        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');

        const newDeck = {
            id: 'deck_' + Date.now(),
            name,
            category,
            theme: theme || undefined,
            description: `Baralho de ${this.getCategoryName(category)}`,
            userId: this.currentUser.id,
            created: new Date().toISOString(),
            cards: []
        };

        // Parse flashcards text
        if (flashcardsText) {
            const lines = flashcardsText.split('\n').filter(line => line.trim());

            lines.forEach((line, index) => {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    newDeck.cards.push({
                        id: `card_${Date.now()}_${index}`,
                        question: parts[0].trim(),
                        answer: parts[1].trim(),
                        explanation: parts[2] ? parts[2].trim() : '',
                        interval: 1,
                        repetitions: 0,
                        easeFactor: 2.5,
                        nextReview: new Date().toISOString().split('T')[0],
                        reviews: []
                    });
                }
            });
        }

        decks.push(newDeck);
        localStorage.setItem('medFocusDecks', JSON.stringify(decks));

        this.closeModal('importModal');
        this.loadFlashcards();
        this.showNotification(`Baralho "${name}" criado com ${newDeck.cards.length} cards!`, 'success');

        // Clear form
        const form = document.getElementById('importForm');
        if (form) form.reset();
    }

    // === SPACED REPETITION SYSTEM (SM-2 Algorithm) ===
    startStudy(deckId) {
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        const deck = decks.find(d => d.id === deckId);

        if (!deck || !deck.cards || deck.cards.length === 0) {
            this.showNotification('Baralho não encontrado ou vazio!', 'error', 'study');
            return;
        }

        // Load study settings
        const settings = this.getUserSettings();

        // Get due cards
        const today = new Date().toISOString().split('T')[0];
        let dueCards = deck.cards.filter(card => card.nextReview <= today);

        // Apply daily limit and allow pulling upcoming cards if enabled
        let selectedCards = dueCards;
        const limit = Math.max(1, settings.dailyLimit || 20);
        if (selectedCards.length > limit) {
            selectedCards = selectedCards.slice(0, limit);
        } else if (settings.allowOverstudy && selectedCards.length < limit) {
            // Pull upcoming cards (closest nextReview dates) to fill up to limit
            const upcoming = deck.cards
                .filter(card => card.nextReview > today)
                .sort((a, b) => (a.nextReview > b.nextReview ? 1 : -1));
            const needed = limit - selectedCards.length;
            selectedCards = selectedCards.concat(upcoming.slice(0, needed));
        }

        if (selectedCards.length === 0) {
            // fallback: se houver cartas, permitir estudar próximas 10
            const upcoming = deck.cards
                .filter(card => card.nextReview > today)
                .sort((a, b) => (a.nextReview > b.nextReview ? 1 : -1));
            selectedCards = upcoming.slice(0, Math.max(1, Math.min(10, limit)));
            if (selectedCards.length === 0) {
                this.showNotification('Nenhum card disponível neste baralho.', 'info', 'study');
                return;
            }
        }

        this.currentDeck = deck;
        this.studySession = {
            cards: selectedCards,
            currentIndex: 0,
            startTime: new Date(),
            reviewed: 0
        };

        this.showPage('studyModePage');
        this.loadCurrentCard();
    }

    loadCurrentCard() {
        if (!this.studySession || this.studySession.currentIndex >= this.studySession.cards.length) {
            this.finishStudySession();
            return;
        }

        const card = this.studySession.cards[this.studySession.currentIndex];

        // Update UI
        const deckTitle = document.getElementById('studyDeckTitle');
        const progress = document.getElementById('studyProgress');
        const question = document.getElementById('cardQuestion');
        const answer = document.getElementById('answerText');
        const explanation = document.getElementById('answerExplanation');

        if (deckTitle) deckTitle.textContent = this.currentDeck.name;
        if (progress) progress.textContent = `${this.studySession.currentIndex + 1} / ${this.studySession.cards.length}`;
        if (question) question.textContent = card.question;
        if (answer) answer.textContent = card.answer;
        if (explanation) explanation.textContent = card.explanation || '';

        // Load study settings UI values
        this.loadStudySettingsUI();

        // Reset card state
        const flashcard = document.getElementById('flashcard');
        if (flashcard) flashcard.classList.remove('flipped');

        // Update difficulty button timings based on current card state
        this.updateDifficultyButtons(card);
    }

    updateDifficultyButtons(card) {
        // Calculate next intervals for each difficulty
        const intervals = this.calculateAllIntervals(card);
        
        // Determinar se deve usar minutos ou dias baseado no estado do card
        const isLearning = !card.repetitions || card.repetitions === 0 || card.learningState === 'learning';

        const buttons = [
            { element: document.querySelector('.again-btn small'), interval: intervals.again },
            { element: document.querySelector('.hard-btn small'), interval: intervals.hard },
            { element: document.querySelector('.good-btn small'), interval: intervals.good },
            { element: document.querySelector('.easy-btn small'), interval: intervals.easy }
        ];

        buttons.forEach(button => {
            if (button.element) {
                button.element.textContent = this.formatInterval(button.interval, isLearning);
            }
        });
    }

    // === STUDY SETTINGS ===
    getUserSettings() {
        const key = 'medFocusSettings_' + (this.currentUser?.id || 'anon');
        const defaults = { dailyLimit: 20, allowOverstudy: true };
        try {
            const saved = JSON.parse(localStorage.getItem(key) || '{}');
            return { ...defaults, ...saved };
        } catch (e) {
            return defaults;
        }
    }

    saveUserSettings(settings) {
        const key = 'medFocusSettings_' + (this.currentUser?.id || 'anon');
        localStorage.setItem(key, JSON.stringify(settings));
    }

    loadStudySettingsUI() {
        const settings = this.getUserSettings();
        const dailyLimitInput = document.getElementById('dailyCardLimit');
        const allowOverstudyInput = document.getElementById('allowOverstudy');
        if (dailyLimitInput && document.activeElement !== dailyLimitInput) {
            dailyLimitInput.value = settings.dailyLimit;
        }
        if (allowOverstudyInput && document.activeElement !== allowOverstudyInput) {
            allowOverstudyInput.checked = !!settings.allowOverstudy;
        }
    }

    saveStudySettingsFromUI() {
        const dailyLimitInput = document.getElementById('dailyCardLimit');
        const allowOverstudyInput = document.getElementById('allowOverstudy');
        const current = this.getUserSettings();
        const next = {
            dailyLimit: Math.max(1, parseInt(dailyLimitInput?.value || current.dailyLimit, 10)),
            allowOverstudy: !!(allowOverstudyInput?.checked)
        };
        this.saveUserSettings(next);
        this.showNotification('Preferências de estudo salvas.', 'success');
    }

    calculateAllIntervals(card) {
        const intervals = {};

        // Para cards novos ou em aprendizado, usar tempos fixos em minutos
        if (!card.repetitions || card.repetitions === 0 || card.learningState === 'learning') {
            intervals.again = 1; // 1 minuto
            intervals.hard = 3; // 3 minutos
            intervals.good = 10; // 10 minutos
            intervals.easy = 30; // 30 minutos
        } else {
            // Para cards em revisão, usar intervalos em dias
            intervals.again = 1; // 1 dia
            intervals.hard = Math.max(1, Math.round(card.interval * 1.2));
            intervals.good = Math.round(card.interval * card.easeFactor);
            intervals.easy = Math.round(intervals.good * card.easeFactor * 1.3);
        }

        return intervals;
    }

    formatInterval(interval, isMinutes = false) {
        if (isMinutes) {
            // Para intervalos em minutos
            if (interval < 1) {
                return '<1 min';
            } else if (interval === 1) {
                return '1 min';
            } else {
                return `${interval} min`;
            }
        } else {
            // Para intervalos em dias
            if (interval < 1) {
                return '<1 dia';
            } else if (interval === 1) {
                return '1 dia';
            } else if (interval < 30) {
                return `${interval} dias`;
            } else if (interval < 365) {
                const months = Math.round(interval / 30);
                return `${months} ${months === 1 ? 'mês' : 'meses'}`;
            } else {
                const years = Math.round(interval / 365);
                return `${years} ${years === 1 ? 'ano' : 'anos'}`;
            }
        }
    }

    flipCard() {
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.toggle('flipped');
        }
    }

    answerCard(quality) {
        if (!this.studySession) return;

        const card = this.studySession.cards[this.studySession.currentIndex];
        const oldCard = { ...card }; // Store previous state

        // Apply SM-2 Algorithm
        const result = this.applySM2Algorithm(card, quality);

        // Update card with new values
        Object.assign(card, result);

        // Add review record
        card.reviews.push({
            date: new Date().toISOString(),
            quality: quality,
            timeSpent: Math.round(Math.random() * 30 + 15), // Simulated time
            previousInterval: oldCard.interval,
            newInterval: result.interval,
            previousEase: oldCard.easeFactor,
            newEase: result.easeFactor
        });

        // Save to localStorage
        this.saveDeck();

        // Update user statistics
        this.updateUserStats(quality >= 3);

        // Move to next card
        this.studySession.currentIndex++;
        this.studySession.reviewed++;

        this.loadCurrentCard();
    }

    // SM-2 Algorithm Implementation (Exact Anki Algorithm)
    applySM2Algorithm(card, quality) {
        let interval = card.interval || 1;
        let repetitions = card.repetitions || 0;
        let easeFactor = card.easeFactor || 2.5;

        // Calculate new ease factor
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        // Ensure ease factor doesn't go below 1.3
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }

        // Calculate new interval based on quality
        if (quality < 3) {
            // Failed card
            repetitions = 0;
            interval = 1;
        } else {
            // Successful review
            if (repetitions === 0) {
                interval = 1;
                repetitions = 1;
            } else if (repetitions === 1) {
                interval = 6;
                repetitions = 2;
            } else {
                interval = Math.round(interval * easeFactor);
                repetitions += 1;
            }
        }

        // Apply quality-specific modifiers
        if (quality === 2) {
            // Hard: reduce interval but don't reset repetitions (if > 0)
            if (repetitions > 0) {
                interval = Math.max(1, Math.round(interval * 1.2));
            }
        } else if (quality === 4) {
            // Easy: increase interval
            interval = Math.round(interval * 1.3);
        }

        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);

        return {
            interval,
            repetitions,
            easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
            nextReview: nextReview.toISOString().split('T')[0]
        };
    }

    saveDeck() {
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        const deckIndex = decks.findIndex(d => d.id === this.currentDeck.id);

        if (deckIndex >= 0) {
            decks[deckIndex] = this.currentDeck;
            localStorage.setItem('medFocusDecks', JSON.stringify(decks));
        }
    }

    updateUserStats(correct) {
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const today = new Date().toISOString().split('T')[0];

        if (!stats[this.currentUser.id]) {
            stats[this.currentUser.id] = {};
        }

        if (!stats[this.currentUser.id][today]) {
            stats[this.currentUser.id][today] = { reviews: 0, correct: 0, timeSpent: 0 };
        }

        stats[this.currentUser.id][today].reviews++;
        if (correct) {
            stats[this.currentUser.id][today].correct++;
        }
        stats[this.currentUser.id][today].timeSpent += 30; // Simulated time

        localStorage.setItem('medFocusUserStats', JSON.stringify(stats));
    }

    finishStudySession() {
        if (!this.studySession) return;

        const endTime = new Date();
        const duration = Math.round((endTime - this.studySession.startTime) / 1000 / 60);
        const reviewed = this.studySession.reviewed || this.studySession.cardsStudied || 0;

        // Salvar estatísticas de tempo
        this.saveStudyTime(duration);

        this.showNotification(
            `Sessão concluída! ${reviewed} cards estudados em ${duration} minutos.`,
            'success',
            'study'
        );

        this.studySession = null;
        this.showPage('dashboardPage');
        this.showDashboardView('flashcards');
    }

    saveStudyTime(durationMinutes) {
        if (!this.currentUser) return;

        const today = new Date().toISOString().split('T')[0];
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        
        if (!stats[today]) {
            stats[today] = {
                date: today,
                reviews: 0,
                correct: 0,
                timeSpent: 0,
                decksStudied: []
            };
        }

        stats[today].timeSpent += durationMinutes;
        localStorage.setItem('medFocusUserStats', JSON.stringify(stats));

        // Atualizar overview se estiver visível
        this.updateOverviewStats();
    }

    updateOverviewStats() {
        if (!this.currentUser) return;

        const today = new Date().toISOString().split('T')[0];
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const quizStats = JSON.parse(localStorage.getItem('medFocusStats') || '{}');
        
        // Calcular tempo total (flashcards + simulados)
        let totalFlashcardsTime = 0;
        let totalQuizzesTime = 0;
        
        Object.values(stats).forEach(dayStats => {
            totalFlashcardsTime += dayStats.timeSpent || 0;
        });
        
        Object.values(quizStats).forEach(dayStats => {
            totalQuizzesTime += dayStats.quizzesTime || 0;
        });
        
        const totalTime = totalFlashcardsTime + totalQuizzesTime;

        // Atualizar elementos do overview
        const todayTimeElement = document.getElementById('todayStudyTime');
        const totalTimeElement = document.getElementById('totalStudyTime');
        const totalSessionsElement = document.getElementById('totalSessions');

        if (todayTimeElement) {
            const todayFlashcardsTime = stats[today]?.timeSpent || 0;
            const todayQuizzesTime = quizStats[today]?.quizzesTime || 0;
            const todayTotalTime = todayFlashcardsTime + todayQuizzesTime;
            todayTimeElement.querySelector('.stat-value').textContent = this.formatTime(todayTotalTime);
        }

        if (totalTimeElement) {
            totalTimeElement.querySelector('.stat-value').textContent = this.formatTime(totalTime);
        }

        if (totalSessionsElement) {
            const totalSessions = Object.keys(stats).length + Object.keys(quizStats).length;
            totalSessionsElement.querySelector('.stat-value').textContent = totalSessions;
        }
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // === STATE PERSISTENCE ===
    saveCurrentState() {
        const state = {
            currentPage: this.currentPage,
            currentDashboardView: this.currentDashboardView,
            timestamp: Date.now()
        };
        
        localStorage.setItem('medFocusAppState', JSON.stringify(state));
        console.log('Estado salvo:', state);
        
        // Debug: verificar se foi salvo corretamente
        const saved = localStorage.getItem('medFocusAppState');
        console.log('Estado verificado no localStorage:', saved);
    }

    restoreState() {
        try {
            const savedState = localStorage.getItem('medFocusAppState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Verificar se o estado não é muito antigo (24 horas)
                const maxAge = 24 * 60 * 60 * 1000; // 24 horas em ms
                if (Date.now() - state.timestamp < maxAge) {
                    console.log('Restaurando estado:', state);
                    
                    // Restaurar página atual
                    if (state.currentPage && state.currentPage !== 'homePage') {
                        this.showPage(state.currentPage);
                        
                        // Se for dashboard, restaurar também a aba
                        if (state.currentPage === 'dashboardPage' && state.currentDashboardView) {
                            setTimeout(() => {
                                this.showDashboardView(state.currentDashboardView);
                            }, 100);
                        }
                    }
                } else {
                    console.log('Estado muito antigo, ignorando');
                    localStorage.removeItem('medFocusAppState');
                    // Se não há estado válido e usuário está logado, ir para dashboard
                    if (this.currentUser) {
                        this.showPage('dashboardPage');
                    }
                }
            } else {
                // Se não há estado salvo e usuário está logado, ir para dashboard
                if (this.currentUser) {
                    console.log('Nenhum estado salvo, indo para dashboard');
                    this.showPage('dashboardPage');
                }
            }
        } catch (error) {
            console.error('Erro ao restaurar estado:', error);
            localStorage.removeItem('medFocusAppState');
            // Em caso de erro, se usuário está logado, ir para dashboard
            if (this.currentUser) {
                this.showPage('dashboardPage');
            }
        }
    }

    // === QUIZ SYSTEM ===
    loadQuizzes() {
        const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
        const userQuizzes = this.currentUser.role === 'admin'
            ? quizzes
            : quizzes.filter(q => q.userId === this.currentUser.id);

        const container = document.getElementById('quizzesGrid');
        if (!container) return;

        if (userQuizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <i class="fas fa-clipboard-list empty-state-icon"></i>
                        <h3>Nenhum simulado encontrado</h3>
                        <p>Crie seu primeiro simulado para começar a estudar!</p>
                        <button class="btn btn--primary" onclick="app.showCreateQuizModal()">
                            <i class="fas fa-plus"></i>
                            Criar Simulado
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="quizzes-actions">
                <button class="btn btn--primary" onclick="app.showCreateQuizModal()">
                    <i class="fas fa-plus"></i>
                    Novo Simulado
                </button>
                <button class="btn btn--outline" onclick="app.importQuiz()">
                    <i class="fas fa-upload"></i>
                    Importar
                </button>
            </div>
        `;

        userQuizzes.forEach(quiz => {
            html += `
                <div class="quiz-card">
                    <div class="quiz-header">
                        <span class="quiz-subject">${this.getCategoryName(quiz.subject)}</span>
                        <div class="quiz-actions">
                            <button class="btn-icon" onclick="app.editQuiz('${quiz.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="app.deleteQuiz('${quiz.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="quiz-content" onclick="app.startQuiz('${quiz.id}')">
                        <h3>${quiz.title}</h3>
                        <p>${quiz.description}</p>
                        <div class="quiz-metadata">
                            <div class="quiz-meta-item">
                                <span class="quiz-meta-value">${quiz.questions?.length || 0}</span>
                                <span class="quiz-meta-label">Questões</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span class="quiz-meta-value">${quiz.timeLimit}</span>
                                <span class="quiz-meta-label">Minutos</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span class="quiz-meta-value">-</span>
                                <span class="quiz-meta-label">Melhor</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    selectQuizzesCategory(cat) {
        this.currentQuizzesCategory = cat;
        this.loadQuizzes();
    }

    startQuiz(quizId) {
        const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
        const quiz = quizzes.find(q => q.id === quizId);

        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
            this.showNotification('Simulado não encontrado ou vazio!', 'error', 'quiz');
            return;
        }

        this.quizSession = {
            quiz: quiz,
            currentQuestion: 0,
            answers: {},
            startTime: new Date(),
            timeRemaining: quiz.timeLimit * 60 // Convert to seconds
        };

        this.showPage('quizModePage');
        this.startQuizTimer();
        this.loadCurrentQuestion();
    }

    startQuizTimer() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
        }

        this.quizTimer = setInterval(() => {
            this.quizSession.timeRemaining--;

            const minutes = Math.floor(this.quizSession.timeRemaining / 60);
            const seconds = this.quizSession.timeRemaining % 60;

            const timerElement = document.getElementById('quizTimer');
            if (timerElement) {
                timerElement.textContent =
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            if (this.quizSession.timeRemaining <= 0) {
                this.finishQuiz();
            }
        }, 1000);
    }

    loadCurrentQuestion() {
        if (!this.quizSession) return;

        const quiz = this.quizSession.quiz;
        const question = quiz.questions[this.quizSession.currentQuestion];

        // Update UI
        const titleElement = document.getElementById('quizTitle');
        const progressElement = document.getElementById('quizProgress');
        const questionElement = document.getElementById('questionText');
        const optionsElement = document.getElementById('optionsList');

        if (titleElement) titleElement.textContent = quiz.title;
        if (progressElement) {
            progressElement.textContent = `Questão ${this.quizSession.currentQuestion + 1} de ${quiz.questions.length}`;
        }
        if (questionElement) questionElement.textContent = question.question;

        // Load options
        if (optionsElement) {
            let html = '';

            question.options.forEach((option, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                const selected = this.quizSession.answers[question.id] === letter ? 'selected' : '';

                html += `
                    <div class="option ${selected}" onclick="app.selectAnswer('${question.id}', '${letter}')">
                        <div class="option-letter">${letter}</div>
                        <span>${option}</span>
                    </div>
                `;
            });

            optionsElement.innerHTML = html;
        }

        // Update navigation buttons
        this.updateQuizNavigation();
    }

    selectAnswer(questionId, answer) {
        this.quizSession.answers[questionId] = answer;

        // Update UI
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });

        // Find the clicked option and mark it as selected
        const clickedOption = document.querySelector(`.option[onclick*="'${answer}'"]`);
        if (clickedOption) {
            clickedOption.classList.add('selected');
        }
    }

    updateQuizNavigation() {
        const prevBtn = document.querySelector('.quiz-navigation .btn--outline');
        const nextBtn = document.querySelector('.quiz-navigation .btn--secondary');
        const finishBtn = document.querySelector('.quiz-navigation .btn--primary');

        // Show/hide previous button
        if (prevBtn) {
            prevBtn.style.visibility = this.quizSession.currentQuestion > 0 ? 'visible' : 'hidden';
        }

        // Show finish button on last question
        const isLastQuestion = this.quizSession.currentQuestion === this.quizSession.quiz.questions.length - 1;

        if (nextBtn) {
            nextBtn.classList.toggle('hidden', isLastQuestion);
        }
        if (finishBtn) {
            finishBtn.classList.toggle('hidden', !isLastQuestion);
        }
    }

    previousQuestion() {
        if (this.quizSession.currentQuestion > 0) {
            this.quizSession.currentQuestion--;
            this.loadCurrentQuestion();
        }
    }

    nextQuestion() {
        if (this.quizSession.currentQuestion < this.quizSession.quiz.questions.length - 1) {
            this.quizSession.currentQuestion++;
            this.loadCurrentQuestion();
        }
    }

    finishQuiz() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }

        // Calculate score
        let correct = 0;
        this.quizSession.quiz.questions.forEach(question => {
            if (this.quizSession.answers[question.id] === question.correct) {
                correct++;
            }
        });

        const total = this.quizSession.quiz.questions.length;
        const percentage = Math.round((correct / total) * 100);
        const duration = Math.round((new Date() - this.quizSession.startTime) / 1000 / 60);

        // Update results page
        const finalScore = document.getElementById('finalScore');
        const correctAnswers = document.getElementById('correctAnswers');
        const timeSpent = document.getElementById('timeSpent');
        const quizCategory = document.getElementById('quizCategory');

        if (finalScore) finalScore.textContent = percentage + '%';
        if (correctAnswers) correctAnswers.textContent = `${correct}/${total}`;
        if (timeSpent) timeSpent.textContent = `${duration} min`;
        if (quizCategory) quizCategory.textContent = this.getCategoryName(this.quizSession.quiz.subject);

        // Update score circle
        const circle = document.querySelector('.circle-progress');
        if (circle) {
            const color = percentage >= 70 ? '#1FB8CD' : percentage >= 50 ? '#FFC185' : '#B4413C';
            circle.style.background = `conic-gradient(${color} ${percentage}%, var(--color-border) ${percentage}%)`;
        }

        // Salvar tempo de estudo do simulado
        const timeSpentSeconds = Math.round((new Date() - this.quizSession.startTime) / 1000);
        this.saveQuizTime(timeSpentSeconds, this.quizSession.quiz.title);

        this.showPage('quizResultsPage');
        this.showNotification(`Quiz concluído! Pontuação: ${percentage}%`, percentage >= 70 ? 'success' : 'info', 'quiz');
    }

    reviewQuiz() {
        console.log('reviewQuiz método chamado');
        if (!this.quizSession) {
            console.error('Nenhuma sessão de quiz ativa');
            return;
        }
        const container = document.getElementById("reviewQuestions");
        if (!container) {
            console.error('Container reviewQuestions não encontrado');
            return;
        }
        console.log('Container encontrado, iniciando revisão');
        
        const quiz = this.quizSession.quiz;
        const timeSpent = Math.round((new Date() - this.quizSession.startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        
        // Atualizar tempo gasto na revisão
        const timeSpentEl = document.getElementById('reviewTimeSpent');
        if (timeSpentEl) {
            timeSpentEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Atualizar pontuação
        const scoreEl = document.getElementById('reviewScore');
        if (scoreEl) {
            let correct = 0;
            quiz.questions.forEach(question => {
                if (this.quizSession.answers[question.id] === question.correct) {
                    correct++;
                }
            });
            const percentage = Math.round((correct / quiz.questions.length) * 100);
            scoreEl.textContent = `${percentage}%`;
        }
        
        container.innerHTML = "";
        quiz.questions.forEach((q, idx) => {
            const userAnswer = this.quizSession.answers[q.id];
            const correctAnswer = q.correct;
            const isCorrect = userAnswer === correctAnswer;
            
            const block = document.createElement("div");
            block.className = "quiz-review-card";
            block.style.cssText = `
                background: var(--color-card-bg);
                border: 1px solid var(--color-card-border);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            // Status da questão (certa/errada)
            const statusEl = document.createElement("div");
            statusEl.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 8px 12px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
            `;
            
            if (isCorrect) {
                statusEl.style.background = '#d4edda';
                statusEl.style.color = '#155724';
                statusEl.style.border = '1px solid #c3e6cb';
                statusEl.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>Resposta Correta';
            } else {
                statusEl.style.background = '#f8d7da';
                statusEl.style.color = '#721c24';
                statusEl.style.border = '1px solid #f5c6cb';
                statusEl.innerHTML = '<i class="fas fa-times-circle" style="margin-right: 8px;"></i>Resposta Incorreta';
            }
            
            // Questão
            const questionEl = document.createElement("div");
            questionEl.style.cssText = `
                font-weight: 600;
                margin-bottom: 16px;
                font-size: 16px;
                line-height: 1.4;
            `;
            questionEl.textContent = `${idx + 1}. ${q.question}`;
            
            // Opções
            const optionsContainer = document.createElement("div");
            optionsContainer.style.cssText = `
                margin-bottom: 16px;
            `;
            
            q.options.forEach((opt, i) => {
                const letter = String.fromCharCode(65 + i); // A, B, C, D
                const optionEl = document.createElement("div");
                optionEl.style.cssText = `
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    border: 2px solid;
                    font-weight: 500;
                    transition: all 0.2s ease;
                `;
                
                if (letter === correctAnswer) {
                    // Resposta correta - verde
                    optionEl.style.background = '#d4edda';
                    optionEl.style.borderColor = '#28a745';
                    optionEl.style.color = '#155724';
                } else if (userAnswer && letter === userAnswer && !isCorrect) {
                    // Resposta do usuário (errada) - vermelho
                    optionEl.style.background = '#f8d7da';
                    optionEl.style.borderColor = '#dc3545';
                    optionEl.style.color = '#721c24';
                } else {
                    // Outras opções - neutro
                    optionEl.style.background = 'var(--color-card-bg)';
                    optionEl.style.borderColor = 'var(--color-card-border)';
                    optionEl.style.color = 'var(--color-text-secondary)';
                }
                
                optionEl.innerHTML = `<strong style="margin-right: 8px;">${letter})</strong> ${opt}`;
                optionsContainer.appendChild(optionEl);
            });
            
            // Explicação
            const explanationEl = document.createElement("div");
            if (q.explanation) {
                explanationEl.style.cssText = `
                    background: #e7f3ff;
                    border: 1px solid #b3d9ff;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 12px;
                    font-size: 14px;
                    line-height: 1.5;
                `;
                explanationEl.innerHTML = `<strong>Explicação:</strong> ${q.explanation}`;
            }
            
            // Montar o card
            block.appendChild(statusEl);
            block.appendChild(questionEl);
            block.appendChild(optionsContainer);
            if (q.explanation) {
                block.appendChild(explanationEl);
            }
            
            container.appendChild(block);
        });
        
        this.showPage("quizReviewPage");
    }

    // === STATISTICS ===
    loadStatistics() {
        this.setupStatsFilters();
        this.loadStatsSummary();
        setTimeout(() => {
            this.loadCategoryChart();
            this.loadDeckChart();
            this.loadQuizChart();
            this.loadMonthlyChart();
            this.renderReviewHeatmap();
        }, 100);
    }

    getStatsFilter() {
        const cat = document.getElementById('statsCategoryFilter')?.value || '';
        const deck = document.getElementById('statsDeckFilter')?.value || '';
        return { category: cat, deckId: deck };
    }

    setupStatsFilters() {
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        const userDecks = this.currentUser.role === 'admin' ? decks : decks.filter(d => d.userId === this.currentUser.id);
        const categories = Array.from(new Set(userDecks.map(d => d.category)));
        const catSel = document.getElementById('statsCategoryFilter');
        const deckSel = document.getElementById('statsDeckFilter');
        if (!catSel || !deckSel) return;
        const current = catSel.value;
        catSel.innerHTML = `<option value="">Todas</option>` + categories.map(c => `<option value="${c}">${this.getCategoryName(c)}</option>`).join('');
        if (current) catSel.value = current;
        const selectedCat = catSel.value;
        const decksFiltered = selectedCat ? userDecks.filter(d => d.category === selectedCat) : userDecks;
        deckSel.innerHTML = `<option value="">Todos</option>` + decksFiltered.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        // bind listeners once
        if (!catSel.dataset.bound) {
            catSel.addEventListener('change', () => this.loadStatistics());
            catSel.dataset.bound = '1';
        }
        if (!deckSel.dataset.bound) {
            deckSel.addEventListener('change', () => this.loadStatistics());
            deckSel.dataset.bound = '1';
        }
    }

    loadStatsSummary() {
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = this.filterUserStats(stats[this.currentUser.id] || {});

        let totalReviews = 0;
        let totalCorrect = 0;
        let totalTime = 0;

        Object.values(userStats).forEach(dayStats => {
            totalReviews += dayStats.reviews;
            totalCorrect += dayStats.correct;
            totalTime += dayStats.timeSpent;
        });

        const accuracyRate = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
        const averageTime = totalReviews > 0 ? Math.round(totalTime / totalReviews) : 0;

        // Create summary cards
        const summaryStats = document.getElementById('summaryStats');
        if (summaryStats) {
            summaryStats.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-eye"></i></div>
                        <div class="stat-info">
                            <h3>${totalReviews}</h3>
                            <p>Total Reviews</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-bullseye"></i></div>
                        <div class="stat-info">
                            <h3>${accuracyRate}%</h3>
                            <p>Taxa de Acerto</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-clock"></i></div>
                        <div class="stat-info">
                            <h3>${averageTime}s</h3>
                            <p>Tempo Médio</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-calendar"></i></div>
                        <div class="stat-info">
                            <h3>${Object.keys(userStats).length}</h3>
                            <p>Dias Ativos</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    filterUserStats(userStats) {
        const { category, deckId } = this.getStatsFilter();
        if (!category && !deckId) return userStats;
        // If we had per-deck per-day stats we'd filter here. As a proxy, return the same but charts will filter decks directly.
        return userStats;
    }

    loadCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        let userDecks = this.currentUser.role === 'admin' ? decks : decks.filter(d => d.userId === this.currentUser.id);
        const { category, deckId } = this.getStatsFilter();
        if (category) userDecks = userDecks.filter(d => d.category === category);
        if (deckId) userDecks = userDecks.filter(d => d.id === deckId);

        const categoryData = {};

        userDecks.forEach(deck => {
            const category = this.getCategoryName(deck.category);
            categoryData[category] = (categoryData[category] || 0) + (deck.cards?.length || 0);
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    loadDeckChart() {
        const ctx = document.getElementById('deckChart');
        if (!ctx) return;

        if (this.charts.deck) {
            this.charts.deck.destroy();
        }

        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        let userDecks = this.currentUser.role === 'admin' ? decks : decks.filter(d => d.userId === this.currentUser.id);
        const { category, deckId } = this.getStatsFilter();
        if (category) userDecks = userDecks.filter(d => d.category === category);
        if (deckId) userDecks = userDecks.filter(d => d.id === deckId);

        const labels = userDecks.slice(0, 5).map(d => d.name);
        const cardCounts = userDecks.slice(0, 5).map(d => d.cards?.length || 0);
        const dueCounts = userDecks.slice(0, 5).map(d => this.getDueCardsCount(d));

        this.charts.deck = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Cards',
                        data: cardCounts,
                        backgroundColor: '#1FB8CD'
                    },
                    {
                        label: 'Cards Devidos',
                        data: dueCounts,
                        backgroundColor: '#FFC185'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    loadQuizChart() {
        const ctx = document.getElementById('quizChart');
        if (!ctx) return;

        if (this.charts.quiz) {
            this.charts.quiz.destroy();
        }

        // Simulated quiz performance data (placeholder)
        const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const scores = [75, 82, 78, 85, 88, 92];

        this.charts.quiz = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pontuação Média (%)',
                    data: scores,
                    borderColor: '#B4413C',
                    backgroundColor: 'rgba(180, 65, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    renderReviewHeatmap() {
        const container = document.getElementById('reviewHeatmap');
        if (!container) return;
        container.innerHTML = '';
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = stats[this.currentUser.id] || {};
        // last 12 weeks (84 days)
        const today = new Date();
        for (let w = 11; w >= 0; w--) {
            // build a column (week)
            const col = document.createElement('div');
            col.style.display = 'grid';
            col.style.gridTemplateRows = 'repeat(7, 1fr)';
            col.style.gap = '6px';
            for (let d = 0; d < 7; d++) {
                const cell = document.createElement('div');
                cell.style.width = '100%';
                cell.style.paddingTop = '100%';
                cell.style.borderRadius = '4px';
                const date = new Date(today);
                date.setDate(today.getDate() - (w * 7 + (6 - d)));
                const key = date.toISOString().slice(0, 10);
                const count = userStats[key]?.reviews || 0;
                // color scale
                let bg = 'var(--color-border)';
                if (count > 0) bg = '#e0f7fa';
                if (count > 5) bg = '#b2ebf2';
                if (count > 10) bg = '#80deea';
                if (count > 20) bg = '#26c6da';
                cell.style.background = bg;
                cell.title = `${key}: ${count} reviews`;
                col.appendChild(cell);
            }
            container.appendChild(col);
        }
    }

    loadMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = stats[this.currentUser.id] || {};

        const monthlyData = {};

        Object.keys(userStats).forEach(date => {
            const month = date.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
                monthlyData[month] = { reviews: 0, correct: 0 };
            }
            monthlyData[month].reviews += userStats[date].reviews;
            monthlyData[month].correct += userStats[date].correct;
        });

        const labels = Object.keys(monthlyData).sort();
        const reviewsData = labels.map(month => monthlyData[month].reviews);
        const accuracyData = labels.map(month =>
            Math.round((monthlyData[month].correct / monthlyData[month].reviews) * 100) || 0
        );

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Reviews',
                        data: reviewsData,
                        backgroundColor: '#1FB8CD',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Precisão (%)',
                        data: accuracyData,
                        type: 'line',
                        borderColor: '#B4413C',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    // === PROFILE ===
    loadProfile() {
        const profileCard = document.getElementById('profileCard');
        if (!profileCard) return;

        const stats = this.getUserStats();

        profileCard.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <div class="profile-info">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-details">
                            <h3>${this.currentUser.name}</h3>
                            <p class="profile-email">${this.currentUser.email}</p>
                            <p class="profile-role">Plano: ${this.currentUser.plan.charAt(0).toUpperCase() + this.currentUser.plan.slice(1)}</p>
                            <p class="profile-joined">Membro desde: ${new Date(this.currentUser.created).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    
                    <div class="profile-stats">
                        <div class="stat-row">
                            <span>Total de Reviews:</span>
                            <strong>${stats.totalReviews}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Taxa de Acerto:</span>
                            <strong>${stats.accuracy}%</strong>
                        </div>
                        <div class="stat-row">
                            <span>Sequência Atual:</span>
                            <strong>${stats.streak} dias</strong>
                        </div>
                        <div class="stat-row">
                            <span>Tempo Total:</span>
                            <strong>${Math.round(stats.totalTime / 60)} horas</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === ADMIN ===
    loadAdmin() {
        if (this.currentUser.role !== 'admin') {
            this.showNotification('Acesso negado!', 'error');
            return;
        }

        this.loadAdminStats();
        this.loadUsersTable();
        this.loadAdminFlashcardsGrid();

        // CORREÇÃO: Chama o método interno para inicializar a aba "dashboard"
        this.switchAdminTab('dashboard');

        setTimeout(() => {
            this.loadAdminCharts();
        }, 100);
    }

    loadAdminFlashcardsGrid() {
        const container = document.getElementById('adminFlashcardsGrid');
        if (!container) return;
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
        let html = '';
        decks.forEach(deck => {
            html += `
                <div class="deck-card">
                    <div class="deck-header">
                        <span class="deck-category">${this.getCategoryName(deck.category)}</span>
                    </div>
                    <h3>${deck.name}</h3>
                    <p>${deck.description || ''}</p>
                    <div class="deck-stats">
                        <div class="deck-stat">
                            <span class="deck-stat-value">${deck.cards?.length || 0}</span>
                            <span class="deck-stat-label">Cards</span>
                        </div>
                    </div>
                    <div style="margin-top:12px; display:flex; gap:8px;">
                        <button class="btn btn--secondary btn--sm" onclick="openEditDeck('${deck.id}')">Editar</button>
                        <button class="btn btn--outline btn--sm" onclick="deleteDeck('${deck.id}')">Excluir</button>
                    </div>
                </div>
            `;
        });
        if (html === '') {
            html = '<div class="empty-state">Nenhum baralho encontrado.</div>';
        }
        container.innerHTML = html;
    }

    loadAdminStats() {
        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');

        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.isActive).length;
        const totalDecks = decks.length;

        // Calculate revenue (simplified)
        let monthlyRevenue = 0;
        users.forEach(user => {
            if (user.plan === 'basic') monthlyRevenue += 29.90;
            if (user.plan === 'premium') monthlyRevenue += 49.90;
        });

        const totalUsersEl = document.getElementById('adminTotalUsers');
        const activeUsersEl = document.getElementById('adminActiveUsers');
        const totalDecksEl = document.getElementById('adminTotalDecks');
        const monthlyRevenueEl = document.getElementById('adminMonthlyRevenue');

        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (activeUsersEl) activeUsersEl.textContent = activeUsers;
        if (totalDecksEl) totalDecksEl.textContent = totalDecks;
        if (monthlyRevenueEl) monthlyRevenueEl.textContent = `R$ ${monthlyRevenue.toFixed(2)}`;
    }

    loadUsersTable() {
        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        // Ordenar usuários por data de cadastro (mais recentes primeiro)
        const sortedUsers = users.sort((a, b) => new Date(b.createdAt || b.created) - new Date(a.createdAt || a.created));

        let html = '';
        sortedUsers.forEach(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca';
            const createdAt = user.createdAt || user.created;
            const createdDate = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : 'N/A';
            const isActive = user.isActive === true || user.isActive === 'true';
            const statusClass = isActive ? 'success' : 'error';
            const statusText = isActive ? 'Ativo' : 'Inativo';
            const planText = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Gratuito';

            html += `
                <tr data-user-id="${user.id}">
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="user-details">
                                <strong>${user.name || 'Nome não informado'}</strong>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge role-badge--${user.role}">${user.role}</span>
                    </td>
                    <td>
                        <span class="plan-badge plan-badge--${user.plan || 'free'}">${planText}</span>
                    </td>
                    <td>
                        <span class="status status--${statusClass}">${statusText}</span>
                    </td>
                    <td>${lastLogin}</td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn--sm btn--outline" onclick="editUser('${user.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn--sm btn--outline" onclick="toggleUserStatus('${user.id}')" title="${isActive ? 'Desativar' : 'Ativar'}">
                                <i class="fas fa-${isActive ? 'ban' : 'check'}"></i>
                            </button>
                            <button class="btn btn--sm btn--danger" onclick="deleteUser('${user.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        this.updateUsersCount(sortedUsers.length);
        this.filteredUsers = sortedUsers; // Armazenar para filtros
    }

    updateUsersCount(count) {
        const countElement = document.getElementById('usersCount');
        if (countElement) {
            countElement.textContent = `${count} usuário${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        }
    }

    filterUsers() {
        const searchName = document.getElementById('searchName')?.value.toLowerCase() || '';
        const searchEmail = document.getElementById('searchEmail')?.value.toLowerCase() || '';
        const searchPlan = document.getElementById('searchPlan')?.value || '';
        const searchStatus = document.getElementById('searchStatus')?.value || '';

        const allUsers = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        
        const filtered = allUsers.filter(user => {
            const nameMatch = !searchName || (user.name && user.name.toLowerCase().includes(searchName));
            const emailMatch = !searchEmail || user.email.toLowerCase().includes(searchEmail);
            const planMatch = !searchPlan || (user.plan || 'free') === searchPlan;
            const statusMatch = !searchStatus || 
                (searchStatus === 'active' && (user.isActive === true || user.isActive === 'true')) ||
                (searchStatus === 'inactive' && (user.isActive === false || user.isActive === 'false'));

            return nameMatch && emailMatch && planMatch && statusMatch;
        });

        this.displayFilteredUsers(filtered);
    }

    displayFilteredUsers(users) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        let html = '';
        users.forEach(user => {
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca';
            const createdAt = user.createdAt || user.created;
            const createdDate = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : 'N/A';
            const isActive = user.isActive === true || user.isActive === 'true';
            const statusClass = isActive ? 'success' : 'error';
            const statusText = isActive ? 'Ativo' : 'Inativo';
            const planText = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Gratuito';

            html += `
                <tr data-user-id="${user.id}">
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="user-details">
                                <strong>${user.name || 'Nome não informado'}</strong>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge role-badge--${user.role}">${user.role}</span>
                    </td>
                    <td>
                        <span class="plan-badge plan-badge--${user.plan || 'free'}">${planText}</span>
                    </td>
                    <td>
                        <span class="status status--${statusClass}">${statusText}</span>
                    </td>
                    <td>${lastLogin}</td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn--sm btn--outline" onclick="editUser('${user.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn--sm btn--outline" onclick="toggleUserStatus('${user.id}')" title="${isActive ? 'Desativar' : 'Ativar'}">
                                <i class="fas fa-${isActive ? 'ban' : 'check'}"></i>
                            </button>
                            <button class="btn btn--sm btn--danger" onclick="deleteUser('${user.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        this.updateUsersCount(users.length);
    }

    toggleUserStatus(userId) {
        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            const user = users[userIndex];
            const newStatus = !(user.isActive === true || user.isActive === 'true');
            users[userIndex].isActive = newStatus;
            
            localStorage.setItem('medFocusUsers', JSON.stringify(users));
            
            this.showNotification(
                `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`, 
                'success'
            );
            
            this.loadUsersTable();
        }
    }

    editUser(userId) {
        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const user = users.find(u => u.id === userId);
        
        if (user) {
            // Preencher modal de edição
            document.getElementById('editUserName').value = user.name || '';
            document.getElementById('editUserEmail').value = user.email || '';
            document.getElementById('editUserPhone').value = user.phone || '';
            document.getElementById('editUserPlan').value = user.plan || 'free';
            document.getElementById('editUserRole').value = user.role || 'user';
            
            // Mostrar modal
            const modal = document.getElementById('editUserModal');
            if (modal) {
                modal.style.display = 'block';
                modal.setAttribute('data-user-id', userId);
            }
        }
    }

    // === ADMIN SETTINGS ===
    loadAdminSettings() {
        if (!this.currentUser || this.currentUser.role !== 'admin') return;

        // Carregar configurações de preços
        this.loadPricingSettings();
        
        // Carregar limites de planos
        this.loadPlanLimits();
        
        // Carregar status de backup
        this.loadBackupStatus();
    }

    loadPricingSettings() {
        const settings = JSON.parse(localStorage.getItem('medFocusPricingSettings') || '{}');
        
        // Valores padrão
        const defaultPrices = {
            basicMonthly: 29.90,
            basicYearly: 299.90,
            premiumMonthly: 59.90,
            premiumYearly: 599.90
        };

        const prices = { ...defaultPrices, ...settings };

        // Atualizar campos
        const fields = {
            'basicMonthlyPrice': prices.basicMonthly,
            'basicYearlyPrice': prices.basicYearly,
            'premiumMonthlyPrice': prices.premiumMonthly,
            'premiumYearlyPrice': prices.premiumYearly
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) field.value = value;
        });
    }

    loadPlanLimits() {
        const settings = JSON.parse(localStorage.getItem('medFocusPlanLimits') || '{}');
        
        // Valores padrão
        const defaultLimits = {
            free: { decks: 3, cards: 50, quizzes: 2 },
            basic: { decks: 20, cards: 200, quizzes: 15 },
            premium: { decks: 999, cards: 999, quizzes: 999 }
        };

        const limits = { ...defaultLimits, ...settings };

        // Atualizar campos
        const fields = {
            'freeMaxDecks': limits.free.decks,
            'freeMaxCards': limits.free.cards,
            'freeMaxQuizzes': limits.free.quizzes,
            'basicMaxDecks': limits.basic.decks,
            'basicMaxCards': limits.basic.cards,
            'basicMaxQuizzes': limits.basic.quizzes,
            'premiumMaxDecks': limits.premium.decks,
            'premiumMaxCards': limits.premium.cards,
            'premiumMaxQuizzes': limits.premium.quizzes
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id);
            if (field) field.value = value;
        });
    }

    loadBackupStatus() {
        const backupInfo = JSON.parse(localStorage.getItem('medFocusBackupInfo') || '{}');
        
        const lastBackupDate = document.getElementById('lastBackupDate');
        const backupSize = document.getElementById('backupSize');
        
        if (lastBackupDate) {
            lastBackupDate.textContent = backupInfo.lastBackup || 'Nenhum backup realizado';
        }
        
        if (backupSize) {
            backupSize.textContent = backupInfo.size || '-';
        }
    }

    createUserFromAdmin() {
        const name = document.getElementById('newUserName')?.value.trim();
        const email = document.getElementById('newUserEmail')?.value.trim();
        const phone = document.getElementById('newUserPhone')?.value.trim();
        const password = document.getElementById('newUserPassword')?.value.trim();
        const plan = document.getElementById('newUserPlan')?.value || 'free';
        const isActive = !!document.getElementById('newUserActive')?.checked;

        if (!name || !email || !password) {
            this.showNotification('Preencha nome, email e senha.', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            this.showNotification('Email já cadastrado.', 'error');
            return;
        }

        const user = {
            id: 'user_' + Date.now(),
            name,
            email,
            password,
            role: 'student',
            plan,
            phone,
            isActive,
            created: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem('medFocusUsers', JSON.stringify(users));
        this.loadUsersTable();
        this.closeModal('createUserModal');
        this.showNotification('Usuário criado com sucesso!', 'success');
    }

    loadAdminCharts() {
        // Admin User Chart
        const userCtx = document.getElementById('adminUserChart');
        if (userCtx && this.charts.adminUser) {
            this.charts.adminUser.destroy();
        }

        if (userCtx) {
            this.charts.adminUser = new Chart(userCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Novos Usuários',
                        data: [2, 5, 3, 8, 6, 4],
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Admin Revenue Chart
        const revenueCtx = document.getElementById('adminRevenueChart');
        if (revenueCtx && this.charts.adminRevenue) {
            this.charts.adminRevenue.destroy();
        }

        if (revenueCtx) {
            this.charts.adminRevenue = new Chart(revenueCtx, {
                type: 'pie',
                data: {
                    labels: ['Gratuito', 'Básico', 'Premium'],
                    datasets: [{
                        data: [60, 30, 10],
                        backgroundColor: ['#ECEBD5', '#FFC185', '#1FB8CD']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    switchAdminTab(tab, btn) {
        const adminSection = document.getElementById('adminContent');
        if (!adminSection) {
            return;
        }

        adminSection.classList.add('active');

        const tabButtons = adminSection.querySelectorAll('.admin-tabs .tab-btn');
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        if (!btn) {
            btn = adminSection.querySelector('.admin-tabs .tab-btn[data-tab="' + tab + '"]');
        }
        if (btn) {
            btn.classList.add('active');
        }

        adminSection.querySelectorAll('.admin-content').forEach(panel => {
            panel.classList.remove('active');
        });

        const tabContent = document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Carregar dados específicos da aba
        if (tab === 'settings') {
            this.loadAdminSettings();
        }
    }

    // === SAMPLES ===
    startSampleFlashcards() {
        // Create a temporary sample deck
        const sampleDeck = {
            id: 'sample_deck',
            name: 'Amostra - Anatomia',
            cards: [
                {
                    id: 'sample_1',
                    question: 'Qual é o maior osso do corpo humano?',
                    answer: 'Fêmur',
                    explanation: 'O fêmur é o osso da coxa e é o mais longo e resistente do esqueleto humano.',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: '2025-09-08',
                    reviews: []
                },
                {
                    id: 'sample_2',
                    question: 'Quantas costelas tem o corpo humano?',
                    answer: '24 costelas (12 pares)',
                    explanation: 'O ser humano possui 24 costelas, sendo 12 pares: 7 pares verdadeiras, 3 pares falsas e 2 pares flutuantes.',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: '2025-09-08',
                    reviews: []
                }
            ]
        };

        this.currentDeck = sampleDeck;
        this.studySession = {
            cards: sampleDeck.cards,
            currentIndex: 0,
            startTime: new Date(),
            reviewed: 0
        };

        this.showPage('studyModePage');
        this.loadCurrentCard();
        this.showNotification('Experimentando flashcards de amostra!', 'info');
    }

    startSampleQuiz() {
        const sampleQuiz = {
            id: 'sample_quiz',
            title: 'Mini Simulado - Anatomia',
            subject: 'anatomia',
            timeLimit: 5,
            questions: [
                {
                    id: 'sq1',
                    question: 'Qual é a função principal do coração?',
                    options: ['Filtrar o sangue', 'Bombear sangue', 'Produzir hemácias', 'Armazenar oxigênio'],
                    correct: 'B',
                    explanation: 'O coração bombeia sangue para todo o corpo.'
                },
                {
                    id: 'sq2',
                    question: 'Quantas câmaras tem o coração?',
                    options: ['2', '3', '4', '5'],
                    correct: 'C',
                    explanation: 'O coração tem 4 câmaras: 2 átrios e 2 ventrículos.'
                },
                {
                    id: 'sq3',
                    question: 'Onde se localiza o fígado?',
                    options: ['Lado esquerdo do abdomen', 'Lado direito do abdomen', 'Centro do abdomen', 'Região pélvica'],
                    correct: 'B',
                    explanation: 'O fígado está localizado no lado direito do abdomen, abaixo do diafragma.'
                }
            ]
        };

        this.quizSession = {
            quiz: sampleQuiz,
            currentQuestion: 0,
            answers: {},
            startTime: new Date(),
            timeRemaining: sampleQuiz.timeLimit * 60
        };

        this.showPage('quizModePage');
        this.startQuizTimer();
        this.loadCurrentQuestion();
        this.showNotification('Experimentando mini simulado!', 'info');
    }

    // === UTILITY FUNCTIONS ===
    getDueCardsCount(deck) {
        if (!deck.cards) return 0;

        const today = new Date().toISOString().split('T')[0];
        return deck.cards.filter(card => card.nextReview <= today).length;
    }

    getDeckAccuracy(deck) {
        if (!deck.cards) return 0;

        let totalReviews = 0;
        let correctReviews = 0;

        deck.cards.forEach(card => {
            if (card.reviews && card.reviews.length > 0) {
                card.reviews.forEach(review => {
                    totalReviews++;
                    if (review.quality >= 3) correctReviews++;
                });
            }
        });

        return totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
    }

    getCategoryName(categoryId) {
        const categories = {
            anatomia: 'Anatomia',
            fisiologia: 'Fisiologia',
            farmacologia: 'Farmacologia',
            patologia: 'Patologia',
            clinica: 'Clínica Médica'
        };
        return categories[categoryId] || categoryId;
    }

    calculateStreak() {
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = stats[this.currentUser.id] || {};

        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            if (userStats[dateStr] && userStats[dateStr].reviews > 0) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        return streak;
    }

    calculateAccuracy() {
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = stats[this.currentUser.id] || {};

        let totalReviews = 0;
        let correctReviews = 0;

        Object.values(userStats).forEach(dayStats => {
            totalReviews += dayStats.reviews;
            correctReviews += dayStats.correct;
        });

        return totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
    }

    getUserStats() {
        const stats = JSON.parse(localStorage.getItem('medFocusUserStats') || '{}');
        const userStats = stats[this.currentUser.id] || {};

        let totalReviews = 0;
        let correctReviews = 0;
        let totalTime = 0;

        Object.values(userStats).forEach(dayStats => {
            totalReviews += dayStats.reviews;
            correctReviews += dayStats.correct;
            totalTime += dayStats.timeSpent;
        });

        return {
            totalReviews,
            accuracy: totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0,
            totalTime,
            streak: this.calculateStreak()
        };
    }

    // === MODAL MANAGEMENT ===
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // === SIDEBAR MANAGEMENT ===
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('expanded');
            this.sidebarExpanded = !this.sidebarExpanded;
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('expanded');
            this.sidebarExpanded = false;
        }
    }

    // === THEME MANAGEMENT ===
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // Update the data attribute
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        
        // Save to localStorage
        localStorage.setItem('medFocusTheme', newTheme);

        // Update theme toggle button icon
        this.updateThemeToggleIcon(newTheme);

        // Show notification
        this.showNotification(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, 'info');
        
        // Force a re-render to ensure all elements pick up the new theme
        this.forceThemeUpdate();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('medFocusTheme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        
        // Update theme toggle button icon
        this.updateThemeToggleIcon(savedTheme);
        
        // Force a re-render to ensure all elements pick up the theme
        this.forceThemeUpdate();
    }
    
    updateThemeToggleIcon(theme) {
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    forceThemeUpdate() {
        // Force a re-render by temporarily toggling a class
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
    }

    // === NOTIFICATION SYSTEM ===
    showNotification(message, type = 'info', context = 'general') {
        // Verificar se deve mostrar notificação baseado no contexto
        if (!this.shouldShowNotification(context)) {
            return;
        }

        const notifications = document.getElementById('notifications');
        if (!notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notifications.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    // Verificar se deve mostrar notificação baseado no contexto
    shouldShowNotification(context) {
        // Se for notificação geral, sempre mostrar
        if (context === 'general') {
            return true;
        }

        // Se for notificação de quiz, só mostrar na aba de simulados
        if (context === 'quiz') {
            const currentView = this.currentDashboardView || 'overview';
            return currentView === 'quizzes';
        }

        // Se for notificação de estudo, só mostrar na aba de flashcards
        if (context === 'study') {
            const currentView = this.currentDashboardView || 'overview';
            return currentView === 'flashcards';
        }

        // Para outros contextos, sempre mostrar
        return true;
    }

    showError(container, message) {
        if (container) {
            container.textContent = message;
            container.classList.remove('hidden');

            setTimeout(() => {
                container.classList.add('hidden');
            }, 5000);
        }
    }

    // === NAVIGATION FUNCTIONS ===
    navigateToHome() {
        this.showPage('homePage');
    }

    // === UI UPDATE FUNCTIONS ===
    updateUIForLoggedUser() {
        document.getElementById('navMenu').classList.add('hidden');
        document.getElementById('userMenu').classList.remove('hidden');

        // Update user name in navbar
        if (this.currentUser) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name || 'Usuário';
            }

            // Update user avatar
            this.updateUserAvatar();
        }

        // Show admin menu if admin (CÓDIGO CORRIGIDO PARA MAIOR ROBUSTEZ)
        const adminMenuItem = document.querySelector('.admin-only');
        
        const isAdmin = this.currentUser && this.currentUser.role === 'admin'; 
        
        if (adminMenuItem) {
            if (isAdmin) {
                adminMenuItem.classList.remove('hidden');
                adminMenuItem.style.display = 'list-item'; 
                console.log('Admin menu: MOSTRADO para:', this.currentUser.email);
            } else {
                adminMenuItem.classList.add('hidden');
                adminMenuItem.style.display = 'none'; 
                console.log('Admin menu: OCULTO. Role:', this.currentUser ? this.currentUser.role : 'no user');
            }
        }
    }

    updateUIForGuest() {
        document.getElementById('navMenu').classList.remove('hidden');
        document.getElementById('userMenu').classList.add('hidden');

        // Hide samples content
        const samplesAuthMessage = document.getElementById('samplesAuthMessage');
        const samplesContent = document.getElementById('samplesContent');

        if (samplesAuthMessage) samplesAuthMessage.classList.remove('hidden');
        if (samplesContent) samplesContent.classList.add('hidden');

        // Hide admin menu
        const adminMenuItem = document.querySelector('.admin-only');
        if (adminMenuItem) {
            adminMenuItem.classList.add('hidden');
            adminMenuItem.style.display = 'none';
        }
    }

    updateUserAvatar() {
        if (this.currentUser && this.currentUser.avatar) {
            const avatarImage = document.getElementById('userAvatarImage');
            const avatarIcon = document.getElementById('userAvatarIcon');

            if (avatarImage && avatarIcon) {
                avatarImage.src = this.currentUser.avatar;
                avatarImage.style.display = 'block';
                avatarIcon.style.display = 'none';
            }
        } else {
            const avatarImage = document.getElementById('userAvatarImage');
            const avatarIcon = document.getElementById('userAvatarIcon');

            if (avatarImage && avatarIcon) {
                avatarImage.style.display = 'none';
                avatarIcon.style.display = 'block';
            }
        }
    }

    // === AVATAR MANAGEMENT ===
    showAvatarUploadModal() {
        this.showModal('avatarUploadModal');

        // Load current avatar if exists
        if (this.currentUser && this.currentUser.avatar) {
            const preview = document.getElementById('avatarPreview');
            const placeholder = document.getElementById('avatarPlaceholder');
            if (preview && placeholder) {
                preview.src = this.currentUser.avatar;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            }
        }

        // Setup file input listener
        const fileInput = document.getElementById('avatarFileInput');
        if (fileInput) {
            fileInput.onchange = (e) => this.previewAvatar(e);
        }
    }

    previewAvatar(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                this.showNotification('Arquivo muito grande. Máximo 2MB.', 'error');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showNotification('Por favor, selecione uma imagem válida.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('avatarPreview');
                const placeholder = document.getElementById('avatarPlaceholder');
                if (preview && placeholder) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    }

    saveAvatar() {
        const fileInput = document.getElementById('avatarFileInput');
        const preview = document.getElementById('avatarPreview');

        if (!fileInput.files[0] && !preview.src) {
            this.showNotification('Por favor, selecione uma imagem.', 'error');
            return;
        }

        if (fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                // Save avatar to user data
                if (this.currentUser) {
                    this.currentUser.avatar = e.target.result;

                    // Update localStorage
                    const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
                    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
                    if (userIndex >= 0) {
                        users[userIndex] = this.currentUser;
                        localStorage.setItem('medFocusUsers', JSON.stringify(users));
                    }

                    // Update current user in localStorage
                    localStorage.setItem('medFocusCurrentUser', JSON.stringify(this.currentUser));

                    // Update UI
                    this.updateUserAvatar();

                    this.showNotification('Avatar atualizado com sucesso!', 'success');
                    this.closeAvatarUploadModal();
                }
            };
            reader.readAsDataURL(file);
        } else if (preview.src) {
            // User is keeping current avatar
            this.showNotification('Avatar mantido.', 'info');
            this.closeAvatarUploadModal();
        }
    }

    closeAvatarUploadModal() {
        this.closeModal('avatarUploadModal');

        // Reset form
        const fileInput = document.getElementById('avatarFileInput');
        const preview = document.getElementById('avatarPreview');
        const placeholder = document.getElementById('avatarPlaceholder');

        if (fileInput) fileInput.value = '';
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = 'flex';
    }
}

// Global functions for HTML onclick handlers
window.showPage = (pageId) => {
    if (window.app) {
        window.app.showPage(pageId);
    }
};

window.showDashboardView = (viewId) => {
    if (window.app) {
        window.app.showDashboardView(viewId);
    }
};

window.toggleSidebar = () => {
    if (window.app) {
        window.app.toggleSidebar();
    }
};

window.closeSidebar = () => {
    if (window.app) {
        window.app.closeSidebar();
    }
};

window.toggleTheme = () => {
    if (window.app) {
        window.app.toggleTheme();
    }
};

window.logout = () => {
    if (window.app) {
        window.app.logout();
    }
};

window.navigateToHome = () => {
    if (window.app) {
        window.app.navigateToHome();
    }
};

// Função de debug para testar persistência de estado
window.debugState = () => {
    if (window.app) {
        console.log('Estado atual:', {
            currentPage: window.app.currentPage,
            currentDashboardView: window.app.currentDashboardView
        });
        
        const saved = localStorage.getItem('medFocusAppState');
        console.log('Estado salvo:', saved ? JSON.parse(saved) : 'Nenhum');
        
        // Testar salvamento
        window.app.saveCurrentState();
        
        // Testar restauração
        setTimeout(() => {
            window.app.restoreState();
        }, 1000);
    }
};

// === ADMIN SETTINGS FUNCTIONS ===
window.savePricingSettings = () => {
    if (window.app) {
        const prices = {
            basicMonthly: parseFloat(document.getElementById('basicMonthlyPrice').value) || 29.90,
            basicYearly: parseFloat(document.getElementById('basicYearlyPrice').value) || 299.90,
            premiumMonthly: parseFloat(document.getElementById('premiumMonthlyPrice').value) || 59.90,
            premiumYearly: parseFloat(document.getElementById('premiumYearlyPrice').value) || 599.90
        };
        
        localStorage.setItem('medFocusPricingSettings', JSON.stringify(prices));
        window.app.showNotification('Preços salvos com sucesso!', 'success');
    }
};

window.resetPricingSettings = () => {
    if (window.app) {
        localStorage.removeItem('medFocusPricingSettings');
        window.app.loadPricingSettings();
        window.app.showNotification('Preços restaurados para o padrão!', 'info');
    }
};

window.savePlanLimits = () => {
    if (window.app) {
        const limits = {
            free: {
                decks: parseInt(document.getElementById('freeMaxDecks').value) || 3,
                cards: parseInt(document.getElementById('freeMaxCards').value) || 50,
                quizzes: parseInt(document.getElementById('freeMaxQuizzes').value) || 2
            },
            basic: {
                decks: parseInt(document.getElementById('basicMaxDecks').value) || 20,
                cards: parseInt(document.getElementById('basicMaxCards').value) || 200,
                quizzes: parseInt(document.getElementById('basicMaxQuizzes').value) || 15
            },
            premium: {
                decks: parseInt(document.getElementById('premiumMaxDecks').value) || 999,
                cards: parseInt(document.getElementById('premiumMaxCards').value) || 999,
                quizzes: parseInt(document.getElementById('premiumMaxQuizzes').value) || 999
            }
        };
        
        localStorage.setItem('medFocusPlanLimits', JSON.stringify(limits));
        window.app.showNotification('Limites salvos com sucesso!', 'success');
    }
};

window.resetPlanLimits = () => {
    if (window.app) {
        localStorage.removeItem('medFocusPlanLimits');
        window.app.loadPlanLimits();
        window.app.showNotification('Limites restaurados para o padrão!', 'info');
    }
};

window.createBackup = () => {
    if (window.app) {
        try {
            const backupData = {
                users: JSON.parse(localStorage.getItem('medFocusUsers') || '[]'),
                decks: JSON.parse(localStorage.getItem('medFocusDecks') || '[]'),
                quizzes: JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]'),
                settings: {
                    pricing: JSON.parse(localStorage.getItem('medFocusPricingSettings') || '{}'),
                    planLimits: JSON.parse(localStorage.getItem('medFocusPlanLimits') || '{}')
                },
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            const backupJson = JSON.stringify(backupData, null, 2);
            const backupSize = (new Blob([backupJson]).size / 1024 / 1024).toFixed(2);
            
            // Salvar informações do backup
            const backupInfo = {
                lastBackup: new Date().toLocaleString('pt-BR'),
                size: backupSize,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('medFocusBackupInfo', JSON.stringify(backupInfo));
            localStorage.setItem('medFocusBackupData', backupJson);
            
            window.app.loadBackupStatus();
            window.app.showNotification(`Backup criado com sucesso! Tamanho: ${backupSize} MB`, 'success');
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            window.app.showNotification('Erro ao criar backup!', 'error');
        }
    }
};

window.downloadBackup = () => {
    const backupData = localStorage.getItem('medFocusBackupData');
    if (backupData) {
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medfocus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.app.showNotification('Backup baixado com sucesso!', 'success');
    } else {
        window.app.showNotification('Nenhum backup encontrado!', 'error');
    }
};

window.checkBackupStatus = () => {
    if (window.app) {
        window.app.loadBackupStatus();
        window.app.showNotification('Status do backup atualizado!', 'info');
    }
};

window.showSystemLogs = () => {
    const logs = JSON.parse(localStorage.getItem('medFocusSystemLogs') || '[]');
    
    if (logs.length === 0) {
        window.app.showNotification('Nenhum log encontrado!', 'info');
        return;
    }
    
    const logsHtml = logs.map(log => `
        <div class="log-entry">
            <div class="log-header">
                <span class="log-level log-level--${log.level}">${log.level.toUpperCase()}</span>
                <span class="log-timestamp">${new Date(log.timestamp).toLocaleString('pt-BR')}</span>
            </div>
            <div class="log-message">${log.message}</div>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 600px;">
            <div class="modal-header">
                <h3>Logs do Sistema</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="overflow-y: auto;">
                <div class="logs-container">
                    ${logsHtml}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn--outline" onclick="clearSystemLogs()">Limpar Logs</button>
                <button class="btn btn--secondary" onclick="this.closest('.modal').remove()">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// === USER MANAGEMENT FUNCTIONS ===
window.filterUsers = () => {
    if (window.app) {
        window.app.filterUsers();
    }
};

window.clearUserSearch = () => {
    document.getElementById('searchName').value = '';
    document.getElementById('searchEmail').value = '';
    document.getElementById('searchPlan').value = '';
    document.getElementById('searchStatus').value = '';
    
    if (window.app) {
        window.app.loadUsersTable();
    }
};

window.exportUsers = () => {
    const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
    
    if (users.length === 0) {
        window.app.showNotification('Nenhum usuário para exportar!', 'error');
        return;
    }
    
    let csv = 'Nome,Email,Telefone,Função,Plano,Status,Último Login,Data de Cadastro\n';
    
    users.forEach(user => {
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca';
        const createdAt = user.createdAt || user.created;
        const createdDate = createdAt ? new Date(createdAt).toLocaleDateString('pt-BR') : 'N/A';
        const isActive = user.isActive === true || user.isActive === 'true';
        const status = isActive ? 'Ativo' : 'Inativo';
        const plan = user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Gratuito';
        
        csv += `"${user.name || ''}","${user.email}","${user.phone || ''}","${user.role}","${plan}","${status}","${lastLogin}","${createdDate}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-medfocus-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    window.app.showNotification('Usuários exportados com sucesso!', 'success');
};

window.toggleUserStatus = (userId) => {
    if (window.app) {
        window.app.toggleUserStatus(userId);
    }
};

window.editUser = (userId) => {
    if (window.app) {
        window.app.editUser(userId);
    }
};

window.deleteUser = (userId) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const filteredUsers = users.filter(u => u.id !== userId);
        
        localStorage.setItem('medFocusUsers', JSON.stringify(filteredUsers));
        
        window.app.showNotification('Usuário excluído com sucesso!', 'success');
        window.app.loadUsersTable();
    }
};

window.startSampleFlashcards = () => {
    if (window.app) {
        window.app.startSampleFlashcards();
    }
};

window.startSampleQuiz = () => {
    if (window.app) {
        window.app.startSampleQuiz();
    }
};

window.showModal = (modalId) => {
    if (window.app) {
        window.app.showModal(modalId);
    }
};

window.closeModal = (modalId) => {
    if (window.app) {
        window.app.closeModal(modalId);
    }
};

window.flipCard = () => {
    if (window.app) {
        window.app.flipCard();
    }
};

window.answerCard = (quality) => {
    if (window.app) {
        window.app.answerCard(quality);
    }
};

window.selectAnswer = (questionId, answer) => {
    if (window.app) {
        window.app.selectAnswer(questionId, answer);
    }
};

window.previousQuestion = () => {
    if (window.app) {
        window.app.previousQuestion();
    }
};

window.nextQuestion = () => {
    if (window.app) {
        window.app.nextQuestion();
    }
};

window.finishQuiz = () => {
    if (window.app) {
        window.app.finishQuiz();
    }
};

window.reviewQuiz = () => {
    console.log('reviewQuiz chamada');
    if (window.app) {
        console.log('App encontrado, verificando quizSession:', window.app.quizSession);
        // Verificar se há sessão de quiz ativa
        if (window.app.quizSession) {
            console.log('Iniciando revisão do quiz');
            window.app.reviewQuiz();
        } else {
            console.error('Nenhuma sessão de quiz ativa para revisão');
            window.app.showNotification('Nenhuma sessão de quiz ativa para revisão', 'error', 'quiz');
        }
    } else {
        console.error('App não encontrado');
    }
};

window.switchAdminTab = (tab, btn) => {
    if (window.app) {
        window.app.switchAdminTab(tab, btn);
    }
};

// Avatar management functions
window.showAvatarUploadModal = () => {
    if (window.app) {
        window.app.showAvatarUploadModal();
    }
};

window.closeAvatarUploadModal = () => {
    if (window.app) {
        window.app.closeAvatarUploadModal();
    }
};

window.saveAvatar = () => {
    if (window.app) {
        window.app.saveAvatar();
    }
};

window.createBackup = () => {
    if (window.app) {
        window.app.showNotification('Backup criado com sucesso!', 'success');
    }
};

window.showSystemLogs = () => {
    if (window.app) {
        window.app.showNotification('Funcionalidade em desenvolvimento!', 'info');
    }
};

window.showFlashcardUploadModal = () => {
    if (window.AdminUploader && typeof window.AdminUploader.showFlashcardUploadModal === 'function') {
        window.AdminUploader.showFlashcardUploadModal();
        return;
    }
    if (window.app) {
        window.app.showModal('flashcardUploadModal');
    }
};

window.showQuizUploadModal = () => {
    if (window.AdminUploader && typeof window.AdminUploader.showSimuladoUploadModal === 'function') {
        window.AdminUploader.showSimuladoUploadModal();
        return;
    }
    if (window.app) {
        window.app.showModal('quizUploadModal');
    }
};

window.showCreateUserModal = () => {
    if (window.app) {
        window.app.showModal('createUserModal');
    }
};

window.processUpload = () => {
    if (window.AdminUploader && typeof window.AdminUploader.saveFlashcardDeck === 'function') {
        window.AdminUploader.saveFlashcardDeck();
        return;
    }
    if (!window.app) return;
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('filePreview');
    const category = document.getElementById('uploadCategory')?.value || 'anatomia';
    const theme = document.getElementById('uploadTheme')?.value?.trim() || '';

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        window.app.showNotification('Selecione pelo menos um arquivo .txt', 'error');
        return;
    }

    const files = Array.from(fileInput.files);
    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const userId = window.app.currentUser?.id || 'user_anon';

    const readers = files.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, content: reader.result });
        reader.readAsText(file);
    }));

    Promise.all(readers).then(results => {
        let created = 0;
        let totalCards = 0;
        if (preview) preview.innerHTML = '';

        results.forEach(({ name, content }) => {
            const lines = String(content).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            const cards = [];
            lines.forEach(line => {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    cards.push({
                        id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2),
                        question: parts[0],
                        answer: parts[1],
                        explanation: parts[2] || '',
                        interval: 1,
                        repetitions: 0,
                        easeFactor: 2.5,
                        nextReview: new Date().toISOString().slice(0, 10),
                        reviews: []
                    });
                }
            });

            if (cards.length > 0) {
                const deck = {
                    id: 'deck_' + Date.now() + '_' + Math.random().toString(36).slice(2),
                    name: name.replace(/\.[^/.]+$/, ''),
                    description: 'Importado de arquivo ' + name,
                    category,
                    theme: theme || undefined,
                    userId,
                    created: new Date().toISOString(),
                    cards
                };
                decks.push(deck);
                created += 1;
                totalCards += cards.length;

                if (preview) {
                    const item = document.createElement('div');
                    item.textContent = `${name} — ${cards.length} cards`;
                    preview.appendChild(item);
                }
            }
        });

        localStorage.setItem('medFocusDecks', JSON.stringify(decks));
        window.app.showNotification(`Upload concluído: ${created} baralho(s), ${totalCards} cards.`, 'success');
        window.app.closeModal('flashcardUploadModal');
        if (window.app.currentDashboardView === 'flashcards') {
            window.app.loadFlashcards();
        }
        // If admin view, refresh grid
        window.app.loadAdminFlashcardsGrid?.();
    });
};

window.processQuizUpload = () => {
    if (window.AdminUploader && typeof window.AdminUploader.saveSimuladoDeck === 'function') {
        window.AdminUploader.saveSimuladoDeck();
        return;
    }
    console.warn('processQuizUpload chamado sem AdminUploader carregado.');
};

window.exportDecks = () => {
    const data = localStorage.getItem('medFocusDecks') || '[]';
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decks-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (window.app) window.app.showNotification('Exportação concluída.', 'success');
};

window.deleteUser = (userId) => {
    if (window.app) {
        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const idx = users.findIndex(u => u.id === userId);
        if (idx >= 0) {
            users.splice(idx, 1);
            localStorage.setItem('medFocusUsers', JSON.stringify(users));
            window.app.loadUsersTable();
            window.app.showNotification('Usuário excluído.', 'info');
        }
    }
};

// Admin deck helpers
window.openEditDeck = (deckId) => {
    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    // Open first card to edit as a starting point
    const first = deck.cards?.[0];
    if (!first) {
        window.app.showNotification('Este baralho não possui cards.', 'info');
        return;
    }
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('editDeckId', deck.id);
    set('editCardId', first.id);
    set('editQuestion', first.question || '');
    set('editAnswer', first.answer || '');
    set('editExplanation', first.explanation || '');
    const cat = document.getElementById('editCategory'); if (cat) cat.value = deck.category || 'anatomia';
    window.app.showModal('editFlashcardModal');
};

window.saveEditedFlashcard = () => {
    const deckId = document.getElementById('editDeckId')?.value;
    const cardId = document.getElementById('editCardId')?.value;
    const question = document.getElementById('editQuestion')?.value.trim();
    const answer = document.getElementById('editAnswer')?.value.trim();
    const explanation = document.getElementById('editExplanation')?.value.trim();
    const category = document.getElementById('editCategory')?.value || 'anatomia';
    if (!deckId || !cardId || !question || !answer) {
        window.app.showNotification('Preencha pergunta e resposta.', 'error');
        return;
    }
    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    deck.category = category;
    const card = deck.cards.find(c => c.id === cardId);
    if (!card) return;
    card.question = question;
    card.answer = answer;
    card.explanation = explanation;
    localStorage.setItem('medFocusDecks', JSON.stringify(decks));
    window.app.showNotification('Card atualizado.', 'success');
    window.app.closeModal('editFlashcardModal');
    window.app.loadAdminFlashcardsGrid();
};

window.deleteDeck = (deckId) => {
    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const filtered = decks.filter(d => d.id !== deckId);
    localStorage.setItem('medFocusDecks', JSON.stringify(filtered));
    window.app.loadAdminFlashcardsGrid?.();
    window.app.showNotification('Baralho excluído.', 'info');
};

// Password visibility toggle function
window.togglePasswordVisibility = function () {
    const passwordInput = document.getElementById('loginPassword');
    const toggleIcon = document.getElementById('passwordToggleIcon');

    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
};

// Debug functions (mantidos para diagnóstico futuro)
window.debugLogin = function () { /* ... */ };
window.forceCreateInitialUsers = function () { /* ... */ };
window.testLoginDirect = function () { /* ... */ };
window.debugAdminLogin = function () { /* ... */ };
window.forceCreateAdmin = function () { /* ... */ };
window.debugLoginStepByStep = function () { /* ... */ };
window.resetAllData = function () { /* ... */ };
window.checkDataState = function () { /* ... */ };
window.forceInitializeData = function () { /* ... */ };
window.debugCurrentUser = function() { /* ... */ };
window.forceShowAdminMenu = function() { /* ... */ };
window.quickFixAdminMenu = function() { /* ... */ };
window.deepDebugAdminMenu = function() { /* ... */ };
window.createAdminMenuManually = function() { /* ... */ };

// Restore missing users
window.restoreUsers = function() {
    console.log('=== RESTAURANDO USUÁRIOS ===');
    
    // Check current users
    const currentUsers = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
    console.log('Usuários atuais:', currentUsers.length);
    
    // Create default users if none exist
    const defaultUsers = [
        {
            id: "admin_001",
            name: "Administrador Sistema",
            email: "admin@medfocus.com",
            password: "admin123",
            role: "admin",
            plan: "premium",
            phone: "",
            isActive: true,
            created: new Date().toISOString(),
            lastLogin: null
        },
        {
            id: "user_001",
            name: "João Silva",
            email: "joao@email.com",
            password: "123456",
            role: "student",
            plan: "premium",
            phone: "(11) 99999-9999",
            isActive: true,
            created: new Date().toISOString(),
            lastLogin: null
        }
    ];
    
    // If no users exist, create default ones
    if (currentUsers.length === 0) {
        localStorage.setItem('medFocusUsers', JSON.stringify(defaultUsers));
        console.log('✅ Usuários padrão criados');
        alert('Usuários restaurados! Admin: admin@medfocus.com / admin123');
    } else {
        // Check if admin exists
        const adminExists = currentUsers.find(u => u.email === 'admin@medfocus.com');
        if (!adminExists) {
            // Add admin if missing
            currentUsers.push(defaultUsers[0]);
            localStorage.setItem('medFocusUsers', JSON.stringify(currentUsers));
            console.log('✅ Admin adicionado aos usuários existentes');
            alert('Admin restaurado! Email: admin@medfocus.com / Senha: admin123');
        } else {
            console.log('✅ Usuários já existem, incluindo admin');
        }
    }
    
    // Verify restoration
    const finalUsers = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
    console.log('Usuários finais:', finalUsers.length);
    console.log('Emails dos usuários:', finalUsers.map(u => u.email));
    
    console.log('=== FIM RESTAURAÇÃO ===');
};

// Funções adicionais para hierarquia
MedFocusApp.prototype.setupSelectionListeners = function() {
    // Não adicionar event listeners duplicados - usar onclick do HTML
    // Apenas inicializar o contador
    this.updateSelectionCounter();
};

MedFocusApp.prototype.toggleDeckSelection = function(deckId) {
    const deckElement = document.querySelector(`[data-deck-id="${deckId}"] .deck-item`);
    if (deckElement) {
        deckElement.classList.toggle('selected');
        this.updateSelectionCounter();
    }
};

MedFocusApp.prototype.updateSelectionCounter = function() {
    const selectedCount = document.querySelectorAll('.deck-item.selected').length;
    const counterElement = document.getElementById('selectedCount');
    if (counterElement) {
        counterElement.textContent = `(${selectedCount})`;
    }
    
    const studyBtn = document.getElementById('studySelectedBtn');
    if (studyBtn) {
        if (selectedCount === 0) {
            studyBtn.disabled = true;
            studyBtn.style.opacity = '0.6';
        } else {
            studyBtn.disabled = false;
            studyBtn.style.opacity = '1';
        }
    }
};

MedFocusApp.prototype.showCreateDeckModal = function() {
    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'createDeckModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Criar Novo Deck</h3>
                <button class="modal-close" onclick="app.closeCreateDeckModal()">&times;</button>
            </div>
            <form id="createDeckForm">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Nome do Deck (use :: para hierarquia)</label>
                        <input type="text" class="form-control" id="deckName" placeholder="Ex: 6º ano::Medicina interna::ERA 01" required>
                        <small class="form-text">Use :: para criar subdecks. Ex: Ano::Matéria::Tema</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoria</label>
                        <select class="form-control" id="deckCategory" required>
                            <option value="medicina">Medicina</option>
                            <option value="cirurgia">Cirurgia</option>
                            <option value="pediatria">Pediatria</option>
                            <option value="ginecologia">Ginecologia</option>
                            <option value="psiquiatria">Psiquiatria</option>
                            <option value="outros">Outros</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea class="form-control" id="deckDescription" rows="3" placeholder="Descrição do deck..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cards (um por linha, formato: Pergunta | Resposta | Explicação)</label>
                        <textarea class="form-control" id="flashcardsText" rows="6" placeholder="Pergunta | Resposta | Explicação&#10;Pergunta 2 | Resposta 2 | Explicação 2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn--outline" onclick="app.closeCreateDeckModal()">Cancelar</button>
                    <button type="submit" class="btn btn--primary">Criar Deck</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    // Adicionar event listener para o formulário
    document.getElementById('createDeckForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.createDeckWithHierarchy();
    });
};

MedFocusApp.prototype.closeCreateDeckModal = function() {
    const modal = document.getElementById('createDeckModal');
    if (modal) {
        modal.remove();
    }
};

MedFocusApp.prototype.createDeckWithHierarchy = function() {
    const name = document.getElementById('deckName').value.trim();
    const category = document.getElementById('deckCategory').value;
    const description = document.getElementById('deckDescription').value.trim();
    const flashcardsText = document.getElementById('flashcardsText').value.trim();

    if (!name || !category) {
        this.showNotification('Nome e categoria são obrigatórios!', 'error');
        return;
    }

    // Validar nome do deck para hierarquia
    if (window.DeckHierarchy) {
        const hierarchy = new DeckHierarchy();
        const validation = hierarchy.validateDeckName(name);
        if (!validation.valid) {
            this.showNotification(validation.error, 'error');
            return;
        }
    }

    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');

    const newDeck = {
        id: 'deck_' + Date.now(),
        name,
        category,
        description: description || `Deck de ${category}`,
        userId: this.currentUser.id,
        created: new Date().toISOString(),
        cards: []
    };

    // Parse flashcards text
    if (flashcardsText) {
        const lines = flashcardsText.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts.length >= 2) {
                newDeck.cards.push({
                    id: `card_${Date.now()}_${index}`,
                    question: parts[0].trim(),
                    answer: parts[1].trim(),
                    explanation: parts[2] ? parts[2].trim() : '',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                });
            }
        });
    }

    decks.push(newDeck);
    localStorage.setItem('medFocusDecks', JSON.stringify(decks));

    this.closeCreateDeckModal();
    this.loadFlashcards();
    this.showNotification(`Deck "${name}" criado com sucesso!`, 'success');
};

// === QUIZ MANAGEMENT ===
MedFocusApp.prototype.showCreateQuizModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'createQuizModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Criar Novo Simulado</h3>
                <button class="modal-close" onclick="app.closeCreateQuizModal()">&times;</button>
            </div>
            <form id="createQuizForm">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Título do Simulado</label>
                            <input type="text" class="form-control" id="quizTitle" placeholder="Ex: Simulado de Medicina Interna" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Matéria</label>
                            <select class="form-control" id="quizSubject" required>
                                <option value="medicina">Medicina</option>
                                <option value="cirurgia">Cirurgia</option>
                                <option value="pediatria">Pediatria</option>
                                <option value="ginecologia">Ginecologia</option>
                                <option value="psiquiatria">Psiquiatria</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tempo Limite (minutos)</label>
                            <input type="number" class="form-control" id="quizTimeLimit" value="30" min="5" max="300" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea class="form-control" id="quizDescription" rows="2" placeholder="Descrição do simulado..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Questões (formato: Pergunta | A) Opção A | B) Opção B | C) Opção C | D) Opção D | Resposta Correta | Explicação)</label>
                        <textarea class="form-control" id="quizQuestions" rows="8" placeholder="Pergunta | A) Opção A | B) Opção B | C) Opção C | D) Opção D | C | Explicação&#10;Pergunta 2 | A) Opção A | B) Opção B | C) Opção C | D) Opção D | A | Explicação 2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn--outline" onclick="app.closeCreateQuizModal()">Cancelar</button>
                    <button type="submit" class="btn btn--primary">Criar Simulado</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    document.getElementById('createQuizForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.createQuiz();
    });
};

MedFocusApp.prototype.closeCreateQuizModal = function() {
    const modal = document.getElementById('createQuizModal');
    if (modal) {
        modal.remove();
    }
};

MedFocusApp.prototype.createQuiz = function() {
    const title = document.getElementById('quizTitle').value.trim();
    const subject = document.getElementById('quizSubject').value;
    const timeLimit = parseInt(document.getElementById('quizTimeLimit').value);
    const description = document.getElementById('quizDescription').value.trim();
    const questionsText = document.getElementById('quizQuestions').value.trim();

    if (!title || !subject || !timeLimit) {
        this.showNotification('Título, matéria e tempo limite são obrigatórios!', 'error');
        return;
    }

    const questions = [];
    if (questionsText) {
        const lines = questionsText.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts.length >= 6) {
                questions.push({
                    id: `q_${Date.now()}_${index}`,
                    question: parts[0].trim(),
                    options: [
                        parts[1].trim(),
                        parts[2].trim(),
                        parts[3].trim(),
                        parts[4].trim()
                    ],
                    correct: parts[5].trim().toUpperCase(),
                    explanation: parts[6] ? parts[6].trim() : ''
                });
            }
        });
    }

    const quiz = {
        id: 'quiz_' + Date.now(),
        title,
        subject,
        timeLimit,
        description: description || `Simulado de ${this.getCategoryName(subject)}`,
        questions,
        created: new Date().toISOString(),
        userId: this.currentUser.id
    };

    const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
    quizzes.push(quiz);
    localStorage.setItem('medFocusQuizzes', JSON.stringify(quizzes));

    this.closeCreateQuizModal();
    this.loadQuizzes();
    this.showNotification(`Simulado "${title}" criado com sucesso!`, 'success');
};

MedFocusApp.prototype.editQuiz = function(quizId) {
    const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
    const quiz = quizzes.find(q => q.id === quizId);
    
    if (!quiz) {
        this.showNotification('Simulado não encontrado!', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editQuizModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Editar Simulado</h3>
                <button class="modal-close" onclick="app.closeEditQuizModal()">&times;</button>
            </div>
            <form id="editQuizForm">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Título do Simulado</label>
                            <input type="text" class="form-control" id="editQuizTitle" value="${quiz.title}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Matéria</label>
                            <select class="form-control" id="editQuizSubject" required>
                                <option value="medicina" ${quiz.subject === 'medicina' ? 'selected' : ''}>Medicina</option>
                                <option value="cirurgia" ${quiz.subject === 'cirurgia' ? 'selected' : ''}>Cirurgia</option>
                                <option value="pediatria" ${quiz.subject === 'pediatria' ? 'selected' : ''}>Pediatria</option>
                                <option value="ginecologia" ${quiz.subject === 'ginecologia' ? 'selected' : ''}>Ginecologia</option>
                                <option value="psiquiatria" ${quiz.subject === 'psiquiatria' ? 'selected' : ''}>Psiquiatria</option>
                                <option value="outros" ${quiz.subject === 'outros' ? 'selected' : ''}>Outros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tempo Limite (minutos)</label>
                            <input type="number" class="form-control" id="editQuizTimeLimit" value="${quiz.timeLimit}" min="5" max="300" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea class="form-control" id="editQuizDescription" rows="2">${quiz.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Questões (formato: Pergunta | A) Opção A | B) Opção B | C) Opção C | D) Opção D | Resposta Correta | Explicação)</label>
                        <textarea class="form-control" id="editQuizQuestions" rows="8">${this.formatQuestionsForEdit(quiz.questions)}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn--outline" onclick="app.closeEditQuizModal()">Cancelar</button>
                    <button type="submit" class="btn btn--primary">Salvar Alterações</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
    
    document.getElementById('editQuizForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateQuiz(quizId);
    });
};

MedFocusApp.prototype.closeEditQuizModal = function() {
    const modal = document.getElementById('editQuizModal');
    if (modal) {
        modal.remove();
    }
};

MedFocusApp.prototype.formatQuestionsForEdit = function(questions) {
    return questions.map(q => {
        return `${q.question} | ${q.options[0]} | ${q.options[1]} | ${q.options[2]} | ${q.options[3]} | ${q.correct} | ${q.explanation || ''}`;
    }).join('\n');
};

MedFocusApp.prototype.updateQuiz = function(quizId) {
    const title = document.getElementById('editQuizTitle').value.trim();
    const subject = document.getElementById('editQuizSubject').value;
    const timeLimit = parseInt(document.getElementById('editQuizTimeLimit').value);
    const description = document.getElementById('editQuizDescription').value.trim();
    const questionsText = document.getElementById('editQuizQuestions').value.trim();

    if (!title || !subject || !timeLimit) {
        this.showNotification('Título, matéria e tempo limite são obrigatórios!', 'error');
        return;
    }

    const questions = [];
    if (questionsText) {
        const lines = questionsText.split('\n').filter(line => line.trim());
        lines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts.length >= 6) {
                questions.push({
                    id: `q_${Date.now()}_${index}`,
                    question: parts[0].trim(),
                    options: [
                        parts[1].trim(),
                        parts[2].trim(),
                        parts[3].trim(),
                        parts[4].trim()
                    ],
                    correct: parts[5].trim().toUpperCase(),
                    explanation: parts[6] ? parts[6].trim() : ''
                });
            }
        });
    }

    const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
    const quizIndex = quizzes.findIndex(q => q.id === quizId);
    
    if (quizIndex !== -1) {
        quizzes[quizIndex] = {
            ...quizzes[quizIndex],
            title,
            subject,
            timeLimit,
            description: description || `Simulado de ${this.getCategoryName(subject)}`,
            questions
        };
        
        localStorage.setItem('medFocusQuizzes', JSON.stringify(quizzes));
        this.closeEditQuizModal();
        this.loadQuizzes();
        this.showNotification(`Simulado "${title}" atualizado com sucesso!`, 'success');
    }
};

MedFocusApp.prototype.deleteQuiz = function(quizId) {
    if (confirm('Tem certeza que deseja excluir este simulado?')) {
        const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
        const filteredQuizzes = quizzes.filter(q => q.id !== quizId);
        localStorage.setItem('medFocusQuizzes', JSON.stringify(filteredQuizzes));
        this.loadQuizzes();
        this.showNotification('Simulado excluído com sucesso!', 'success');
    }
};

MedFocusApp.prototype.importQuiz = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                this.parseImportedQuiz(content);
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

MedFocusApp.prototype.parseImportedQuiz = function(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const questions = [];
    
    lines.forEach((line, index) => {
        const parts = line.split('|');
        if (parts.length >= 6) {
            questions.push({
                id: `q_${Date.now()}_${index}`,
                question: parts[0].trim(),
                options: [
                    parts[1].trim(),
                    parts[2].trim(),
                    parts[3].trim(),
                    parts[4].trim()
                ],
                correct: parts[5].trim().toUpperCase(),
                explanation: parts[6] ? parts[6].trim() : ''
            });
        }
    });

    if (questions.length > 0) {
        const quiz = {
            id: 'quiz_' + Date.now(),
            title: 'Simulado Importado',
            subject: 'medicina',
            timeLimit: 30,
            description: 'Simulado importado de arquivo',
            questions,
            created: new Date().toISOString(),
            userId: this.currentUser.id
        };

        const quizzes = JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
        quizzes.push(quiz);
        localStorage.setItem('medFocusQuizzes', JSON.stringify(quizzes));
        
        this.loadQuizzes();
        this.showNotification(`Simulado importado com sucesso! ${questions.length} questões adicionadas.`, 'success');
    } else {
        this.showNotification('Nenhuma questão válida encontrada no arquivo!', 'error');
    }
};

// === FLASHCARD EXPORT ===
MedFocusApp.prototype.exportFlashcards = function() {
    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const userDecks = this.currentUser.role === 'admin'
        ? decks
        : decks.filter(d => d.userId === this.currentUser.id);

    if (userDecks.length === 0) {
        this.showNotification('Nenhum deck encontrado para exportar!', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'exportModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Exportar Flashcards</h3>
                <button class="modal-close" onclick="app.closeExportModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Selecione os decks para exportar:</label>
                    <div class="export-decks-list">
                        ${userDecks.map(deck => `
                            <label class="checkbox-item">
                                <input type="checkbox" value="${deck.id}" checked>
                                <span>${deck.name} (${deck.cards?.length || 0} cards)</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Formato de exportação:</label>
                    <select class="form-control" id="exportFormat">
                        <option value="csv">CSV (Excel/Google Sheets)</option>
                        <option value="txt">TXT (Anki/Outros)</option>
                        <option value="json">JSON (Backup completo)</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn--outline" onclick="app.closeExportModal()">Cancelar</button>
                <button class="btn btn--primary" onclick="app.downloadExport()">Exportar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.remove('hidden');
};

MedFocusApp.prototype.closeExportModal = function() {
    const modal = document.getElementById('exportModal');
    if (modal) {
        modal.remove();
    }
};

MedFocusApp.prototype.downloadExport = function() {
    const selectedDecks = Array.from(document.querySelectorAll('#exportModal input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    const format = document.getElementById('exportFormat').value;
    
    if (selectedDecks.length === 0) {
        this.showNotification('Selecione pelo menos um deck!', 'error');
        return;
    }

    const decks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const selectedDeckData = decks.filter(d => selectedDecks.includes(d.id));
    
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
        case 'csv':
            content = this.exportToCSV(selectedDeckData);
            filename = `medfocus-flashcards-${new Date().toISOString().split('T')[0]}.csv`;
            mimeType = 'text/csv';
            break;
        case 'txt':
            content = this.exportToTXT(selectedDeckData);
            filename = `medfocus-flashcards-${new Date().toISOString().split('T')[0]}.txt`;
            mimeType = 'text/plain';
            break;
        case 'json':
            content = JSON.stringify(selectedDeckData, null, 2);
            filename = `medfocus-flashcards-${new Date().toISOString().split('T')[0]}.json`;
            mimeType = 'application/json';
            break;
    }

    this.downloadFile(content, filename, mimeType);
    this.closeExportModal();
    this.showNotification('Flashcards exportados com sucesso!', 'success');
};

// === QUIZ TIME TRACKING ===
MedFocusApp.prototype.saveQuizTime = function(timeSpentSeconds, quizTitle) {
    const today = new Date().toISOString().split('T')[0];
    const stats = JSON.parse(localStorage.getItem('medFocusStats') || '{}');
    
    if (!stats[today]) {
        stats[today] = {
            date: today,
            flashcardsTime: 0,
            quizzesTime: 0,
            totalTime: 0,
            sessions: 0,
            cardsStudied: 0,
            quizzesCompleted: 0,
            quizDetails: []
        };
    }
    
    const dayStats = stats[today];
    dayStats.quizzesTime += timeSpentSeconds;
    dayStats.totalTime = dayStats.flashcardsTime + dayStats.quizzesTime;
    dayStats.quizzesCompleted += 1;
    
    // Salvar detalhes do simulado
    if (!dayStats.quizDetails) {
        dayStats.quizDetails = [];
    }
    
    dayStats.quizDetails.push({
        title: quizTitle,
        timeSpent: timeSpentSeconds,
        completedAt: new Date().toISOString()
    });
    
    localStorage.setItem('medFocusStats', JSON.stringify(stats));
    
    // Atualizar overview se estiver visível
    if (this.updateOverviewStats) {
        this.updateOverviewStats();
    }
    
    console.log(`Tempo de simulado salvo: ${Math.floor(timeSpentSeconds / 60)}:${(timeSpentSeconds % 60).toString().padStart(2, '0')} - ${quizTitle}`);
};

MedFocusApp.prototype.exportToCSV = function(decks) {
    let csv = 'Deck,Pergunta,Resposta,Explicação\n';
    
    decks.forEach(deck => {
        deck.cards?.forEach(card => {
            csv += `"${deck.name}","${card.question}","${card.answer}","${card.explanation || ''}"\n`;
        });
    });
    
    return csv;
};

MedFocusApp.prototype.exportToTXT = function(decks) {
    let txt = '';
    
    decks.forEach(deck => {
        txt += `# ${deck.name}\n`;
        txt += `# ${deck.description || ''}\n\n`;
        
        deck.cards?.forEach(card => {
            txt += `${card.question} | ${card.answer} | ${card.explanation || ''}\n`;
        });
        
        txt += '\n---\n\n';
    });
    
    return txt;
};

MedFocusApp.prototype.downloadFile = function(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MedFocusApp();
    });
} else {
    new MedFocusApp();
}

