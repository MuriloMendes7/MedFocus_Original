// Sistema de Hierarquia de Decks - Similar ao Anki
// Suporta múltiplos níveis usando :: como separador

class DeckHierarchy {
    constructor() {
        this.separator = '::';
    }

    // Parse do nome do deck para extrair hierarquia
    parseDeckName(deckName) {
        const parts = deckName.split(this.separator);
        return {
            fullName: deckName,
            parts: parts,
            levels: parts.length,
            parent: parts.length > 1 ? parts.slice(0, -1).join(this.separator) : null,
            name: parts[parts.length - 1],
            path: parts
        };
    }

    // Criar estrutura hierárquica a partir de lista de decks
    buildHierarchy(decks) {
        const hierarchy = {
            root: {},
            flat: decks
        };

        // Agrupar decks por hierarquia
        decks.forEach(deck => {
            const parsed = this.parseDeckName(deck.name);
            this.addToHierarchy(hierarchy.root, parsed, deck);
        });

        return hierarchy;
    }

    // Adicionar deck à estrutura hierárquica
    addToHierarchy(hierarchy, parsed, deck) {
        let current = hierarchy;
        
        // Navegar pela hierarquia
        for (let i = 0; i < parsed.parts.length - 1; i++) {
            const part = parsed.parts[i];
            if (!current[part]) {
                current[part] = {
                    type: 'folder',
                    name: part,
                    path: parsed.parts.slice(0, i + 1).join(this.separator),
                    children: {},
                    decks: []
                };
            }
            current = current[part].children;
        }

        // Adicionar o deck final
        const finalName = parsed.parts[parsed.parts.length - 1];
        if (!current[finalName]) {
            current[finalName] = {
                type: 'deck',
                name: finalName,
                path: parsed.fullName,
                deck: deck,
                children: {},
                decks: [deck]
            };
        } else {
            current[finalName].deck = deck;
            current[finalName].decks = [deck];
        }
    }

    // Obter todos os decks de uma pasta (incluindo subpastas)
    getAllDecksFromFolder(folder) {
        const decks = [];
        
        if (folder.type === 'deck') {
            decks.push(folder.deck);
        } else if (folder.type === 'folder') {
            Object.values(folder.children).forEach(child => {
                decks.push(...this.getAllDecksFromFolder(child));
            });
        }

        return decks;
    }

    // Obter decks de múltiplas pastas
    getDecksFromMultipleFolders(folders) {
        const allDecks = [];
        folders.forEach(folder => {
            allDecks.push(...this.getAllDecksFromFolder(folder));
        });
        return allDecks;
    }

    // Encontrar pasta por caminho
    findFolderByPath(hierarchy, path) {
        const parts = path.split(this.separator);
        let current = hierarchy;

        for (const part of parts) {
            if (current[part]) {
                current = current[part].children;
            } else {
                return null;
            }
        }

        return current;
    }

    // Gerar HTML para exibir hierarquia
    generateHierarchyHTML(hierarchy, level = 0) {
        let html = '';
        const indent = '  '.repeat(level);

        Object.values(hierarchy).forEach(item => {
            if (item.type === 'folder') {
                const folderId = `folder-${item.path.replace(/::/g, '-')}`;
                html += `${indent}<div class="hierarchy-folder" data-path="${item.path}">\n`;
                html += `${indent}  <div class="folder-header" onclick="toggleFolder('${item.path}')">\n`;
                html += `${indent}    <i class="fas fa-folder"></i>\n`;
                html += `${indent}    <span class="folder-name">${item.name}</span>\n`;
                html += `${indent}    <span class="folder-count">${this.countDecksInFolder(item)} decks</span>\n`;
                html += `${indent}  </div>\n`;
                html += `${indent}  <div class="folder-content" id="${folderId}" style="display: block;">\n`;
                html += this.generateHierarchyHTML(item.children, level + 2);
                html += `${indent}  </div>\n`;
                html += `${indent}</div>\n`;
            } else if (item.type === 'deck') {
                html += `${indent}<div class="hierarchy-deck" data-deck-id="${item.deck.id}">\n`;
                html += `${indent}  <div class="deck-item" onclick="selectDeck('${item.deck.id}')">\n`;
                html += `${indent}    <i class="fas fa-layer-group"></i>\n`;
                html += `${indent}    <span class="deck-name">${item.name}</span>\n`;
                html += `${indent}    <span class="deck-count">${item.deck.cards?.length || 0} cards</span>\n`;
                html += `${indent}  </div>\n`;
                html += `${indent}</div>\n`;
            }
        });

        return html;
    }

    // Contar decks em uma pasta
    countDecksInFolder(folder) {
        let count = 0;
        Object.values(folder.children).forEach(child => {
            if (child.type === 'deck') {
                count++;
            } else if (child.type === 'folder') {
                count += this.countDecksInFolder(child);
            }
        });
        return count;
    }

    // Validar nome do deck para hierarquia
    validateDeckName(name) {
        if (!name || name.trim() === '') {
            return { valid: false, error: 'Nome do deck é obrigatório' };
        }

        if (name.includes('  ')) {
            return { valid: false, error: 'Nome não pode conter espaços duplos' };
        }

        if (name.startsWith(this.separator) || name.endsWith(this.separator)) {
            return { valid: false, error: 'Nome não pode começar ou terminar com ::' };
        }

        return { valid: true };
    }

    // Sugerir nomes de hierarquia baseado em decks existentes
    suggestHierarchyNames(decks) {
        const suggestions = new Set();
        
        decks.forEach(deck => {
            const parsed = this.parseDeckName(deck.name);
            if (parsed.levels > 1) {
                // Adicionar sugestões baseadas em caminhos existentes
                for (let i = 1; i < parsed.parts.length; i++) {
                    suggestions.add(parsed.parts.slice(0, i).join(this.separator));
                }
            }
        });

        return Array.from(suggestions).sort();
    }
}

// Funções globais para interação com a hierarquia
window.DeckHierarchy = DeckHierarchy;

// Função para alternar visibilidade de pastas
window.toggleFolder = function(path) {
    const folderId = `folder-${path.replace(/::/g, '-')}`;
    const folderContent = document.getElementById(folderId);
    const folderHeader = document.querySelector(`[data-path="${path}"] .folder-header`);
    
    if (folderContent && folderHeader) {
        const isVisible = folderContent.style.display !== 'none';
        folderContent.style.display = isVisible ? 'none' : 'block';
        
        const icon = folderHeader.querySelector('i');
        if (icon) {
            icon.className = isVisible ? 'fas fa-folder' : 'fas fa-folder-open';
        }
    }
};

// Função para selecionar deck
window.selectDeck = function(deckId) {
    const deckElement = document.querySelector(`[data-deck-id="${deckId}"] .deck-item`);
    if (deckElement) {
        deckElement.classList.toggle('selected');
        
        // Atualizar contador de selecionados
        const selectedCount = document.querySelectorAll('.deck-item.selected').length;
        console.log(`${selectedCount} decks selecionados`);
        
        // Atualizar contador visual se disponível
        if (window.app && typeof window.app.updateSelectionCounter === 'function') {
            window.app.updateSelectionCounter();
        }
    }
};

// Função para selecionar múltiplos decks
window.selectMultipleDecks = function(deckIds) {
    deckIds.forEach(deckId => {
        const deckElement = document.querySelector(`[data-deck-id="${deckId}"] .deck-item`);
        if (deckElement) {
            deckElement.classList.add('selected');
        }
    });
};

// Função para criar decks de exemplo com hierarquia
window.createExampleHierarchy = function() {
    const exampleDecks = [
        // 6º ano - Medicina interna
        {
            id: 'deck_6ano_medicina_interna',
            name: '6º ano::Medicina interna',
            category: 'medicina',
            description: 'Deck principal de medicina interna',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_1',
                    question: 'Qual é a definição de hipertensão arterial?',
                    answer: 'Pressão arterial sistólica ≥ 140 mmHg e/ou diastólica ≥ 90 mmHg',
                    explanation: 'Definição baseada nas diretrizes atuais',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        },
        {
            id: 'deck_6ano_medicina_interna_era01',
            name: '6º ano::Medicina interna::ERA 01',
            category: 'medicina',
            description: 'Deck específico da ERA 01',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_2',
                    question: 'Quais são os critérios diagnósticos para diabetes tipo 2?',
                    answer: 'Glicemia de jejum ≥ 126 mg/dL ou HbA1c ≥ 6.5%',
                    explanation: 'Critérios da ADA',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                },
                {
                    id: 'card_3',
                    question: 'Qual é o tratamento de primeira linha para hipertensão?',
                    answer: 'IECA ou BRA, dependendo das comorbidades',
                    explanation: 'Baseado nas diretrizes atuais',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        },
        {
            id: 'deck_6ano_medicina_interna_era02',
            name: '6º ano::Medicina interna::ERA 02',
            category: 'medicina',
            description: 'Deck específico da ERA 02',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_4',
                    question: 'Quais são as complicações do diabetes?',
                    answer: 'Retinopatia, nefropatia, neuropatia, doença cardiovascular',
                    explanation: 'Complicações micro e macrovasculares',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                },
                {
                    id: 'card_5',
                    question: 'Qual é o manejo da insuficiência cardíaca?',
                    answer: 'IECA/ARA-II, betabloqueadores, diuréticos, espironolactona',
                    explanation: 'Tratamento baseado nas diretrizes',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        },
        {
            id: 'deck_6ano_medicina_interna_era03',
            name: '6º ano::Medicina interna::ERA 03',
            category: 'medicina',
            description: 'Deck específico da ERA 03',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_6',
                    question: 'Quais são os critérios para diagnóstico de infarto agudo do miocárdio?',
                    answer: 'Dor precordial + elevação de troponina + alterações no ECG',
                    explanation: 'Critérios da 4ª definição universal',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        },
        // 6º ano - Cirurgia
        {
            id: 'deck_6ano_cirurgia',
            name: '6º ano::Cirurgia',
            category: 'cirurgia',
            description: 'Deck principal de cirurgia',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_7',
                    question: 'Quais são as indicações para apendicectomia?',
                    answer: 'Apendicite aguda confirmada por exame clínico e laboratorial',
                    explanation: 'Tratamento cirúrgico padrão',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        },
        {
            id: 'deck_6ano_cirurgia_emergencia',
            name: '6º ano::Cirurgia::Emergência',
            category: 'cirurgia',
            description: 'Deck de cirurgia de emergência',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_8',
                    question: 'Qual é o manejo inicial do trauma abdominal?',
                    answer: 'ABCDE, exame físico, FAST, tomografia se estável',
                    explanation: 'Protocolo ATLS',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        },
        // 5º ano - Pediatria
        {
            id: 'deck_5ano_pediatria',
            name: '5º ano::Pediatria',
            category: 'pediatria',
            description: 'Deck principal de pediatria',
            userId: 'current_user',
            created: new Date().toISOString(),
            cards: [
                {
                    id: 'card_9',
                    question: 'Qual é a classificação de Denver para desenvolvimento infantil?',
                    answer: 'Avalia 4 áreas: motor grosso, motor fino, linguagem e pessoal-social',
                    explanation: 'Ferramenta de triagem do desenvolvimento',
                    interval: 1,
                    repetitions: 0,
                    easeFactor: 2.5,
                    nextReview: new Date().toISOString().split('T')[0],
                    reviews: []
                }
            ]
        }
    ];

    // Salvar decks de exemplo
    const existingDecks = JSON.parse(localStorage.getItem('medFocusDecks') || '[]');
    const newDecks = [...existingDecks, ...exampleDecks];
    localStorage.setItem('medFocusDecks', JSON.stringify(newDecks));

    // Recarregar interface se estiver na página de flashcards
    if (window.app && typeof window.app.loadFlashcards === 'function') {
        window.app.loadFlashcards();
    }

    console.log('Decks de exemplo criados com hierarquia!');
    alert('Decks de exemplo criados! Agora você pode ver a hierarquia funcionando.');
    return exampleDecks;
};
