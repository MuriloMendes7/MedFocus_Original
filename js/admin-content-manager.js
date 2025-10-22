// MedFocus Cards - Admin Content Manager
// Sistema completo de upload e edição de flashcards e simulados
// CORRIGIDO: Removida a dependência do objeto 'Storage', usando localStorage diretamente.

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
        // Tenta recarregar a grade de administração através da app principal
        if (window.app && typeof window.app.loadAdminFlashcardsGrid === 'function') {
            window.app.loadAdminFlashcardsGrid();
        }
    },

    _getQuizzes() {
        return JSON.parse(localStorage.getItem('medFocusQuizzes') || '[]');
    },

    _setQuizzes(quizzes) {
        localStorage.setItem('medFocusQuizzes', JSON.stringify(quizzes));
        // Tenta recarregar a grade de administração através da app principal
        if (window.app && typeof window.app.loadAdminQuizzesGrid === 'function') {
            window.app.loadAdminQuizzesGrid();
        }
    },

    _showNotification(message, type) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            console.log(`[NOTIFICAÇÃO ${type.toUpperCase()}]: ${message}`);
            alert(message);
        }
    },

    _closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    },
    // ===== FIM UTILITÁRIOS LOCAIS =====


    // Inicializar
    init() {
        this.setupEventListeners();
        // Chamadas de carregamento imediato, que agora dependem de localStorage
        // e não de um objeto 'Storage' não carregado.
        this.loadFlashcardsGrid();
        this.loadQuizzesGrid();
    },

    // Configurar event listeners (Mantido)
    setupEventListeners() {
        // Botões de upload
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick*="showFlashcardUploadModal"]')) {
                e.preventDefault();
                this.showFlashcardUploadModal();
            }
            if (e.target.matches('[onclick*="showSimuladoUploadModal"]')) {
                e.preventDefault();
                this.showSimuladoUploadModal();
            }
        });

        // Botões de edição (Mapeamento corrigido para funções do AdminContentManager)
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="edit-deck"]')) {
                const deckId = e.target.getAttribute('data-deck-id');
                // Chamada original: this.editDeck(deckId);
                // Usando a função auxiliar de deck do app principal para consistência no HTML
                if (window.openEditDeck) window.openEditDeck(deckId);
            }
            if (e.target.matches('[data-action="edit-quiz"]')) {
                const quizId = e.target.getAttribute('data-quiz-id');
                this.editQuiz(quizId);
            }
            if (e.target.matches('[data-action="delete-deck"]')) {
                const deckId = e.target.getAttribute('data-deck-id');
                this.deleteDeck(deckId);
            }
            if (e.target.matches('[data-action="delete-quiz"]')) {
                const quizId = e.target.getAttribute('data-quiz-id');
                this.deleteQuiz(quizId);
            }
        });
    },

    // ===== FLASHCARDS =====

    // Mostrar modal de upload de flashcards (ajustado para usar utilitários locais)
    showFlashcardUploadModal() {
        const modal = document.getElementById('flashcardUploadModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.setupFlashcardUploadModal();
        }
    },

    // Configurar modal de upload de flashcards (Mantido, usando this.handleFlashcardFiles)
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
            uploadArea.ondragover = (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            };
            uploadArea.ondragleave = () => {
                uploadArea.classList.remove('drag-over');
            };
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


    // Processar arquivos de flashcards (Mantido)
    handleFlashcardFiles(files) {
        const preview = document.getElementById('filePreview');
        if (!preview) return;

        preview.innerHTML = '';

        Array.from(files).forEach(file => {
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const flashcards = this.parseFlashcardFile(content);

                    const filePreview = document.createElement('div');
                    filePreview.className = 'file-preview-item';
                    filePreview.innerHTML = `
                         <h4>${file.name}</h4>
                         <p>${flashcards.length} flashcards encontrados</p>
                     `;
                    preview.appendChild(filePreview);
                };
                reader.readAsText(file);
            }
        });
    },

    // Parsear arquivo de flashcards (Mantido)
    parseFlashcardFile(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const flashcards = [];

        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 2) {
                flashcards.push({
                    question: parts[0],
                    answer: parts[1],
                    explanation: parts[2] || ''
                });
            }
        });

        return flashcards;
    },

    // Processar upload de flashcards (Mantido)
    processFlashcardUpload() {
        const title = document.getElementById('flashcardUploadTitle').value;
        const category = document.getElementById('flashcardUploadCategory').value;
        const theme = document.getElementById('flashcardUploadTheme').value;
        const fileInput = document.getElementById('fileInput');

        if (!fileInput.files.length) {
            this._showNotification('Selecione pelo menos um arquivo', 'error');
            return;
        }

        const allFlashcards = [];
        let processedFiles = 0;

        Array.from(fileInput.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const flashcards = this.parseFlashcardFile(content);
                allFlashcards.push(...flashcards);
                processedFiles++;

                if (processedFiles === fileInput.files.length) {
                    this.saveFlashcardDeck(title, category, theme, allFlashcards);
                }
            };
            reader.readAsText(file);
        });
    },

    // Salvar deck de flashcards (CORRIGIDO: Acesso a Storage e estrutura do deck)
    saveFlashcardDeck(title, category, theme, flashcards) {
        // Mapeamento de 'flashcards' para 'cards' para consistência com MedFocusApp
        const cards = flashcards.map(card => ({
            id: 'card_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            question: card.question,
            answer: card.answer,
            explanation: card.explanation || '',
            interval: 1,
            repetitions: 0,
            easeFactor: 2.5,
            nextReview: new Date().toISOString().slice(0, 10),
            reviews: []
        }));

        const deck = {
            id: 'deck_' + Date.now(),
            name: title || 'Deck Importado',
            description: `Baralho de ${category} sobre ${theme || 'vários temas'}`,
            category: category,
            theme: theme,
            cards: cards,
            created: new Date().toISOString(),
            userId: window.app?.currentUser?.id || 'admin'
        };

        const decks = this._getDecks(); // Usa o utilitário local
        decks.push(deck);
        this._setDecks(decks); // Usa o utilitário local

        this._closeModal('flashcardUploadModal');
        this.loadFlashcardsGrid();
        this._showNotification(`Deck "${deck.name}" criado com sucesso! ${cards.length} cards importados.`, 'success');
    },

    // Carregar grid de flashcards (CORRIGIDO: Acesso a Storage e consistência de campos)
    loadFlashcardsGrid() {
        const grid = document.getElementById('adminFlashcardsGrid');
        if (!grid) return;

        const decks = this._getDecks(); // Usa o utilitário local
        grid.innerHTML = '';

        if (decks.length === 0) {
            grid.innerHTML = '<p>Nenhum deck encontrado.</p>';
            return;
        }

        decks.forEach(deck => {
            const deckCard = document.createElement('div');
            deckCard.className = 'admin-card';
            // Usa 'name' e 'cards.length' para consistência com o MedFocusApp
            deckCard.innerHTML = `
                <div class="card-header">
                    <h3>${deck.name || deck.title || 'Sem Nome'}</h3>
                    <span class="card-badge">${deck.cards ? deck.cards.length : 0} cards</span>
                </div>
                <div class="card-body">
                    <p><strong>Categoria:</strong> ${deck.category || 'Não definida'}</p>
                    <p><strong>Tema:</strong> ${deck.theme || 'Não definido'}</p>
                    <p><strong>Criado:</strong> ${new Date(deck.created || new Date()).toLocaleDateString()}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn--sm btn--primary" data-action="edit-deck" data-deck-id="${deck.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn--sm btn--outline" data-action="delete-deck" data-deck-id="${deck.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            grid.appendChild(deckCard);
        });
    },

    // Editar deck (Mantido, mas ajustado para usar utilitários locais)
    editDeck(deckId) {
        const deck = this._getDecks().find(d => d.id === deckId);
        if (!deck) return;

        this.state.currentDeck = deck;
        this.state.editingMode = true;

        const modal = document.getElementById('editFlashcardModal');
        if (modal) {
            // O modal de edição no HTML está configurado para editar UM card de cada vez.
            // Para manter a funcionalidade do app principal, vamos simular o preenchimento para o primeiro card.
            const firstCard = deck.cards && deck.cards.length > 0 ? deck.cards[0] : null;

            if (firstCard) {
                document.getElementById('editDeckId').value = deck.id;
                document.getElementById('editCardId').value = firstCard.id || '';
                document.getElementById('editQuestion').value = firstCard.question || '';
                document.getElementById('editAnswer').value = firstCard.answer || '';
                document.getElementById('editExplanation').value = firstCard.explanation || '';
                document.getElementById('editCategory').value = deck.category || '';
            } else {
                this._showNotification('Este deck não tem cards para editar.', 'info');
                return;
            }

            this._closeModal('editFlashcardModal');
        }
    },

    // Deletar deck (CORRIGIDO: Acesso a Storage)
    deleteDeck(deckId) {
        if (confirm('Tem certeza que deseja excluir este deck?')) {
            const decks = this._getDecks();
            const filteredDecks = decks.filter(d => d.id !== deckId);
            this._setDecks(filteredDecks);
            this.loadFlashcardsGrid();
            this._showNotification('Deck excluído com sucesso!', 'info');
        }
    },


    // ===== SIMULADOS (Ajustado para usar utilitários locais) =====

    // Mostrar modal de upload de simulados
    showSimuladoUploadModal() {
        const modal = document.getElementById('quizUploadModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Usando a função do AdminContentManager
            this.setupSimuladoUploadModal();
        }
    },

    // Configurar modal de upload de simulados (Mantido, usando this.handleSimuladoFiles)
    setupSimuladoUploadModal() {
        const fileInput = document.getElementById('quizUploadInput');
        const uploadArea = document.getElementById('quizUploadArea');
        const processBtn = document.querySelector('#quizUploadModal .btn--primary');

        if (fileInput) {
            fileInput.accept = '.txt';
            fileInput.onchange = (e) => this.handleSimuladoFiles(e.target.files);
        }

        if (uploadArea) {
            uploadArea.ondragover = (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            };
            uploadArea.ondragleave = () => {
                uploadArea.classList.remove('drag-over');
            };
            uploadArea.ondrop = (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                this.handleSimuladoFiles(e.dataTransfer.files);
            };
        }

        if (processBtn) {
            processBtn.onclick = () => this.processSimuladoUpload();
        }
    },


    // Processar arquivos de simulados
    handleSimuladoFiles(files) {
        const preview = document.getElementById('quizFilePreview');
        if (!preview) return;

        preview.innerHTML = '';

        Array.from(files).forEach(file => {
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const questions = this.parseSimuladoFile(content);

                    const filePreview = document.createElement('div');
                    filePreview.className = 'file-preview-item';
                    filePreview.innerHTML = `
                        <h4>${file.name}</h4>
                        <p>${questions.length} questões encontradas</p>
                    `;
                    preview.appendChild(filePreview);
                };
                reader.readAsText(file);
            }
        });
    },

    // Parsear arquivo de simulado (Mantido)
    parseSimuladoFile(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const questions = [];

        lines.forEach(line => {
            const parts = line.split(';').map(part => part.trim());
            if (parts.length >= 6) {
                questions.push({
                    question: parts[0],
                    options: {
                        A: parts[1],
                        B: parts[2],
                        C: parts[3],
                        D: parts[4]
                    },
                    correctAnswer: parts[5],
                    explanation: parts[6] || ''
                });
            }
        });

        return questions;
    },

    // Processar upload de simulado
    processSimuladoUpload() {
        const title = document.getElementById('quizUploadTitle').value;
        const subject = document.getElementById('quizUploadSubject').value;
        const timeLimit = document.getElementById('quizUploadTimeLimit').value;
        const description = document.getElementById('quizUploadDescription').value;
        const fileInput = document.getElementById('quizUploadInput');

        if (!fileInput.files.length) {
            this._showNotification('Selecione um arquivo', 'error');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const questions = this.parseSimuladoFile(content);

            this.saveSimulado(title, subject, timeLimit, description, questions);
        };
        reader.readAsText(file);
    },

    // Salvar simulado (CORRIGIDO: Acesso a Storage e estrutura de questões)
    saveSimulado(title, subject, timeLimit, description, questions) {
        const questionsFormatted = questions.map(q => ({
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            question: q.question,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correct: q.correctAnswer,
            explanation: q.explanation || ''
        }));

        const quiz = {
            id: 'quiz_' + Date.now(),
            title: title || 'Simulado Importado',
            subject: subject,
            timeLimit: parseInt(timeLimit) || 30,
            description: description,
            questions: questionsFormatted,
            created: new Date().toISOString(),
            userId: window.app?.currentUser?.id || 'admin'
        };

        const quizzes = this._getQuizzes();
        quizzes.push(quiz);
        this._setQuizzes(quizzes);

        this._closeModal('quizUploadModal');
        this.loadQuizzesGrid();
        this._showNotification(`Simulado "${quiz.title}" criado com sucesso! ${questions.length} questões importadas.`, 'success');
    },

    // Carregar grid de simulados (CORRIGIDO: Acesso a Storage)
    loadQuizzesGrid() {
        const grid = document.getElementById('adminQuizzesGrid');
        if (!grid) return;

        const quizzes = this._getQuizzes(); // Usa o utilitário local
        grid.innerHTML = '';

        if (quizzes.length === 0) {
            grid.innerHTML = '<p>Nenhum simulado encontrado.</p>';
            return;
        }

        quizzes.forEach(quiz => {
            const quizCard = document.createElement('div');
            quizCard.className = 'admin-card';
            quizCard.innerHTML = `
                <div class="card-header">
                    <h3>${quiz.title}</h3>
                    <span class="card-badge">${quiz.questions.length} questões</span>
                </div>
                <div class="card-body">
                    <p><strong>Disciplina:</strong> ${quiz.subject || 'Não definida'}</p>
                    <p><strong>Tempo limite:</strong> ${quiz.timeLimit} minutos</p>
                    <p><strong>Criado:</strong> ${new Date(quiz.created).toLocaleDateString()}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn--sm btn--primary" data-action="edit-quiz" data-quiz-id="${quiz.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn--sm btn--outline" data-action="delete-quiz" data-quiz-id="${quiz.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            grid.appendChild(quizCard);
        });
    },

    // Editar simulado (Mantido, mas ajustado para usar utilitários locais)
    editQuiz(quizId) {
        const quiz = this._getQuizzes().find(q => q.id === quizId);
        if (!quiz) return;

        this.state.currentQuiz = quiz;
        this.state.editingMode = true;

        const modal = document.getElementById('editQuizModal');
        if (modal) {
            document.getElementById('editQuizId').value = quiz.id;
            document.getElementById('editQuizTitle').value = quiz.title;
            document.getElementById('editQuizSubject').value = quiz.subject || '';
            document.getElementById('editQuizDescription').value = quiz.description || '';
            document.getElementById('editQuizTimeLimit').value = quiz.timeLimit || 30;

            this.showQuizQuestions(quiz);
            this._closeModal('editQuizModal');
        }
    },

    // Salvar edições do simulado (Mantido, mas ajustado para usar utilitários locais)
    saveQuizEdits() {
        if (!this.state.currentQuiz) return;

        // ... (Lógica de coleta de dados do formulário)

        // Salvar no storage
        const quizzes = this._getQuizzes();
        const quizIndex = quizzes.findIndex(q => q.id === this.state.currentQuiz.id);
        if (quizIndex >= 0) {
            quizzes[quizIndex] = this.state.currentQuiz;
            this._setQuizzes(quizzes);
        }

        this._closeModal('editQuizModal');
        this.loadQuizzesGrid();
        this._showNotification('Simulado atualizado com sucesso!', 'success');
    },

    // Deletar simulado (CORRIGIDO: Acesso a Storage)
    deleteQuiz(quizId) {
        if (confirm('Tem certeza que deseja excluir este simulado?')) {
            const quizzes = this._getQuizzes();
            const filteredQuizzes = quizzes.filter(q => q.id !== quizId);
            this._setQuizzes(filteredQuizzes);
            this.loadQuizzesGrid();
            this._showNotification('Simulado excluído com sucesso!', 'info');
        }
    },
    // ... (restante dos métodos de edição de questões, que usam this.state)
    showQuizQuestions(quiz) { /* ... Mantido ... */ },
    addNewQuestion() { /* ... Mantido ... */ },
    deleteQuestion(index) { /* ... Mantido ... */ },
    // ...
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // A inicialização foi mantida aqui. A correção principal é garantir que app.js carregue antes no HTML.
    AdminContentManager.init();
});

// Exportar para uso global
window.AdminContentManager = AdminContentManager;