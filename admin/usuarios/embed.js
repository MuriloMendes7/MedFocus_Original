// MedFocus Cards - User Admin Module
// Comprehensive user management interface

class UserAdmin {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.users = [];
        this.filteredUsers = [];
        this.searchTerm = '';
        this.planFilter = '';
        this.statusFilter = '';
        this.selectedUsers = new Set();
        this.isLoading = false;

        this.init();
    }

    init() {
        this.loadUsers();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // New user button
        const newUserBtn = document.getElementById('btnNewUser');
        if (newUserBtn) {
            newUserBtn.addEventListener('click', () => this.showCreateUserModal());
        }

        // Search functionality
        const searchInput = document.querySelector('.admin-users__search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterUsers();
                this.currentPage = 1;
                this.renderTable();
            });
        }

        // Filter functionality
        const planFilter = document.querySelector('.admin-users__filter-select[aria-label="Plano"]');
        const statusFilter = document.querySelector('.admin-users__filter-select[aria-label="Status"]');

        if (planFilter) {
            planFilter.addEventListener('change', (e) => {
                this.planFilter = e.target.value;
                this.filterUsers();
                this.currentPage = 1;
                this.renderTable();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.filterUsers();
                this.currentPage = 1;
                this.renderTable();
            });
        }

        // Bulk actions
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('admin-users__checkbox')) {
                this.handleUserSelection(e.target);
            }
        });

        // Select all checkbox
        const selectAllCheckbox = document.querySelector('.admin-users__select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }
    }

    async loadUsers() {
        this.isLoading = true;
        this.render();

        try {
            // Get users from Storage (assuming Storage is available globally)
            this.users = window.Storage ? window.Storage.getUsers() : [];
            if (!this.users) {
                this.users = [];
            }
            this.filterUsers();
            this.renderTable();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Erro ao carregar usuários');
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    filterUsers() {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !this.searchTerm ||
                user.name.toLowerCase().includes(this.searchTerm) ||
                user.email.toLowerCase().includes(this.searchTerm) ||
                user.id.toLowerCase().includes(this.searchTerm);

            const matchesPlan = !this.planFilter || user.plan === this.planFilter;

            const matchesStatus = !this.statusFilter ||
                (this.statusFilter === 'active' && user.isActive) ||
                (this.statusFilter === 'inactive' && !user.isActive);

            return matchesSearch && matchesPlan && matchesStatus;
        });
    }

    render() {
        const container = document.getElementById('admin-usuarios-app');
        if (!container) return;

        container.innerHTML = `
            <div class="admin-users">
                <div class="admin-users__filters">
                    <div class="admin-users__search-row">
                        <input type="text" class="admin-users__search-input" placeholder="Buscar usuários por nome, email ou ID...">
                        <button class="admin-users__search-btn">
                            <i class="fas fa-search"></i>
                            Buscar
                        </button>
                    </div>
                    <div class="admin-users__filter-row">
                        <div class="admin-users__filter-group">
                            <label class="admin-users__filter-label">Plano</label>
                            <select class="admin-users__filter-select" aria-label="Plano">
                                <option value="">Todos os planos</option>
                                <option value="free">Gratuito</option>
                                <option value="basic">Básico</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                        <div class="admin-users__filter-group">
                            <label class="admin-users__filter-label">Status</label>
                            <select class="admin-users__filter-select" aria-label="Status">
                                <option value="">Todos os status</option>
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="admin-users__bulk-actions" id="bulkActions">
                    <span class="admin-users__bulk-text" id="bulkText"></span>
                    <button class="admin-users__bulk-btn admin-users__bulk-btn--delete" onclick="userAdmin.bulkDelete()">
                        <i class="fas fa-trash"></i>
                        Excluir Selecionados
                    </button>
                </div>

                <div class="admin-users__table-container">
                    ${this.isLoading ? this.renderLoading() : this.renderTable()}
                </div>

                ${this.renderPagination()}
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="admin-users__loading">
                <div class="admin-users__loading-spinner"></div>
                Carregando usuários...
            </div>
        `;
    }

    renderTable() {
        if (this.filteredUsers.length === 0) {
            return this.renderEmpty();
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);

        return `
            <table class="admin-users__table">
                <thead>
                    <tr>
                        <th>
                            <input type="checkbox" class="admin-users__select-all">
                        </th>
                        <th>Usuário</th>
                        <th>Email</th>
                        <th>Plano</th>
                        <th>Status</th>
                        <th>Cadastro</th>
                        <th>Último Login</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${paginatedUsers.map(user => this.renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;
    }

    renderUserRow(user) {
        const planClasses = {
            free: 'admin-users__plan-badge--free',
            basic: 'admin-users__plan-badge--basic',
            premium: 'admin-users__plan-badge--premium'
        };

        const statusClasses = {
            true: 'admin-users__status-badge--active',
            false: 'admin-users__status-badge--inactive'
        };

        const planLabels = {
            free: 'Gratuito',
            basic: 'Básico',
            premium: 'Premium'
        };

        return `
            <tr>
                <td>
                    <input type="checkbox" class="admin-users__checkbox" value="${user.id}">
                </td>
                <td>
                    <div class="admin-users__user-info">
                        <div class="admin-users__user-avatar">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="admin-users__user-details">
                            <div class="admin-users__user-name">${user.name}</div>
                            <div class="admin-users__user-id">#${user.id}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="admin-users__plan-badge ${planClasses[user.plan]}">
                        ${planLabels[user.plan]}
                    </span>
                </td>
                <td>
                    <span class="admin-users__status-badge ${statusClasses[user.isActive]}">
                        ${user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>${user.lastLoginAt ? this.formatDate(user.lastLoginAt) : 'Nunca'}</td>
                <td>
                    <div class="admin-users__actions">
                        <button class="admin-users__action-btn admin-users__action-btn--edit"
                                onclick="userAdmin.editUser('${user.id}')"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="admin-users__action-btn admin-users__action-btn--delete"
                                onclick="userAdmin.deleteUser('${user.id}')"
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="admin-users__action-btn ${user.isActive ? 'admin-users__action-btn--deactivate' : 'admin-users__action-btn--activate'}"
                                onclick="userAdmin.toggleUserStatus('${user.id}')"
                                title="${user.isActive ? 'Desativar' : 'Ativar'}">
                            <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmpty() {
        return `
            <div class="admin-users__empty">
                <div class="admin-users__empty-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3 class="admin-users__empty-title">Nenhum usuário encontrado</h3>
                <p class="admin-users__empty-text">
                    ${this.searchTerm || this.planFilter || this.statusFilter ?
                        'Tente ajustar os filtros de busca.' :
                        'Comece criando o primeiro usuário.'}
                </p>
            </div>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        if (totalPages <= 1) return '';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, this.filteredUsers.length);

        let pages = [];
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(`
                <button class="admin-users__page-btn ${i === this.currentPage ? 'admin-users__page-btn--active' : ''}"
                        onclick="userAdmin.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        return `
            <div class="admin-users__pagination">
                <div class="admin-users__pagination-info">
                    Mostrando ${startIndex}-${endIndex} de ${this.filteredUsers.length} usuários
                </div>
                <div class="admin-users__pagination-controls">
                    <button class="admin-users__page-btn ${this.currentPage === 1 ? 'admin-users__page-btn--disabled' : ''}"
                            onclick="userAdmin.prevPage()"
                            ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    ${pages.join('')}
                    <button class="admin-users__page-btn ${this.currentPage === totalPages ? 'admin-users__page-btn--disabled' : ''}"
                            onclick="userAdmin.nextPage()"
                            ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    showCreateUserModal() {
        this.showUserModal();
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showError('Usuário não encontrado');
            return;
        }
        this.showUserModal(user);
    }

    showUserModal(user = null) {
        const isEdit = !!user;
        const modal = document.createElement('div');
        modal.className = 'admin-users__modal';
        modal.innerHTML = `
            <div class="admin-users__modal-content">
                <div class="admin-users__modal-header">
                    <h2 class="admin-users__modal-title">
                        ${isEdit ? 'Editar Usuário' : 'Criar Novo Usuário'}
                    </h2>
                    <p class="admin-users__modal-subtitle">
                        ${isEdit ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
                    </p>
                </div>
                <form class="admin-users__modal-body" id="userForm">
                    <input type="hidden" id="userId" value="${user?.id || ''}">
                    <div class="admin-users__form-row">
                        <div class="admin-users__form-group">
                            <label class="admin-users__form-label" for="userName">Nome Completo</label>
                            <input type="text" class="admin-users__form-input" id="userName" value="${user?.name || ''}" required>
                        </div>
                        <div class="admin-users__form-group">
                            <label class="admin-users__form-label" for="userEmail">Email</label>
                            <input type="email" class="admin-users__form-input" id="userEmail" value="${user?.email || ''}" required>
                        </div>
                    </div>
                    <div class="admin-users__form-row">
                        <div class="admin-users__form-group">
                            <label class="admin-users__form-label" for="userPhone">Telefone</label>
                            <input type="tel" class="admin-users__form-input" id="userPhone" value="${user?.phone || ''}">
                        </div>
                        <div class="admin-users__form-group">
                            <label class="admin-users__form-label" for="userPlan">Plano</label>
                            <select class="admin-users__form-select" id="userPlan" required>
                                <option value="free" ${user?.plan === 'free' ? 'selected' : ''}>Gratuito</option>
                                <option value="basic" ${user?.plan === 'basic' ? 'selected' : ''}>Básico</option>
                                <option value="premium" ${user?.plan === 'premium' ? 'selected' : ''}>Premium</option>
                            </select>
                        </div>
                    </div>
                    ${!isEdit ? `
                        <div class="admin-users__form-group">
                            <label class="admin-users__form-label" for="userPassword">Senha</label>
                            <input type="password" class="admin-users__form-input" id="userPassword" required>
                        </div>
                    ` : ''}
                    <div class="admin-users__form-checkbox">
                        <input type="checkbox" id="userActive" ${user?.isActive !== false ? 'checked' : ''}>
                        <label for="userActive">Usuário ativo</label>
                    </div>
                </form>
                <div class="admin-users__modal-footer">
                    <button type="button" class="admin-users__modal-btn admin-users__modal-btn--cancel" onclick="userAdmin.closeModal()">
                        Cancelar
                    </button>
                    <button type="button" class="admin-users__modal-btn admin-users__modal-btn--primary" onclick="userAdmin.saveUser()">
                        ${isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        const modal = document.querySelector('.admin-users__modal');
        if (modal) {
            modal.remove();
        }
    }

    async saveUser() {
        const form = document.getElementById('userForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const userId = document.getElementById('userId').value;
        const name = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const phone = document.getElementById('userPhone').value.trim();
        const plan = document.getElementById('userPlan').value;
        const password = document.getElementById('userPassword')?.value;
        const isActive = document.getElementById('userActive').checked;

        try {
            if (userId) {
                // Edit existing user
                await this.updateUser(userId, { name, email, phone, plan, isActive });
                this.showSuccess('Usuário atualizado com sucesso!');
            } else {
                // Create new user
                await this.createUser({ name, email, phone, plan, password, isActive });
                this.showSuccess('Usuário criado com sucesso!');
            }

            this.closeModal();
            await this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            this.showError('Erro ao salvar usuário');
        }
    }

    async createUser(userData) {
        // Use admin.js functions if available, otherwise fallback
        if (window.Admin && window.Admin.createUser) {
            // This would need to be adapted to work with the modal
            return;
        }

        // Fallback implementation
        const newUser = {
            id: this.generateId(),
            ...userData,
            role: 'student',
            createdAt: new Date().toISOString(),
            lastLoginAt: null
        };

        this.users.push(newUser);
        if (window.Storage) {
            window.Storage.setUsers(this.users);
        }
    }

    async updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error('User not found');

        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        if (window.Storage) {
            window.Storage.setUsers(this.users);
        }
    }

    async deleteUser(userId) {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            this.users = this.users.filter(u => u.id !== userId);
            if (window.Storage) {
                window.Storage.setUsers(this.users);
            }
            this.filterUsers();
            this.renderTable();
            this.showSuccess('Usuário excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showError('Erro ao excluir usuário');
        }
    }

    async toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showError('Usuário não encontrado');
            return;
        }

        try {
            await this.updateUser(userId, { isActive: !user.isActive });
            this.filterUsers();
            this.renderTable();
            const status = user.isActive ? 'desativado' : 'ativado';
            this.showSuccess(`Usuário ${status} com sucesso!`);
        } catch (error) {
            console.error('Error toggling user status:', error);
            this.showError('Erro ao alterar status do usuário');
        }
    }

    handleUserSelection(checkbox) {
        const userId = checkbox.value;
        if (checkbox.checked) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
        }
        this.updateBulkActions();
    }

    handleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.admin-users__checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            this.handleUserSelection(cb);
        });
    }

    updateBulkActions() {
        const bulkActions = document.getElementById('bulkActions');
        const bulkText = document.getElementById('bulkText');

        if (this.selectedUsers.size > 0) {
            bulkActions.classList.add('show');
            bulkText.textContent = `${this.selectedUsers.size} usuário(s) selecionado(s)`;
        } else {
            bulkActions.classList.remove('show');
        }
    }

    async bulkDelete() {
        if (this.selectedUsers.size === 0) return;

        const count = this.selectedUsers.size;
        if (!confirm(`Tem certeza que deseja excluir ${count} usuário(s)? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            this.users = this.users.filter(u => !this.selectedUsers.has(u.id));
            if (window.Storage) {
                window.Storage.setUsers(this.users);
            }
            this.selectedUsers.clear();
            this.filterUsers();
            this.renderTable();
            this.showSuccess(`${count} usuário(s) excluído(s) com sucesso!`);
        } catch (error) {
            console.error('Error bulk deleting users:', error);
            this.showError('Erro ao excluir usuários');
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.renderPagination();
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
            this.renderPagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
            this.renderPagination();
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Use UI notifications if available, otherwise fallback to alert
        if (window.UI && window.UI.notifications) {
            window.UI.notifications.show(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make it globally available
    window.userAdmin = new UserAdmin();
});
