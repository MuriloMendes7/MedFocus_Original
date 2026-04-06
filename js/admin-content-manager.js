// MedFocus Cards - Admin Content Manager
// Sistema completo de upload e edição de flashcards e simulados
// CORRIGIDO: Processamento assíncrono com Promises e Unificação de Eventos.

const AdminContentManager = {
    // Estado
    state: {
        currentDeck: null,
        currentQuiz: null,
        editingMode: false
    },

    // ===== UTILITÁRIOS LOCAIS PARA GARANTIR CONSISTÊNCIA =====

    _getDecks() {
        return JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    },

    _setDecks(decks) {
        localStorage.setItem('medFocusDecks', JSON.stringify(decks));
        if (window.app && typeof window.app.loadAdminFlashcardsGrid === 'function') {
            window.app.loadAdminFlashcardsGrid();
        }
    },

    _getQuizzes() {
        return JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
    },

    _setQuizzes(quizzes) {
        localStorage.setItem('medFocusQuizzes', JSON.stringify(quizzes));
        if (window.app && typeof window.app.loadAdminQuizzesGrid === 'function') {
            window.app.loadAdminQuizzesGrid();
        }
    },

    _showNotification(message, type) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            alert(`[${type.toUpperCase()}]: ${message}`);
        }
    },

    _closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // ===== INICIALIZAÇÃO =====

    init() {
        this.setupEventListeners();
        this.loadFlashcardsGrid();
        this.loadQuizzesGrid();
    },

    setupEventListeners() {
        // Delegação de eventos para cliques em botões dinâmicos e estáticos
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button') || e.target;

            // Abrir Modais de Upload
            if (target.matches('[onclick*="showFlashcardUploadModal"]')) {
                e.preventDefault();
                this.showFlashcardUploadModal();
            }
            if (target.matches('[onclick*="showSimuladoUploadModal"]')) {
                e.preventDefault();
                this.showSimuladoUploadModal();
            }

            // Ações de Flashcards (Edit/Delete)
            if (target.matches('[data-action="edit-deck"]')) {
                const deckId = target.getAttribute('data-deck-id');
                if (window.openEditDeck) window.openEditDeck(deckId);
                else this.editDeck(deckId);
            }
            if (target.matches('[data-action="delete-deck"]')) {
                this.deleteDeck(target.getAttribute('data-deck-id'));
            }

            // Ações de Simulados (Edit/Delete)
            if (target.matches('[data-action="edit-quiz"]')) {
                this.editQuiz(target.getAttribute('data-quiz-id'));
            }
            if (target.matches('[data-action="delete-quiz"]')) {
                this.deleteQuiz(target.getAttribute('data-quiz-id'));
            }
        });
    },

    // ===== FLASHCARDS (LÓGICA CORRIGIDA COM PROMISES) =====

    showFlashcardUploadModal() {
        const modal = document.getElementById('flashcardUploadModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.setupFlashcardUploadModal();
        }
    },

    setupFlashcardUploadModal() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const processBtn = document.querySelector('#flashcardUploadModal .btn--primary');

        if (fileInput) {
            fileInput.accept = '.txt';
            fileInput.multiple = true;
            fileInput.onchange = (e) => this.handleFlashcardFiles(e.target.files);
        }

        if (uploadArea) {
            uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); };
            uploadArea.ondragleave = () => uploadArea.classList.remove('drag-over');
            uploadArea.ondrop = (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                this.handleFlashcardFiles(e.dataTransfer.files);
            };
        }

        if (processBtn) {
            processBtn.onclick = () => this.processFlashcardUpload();
        }
    },

    handleFlashcardFiles(files) {
        const preview = document.getElementById('filePreview');
        if (!preview) return;
        preview.innerHTML = '';

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const flashcards = this.parseFlashcardFile(e.target.result);
                const item = document.createElement('div');
                item.className = 'file-preview-item';
                item.innerHTML = `<h4>${file.name}</h4><p>${flashcards.length} cards encontrados</p>`;
                preview.appendChild(item);
            };
            reader.readAsText(file);
        });
    },

    parseFlashcardFile(content) {
        return content.split('\n')
            .filter(line => line.trim() && line.includes('|'))
            .map(line => {
                const parts = line.split('|').map(p => p.trim());
                return { question: parts[0], answer: parts[1], explanation: parts[2] || '' };
            });
    },

    async processFlashcardUpload() {
        const title = document.getElementById('flashcardUploadTitle').value;
        const category = document.getElementById('flashcardUploadCategory').value;
        const theme = document.getElementById('flashcardUploadTheme').value;
        const fileInput = document.getElementById('fileInput');

        if (!fileInput.files.length) {
            this._showNotification('Selecione arquivos .txt', 'error');
            return;
        }

        try {
            const files = Array.from(fileInput.files);
            const promises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(this.parseFlashcardFile(e.target.result));
                    reader.readAsText(file);
                });
            });

            const results = await Promise.all(promises);
            const allFlashcards = results.flat();

            if (allFlashcards.length > 0) {
                this.saveFlashcardDeck(title, category, theme, allFlashcards);
            } else {
                this._showNotification('Nenhum card válido nos arquivos.', 'warning');
            }
        } catch (err) {
            this._showNotification('Erro ao processar upload.', 'error');
        }
    },

    saveFlashcardDeck(title, category, theme, flashcards) {
        const cards = flashcards.map(card => ({
            id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            question: card.question,
            answer: card.answer,
            explanation: card.explanation,
            interval: 1, repetitions: 0, easeFactor: 2.5,
            nextReview: new Date().toISOString().slice(0, 10),
            reviews: []
        }));

        const deck = {
            id: 'deck_' + Date.now(),
            name: title || 'Deck Importado',
            description: `Baralho de ${category} - ${theme}`,
            category, theme, cards,
            created: new Date().toISOString(),
            userId: window.app?.currentUser?.id || 'admin'
        };

        const decks = this._getDecks();
        decks.push(deck);
        this._setDecks(decks);

        this._closeModal('flashcardUploadModal');
        this.loadFlashcardsGrid();
        this._showNotification(`Sucesso! ${cards.length} cards importados.`, 'success');
    },

    // ===== SIMULADOS (LÓGICA CORRIGIDA COM PROMISES) =====

    showSimuladoUploadModal() {
        const modal = document.getElementById('quizUploadModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.setupSimuladoUploadModal();
        }
    },

    setupSimuladoUploadModal() {
        const fileInput = document.getElementById('quizUploadInput');
        const processBtn = document.querySelector('#quizUploadModal .btn--primary');

        if (fileInput) {
            fileInput.accept = '.txt';
            fileInput.onchange = (e) => this.handleSimuladoFiles(e.target.files);
        }

        if (processBtn) {
            processBtn.onclick = () => this.processSimuladoUpload();
        }
    },

    handleSimuladoFiles(files) {
        const preview = document.getElementById('quizFilePreview');
        if (!preview || !files[0]) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const questions = this.parseSimuladoFile(e.target.result);
            preview.innerHTML = `<div class="file-preview-item"><h4>${files[0].name}</h4><p>${questions.length} questões</p></div>`;
        };
        reader.readAsText(files[0]);
    },

    parseSimuladoFile(content) {
        return content.split('\n')
            .filter(line => line.trim() && line.split(';').length >= 6)
            .map(line => {
                const parts = line.split(';').map(p => p.trim());
                return {
                    question: parts[0],
                    options: { A: parts[1], B: parts[2], C: parts[3], D: parts[4] },
                    correctAnswer: parts[5],
                    explanation: parts[6] || ''
                };
            });
    },

    async processSimuladoUpload() {
        const title = document.getElementById('quizUploadTitle').value;
        const subject = document.getElementById('quizUploadSubject').value;
        const timeLimit = document.getElementById('quizUploadTimeLimit').value;
        const description = document.getElementById('quizUploadDescription').value;
        const fileInput = document.getElementById('quizUploadInput');

        if (!fileInput.files[0]) {
            this._showNotification('Selecione o arquivo do simulado.', 'error');
            return;
        }

        const reader = new FileReader();
        const content = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsText(fileInput.files[0]);
        });

        const questions = this.parseSimuladoFile(content);
        if (questions.length > 0) {
            this.saveSimulado(title, subject, timeLimit, description, questions);
        } else {
            this._showNotification('Arquivo inválido ou vazio.', 'error');
        }
    },

    saveSimulado(title, subject, timeLimit, description, questions) {
        const questionsFormatted = questions.map(q => ({
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            question: q.question,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correct: q.correctAnswer,
            explanation: q.explanation
        }));

        const quiz = {
            id: 'quiz_' + Date.now(),
            title: title || 'Simulado Novo',
            subject, description,
            timeLimit: parseInt(timeLimit) || 30,
            questions: questionsFormatted,
            created: new Date().toISOString(),
            userId: window.app?.currentUser?.id || 'admin'
        };

        const quizzes = this._getQuizzes();
        quizzes.push(quiz);
        this._setQuizzes(quizzes);

        this._closeModal('quizUploadModal');
        this.loadQuizzesGrid();
        this._showNotification(`Simulado "${quiz.title}" criado!`, 'success');
    },

    // ===== GRID RENDERERS =====

    loadFlashcardsGrid() {
        const grid = document.getElementById('adminFlashcardsGrid');
        if (!grid) return;
        const decks = this._getDecks();
        
        if (decks.length === 0) {
            grid.innerHTML = '<p>Nenhum deck encontrado.</p>';
            return;
        }

        grid.innerHTML = decks.map(deck => `
            <div class="admin-card">
                <div class="card-header">
                    <h3>${deck.name}</h3>
                    <span class="card-badge">${deck.cards.length} cards</span>
                </div>
                <div class="card-body">
                    <p><strong>Categoria:</strong> ${deck.category}</p>
                    <p><strong>Tema:</strong> ${deck.theme}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn--sm btn--primary" data-action="edit-deck" data-deck-id="${deck.id}">Editar</button>
                    <button class="btn btn--sm btn--outline" data-action="delete-deck" data-deck-id="${deck.id}">Excluir</button>
                </div>
            </div>
        `).join('');
    },

    loadQuizzesGrid() {
        const grid = document.getElementById('adminQuizzesGrid');
        if (!grid) return;
        const quizzes = this._getQuizzes();

        if (quizzes.length === 0) {
            grid.innerHTML = '<p>Nenhum simulado encontrado.</p>';
            return;
        }

        grid.innerHTML = quizzes.map(quiz => `
            <div class="admin-card">
                <div class="card-header">
                    <h3>${quiz.title}</h3>
                    <span class="card-badge">${quiz.questions.length} questões</span>
                </div>
                <div class="card-body">
                    <p><strong>Disciplina:</strong> ${quiz.subject}</p>
                    <p><strong>Tempo:</strong> ${quiz.timeLimit} min</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn--sm btn--primary" data-action="edit-quiz" data-quiz-id="${quiz.id}">Editar</button>
                    <button class="btn btn--sm btn--outline" data-action="delete-quiz" data-quiz-id="${quiz.id}">Excluir</button>
                </div>
            </div>
        `).join('');
    },

    deleteDeck(deckId) {
        if (confirm('Excluir este deck?')) {
            this._setDecks(this._getDecks().filter(d => d.id !== deckId));
            this.loadFlashcardsGrid();
        }
    },

    deleteQuiz(quizId) {
        if (confirm('Excluir este simulado?')) {
            this._setQuizzes(this._getQuizzes().filter(q => q.id !== quizId));
            this.loadQuizzesGrid();
        }
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => AdminContentManager.init());
window.AdminContentManager = AdminContentManager;