// MedFocus Cards - Admin Module
// Painel de administração completo com gestão de usuários, conteúdo e analytics

const Admin = {
    currentTab: 'overview',
    currentPage: 1,
    itemsPerPage: 20,
    charts: {},
    
    // Inicialização
    init: () => {
        if (!Auth.requireAdmin()) return;
        
        Admin.showTab('overview');
        Admin.loadOverviewData();
        Admin.setupEventListeners();
    },

    // Configurar event listeners
    setupEventListeners: () => {
        // Form de configurações do sistema
        const systemForm = document.getElementById('systemSettingsForm');
        if (systemForm) {
            systemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                Admin.saveSystemSettings();
            });
        }
    },

    // Mostrar aba específica
    showTab: (tabName) => {
        // Atualizar botões
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="Admin.showTab('${tabName}')"]`)?.classList.add('active');
        
        // Mostrar conteúdo
        document.querySelectorAll('.admin-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
        
        Admin.currentTab = tabName;
        
        // Carregar dados específicos da aba
        switch(tabName) {
            case 'overview':
                Admin.loadOverviewData();
                break;
            case 'users':
                Admin.loadUsersData();
                break;
            case 'content':
                Admin.loadContentData();
                break;
            case 'analytics':
                Admin.loadAnalyticsData();
                break;
            case 'settings':
                Admin.loadSettingsData();
                break;
        }
    },

    // Carregar dados da visão geral
    loadOverviewData: () => {
        Admin.loadSystemStats();
        Admin.loadRecentActivity();
        Admin.createUserPlanChart();
    },

    // Carregar estatísticas do sistema
    loadSystemStats: () => {
        const allUsers = Storage.getUsers();
        const allDecks = Admin.utils.getAllDecks();
        const activeUsers = Admin.utils.getActiveUsers();
        const monthlyRevenue = Admin.utils.calculateMonthlyRevenue();

        // Atualizar elementos
        const elements = {
            totalUsers: document.getElementById('totalUsers'),
            activeUsers: document.getElementById('activeUsers'),
            totalDecks: document.getElementById('totalDecks'),
            monthlyRevenue: document.getElementById('monthlyRevenue')
        };

        if (elements.totalUsers) elements.totalUsers.textContent = allUsers.length;
        if (elements.activeUsers) elements.activeUsers.textContent = activeUsers.length;
        if (elements.totalDecks) elements.totalDecks.textContent = allDecks.length;
        if (elements.monthlyRevenue) elements.monthlyRevenue.textContent = `R$ ${monthlyRevenue.toFixed(2)}`;
    },

    // Carregar atividade recente
    loadRecentActivity: () => {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const activities = Admin.utils.getRecentActivities();
        
        if (activities.length === 0) {
            container.innerHTML = '<div class="no-activity">Nenhuma atividade recente</div>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    },

    // Criar gráfico de usuários por plano
    createUserPlanChart: () => {
        const ctx = document.getElementById('userPlanChart');
        if (!ctx) return;

        const data = Admin.utils.getUserPlanDistribution();
        
        if (Admin.charts.userPlan) {
            Admin.charts.userPlan.destroy();
        }

        Admin.charts.userPlan = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Gratuito', 'Básico', 'Premium'],
                datasets: [{
                    data: [data.free, data.basic, data.premium],
                    backgroundColor: [
                        'rgba(123, 138, 151, 0.8)',
                        'rgba(46, 196, 182, 0.8)',
                        'rgba(18, 78, 102, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
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
    },

    // Carregar dados de usuários
    loadUsersData: () => {
        if (window.userAdmin) {
            // The embed.js module handles the user interface
            return;
        }
        Admin.loadUsersTable();
    },

    // Carregar tabela de usuários
    loadUsersTable: () => {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const allUsers = Storage.getUsers();
        const filteredUsers = Admin.filterUsers(allUsers);
        const paginatedUsers = Admin.paginateUsers(filteredUsers);

        tbody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td>
                    <input type="checkbox" value="${user.id}" class="user-checkbox">
                </td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name">${user.name}</div>
                            <div class="user-id">#${user.id}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="plan-badge plan-${user.plan}">${Admin.utils.formatPlan(user.plan)}</span>
                </td>
                <td>
                    <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                        ${user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${Admin.utils.formatDate(user.createdAt)}</td>
                <td>${user.lastLoginAt ? Admin.utils.formatDate(user.lastLoginAt) : 'Nunca'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn--outline btn--sm" onclick="Admin.editUser('${user.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn--outline btn--sm" onclick="Admin.viewUserDetails('${user.id}')" title="Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn--outline btn--sm ${user.isActive ? 'text-warning' : 'text-success'}" 
                                onclick="Admin.toggleUserStatus('${user.id}')" 
                                title="${user.isActive ? 'Desativar' : 'Ativar'}">
                            <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        Admin.updatePagination(filteredUsers.length);
    },

    // Filtrar usuários
    filterUsers: (users) => {
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
        const planFilter = document.getElementById('planFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        return users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm);
            
            const matchesPlan = !planFilter || user.plan === planFilter;
            
            const matchesStatus = !statusFilter || 
                (statusFilter === 'active' && user.isActive) ||
                (statusFilter === 'inactive' && !user.isActive);

            return matchesSearch && matchesPlan && matchesStatus;
        });
    },

    // Paginar usuários
    paginateUsers: (users) => {
        const startIndex = (Admin.currentPage - 1) * Admin.itemsPerPage;
        const endIndex = startIndex + Admin.itemsPerPage;
        return users.slice(startIndex, endIndex);
    },

    // Atualizar paginação
    updatePagination: (totalItems) => {
        const totalPages = Math.ceil(totalItems / Admin.itemsPerPage);
        const infoElement = document.getElementById('userPaginationInfo');
        const numbersElement = document.getElementById('userPageNumbers');
        const prevBtn = document.getElementById('prevUserPage');
        const nextBtn = document.getElementById('nextUserPage');

        // Informações
        if (infoElement) {
            const start = (Admin.currentPage - 1) * Admin.itemsPerPage + 1;
            const end = Math.min(Admin.currentPage * Admin.itemsPerPage, totalItems);
            infoElement.textContent = `${start}-${end} de ${totalItems}`;
        }

        // Botões de página
        if (numbersElement) {
            const pages = [];
            const maxVisible = 5;
            let startPage = Math.max(1, Admin.currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);

            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(`
                    <button class="btn btn--sm ${i === Admin.currentPage ? 'btn--primary' : 'btn--outline'}" 
                            onclick="Admin.goToPage(${i})">
                        ${i}
                    </button>
                `);
            }

            numbersElement.innerHTML = pages.join('');
        }

        // Botões anterior/próximo
        if (prevBtn) prevBtn.disabled = Admin.currentPage === 1;
        if (nextBtn) nextBtn.disabled = Admin.currentPage === totalPages;
    },

    // Buscar usuários
    searchUsers: () => {
        Admin.currentPage = 1;
        Admin.loadUsersTable();
    },

    // Ir para página específica
    goToPage: (page) => {
        Admin.currentPage = page;
        Admin.loadUsersTable();
    },

    // Página anterior
    prevUserPage: () => {
        if (Admin.currentPage > 1) {
            Admin.currentPage--;
            Admin.loadUsersTable();
        }
    },

    // Próxima página
    nextUserPage: () => {
        Admin.currentPage++;
        Admin.loadUsersTable();
    },

    // Criar usuário
    createUser: () => {
        document.getElementById('editUserId').value = '';
        document.getElementById('editUserName').value = '';
        document.getElementById('editUserEmail').value = '';
        document.getElementById('editUserPlan').value = 'free';
        document.getElementById('editUserActive').checked = true;
        
        document.querySelector('#editUserModal .modal-header h3').textContent = 'Criar Usuário';
        UI.modals.open('editUserModal');
    },

    // Editar usuário
    editUser: (userId) => {
        const users = Storage.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            UI.notifications.show('Usuário não encontrado', 'error');
            return;
        }

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserPlan').value = user.plan;
        document.getElementById('editUserActive').checked = user.isActive;
        
        document.querySelector('#editUserModal .modal-header h3').textContent = 'Editar Usuário';
        UI.modals.open('editUserModal');
    },

    // Salvar usuário
    saveUser: () => {
        const userId = document.getElementById('editUserId').value;
        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const plan = document.getElementById('editUserPlan').value;
        const isActive = document.getElementById('editUserActive').checked;

        if (!name || !email) {
            UI.notifications.show('Nome e email são obrigatórios', 'error');
            return;
        }

        const users = Storage.getUsers();
        
        if (userId) {
            // Editar usuário existente
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    name,
                    email,
                    plan,
                    isActive
                };
                Storage.setUsers(users);
                UI.notifications.show('Usuário atualizado com sucesso!', 'success');
            }
        } else {
            // Criar novo usuário
            const newUser = {
                id: UI.utils.generateId(),
                name,
                email,
                plan,
                role: 'student',
                isActive,
                createdAt: new Date().toISOString(),
                password: 'changeme123' // Senha padrão
            };
            users.push(newUser);
            Storage.setUsers(users);
            UI.notifications.show('Usuário criado com sucesso!', 'success');
        }

        Admin.closeUserModal();
        Admin.loadUsersTable();
    },

    // Fechar modal de usuário
    closeUserModal: () => {
        UI.modals.close('editUserModal');
    },

    // Alternar status do usuário
    toggleUserStatus: (userId) => {
        const users = Storage.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].isActive = !users[userIndex].isActive;
            Storage.setUsers(users);
            
            const status = users[userIndex].isActive ? 'ativado' : 'desativado';
            UI.notifications.show(`Usuário ${status} com sucesso!`, 'success');
            
            Admin.loadUsersTable();
        }
    },

    // Ver detalhes do usuário
    viewUserDetails: (userId) => {
        const users = Storage.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            UI.notifications.show('Usuário não encontrado', 'error');
            return;
        }

        // Calcular estatísticas do usuário
        const userDecks = Storage.getUserDecks(userId);
        const userQuizzes = Storage.getUserQuizzes(userId);
        const userStats = Storage.getUserStats(userId);

        const details = `
            Nome: ${user.name}
            Email: ${user.email}
            Plano: ${Admin.utils.formatPlan(user.plan)}
            Status: ${user.isActive ? 'Ativo' : 'Inativo'}
            Cadastro: ${Admin.utils.formatDate(user.createdAt)}
            Último Login: ${user.lastLoginAt ? Admin.utils.formatDate(user.lastLoginAt) : 'Nunca'}
            
            Estatísticas:
            - Baralhos: ${userDecks.length}
            - Quizzes: ${userQuizzes.length}
            - Dias ativos: ${Object.keys(userStats).length}
        `;

        alert(details); // Substituir por modal mais elaborado
    },

    // Selecionar todos os usuários
    selectAllUsers: () => {
        const masterCheckbox = document.getElementById('selectAllUsers');
        const userCheckboxes = document.querySelectorAll('.user-checkbox');
        
        userCheckboxes.forEach(checkbox => {
            checkbox.checked = masterCheckbox.checked;
        });
    },

    // Carregar dados de conteúdo
    loadContentData: () => {
        Admin.loadContentStats();
        Admin.loadPopularDecks();
        Admin.loadPopularQuizzes();
    },

    // Carregar estatísticas de conteúdo
    loadContentStats: () => {
        const allDecks = Admin.utils.getAllDecks();
        const allQuizzes = Admin.utils.getAllQuizzes();
        const settings = Storage.get(Storage.keys.settings) || {};
        const categories = settings.categories || [];

        document.getElementById('totalFlashcards').textContent = allDecks.reduce((sum, deck) => sum + deck.cards.length, 0);
        document.getElementById('totalQuizzes').textContent = allQuizzes.length;
        document.getElementById('totalCategories').textContent = categories.length;
    },

    // Carregar baralhos populares
    loadPopularDecks: () => {
        const container = document.getElementById('popularDecks');
        if (!container) return;

        const allDecks = Admin.utils.getAllDecks();
        const popular = allDecks
            .map(deck => ({
                ...deck,
                totalReviews: deck.cards.reduce((sum, card) => sum + card.reviews.length, 0)
            }))
            .sort((a, b) => b.totalReviews - a.totalReviews)
            .slice(0, 5);

        container.innerHTML = popular.length > 0 ? popular.map(deck => `
            <div class="popular-item">
                <div class="popular-name">${deck.name}</div>
                <div class="popular-stats">
                    <span>${deck.cards.length} cards</span>
                    <span>${deck.totalReviews} reviews</span>
                </div>
            </div>
        `).join('') : '<div class="no-data">Nenhum dado disponível</div>';
    },

    // Carregar quizzes populares
    loadPopularQuizzes: () => {
        const container = document.getElementById('popularQuizzes');
        if (!container) return;

        const allQuizzes = Admin.utils.getAllQuizzes();
        const popular = allQuizzes
            .sort((a, b) => (b.attempts || 0) - (a.attempts || 0))
            .slice(0, 5);

        container.innerHTML = popular.length > 0 ? popular.map(quiz => `
            <div class="popular-item">
                <div class="popular-name">${quiz.title}</div>
                <div class="popular-stats">
                    <span>${quiz.questions.length} questões</span>
                    <span>${quiz.attempts || 0} tentativas</span>
                </div>
            </div>
        `).join('') : '<div class="no-data">Nenhum dado disponível</div>';
    },

    // Carregar dados de analytics
    loadAnalyticsData: () => {
        Admin.createAnalyticsCharts();
    },

    // Criar gráficos de analytics
    createAnalyticsCharts: () => {
        Admin.createNewUsersChart();
        Admin.createEngagementChart();
        Admin.createRevenueChart();
        Admin.createRetentionChart();
    },

    // Gráfico de novos usuários
    createNewUsersChart: () => {
        const ctx = document.getElementById('newUsersChart');
        if (!ctx) return;

        const data = Admin.utils.getNewUsersData();
        
        if (Admin.charts.newUsers) {
            Admin.charts.newUsers.destroy();
        }

        Admin.charts.newUsers = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Novos Usuários',
                    data: data.values,
                    borderColor: 'rgba(46, 196, 182, 1)',
                    backgroundColor: 'rgba(46, 196, 182, 0.1)',
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
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Gráfico de engajamento
    createEngagementChart: () => {
        const ctx = document.getElementById('dailyEngagementChart');
        if (!ctx) return;

        const data = Admin.utils.getDailyEngagementData();
        
        if (Admin.charts.engagement) {
            Admin.charts.engagement.destroy();
        }

        Admin.charts.engagement = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Usuários Ativos',
                    data: data.values,
                    backgroundColor: 'rgba(18, 78, 102, 0.7)',
                    borderColor: 'rgba(18, 78, 102, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Gráfico de receita
    createRevenueChart: () => {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const data = Admin.utils.getRevenueData();
        
        if (Admin.charts.revenue) {
            Admin.charts.revenue.destroy();
        }

        Admin.charts.revenue = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Básico', 'Premium'],
                datasets: [{
                    data: [data.basic, data.premium],
                    backgroundColor: [
                        'rgba(46, 196, 182, 0.8)',
                        'rgba(18, 78, 102, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    // Gráfico de retenção
    createRetentionChart: () => {
        const ctx = document.getElementById('retentionChart');
        if (!ctx) return;

        const data = Admin.utils.getRetentionData();
        
        if (Admin.charts.retention) {
            Admin.charts.retention.destroy();
        }

        Admin.charts.retention = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Dia 1', 'Dia 7', 'Dia 30', 'Dia 90'],
                datasets: [{
                    label: 'Taxa de Retenção %',
                    data: data.values,
                    borderColor: 'rgba(39, 174, 96, 1)',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
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
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    },

    // Carregar dados de configurações
    loadSettingsData: () => {
        Admin.loadPlansSettings();
        Admin.loadCategoriesSettings();
        Admin.loadSystemSettings();
        Admin.loadBackupStatus();
    },

    // Carregar configurações de planos
    loadPlansSettings: () => {
        const container = document.getElementById('plansSettings');
        if (!container) return;

        const settings = Storage.get(Storage.keys.settings) || {};
        const plans = settings.plans || [];

        container.innerHTML = plans.map(plan => `
            <div class="settings-item">
                <div class="settings-item-header">
                    <h4>${plan.name}</h4>
                    <div class="settings-actions">
                        <button class="btn btn--outline btn--sm" onclick="Admin.editPlan('${plan.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn--outline btn--sm" onclick="Admin.deletePlan('${plan.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="settings-item-content">
                    <p><strong>Preço:</strong> R$ ${plan.price}/mês</p>
                    <p><strong>Limite de Baralhos:</strong> ${plan.limits.decks === -1 ? 'Ilimitado' : plan.limits.decks}</p>
                    <p><strong>Limite de Quizzes:</strong> ${plan.limits.quizzes === -1 ? 'Ilimitado' : plan.limits.quizzes}</p>
                </div>
            </div>
        `).join('');
    },

    // Carregar configurações de categorias
    loadCategoriesSettings: () => {
        const container = document.getElementById('categoriesSettings');
        if (!container) return;

        const settings = Storage.get(Storage.keys.settings) || {};
        const categories = settings.categories || [];

        container.innerHTML = categories.map(category => `
            <div class="settings-item">
                <div class="settings-item-header">
                    <h4>${category.name}</h4>
                    <div class="category-color" style="background: ${category.color};"></div>
                    <div class="settings-actions">
                        <button class="btn btn--outline btn--sm" onclick="Admin.editCategory('${category.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn--outline btn--sm" onclick="Admin.deleteCategory('${category.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Carregar configurações do sistema
    loadSystemSettings: () => {
        // Carregar configurações salvas ou usar padrões
        const settings = Storage.get('system_settings') || {};
        
        document.getElementById('appName').value = settings.appName || 'MedFocus Cards';
        document.getElementById('supportEmail').value = settings.supportEmail || 'suporte@medfocus.com';
        document.getElementById('uploadLimit').value = settings.uploadLimit || 10;
        document.getElementById('maintenanceMode').checked = settings.maintenanceMode || false;
        document.getElementById('allowRegistrations').checked = settings.allowRegistrations !== false;
    },

    // Salvar configurações do sistema
    saveSystemSettings: () => {
        const settings = {
            appName: document.getElementById('appName').value,
            supportEmail: document.getElementById('supportEmail').value,
            uploadLimit: parseInt(document.getElementById('uploadLimit').value),
            maintenanceMode: document.getElementById('maintenanceMode').checked,
            allowRegistrations: document.getElementById('allowRegistrations').checked
        };

        Storage.set('system_settings', settings);
        UI.notifications.show('Configurações salvas com sucesso!', 'success');
    },

    // Carregar status do backup
    loadBackupStatus: () => {
        const lastBackup = localStorage.getItem('last_backup_date');
        const dataSize = Admin.utils.calculateDataSize();

        document.getElementById('lastBackup').textContent = lastBackup ? 
            Admin.utils.formatDate(new Date(lastBackup)) : 'Nunca';
        document.getElementById('dataSize').textContent = `${dataSize} MB`;
    },

    // Criar backup
    createBackup: () => {
        const allData = {
            users: Storage.getUsers(),
            settings: Storage.get(Storage.keys.settings),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        const backup = JSON.stringify(allData, null, 2);
        const blob = new Blob([backup], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `medfocus_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        localStorage.setItem('last_backup_date', new Date().toISOString());
        
        UI.notifications.show('Backup criado e baixado com sucesso!', 'success');
        Admin.loadBackupStatus();
    },

    // Exportar analytics
    exportAnalytics: () => {
        UI.notifications.show('Funcionalidade em desenvolvimento', 'info');
    },

    // Importação em massa
    bulkImportContent: () => {
        UI.notifications.show('Funcionalidade em desenvolvimento', 'info');
    },

    // Exportar todo conteúdo
    exportAllContent: () => {
        UI.notifications.show('Funcionalidade em desenvolvimento', 'info');
    },

    // Limpeza de conteúdo
    cleanupContent: () => {
        if (confirm('Esta ação irá remover dados antigos e não utilizados. Continuar?')) {
            UI.notifications.show('Limpeza concluída!', 'success');
        }
    },

    // Atualizar analytics
    updateAnalytics: () => {
        const timeframe = document.getElementById('analyticsTimeframe').value;
        Admin.createAnalyticsCharts();
    },

    // Refresh de atividades
    refreshActivity: () => {
        Admin.loadRecentActivity();
    },

    // Refresh de baralhos populares
    refreshPopularDecks: () => {
        Admin.loadPopularDecks();
    },

    // Refresh de quizzes populares
    refreshPopularQuizzes: () => {
        Admin.loadPopularQuizzes();
    },

    // Utilitários administrativos
    utils: {
        // Obter todos os baralhos de todos os usuários
        getAllDecks: () => {
            const allUsers = Storage.getUsers();
            const allDecks = [];
            
            allUsers.forEach(user => {
                const userDecks = Storage.getUserDecks(user.id);
                allDecks.push(...userDecks);
            });
            
            return allDecks;
        },

        // Obter todos os quizzes
        getAllQuizzes: () => {
            const allUsers = Storage.getUsers();
            const allQuizzes = [];
            
            allUsers.forEach(user => {
                const userQuizzes = Storage.getUserQuizzes(user.id);
                allQuizzes.push(...userQuizzes);
            });
            
            return allQuizzes;
        },

        // Obter usuários ativos
        getActiveUsers: () => {
            const allUsers = Storage.getUsers();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            return allUsers.filter(user => {
                if (!user.lastLoginAt) return false;
                const lastLogin = new Date(user.lastLoginAt);
                return lastLogin >= thirtyDaysAgo;
            });
        },

        // Calcular receita mensal
        calculateMonthlyRevenue: () => {
            const allUsers = Storage.getUsers();
            const planPrices = { free: 0, basic: 29.90, premium: 49.90 };
            
            return allUsers.reduce((total, user) => {
                return total + (planPrices[user.plan] || 0);
            }, 0);
        },

        // Obter distribuição de planos
        getUserPlanDistribution: () => {
            const allUsers = Storage.getUsers();
            const distribution = { free: 0, basic: 0, premium: 0 };
            
            allUsers.forEach(user => {
                distribution[user.plan] = (distribution[user.plan] || 0) + 1;
            });
            
            return distribution;
        },

        // Obter atividades recentes (simuladas)
        getRecentActivities: () => {
            return [
                {
                    icon: 'fas fa-user-plus',
                    text: 'Novo usuário cadastrado: João Silva',
                    time: '2 minutos atrás'
                },
                {
                    icon: 'fas fa-upload',
                    text: 'Novo baralho importado: Anatomia Humana',
                    time: '15 minutos atrás'
                },
                {
                    icon: 'fas fa-crown',
                    text: 'Usuário upgraded para plano Premium',
                    time: '1 hora atrás'
                }
            ];
        },

        // Dados de novos usuários (últimos 30 dias)
        getNewUsersData: () => {
            const allUsers = Storage.getUsers();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const dailyCount = {};
            
            allUsers.forEach(user => {
                const createdDate = new Date(user.createdAt);
                if (createdDate >= thirtyDaysAgo) {
                    const dateKey = createdDate.toISOString().split('T')[0];
                    dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;
                }
            });
            
            const labels = [];
            const values = [];
            
            for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
                values.push(dailyCount[dateKey] || 0);
            }
            
            return { labels, values };
        },

        // Dados de engajamento diário
        getDailyEngagementData: () => {
            // Dados simulados - implementar coleta real
            const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            const values = [45, 52, 48, 61, 55, 32, 28];
            
            return { labels, values };
        },

        // Dados de receita
        getRevenueData: () => {
            const distribution = Admin.utils.getUserPlanDistribution();
            return {
                basic: distribution.basic * 29.90,
                premium: distribution.premium * 49.90
            };
        },

        // Dados de retenção
        getRetentionData: () => {
            // Dados simulados - implementar cálculo real
            return {
                values: [100, 75, 45, 30] // Retenção em D1, D7, D30, D90
            };
        },

        // Calcular tamanho dos dados
        calculateDataSize: () => {
            const allData = JSON.stringify({
                users: Storage.getUsers(),
                settings: Storage.get(Storage.keys.settings)
            });
            
            return (new Blob([allData]).size / (1024 * 1024)).toFixed(2);
        },

        // Formatar plano
        formatPlan: (plan) => {
            const plans = {
                free: 'Gratuito',
                basic: 'Básico',
                premium: 'Premium'
            };
            return plans[plan] || plan;
        },

        // Formatar data
        formatDate: (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
};




