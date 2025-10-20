// MedFocus Cards - Quizzes Module
// Sistema completo de simulados com questões múltipla escolha

const Quizzes = {
    currentQuiz: null,
    currentQuestion: 0,
    userAnswers: [],
    startTime: null,
    timer: null,
    timeLimit: 0,
    isPaused: false,

    // Sistema de importação de quizzes
    import: {
        // Preview do arquivo antes de importar
        preview: (file, callback) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const questions = Quizzes.import.parseContent(content);
                callback(questions);
            };
            reader.readAsText(file);
        },

        // Parse do conteúdo do arquivo
        parseContent: (content) => {
            const lines = content.split('\n').filter(line => line.trim());
            const questions = [];

            for (const line of lines) {
                // Formato: pergunta;A);B);C);D);letraCorreta
                const parts = line.split(';');
                
                if (parts.length >= 6) {
                    const question = {
                        id: UI.utils.generateId(),
                        question: parts[0].trim(),
                        options: {
                            A: parts[1].replace(/^A\)/, '').trim(),
                            B: parts[2].replace(/^B\)/, '').trim(),
                            C: parts[3].replace(/^C\)/, '').trim(),
                            D: parts[4].replace(/^D\)/, '').trim()
                        },
                        correctAnswer: parts[5].trim().toUpperCase(),
                        explanation: parts[6] || '',
                        difficulty: 'medium',
                        category: 'geral'
                    };
                    
                    // Validar resposta correta
                    if (['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
                        questions.push(question);
                    }
                }
            }

            return questions;
        },

        // Criar quiz a partir das questões
        createQuiz: (quizData, questions, userId) => {
            const quiz = {
                id: UI.utils.generateId(),
                title: quizData.title,
                description: quizData.description || '',
                subject: quizData.subject,
                timeLimit: parseInt(quizData.timeLimit) || 30,
                questions: questions,
                userId: userId,
                created: new Date().toISOString(),
                attempts: 0,
                bestScore: 0,
                averageScore: 0,
                stats: {
                    totalAttempts: 0,
                    totalQuestions: questions.length,
                    averageTime: 0,
                    difficultyDistribution: Quizzes.import.analyzeDifficulty(questions)
                }
            };

            // Salvar no storage
            const userQuizzes = Storage.getUserQuizzes(userId);
            userQuizzes.push(quiz);
            Storage.setUserQuizzes(userId, userQuizzes);

            return quiz;
        },

        // Analisar distribuição de dificuldade
        analyzeDifficulty: (questions) => {
            const distribution = { easy: 0, medium: 0, hard: 0 };
            questions.forEach(q => {
                distribution[q.difficulty || 'medium']++;
            });
            return distribution;
        }
    },

    // Gerenciamento de execução de quiz
    execution: {
        // Iniciar quiz
        start: (quizId) => {
            const userId = Auth.current.id;
            const quizzes = Storage.getUserQuizzes(userId);
            const quiz = quizzes.find(q => q.id === quizId);
            
            if (!quiz) {
                UI.notifications.show('Quiz não encontrado', 'error');
                return false;
            }

            if (quiz.questions.length === 0) {
                UI.notifications.show('Quiz não possui questões válidas', 'error');
                return false;
            }

            // Configurar estado do quiz
            Quizzes.currentQuiz = quiz;
            Quizzes.currentQuestion = 0;
            Quizzes.userAnswers = new Array(quiz.questions.length).fill(null);
            Quizzes.startTime = new Date();
            Quizzes.timeLimit = quiz.timeLimit * 60; // Converter para segundos
            Quizzes.isPaused = false;

            // Esconder lista e mostrar execução
            document.getElementById('quizListView').classList.add('hidden');
            document.getElementById('quizExecutionView').classList.remove('hidden');

            // Inicializar interface
            Quizzes.ui.setupQuizInterface();
            Quizzes.ui.displayQuestion();
            Quizzes.execution.startTimer();

            return true;
        },

        // Iniciar cronômetro
        startTimer: () => {
            if (Quizzes.timer) {
                clearInterval(Quizzes.timer);
            }

            let remainingTime = Quizzes.timeLimit;
            
            Quizzes.timer = setInterval(() => {
                if (Quizzes.isPaused) return;

                remainingTime--;
                
                if (remainingTime <= 0) {
                    Quizzes.execution.finishQuiz();
                    return;
                }

                Quizzes.ui.updateTimer(remainingTime);
                
                // Aviso quando restam 5 minutos
                if (remainingTime === 300) {
                    UI.notifications.show('Restam apenas 5 minutos!', 'warning');
                }
                
                // Aviso quando resta 1 minuto
                if (remainingTime === 60) {
                    UI.notifications.show('Último minuto!', 'alert');
                }
            }, 1000);
        },

        // Pausar/despausar quiz
        pause: () => {
            Quizzes.isPaused = !Quizzes.isPaused;
            const pauseBtn = document.querySelector('.quiz-controls button[onclick="pauseQuiz()"]');
            
            if (pauseBtn) {
                if (Quizzes.isPaused) {
                    pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    UI.notifications.show('Quiz pausado', 'info');
                } else {
                    pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    UI.notifications.show('Quiz retomado', 'info');
                }
            }
        },

        // Responder questão
        answerQuestion: (answer) => {
            if (!Quizzes.currentQuiz || Quizzes.isPaused) return;

            Quizzes.userAnswers[Quizzes.currentQuestion] = answer;
            Quizzes.ui.updateQuestionNavigation();
            
            // Salvar progresso
            Quizzes.execution.saveProgress();
        },

        // Ir para próxima questão
        nextQuestion: () => {
            if (Quizzes.currentQuestion < Quizzes.currentQuiz.questions.length - 1) {
                Quizzes.currentQuestion++;
                Quizzes.ui.displayQuestion();
            } else {
                Quizzes.execution.finishQuiz();
            }
        },

        // Ir para questão anterior
        prevQuestion: () => {
            if (Quizzes.currentQuestion > 0) {
                Quizzes.currentQuestion--;
                Quizzes.ui.displayQuestion();
            }
        },

        // Ir para questão específica
        goToQuestion: (questionIndex) => {
            if (questionIndex >= 0 && questionIndex < Quizzes.currentQuiz.questions.length) {
                Quizzes.currentQuestion = questionIndex;
                Quizzes.ui.displayQuestion();
            }
        },

        // Finalizar quiz
        finishQuiz: () => {
            if (Quizzes.timer) {
                clearInterval(Quizzes.timer);
                Quizzes.timer = null;
            }

            const results = Quizzes.execution.calculateResults();
            Quizzes.execution.saveResults(results);
            Quizzes.ui.displayResults(results);
        },

        // Calcular resultados
        calculateResults: () => {
            const totalQuestions = Quizzes.currentQuiz.questions.length;
            const endTime = new Date();
            const timeSpent = Math.round((endTime - Quizzes.startTime) / 1000);
            
            let correctAnswers = 0;
            const questionResults = [];

            // Analisar cada questão
            Quizzes.currentQuiz.questions.forEach((question, index) => {
                const userAnswer = Quizzes.userAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                if (isCorrect) correctAnswers++;
                
                questionResults.push({
                    questionIndex: index,
                    question: question.question,
                    userAnswer: userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect: isCorrect,
                    options: question.options,
                    explanation: question.explanation || ''
                });
            });

            const score = Math.round((correctAnswers / totalQuestions) * 100);
            
            return {
                quizId: Quizzes.currentQuiz.id,
                quizTitle: Quizzes.currentQuiz.title,
                totalQuestions,
                correctAnswers,
                score,
                timeSpent,
                questionResults,
                completedAt: new Date().toISOString(),
                passed: score >= 70 // 70% para aprovação
            };
        },

        // Salvar resultados
        saveResults: (results) => {
            const userId = Auth.current.id;
            const userResults = Storage.getUserQuizResults(userId);
            
            // Adicionar novo resultado
            userResults.push(results);
            Storage.setUserQuizResults(userId, userResults);
            
            // Atualizar estatísticas do quiz
            const quiz = Storage.getQuizById(results.quizId);
            if (quiz) {
                quiz.attempts = (quiz.attempts || 0) + 1;
                if (results.score > (quiz.bestScore || 0)) {
                    quiz.bestScore = results.score;
                }
                Storage.updateQuiz(quiz);
            }
            
            // Salvar tempo de estudo
            if (window.app && typeof window.app.saveQuizTime === 'function') {
                window.app.saveQuizTime(results.timeSpent, results.quizTitle);
            }
        },

        // Revisar questões do simulado
        reviewQuiz: (results) => {
            if (!results) {
                console.error('Nenhum resultado fornecido para revisão');
                return;
            }

            // Armazenar resultados para revisão
            Quizzes.currentReviewResults = results;
            
            // Atualizar título do simulado
            const titleEl = document.getElementById('reviewQuizTitle');
            if (titleEl) {
                titleEl.textContent = results.quizTitle;
            }
            
            // Atualizar estatísticas
            const timeSpentEl = document.getElementById('reviewTimeSpent');
            const scoreEl = document.getElementById('reviewScore');
            
            if (timeSpentEl) {
                const minutes = Math.floor(results.timeSpent / 60);
                const seconds = results.timeSpent % 60;
                timeSpentEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (scoreEl) {
                scoreEl.textContent = `${results.score}%`;
            }
            
            // Exibir questões para revisão
            Quizzes.ui.displayQuestionReview(results);
            
            // Mostrar página de revisão
            showPage('quizReviewPage');
        },

        // Exibir questões para revisão
        displayQuestionReview: (results) => {
            const container = document.getElementById('reviewQuestions');
            if (!container) return;
            
            container.innerHTML = results.questionResults.map((result, index) => `
                <div class="review-question ${result.isCorrect ? 'correct' : 'incorrect'}">
                    <div class="question-header">
                        <div class="question-number">
                            Questão ${index + 1}
                        </div>
                        <div class="question-status">
                            ${result.isCorrect ? 
                                '<i class="fas fa-check-circle"></i> Correta' : 
                                '<i class="fas fa-times-circle"></i> Incorreta'
                            }
                        </div>
                    </div>
                    
                    <div class="question-content">
                        <h4>${result.question}</h4>
                    </div>
                    
                    <div class="question-options-review">
                        ${['A', 'B', 'C', 'D'].map(option => {
                            const isUserAnswer = result.userAnswer === option;
                            const isCorrectAnswer = result.correctAnswer === option;
                            const optionText = result.options[option];
                            
                            let className = 'option-review';
                            if (isCorrectAnswer) {
                                className += ' correct-answer';
                            } else if (isUserAnswer && !isCorrectAnswer) {
                                className += ' wrong-answer';
                            }
                            
                            return `
                                <div class="${className}">
                                    <div class="option-letter">${option}</div>
                                    <div class="option-text">${optionText}</div>
                                    ${isUserAnswer ? '<div class="user-answer-indicator">Sua resposta</div>' : ''}
                                    ${isCorrectAnswer ? '<div class="correct-answer-indicator">Resposta correta</div>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    ${result.explanation ? `
                        <div class="question-explanation">
                            <h5><i class="fas fa-lightbulb"></i> Explicação:</h5>
                            <p>${result.explanation}</p>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
    },

    // Inicializar módulo
    init: () => {
        if (!Auth.requireAuth()) return;
        
        Quizzes.loadQuizzes();
        
        // Verificar se há progresso salvo
        const urlParams = new URLSearchParams(window.location.search);
        const startQuizId = urlParams.get('start');
        
        if (startQuizId) {
            // Verificar progresso salvo
            const savedProgress = Quizzes.execution.restoreProgress();
            if (savedProgress && savedProgress.quizId === startQuizId) {
                if (confirm('Há um quiz em andamento. Deseja continuar de onde parou?')) {
                    Quizzes.execution.restoreFromProgress(savedProgress);
                } else {
                    sessionStorage.removeItem('quiz_progress');
                    Quizzes.execution.start(startQuizId);
                }
            } else {
                Quizzes.execution.start(startQuizId);
            }
        }
    },

    // Carregar lista de quizzes
    loadQuizzes: () => {
        const userId = Auth.current.id;
        const userQuizzes = Storage.getUserQuizzes(userId);
        const container = document.getElementById('quizzesGrid');
        
        if (!container) return;
        
        if (userQuizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-question-circle fa-3x"></i>
                    <h3>Nenhum simulado encontrado</h3>
                    <p>Importe seu primeiro simulado para começar a praticar</p>
                    <button class="btn btn--primary" onclick="openImportModal()">
                        <i class="fas fa-upload"></i>
                        Importar Simulado
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = userQuizzes.map(quiz => `
            <div class="quiz-card">
                <div class="quiz-header">
                    <h4>${quiz.title}</h4>
                    <span class="quiz-subject">${quiz.subject || 'Geral'}</span>
                </div>
                <div class="quiz-description">
                    ${quiz.description || 'Sem descrição'}
                </div>
                <div class="quiz-stats">
                    <div class="quiz-stat">
                        <i class="fas fa-list"></i>
                        ${quiz.questions.length} questões
                    </div>
                    <div class="quiz-stat">
                        <i class="fas fa-clock"></i>
                        ${quiz.timeLimit} min
                    </div>
                    <div class="quiz-stat">
                        <i class="fas fa-play"></i>
                        ${quiz.attempts} tentativas
                    </div>
                    ${quiz.bestScore > 0 ? `
                        <div class="quiz-stat">
                            <i class="fas fa-trophy"></i>
                            Melhor: ${quiz.bestScore}%
                        </div>
                    ` : ''}
                </div>
                <div class="quiz-actions">
                    <button class="btn btn--primary" onclick="Quizzes.execution.start('${quiz.id}')">
                        <i class="fas fa-play"></i>
                        Iniciar
                    </button>
                    <button class="btn btn--outline btn--sm" onclick="editQuiz('${quiz.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn--outline btn--sm" onclick="deleteQuiz('${quiz.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
};

// Funções globais para o HTML
function reviewQuiz() {
    if (Quizzes.currentReviewResults) {
        Quizzes.ui.reviewQuiz(Quizzes.currentReviewResults);
    } else {
        console.error('Nenhum resultado disponível para revisão');
    }
}

// Função para iniciar revisão de um simulado específico
function startQuizReview(quizId) {
    const userId = Auth.current.id;
    const userResults = Storage.getUserQuizResults(userId);
    const quizResults = userResults.filter(result => result.quizId === quizId);
    
    if (quizResults.length === 0) {
        alert('Nenhum resultado encontrado para este simulado');
        return;
    }
    
    // Pegar o resultado mais recente
    const latestResult = quizResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
    Quizzes.ui.reviewQuiz(latestResult);
}

// Função para iniciar revisão de um simulado específico
function startQuizReview(quizId) {
    const userId = Auth.current.id;
    const userResults = Storage.getUserQuizResults(userId);
    const quizResults = userResults.filter(result => result.quizId === quizId);
    
    if (quizResults.length === 0) {
        alert('Nenhum resultado encontrado para este simulado');
        return;
    }
    
    // Pegar o resultado mais recente
    const latestResult = quizResults.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
    Quizzes.ui.reviewQuiz(latestResult);
}

        // Salvar progresso (para recuperação)
        saveProgress: () => {
            const progress = {
                quizId: Quizzes.currentQuiz.id,
                currentQuestion: Quizzes.currentQuestion,
                userAnswers: Quizzes.userAnswers,
                startTime: Quizzes.startTime.toISOString(),
                timeLimit: Quizzes.timeLimit
            };
            
            sessionStorage.setItem('quiz_progress', JSON.stringify(progress));
        },

        // Recuperar progresso
        restoreProgress: () => {
            const saved = sessionStorage.getItem('quiz_progress');
            if (saved) {
                try {
                    const progress = JSON.parse(saved);
                    
                    // Verificar se ainda é válido (não muito antigo)
                    const savedTime = new Date(progress.startTime);
                    const now = new Date();
                    const hoursSince = (now - savedTime) / (1000 * 60 * 60);
                    
                    if (hoursSince < 6) { // Válido por 6 horas
                        return progress;
                    }
                } catch (e) {
                    console.log('Erro ao recuperar progresso:', e);
                }
                
                sessionStorage.removeItem('quiz_progress');
            }
            
            return null;
        }
    },

    // Interface do usuário
    ui: {
        // Configurar interface do quiz
        setupQuizInterface: () => {
            // Atualizar título e contador
            const titleEl = document.getElementById('quizTitle');
            const counterEl = document.getElementById('questionCounter');
            
            if (titleEl) titleEl.textContent = Quizzes.currentQuiz.title;
            if (counterEl) {
                counterEl.textContent = `Questão 1 de ${Quizzes.currentQuiz.questions.length}`;
            }
            
            // Configurar navegação de questões
            Quizzes.ui.setupQuestionNavigation();
            
            // Configurar botões de navegação
            Quizzes.ui.updateNavigationButtons();
        },

        // Configurar navegação de questões
        setupQuestionNavigation: () => {
            const navContainer = document.getElementById('questionNumbers');
            if (!navContainer) return;
            
            const questions = Quizzes.currentQuiz.questions;
            navContainer.innerHTML = questions.map((_, index) => 
                `<button class="question-nav-btn" onclick="Quizzes.execution.goToQuestion(${index})" id="navBtn${index}">
                    ${index + 1}
                </button>`
            ).join('');
            
            Quizzes.ui.updateQuestionNavigation();
        },

        // Atualizar navegação de questões
        updateQuestionNavigation: () => {
            const questions = Quizzes.currentQuiz.questions;
            
            questions.forEach((_, index) => {
                const btn = document.getElementById(`navBtn${index}`);
                if (btn) {
                    btn.className = 'question-nav-btn';
                    
                    if (index === Quizzes.currentQuestion) {
                        btn.className += ' current';
                    } else if (Quizzes.userAnswers[index] !== null) {
                        btn.className += ' answered';
                    }
                }
            });
        },

        // Exibir questão atual
        displayQuestion: () => {
            const question = Quizzes.currentQuiz.questions[Quizzes.currentQuestion];
            const cardContainer = document.getElementById('questionCard');
            
            if (!cardContainer || !question) return;
            
            const userAnswer = Quizzes.userAnswers[Quizzes.currentQuestion];
            
            cardContainer.innerHTML = `
                <div class="question-header">
                    <div class="question-number">
                        Questão ${Quizzes.currentQuestion + 1} de ${Quizzes.currentQuiz.questions.length}
                    </div>
                    <div class="question-category">${Quizzes.currentQuiz.subject || 'Geral'}</div>
                </div>
                
                <div class="question-content">
                    <h3>${question.question}</h3>
                </div>
                
                <div class="question-options">
                    ${['A', 'B', 'C', 'D'].map(option => `
                        <label class="option-label ${userAnswer === option ? 'selected' : ''}">
                            <input type="radio" 
                                   name="question${Quizzes.currentQuestion}" 
                                   value="${option}"
                                   ${userAnswer === option ? 'checked' : ''}
                                   onchange="Quizzes.execution.answerQuestion('${option}')">
                            <div class="option-content">
                                <span class="option-letter">${option}</span>
                                <span class="option-text">${question.options[option]}</span>
                            </div>
                        </label>
                    `).join('')}
                </div>
            `;
            
            // Atualizar contador
            const counterEl = document.getElementById('questionCounter');
            if (counterEl) {
                counterEl.textContent = `Questão ${Quizzes.currentQuestion + 1} de ${Quizzes.currentQuiz.questions.length}`;
            }
            
            // Atualizar botões de navegação
            Quizzes.ui.updateNavigationButtons();
            Quizzes.ui.updateQuestionNavigation();
        },

        // Atualizar botões de navegação
        updateNavigationButtons: () => {
            const prevBtn = document.getElementById('prevQuestion');
            const nextBtn = document.getElementById('nextQuestion');
            
            if (prevBtn) {
                prevBtn.disabled = Quizzes.currentQuestion === 0;
            }
            
            if (nextBtn) {
                const isLastQuestion = Quizzes.currentQuestion === Quizzes.currentQuiz.questions.length - 1;
                nextBtn.textContent = isLastQuestion ? 'Finalizar' : 'Próxima';
                nextBtn.innerHTML = isLastQuestion ? 
                    '<i class="fas fa-check"></i> Finalizar' : 
                    'Próxima <i class="fas fa-arrow-right"></i>';
            }
        },

        // Atualizar cronômetro
        updateTimer: (remainingSeconds) => {
            const timerEl = document.getElementById('quizTimer');
            if (!timerEl) return;
            
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            timerEl.textContent = timeString;
            
            // Mudar cor quando restam poucos minutos
            if (remainingSeconds <= 300) { // 5 minutos
                timerEl.style.color = 'var(--alert)';
            } else if (remainingSeconds <= 600) { // 10 minutos
                timerEl.style.color = 'var(--warning)';
            }
        },

        // Exibir resultados
        displayResults: (results) => {
            // Esconder execução e mostrar resultados
            document.getElementById('quizExecutionView').classList.add('hidden');
            document.getElementById('quizResultsView').classList.remove('hidden');
            
            // Atualizar elementos dos resultados
            const finalScoreEl = document.getElementById('finalScore');
            const correctAnswersEl = document.getElementById('correctAnswers');
            const totalQuestionsEl = document.getElementById('totalQuestions');
            const timeSpentEl = document.getElementById('timeSpent');
            const resultsIconEl = document.getElementById('resultsIcon');
            
            if (finalScoreEl) finalScoreEl.textContent = `${results.score}%`;
            if (correctAnswersEl) correctAnswersEl.textContent = results.correctAnswers;
            if (totalQuestionsEl) totalQuestionsEl.textContent = results.totalQuestions;
            if (timeSpentEl) {
                const minutes = Math.floor(results.timeSpent / 60);
                const seconds = results.timeSpent % 60;
                timeSpentEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Ícone baseado na pontuação
            if (resultsIconEl) {
                if (results.score >= 90) {
                    resultsIconEl.className = 'fas fa-trophy';
                    resultsIconEl.style.color = 'gold';
                } else if (results.score >= 70) {
                    resultsIconEl.className = 'fas fa-medal';
                    resultsIconEl.style.color = 'var(--success)';
                } else {
                    resultsIconEl.className = 'fas fa-chart-line';
                    resultsIconEl.style.color = 'var(--alert)';
                }
            }
            
            // Breakdown detalhado
            Quizzes.ui.displayResultsBreakdown(results);
        },

        // Exibir breakdown detalhado
        displayResultsBreakdown: (results) => {
            const breakdownEl = document.getElementById('resultsBreakdown');
            if (!breakdownEl) return;
            
            const categoryStats = {};
            results.questionResults.forEach(result => {
                const category = Quizzes.currentQuiz.subject || 'Geral';
                if (!categoryStats[category]) {
                    categoryStats[category] = { total: 0, correct: 0 };
                }
                categoryStats[category].total++;
                if (result.isCorrect) {
                    categoryStats[category].correct++;
                }
            });
            
            breakdownEl.innerHTML = `
                <div class="results-breakdown-header">
                    <h4>Detalhamento por Categoria</h4>
                </div>
                <div class="category-stats">
                    ${Object.entries(categoryStats).map(([category, stats]) => `
                        <div class="category-stat">
                            <span class="category-name">${category}</span>
                            <span class="category-score">${stats.correct}/${stats.total}</span>
                            <div class="category-bar">
                                <div class="category-progress" style="width: ${(stats.correct/stats.total)*100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="performance-message">
                    ${results.score >= 90 ? 
                        '<i class="fas fa-star"></i> Excelente! Você domina bem este assunto!' :
                        results.score >= 70 ?
                        '<i class="fas fa-thumbs-up"></i> Bom trabalho! Continue estudando para melhorar.' :
                        '<i class="fas fa-book"></i> Recomendamos revisar o conteúdo e tentar novamente.'
                    }
                </div>
            `;
        }
    },

    // Inicializar módulo
    init: () => {
        if (!Auth.requireAuth()) return;
        
        Quizzes.loadQuizzes();
        
        // Verificar se há progresso salvo
        const urlParams = new URLSearchParams(window.location.search);
        const startQuizId = urlParams.get('start');
        
        if (startQuizId) {
            // Verificar progresso salvo
            const savedProgress = Quizzes.execution.restoreProgress();
            if (savedProgress && savedProgress.quizId === startQuizId) {
                if (confirm('Há um quiz em andamento. Deseja continuar de onde parou?')) {
                    Quizzes.execution.restoreFromProgress(savedProgress);
                } else {
                    sessionStorage.removeItem('quiz_progress');
                    Quizzes.execution.start(startQuizId);
                }
            } else {
                Quizzes.execution.start(startQuizId);
            }
        }
    },

    // Carregar lista de quizzes
    loadQuizzes: () => {
        const userId = Auth.current.id;
        const userQuizzes = Storage.getUserQuizzes(userId);
        const container = document.getElementById('quizzesGrid');
        
        if (!container) return;
        
        if (userQuizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-question-circle fa-3x"></i>
                    <h3>Nenhum simulado encontrado</h3>
                    <p>Importe seu primeiro simulado para começar a praticar</p>
                    <button class="btn btn--primary" onclick="openImportModal()">
                        <i class="fas fa-upload"></i>
                        Importar Simulado
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = userQuizzes.map(quiz => `
            <div class="quiz-card">
                <div class="quiz-header">
                    <h4>${quiz.title}</h4>
                    <span class="quiz-subject">${quiz.subject || 'Geral'}</span>
                </div>
                <div class="quiz-description">
                    ${quiz.description || 'Sem descrição'}
                </div>
                <div class="quiz-stats">
                    <div class="quiz-stat">
                        <i class="fas fa-list"></i>
                        ${quiz.questions.length} questões
                    </div>
                    <div class="quiz-stat">
                        <i class="fas fa-clock"></i>
                        ${quiz.timeLimit} min
                    </div>
                    <div class="quiz-stat">
                        <i class="fas fa-play"></i>
                        ${quiz.attempts} tentativas
                    </div>
                    ${quiz.bestScore > 0 ? `
                        <div class="quiz-stat">
                            <i class="fas fa-trophy"></i>
                            Melhor: ${quiz.bestScore}%
                        </div>
                    ` : ''}
                </div>
                <div class="quiz-actions">
                    <button class="btn btn--primary" onclick="Quizzes.execution.start('${quiz.id}')">
                        <i class="fas fa-play"></i>
                        Iniciar
                    </button>
                    <button class="btn btn--outline btn--sm" onclick="editQuiz('${quiz.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn--outline btn--sm" onclick="deleteQuiz('${quiz.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
};

// Funções globais para o HTML
function openImportModal() {
    UI.modals.open('importModal');
}

function closeImportModal() {
    UI.modals.close('importModal');
    document.getElementById('quizTitle').value = '';
    document.getElementById('quizFile').value = '';
    document.getElementById('quizPreview').innerHTML = 'Selecione um arquivo para visualizar';
}

function previewQuiz() {
    const fileInput = document.getElementById('quizFile');
    const file = fileInput.files[0];
    
    if (file) {
        Quizzes.import.preview(file, (questions) => {
            const preview = document.getElementById('quizPreview');
            preview.innerHTML = `
                <strong>${questions.length} questões encontradas</strong>
                <div class="preview-questions">
                    ${questions.slice(0, 2).map(q => `
                        <div class="preview-question">
                            <strong>P:</strong> ${q.question}<br>
                            <strong>Opções:</strong> A) ${q.options.A} | B) ${q.options.B}<br>
                            <strong>Resposta:</strong> ${q.correctAnswer}
                        </div>
                    `).join('')}
                    ${questions.length > 2 ? '<div class="preview-more">+ mais ' + (questions.length - 2) + ' questões...</div>' : ''}
                </div>
            `;
        });
    }
}

function importQuiz() {
    const title = document.getElementById('quizTitle').value;
    const subject = document.getElementById('quizSubject').value;
    const description = document.getElementById('quizDescription').value;
    const timeLimit = document.getElementById('quizTimeLimit').value;
    const fileInput = document.getElementById('quizFile');
    const file = fileInput.files[0];
    
    if (!title || !file) {
        UI.notifications.show('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    Quizzes.import.preview(file, (questions) => {
        if (questions.length === 0) {
            UI.notifications.show('Nenhuma questão válida encontrada no arquivo', 'error');
            return;
        }
        
        const quizData = { title, subject, description, timeLimit };
        const quiz = Quizzes.import.createQuiz(quizData, questions, Auth.current.id);
        
        UI.notifications.show(`Quiz "${title}" importado com ${questions.length} questões!`, 'success');
        
        closeImportModal();
        Quizzes.loadQuizzes();
    });
}

function pauuiz() {
    Quizzes.execution.pause();
}

function exitQuiz() {
    if (confirm('Tem certeza que deseja sair do quiz? O progresso será perdido.')) {
        if (Quizzes.timer) {
            clearInterval(Quizzes.timer);
        }
        sessionStorage.removeItem('quiz_progress');
        window.location.href = 'quizzes.html';
    }
}

function nextQuestion() {
    Quizzes.execution.nextQuestion();
}

function prevQuestion() {
    Quizzes.execution.prevQuestion();
}

function reviewAnswers() {
    // Funcionalidade de revisão detalhada
    UI.notifications.show('Funcionalidade em desenvolvimento', 'info');
}

function restartQuiz() {
    if (confirm('Deseja refazer este simulado?')) {
        sessionStorage.removeItem('quiz_progress');
        Quizzes.execution.start(Quizzes.currentQuiz.id);
    }
}

function backToQuizzes() {
    sessionStorage.removeItem('quiz_progress');
    window.location.href = 'quizzes.html';
}

function editQuiz(quizId) {
    UI.notifications.show('Funcionalidade em desenvolvimento', 'info');
}

function deleteQuiz(quizId) {
    if (confirm('Tem certeza que deseja excluir este simulado?')) {
        const userId = Auth.current.id;
        const quizzes = Storage.getUserQuizzes(userId);
        const filteredQuizzes = quizzes.filter(q => q.id !== quizId);
        Storage.setUserQuizzes(userId, filteredQuizzes);
        
        UI.notifications.show('Simulado excluído com sucesso', 'success');
        Quizzes.loadQuizzes();
    }
}





