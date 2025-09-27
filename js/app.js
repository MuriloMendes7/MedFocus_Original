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
        
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize data
        this.initializeData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load theme
        this.loadTheme();
        
        // Check authentication after short delay
        setTimeout(() => {
            this.checkAuth();
            this.hideLoadingScreen();
        }, 1500);
    }

    // === DATA INITIALIZATION ===
    initializeData() {
        if (!localStorage.getItem('medFocusUsers')) {
            const initialUsers = [
                {
                    id: "admin_001",
                    name: "Administrador Sistema",
                    email: "admin@medfocus.com",
                    password: "admin123",
                    role: "admin",
                    plan: "premium",
                    phone: "",
                    isActive: true,
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
                            answer: "Entre átrio e ventículo esquerdos",
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
                    "2025-09-01": {reviews: 12, correct: 10, timeSpent: 180},
                    "2025-09-02": {reviews: 8, correct: 6, timeSpent: 240},
                    "2025-09-03": {reviews: 15, correct: 13, timeSpent: 320},
                    "2025-09-04": {reviews: 6, correct: 5, timeSpent: 150},
                    "2025-09-05": {reviews: 10, correct: 8, timeSpent: 200},
                    "2025-09-06": {reviews: 14, correct: 12, timeSpent: 280},
                    "2025-09-07": {reviews: 5, correct: 5, timeSpent: 120}
                },
                "admin_001": {
                    "2025-09-05": {reviews: 20, correct: 18, timeSpent: 360},
                    "2025-09-06": {reviews: 16, correct: 14, timeSpent: 300},
                    "2025-09-07": {reviews: 8, correct: 7, timeSpent: 180}
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
            this.showPage('dashboardPage');
            this.updateUIForLoggedUser();
        } else {
            this.showPage('homePage');
            this.updateUIForGuest();
        }
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorDiv = document.getElementById('loginError');

        if (!email || !password) {
            this.showError(errorDiv, 'Por favor, preencha todos os campos!');
            return;
        }

        const users = JSON.parse(localStorage.getItem('medFocusUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user && user.isActive) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            const userIndex = users.findIndex(u => u.id === user.id);
            users[userIndex] = user;
            localStorage.setItem('medFocusUsers', JSON.stringify(users));

            this.currentUser = user;
            localStorage.setItem('medFocusCurrentUser', JSON.stringify(user));
            
            this.showPage('dashboardPage');
            this.updateUIForLoggedUser();
            this.showNotification('Login realizado com sucesso!', 'success');
        } else {
            this.showError(errorDiv, 'Email ou senha incorretos!');
        }
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
        
        this.showPage('dashboardPage');
        this.updateUIForLoggedUser();
        this.showNotification('Cadastro realizado com sucesso!', 'success');
    }

    logout() {
        localStorage.removeItem('medFocusCurrentUser');
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
        
        // Show admin menu if admin
        const adminMenuItem = document.querySelector('.admin-only');
        if (adminMenuItem && this.currentUser.role === 'admin') {
            adminMenuItem.classList.remove('hidden');
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

    createDeck() {
        const name = document.getElementById('deckName').value.trim();
        const category = document.getElementById('deckCategory').value;
        const theme = (document.getElementById('deckTheme')?.value || '').trim();
        const flashcardsText = document.getElementById('flashcardsText').value.trim();
        
        if (!name || !category) {
            this.showNotification('Nome e categoria são obrigatórios!', 'error');
            return;
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
            this.showNotification('Baralho não encontrado ou vazio!', 'error');
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
                this.showNotification('Nenhum card disponível neste baralho.', 'info');
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
        
        const buttons = [
            { element: document.querySelector('.again-btn small'), interval: intervals.again },
            { element: document.querySelector('.hard-btn small'), interval: intervals.hard },
            { element: document.querySelector('.good-btn small'), interval: intervals.good },
            { element: document.querySelector('.easy-btn small'), interval: intervals.easy }
        ];
        
        buttons.forEach(button => {
            if (button.element) {
                button.element.textContent = this.formatInterval(button.interval);
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
        
        // Again (quality 1)
        intervals.again = 1;
        
        // Hard (quality 2)
        if (card.repetitions === 0) {
            intervals.hard = 1;
        } else {
            intervals.hard = Math.max(1, Math.round(card.interval * 1.2));
        }
        
        // Good (quality 3)
        if (card.repetitions === 0) {
            intervals.good = 1;
        } else if (card.repetitions === 1) {
            intervals.good = 6;
        } else {
            intervals.good = Math.round(card.interval * card.easeFactor);
        }
        
        // Easy (quality 4)
        if (card.repetitions === 0) {
            intervals.easy = 4;
        } else {
            intervals.easy = Math.round(intervals.good * card.easeFactor * 1.3);
        }
        
        return intervals;
    }

    formatInterval(days) {
        if (days < 1) {
            return '<1 dia';
        } else if (days === 1) {
            return '1 dia';
        } else if (days < 30) {
            return `${days} dias`;
        } else if (days < 365) {
            const months = Math.round(days / 30);
            return `${months} ${months === 1 ? 'más' : 'meses'}`;
        } else {
            const years = Math.round(days / 365);
            return `${years} ${years === 1 ? 'ano' : 'anos'}`;
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
        const oldCard = {...card}; // Store previous state
        
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
        
        const duration = Math.round((new Date() - this.studySession.startTime) / 1000 / 60);
        const reviewed = this.studySession.reviewed;
        
        this.showNotification(
            `Sessão concluída! ${reviewed} cards estudados em ${duration} minutos.`,
            'success'
        );
        
        this.studySession = null;
        this.showPage('dashboardPage');
        this.showDashboardView('flashcards');
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
            container.innerHTML = '<div class="empty-state">Nenhum simulado encontrado.</div>';
            return;
        }
        
        let html = '';
        userQuizzes.forEach(quiz => {
            html += `
                <div class="quiz-card" onclick="app.startQuiz('${quiz.id}')">
                    <div class="quiz-header">
                        <span class="quiz-subject">${this.getCategoryName(quiz.subject)}</span>
                    </div>
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
            this.showNotification('Simulado não encontrado ou vazio!', 'error');
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
        
        this.showPage('quizResultsPage');
        this.showNotification(`Quiz concluído! Pontuação: ${percentage}%`, percentage >= 70 ? 'success' : 'info');
    }

    reviewQuiz() {
        if (!this.quizSession) return;
        const container = document.getElementById("quizReviewContainer");
        if (!container) return;
        const quiz = this.quizSession.quiz;
        container.innerHTML = "";
        quiz.questions.forEach((q, idx) => {
            const user = this.quizSession.answers[q.id];
            const correct = q.correct;
            const block = document.createElement("div");
            block.className = "quiz-card";
            const optionsHtml = q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                let cls = "option";
                if (letter === correct) cls += " correct";
                if (user && letter === user && user !== correct) cls += " wrong";
                return `<div class="${cls}" style="padding:8px;border-radius:8px;border:1px solid var(--color-card-border);margin-bottom:6px;"><strong style="margin-right:8px;">${letter})</strong> ${opt}</div>`;
            }).join("");
            block.innerHTML = `<div class="question-text" style="margin-bottom:8px;">${idx + 1}. ${q.question}</div>${optionsHtml}<div class="answer-explanation" style="margin-top:8px;">${q.explanation || ""}</div>`;
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
        const table = document.getElementById('usersTable');
        if (!table) return;
        
        let html = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Funo</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th>Último Login</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        users.forEach(user => {
            const lastLogin = new Date(user.lastLogin).toLocaleDateString('pt-BR');
            const statusClass = user.isActive ? 'success' : 'error';
            const statusText = user.isActive ? 'Ativo' : 'Inativo';
            
            html += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${user.plan}</td>
                    <td><span class="status status--${statusClass}">${statusText}</span></td>
                    <td>${lastLogin}</td>
                    <td>
                        <button class="btn btn--outline btn--sm" onclick="deleteUser('${user.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody>';
        table.innerHTML = html;
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
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('medFocusTheme', newTheme);
        
        this.showNotification(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, 'info');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('medFocusTheme') || 'light';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
    }

    // === NOTIFICATION SYSTEM ===
    showNotification(message, type = 'info') {
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
    if (window.app) {
        window.app.reviewQuiz();
    }
};

window.switchAdminTab = (tab, btn) => {
    if (window.app) {
        window.app.switchAdminTab(tab, btn);
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
                    item.textContent = `${name} &mdash; ${cards.length} cards`;
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

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MedFocusApp();
    });
} else {
    new MedFocusApp();
}
