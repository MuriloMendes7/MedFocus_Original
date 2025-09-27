// MedFocus Cards - Statistics Module
// Sistema completo de estatísticas com Chart.js e análise avançada

const Stats = {
    charts: {},
    currentPeriod: 30,
    currentUser: null,

    // Inicialização
    init: () => {
        if (!Auth.requireAuth()) return;
        
        Stats.currentUser = Auth.current.id;
        Stats.loadSummaryStats();
        Stats.createCharts();
        Stats.loadTables();
        Stats.createHeatmap();
    },

    // Carregar estatísticas de resumo
    loadSummaryStats: () => {
        const userId = Stats.currentUser;
        const userStats = Storage.getUserStats(userId);
        const period = Stats.currentPeriod;
        
        // Calcular período
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        
        const periodStats = Stats.utils.filterStatsByPeriod(userStats, startDate, endDate);
        const previousPeriodStats = Stats.utils.filterStatsByPeriod(userStats, 
            new Date(startDate.getTime() - period * 24 * 60 * 60 * 1000), startDate);
        
        // Calcular métricas
        const currentMetrics = Stats.utils.calculatePeriodMetrics(periodStats);
        const previousMetrics = Stats.utils.calculatePeriodMetrics(previousPeriodStats);
        
        // Atualizar interface
        Stats.ui.updateSummaryCards(currentMetrics, previousMetrics);
    },

    // Criar gráficos
    createCharts: () => {
        Stats.charts.dailyActivity = Stats.createDailyActivityChart();
        Stats.charts.accuracyTrend = Stats.createAccuracyTrendChart();
        Stats.charts.categoryPerformance = Stats.createCategoryPerformanceChart();
        Stats.charts.timeDistribution = Stats.createTimeDistributionChart();
        Stats.charts.deckRanking = Stats.createDeckRankingChart();
    },

    // Gráfico de atividade diária
    createDailyActivityChart: () => {
        const ctx = document.getElementById('dailyActivityChart');
        if (!ctx) return null;

        const data = Stats.data.getDailyActivityData();
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Total Reviews',
                        data: data.reviews,
                        backgroundColor: 'rgba(46, 196, 182, 0.7)',
                        borderColor: 'rgba(46, 196, 182, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Corretas',
                        data: data.correct,
                        backgroundColor: 'rgba(39, 174, 96, 0.7)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                if (context.datasetIndex === 0) {
                                    const correct = data.correct[context.dataIndex] || 0;
                                    const total = context.parsed.y || 0;
                                    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
                                    return `Precisão: ${accuracy}%`;
                                }
                                return '';
                            }
                        }
                    }
                },
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

    // Gráfico de evolução da precisão
    createAccuracyTrendChart: () => {
        const ctx = document.getElementById('accuracyTrendChart');
        if (!ctx) return null;

        const data = Stats.data.getAccuracyTrendData();
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Precisão %',
                    data: data.accuracy,
                    borderColor: 'rgba(18, 78, 102, 1)',
                    backgroundColor: 'rgba(18, 78, 102, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgba(18, 78, 102, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
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

    // Gráfico de desempenho por categoria
    createCategoryPerformanceChart: () => {
        const ctx = document.getElementById('categoryPerformanceChart');
        if (!ctx) return null;

        const data = Stats.data.getCategoryPerformanceData();
        
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(46, 196, 182, 0.8)',
                        'rgba(18, 78, 102, 0.8)',
                        'rgba(39, 174, 96, 0.8)',
                        'rgba(255, 140, 0, 0.8)',
                        'rgba(230, 57, 70, 0.8)'
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
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const percentage = Math.round((context.parsed / data.total) * 100);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Gráfico de distribuição de tempo
    createTimeDistributionChart: () => {
        const ctx = document.getElementById('timeDistributionChart');
        if (!ctx) return null;

        const data = Stats.data.getTimeDistributionData();
        
        return new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 205, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    // Gráfico de ranking de baralhos
    createDeckRankingChart: () => {
        const ctx = document.getElementById('deckRankingChart');
        if (!ctx) return null;

        const data = Stats.data.getDeckRankingData('accuracy');
        
        return new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Precisão %',
                    data: data.values,
                    backgroundColor: 'rgba(46, 196, 182, 0.7)',
                    borderColor: 'rgba(46, 196, 182, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
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

    // Criar heatmap de atividade
    createHeatmap: () => {
        const container = document.getElementById('activityHeatmap');
        if (!container) return;

        const data = Stats.data.getHeatmapData();
        const heatmapHtml = Stats.ui.generateHeatmapHTML(data);
        container.innerHTML = heatmapHtml;
    },

    // Carregar tabelas
    loadTables: () => {
        Stats.loadDeckStatsTable();
        Stats.loadQuizStatsTable();
    },

    // Carregar tabela de estatísticas de baralhos
    loadDeckStatsTable: () => {
        const tbody = document.getElementById('deckStatsBody');
        if (!tbody) return;

        const userId = Stats.currentUser;
        const decks = Storage.getUserDecks(userId);
        const userStats = Storage.getUserStats(userId);

        if (decks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum baralho encontrado</td></tr>';
            return;
        }

        const deckStats = decks.map(deck => {
            const stats = Flashcards.utils.calculateDeckStats(deck);
            const lastReview = deck.cards.reduce((latest, card) => {
                const lastReviewDate = card.reviews.length > 0 ? 
                    card.reviews[card.reviews.length - 1].date : null;
                return lastReviewDate && (!latest || lastReviewDate > latest) ? lastReviewDate : latest;
            }, null);

            return {
                name: deck.name,
                totalCards: stats.totalCards,
                totalReviews: stats.totalReviews,
                accuracy: stats.correctRate,
                totalTime: Stats.utils.calculateDeckTotalTime(deck),
                lastReview: lastReview ? Stats.utils.formatDate(new Date(lastReview)) : 'Nunca'
            };
        });

        tbody.innerHTML = deckStats.map(stats => `
            <tr>
                <td>${stats.name}</td>
                <td>${stats.totalCards}</td>
                <td>${stats.totalReviews}</td>
                <td>${stats.accuracy}%</td>
                <td>${Stats.utils.formatTime(stats.totalTime)}</td>
                <td>${stats.lastReview}</td>
            </tr>
        `).join('');
    },

    // Carregar tabela de estatísticas de quizzes
    loadQuizStatsTable: () => {
        const tbody = document.getElementById('quizStatsBody');
        if (!tbody) return;

        const userId = Stats.currentUser;
        const quizResults = Storage.getUserData(userId, 'quiz_results') || [];

        if (quizResults.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum resultado encontrado</td></tr>';
            return;
        }

        // Ordenar por data mais recente
        const sortedResults = quizResults
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 20); // Mostrar apenas os 20 mais recentes

        tbody.innerHTML = sortedResults.map(result => `
            <tr>
                <td>${result.quizTitle}</td>
                <td>${result.totalQuestions}</td>
                <td class="${result.score >= 70 ? 'text-success' : 'text-danger'}">${result.score}%</td>
                <td>${Stats.utils.formatTime(result.timeSpent)}</td>
                <td>${Stats.utils.formatDate(new Date(result.completedAt))}</td>
                <td>
                    <button class="btn btn--outline btn--sm" onclick="Stats.viewQuizDetails('${result.quizId}', '${result.completedAt}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // Atualizar período
    updatePeriod: () => {
        const periodSelect = document.getElementById('periodFilter');
        if (periodSelect) {
            Stats.currentPeriod = parseInt(periodSelect.value);
            Stats.loadSummaryStats();
            Stats.updateCharts();
        }
    },

    // Atualizar gráficos
    updateCharts: () => {
        Object.values(Stats.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        Stats.createCharts();
    },

    // Alternar tipo de precisão
    toggleAccuracyType: (type) => {
        const dailyBtn = document.getElementById('dailyAccuracy');
        const weeklyBtn = document.getElementById('weeklyAccuracy');
        
        if (type === 'daily') {
            dailyBtn.className = 'btn btn--sm btn--primary';
            weeklyBtn.className = 'btn btn--sm btn--outline';
        } else {
            dailyBtn.className = 'btn btn--sm btn--outline';
            weeklyBtn.className = 'btn btn--sm btn--primary';
        }
        
        // Recriar gráfico com dados diferentes
        if (Stats.charts.accuracyTrend) {
            Stats.charts.accuracyTrend.destroy();
        }
        Stats.charts.accuracyTrend = Stats.createAccuracyTrendChart(type);
    },

    // Atualizar ranking
    updateRanking: () => {
        const select = document.getElementById('rankingMetric');
        if (select && Stats.charts.deckRanking) {
            Stats.charts.deckRanking.destroy();
            Stats.charts.deckRanking = Stats.createDeckRankingChart(select.value);
        }
    },

    // Exportar dados
    exportData: () => {
        const userId = Stats.currentUser;
        const allData = {
            user: Auth.current,
            decks: Storage.getUserDecks(userId),
            quizzes: Storage.getUserQuizzes(userId),
            stats: Storage.getUserStats(userId),
            quiz_results: Storage.getUserData(userId, 'quiz_results') || []
        };
        
        const csv = Stats.utils.convertToCSV(allData);
        Stats.utils.downloadCSV(csv, `medfocus_stats_${new Date().toISOString().split('T')[0]}.csv`);
        
        UI.notifications.show('Dados exportados com sucesso!', 'success');
    },

    // Exportar estatísticas de baralhos
    exportDeckStats: () => {
        const userId = Stats.currentUser;
        const decks = Storage.getUserDecks(userId);
        
        const deckData = decks.map(deck => {
            const stats = Flashcards.utils.calculateDeckStats(deck);
            return {
                'Nome do Baralho': deck.name,
                'Total de Cards': stats.totalCards,
                'Cards Devidos': stats.dueCards,
                'Total de Reviews': stats.totalReviews,
                'Taxa de Acerto': stats.correctRate + '%',
                'Fator de Facilidade Médio': stats.averageEaseFactor,
                'Data de Criação': deck.created,
                'Última Revisão': deck.lastStudied || 'Nunca'
            };
        });
        
        const csv = Stats.utils.objectArrayToCSV(deckData);
        Stats.utils.downloadCSV(csv, `baralhos_stats_${new Date().toISOString().split('T')[0]}.csv`);
        
        UI.notifications.show('Estatísticas de baralhos exportadas!', 'success');
    },

    // Exportar estatísticas de quizzes
    exportQuizStats: () => {
        const userId = Stats.currentUser;
        const quizResults = Storage.getUserData(userId, 'quiz_results') || [];
        
        const quizData = quizResults.map(result => ({
            'Título do Quiz': result.quizTitle,
            'Total de Questões': result.totalQuestions,
            'Respostas Corretas': result.correctAnswers,
            'Pontuação': result.score + '%',
            'Tempo Gasto (segundos)': result.timeSpent,
            'Aprovado': result.passed ? 'Sim' : 'Não',
            'Data de Conclusão': result.completedAt
        }));
        
        const csv = Stats.utils.objectArrayToCSV(quizData);
        Stats.utils.downloadCSV(csv, `quizzes_stats_${new Date().toISOString().split('T')[0]}.csv`);
        
        UI.notifications.show('Estatísticas de quizzes exportadas!', 'success');
    },

    // Ver detalhes do quiz
    viewQuizDetails: (quizId, completedAt) => {
        UI.notifications.show('Visualização de detalhes em desenvolvimento', 'info');
    },

    // Módulo de dados
    data: {
        // Obter dados de atividade diária
        getDailyActivityData: () => {
            const userId = Stats.currentUser;
            const userStats = Storage.getUserStats(userId);
            const period = Stats.currentPeriod;
            
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - period);
            
            const labels = [];
            const reviews = [];
            const correct = [];
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                const dayStats = userStats[dateKey];
                
                labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
                reviews.push(dayStats ? (dayStats.reviews || 0) : 0);
                correct.push(dayStats ? (dayStats.correct || 0) : 0);
            }
            
            return { labels, reviews, correct };
        },

        // Obter dados de tendência de precisão
        getAccuracyTrendData: () => {
            const { labels, reviews, correct } = Stats.data.getDailyActivityData();
            
            const accuracy = reviews.map((totalReviews, index) => {
                const correctReviews = correct[index] || 0;
                return totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
            });
            
            return { labels, accuracy };
        },

        // Obter dados de desempenho por categoria
        getCategoryPerformanceData: () => {
            const userId = Stats.currentUser;
            const decks = Storage.getUserDecks(userId);
            
            const categories = {};
            let total = 0;
            
            decks.forEach(deck => {
                const category = deck.category || 'Geral';
                const stats = Flashcards.utils.calculateDeckStats(deck);
                
                if (!categories[category]) {
                    categories[category] = 0;
                }
                categories[category] += stats.totalReviews;
                total += stats.totalReviews;
            });
            
            return {
                labels: Object.keys(categories),
                values: Object.values(categories),
                total
            };
        },

        // Obter dados de distribuição de tempo
        getTimeDistributionData: () => {
            const periods = ['Manhã (6-12h)', 'Tarde (12-18h)', 'Noite (18-24h)', 'Madrugada (0-6h)'];
            const values = [25, 35, 30, 10]; // Dados simulados - implementar coleta real
            
            return { labels: periods, values };
        },

        // Obter dados de ranking de baralhos
        getDeckRankingData: (metric = 'accuracy') => {
            const userId = Stats.currentUser;
            const decks = Storage.getUserDecks(userId);
            
            const deckStats = decks.map(deck => {
                const stats = Flashcards.utils.calculateDeckStats(deck);
                return {
                    name: deck.name.length > 20 ? deck.name.substring(0, 17) + '...' : deck.name,
                    accuracy: stats.correctRate,
                    reviews: stats.totalReviews,
                    time: Stats.utils.calculateDeckTotalTime(deck)
                };
            });
            
            // Ordenar por métrica escolhida
            deckStats.sort((a, b) => {
                switch(metric) {
                    case 'reviews':
                        return b.reviews - a.reviews;
                    case 'time':
                        return b.time - a.time;
                    default: // accuracy
                        return b.accuracy - a.accuracy;
                }
            });
            
            // Pegar top 10
            const top10 = deckStats.slice(0, 10);
            
            return {
                labels: top10.map(d => d.name),
                values: top10.map(d => d[metric])
            };
        },

        // Obter dados do heatmap
        getHeatmapData: () => {
            const userId = Stats.currentUser;
            const userStats = Storage.getUserStats(userId);
            
            // Gerar dados dos últimos 365 dias
            const data = {};
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 365);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                const dayStats = userStats[dateKey];
                const reviews = dayStats ? (dayStats.reviews || 0) : 0;
                
                data[dateKey] = Math.min(Math.floor(reviews / 10), 4); // Níveis 0-4
            }
            
            return data;
        }
    },

    // Módulo de interface
    ui: {
        // Atualizar cards de resumo
        updateSummaryCards: (current, previous) => {
            const elements = {
                totalReviews: document.getElementById('totalReviews'),
                averageAccuracy: document.getElementById('averageAccuracy'),
                studyStreak: document.getElementById('studyStreak'),
                totalTime: document.getElementById('totalTime'),
                reviewsChange: document.getElementById('reviewsChange'),
                accuracyChange: document.getElementById('accuracyChange'),
                streakChange: document.getElementById('streakChange'),
                timeChange: document.getElementById('timeChange')
            };
            
            if (elements.totalReviews) elements.totalReviews.textContent = current.totalReviews;
            if (elements.averageAccuracy) elements.averageAccuracy.textContent = `${current.accuracy}%`;
            if (elements.studyStreak) elements.studyStreak.textContent = current.streak;
            if (elements.totalTime) elements.totalTime.textContent = `${Math.round(current.totalTime / 3600)}h`;
            
            // Calcular mudanças percentuais
            const reviewsChange = Stats.utils.calculatePercentChange(previous.totalReviews, current.totalReviews);
            const accuracyChange = Stats.utils.calculatePercentChange(previous.accuracy, current.accuracy);
            const timeChange = Math.round((current.totalTime - previous.totalTime) / 3600);
            
            if (elements.reviewsChange) {
                elements.reviewsChange.textContent = `${reviewsChange > 0 ? '+' : ''}${reviewsChange}%`;
                elements.reviewsChange.className = reviewsChange >= 0 ? 'stat-change positive' : 'stat-change negative';
            }
            
            if (elements.accuracyChange) {
                elements.accuracyChange.textContent = `${accuracyChange > 0 ? '+' : ''}${accuracyChange}%`;
                elements.accuracyChange.className = accuracyChange >= 0 ? 'stat-change positive' : 'stat-change negative';
            }
            
            if (elements.streakChange) elements.streakChange.textContent = 'dias';
            
            if (elements.timeChange) {
                elements.timeChange.textContent = `${timeChange > 0 ? '+' : ''}${timeChange}h`;
                elements.timeChange.className = timeChange >= 0 ? 'stat-change positive' : 'stat-change negative';
            }
        },

        // Gerar HTML do heatmap
        generateHeatmapHTML: (data) => {
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 365);
            
            let html = '<div class="heatmap-grid">';
            
            // Cabeçalho com meses
            html += '<div class="heatmap-months">';
            for (let month = 0; month < 12; month++) {
                html += `<span class="heatmap-month">${new Date(0, month).toLocaleDateString('pt-BR', { month: 'short' })}</span>`;
            }
            html += '</div>';
            
            // Grid de dias
            html += '<div class="heatmap-days">';
            for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                const level = data[dateKey] || 0;
                const dayOfWeek = d.getDay();
                
                html += `<div class="heatmap-cell level-${level}" 
                              title="${d.toLocaleDateString('pt-BR')} - ${data[dateKey] * 10 || 0} reviews"
                              data-date="${dateKey}">
                         </div>`;
            }
            html += '</div></div>';
            
            return html;
        }
    },

    // Utilitários
    utils: {
        // Filtrar estatísticas por período
        filterStatsByPeriod: (userStats, startDate, endDate) => {
            const filtered = {};
            
            Object.keys(userStats).forEach(dateKey => {
                const date = new Date(dateKey);
                if (date >= startDate && date <= endDate) {
                    filtered[dateKey] = userStats[dateKey];
                }
            });
            
            return filtered;
        },

        // Calcular métricas de período
        calculatePeriodMetrics: (periodStats) => {
            let totalReviews = 0;
            let totalCorrect = 0;
            let totalTime = 0;
            let activeDays = 0;
            
            Object.values(periodStats).forEach(dayStats => {
                totalReviews += dayStats.reviews || 0;
                totalCorrect += dayStats.correct || 0;
                totalTime += dayStats.timeSpent || 0;
                if ((dayStats.reviews || 0) > 0) activeDays++;
            });
            
            const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
            const streak = Stats.utils.calculateStreak(periodStats);
            
            return {
                totalReviews,
                totalCorrect,
                accuracy,
                totalTime,
                activeDays,
                streak
            };
        },

        // Calcular sequência de estudos
        calculateStreak: (userStats) => {
            const today = new Date().toISOString().split('T')[0];
            let streak = 0;
            let currentDate = new Date();
            
            while (true) {
                const dateKey = currentDate.toISOString().split('T')[0];
                const dayStats = userStats[dateKey];
                
                if (dayStats && (dayStats.reviews || 0) > 0) {
                    streak++;
                } else {
                    break;
                }
                
                currentDate.setDate(currentDate.getDate() - 1);
                
                // Limitar verificação a 365 dias
                if (streak > 365) break;
            }
            
            return streak;
        },

        // Calcular tempo total de um baralho
        calculateDeckTotalTime: (deck) => {
            let totalTime = 0;
            deck.cards.forEach(card => {
                card.reviews.forEach(review => {
                    totalTime += review.timeSpent || 0;
                });
            });
            return totalTime;
        },

        // Calcular mudança percentual
        calculatePercentChange: (previous, current) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        },

        // Formatar tempo
        formatTime: (seconds) => {
            if (seconds < 60) return `${seconds}s`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        },

        // Formatar data
        formatDate: (date) => {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },

        // Converter objeto para CSV
        objectArrayToCSV: (objArray) => {
            if (objArray.length === 0) return '';
            
            const headers = Object.keys(objArray[0]);
            const csvContent = [
                headers.join(','),
                ...objArray.map(obj => 
                    headers.map(key => `"${obj[key]}"`).join(',')
                )
            ].join('\n');
            
            return csvContent;
        },

        // Converter dados completos para CSV
        convertToCSV: (data) => {
            let csv = 'Relatório Completo MedFocus Cards\n\n';
            
            // Adicionar diferentes seções
            if (data.decks.length > 0) {
                csv += 'Baralhos:\n';
                csv += Stats.utils.objectArrayToCSV(data.decks.map(deck => ({
                    Nome: deck.name,
                    Cards: deck.cards.length,
                    Categoria: deck.category || 'Geral',
                    Criado: deck.created
                })));
                csv += '\n\n';
            }
            
            return csv;
        },

        // Download CSV
        downloadCSV: (csvContent, filename) => {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};




