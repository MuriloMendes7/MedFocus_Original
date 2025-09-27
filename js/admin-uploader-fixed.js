(function(global) {
  'use strict';

  const state = {
    upload: {
      flashcard: null,
      simulado: null
    },
    editor: {
      flashcard: {
        items: [],
        editingIndex: null
      },
      simulado: {
        items: [],
        editingIndex: null
      }
    }
  };

  let storageService = null;

  function normalizeText(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  function parseFlashcardTxt(text) {
    if (global.ParserService && typeof global.ParserService.parseFlashcardTxt === 'function') {
      const result = global.ParserService.parseFlashcardTxt(text);
      // Convert to the format expected by admin-uploader.js
      const items = result.items.map((item, index) => ({
        linha: index + 1,
        pergunta: item.pergunta,
        resposta: item.resposta,
        explicacao: item.explicacao,
        bruta: item.pergunta + ' | ' + item.resposta + ' | ' + item.explicacao
      }));
      const errors = result.errors.map(err => ({
        linha: err.linha,
        motivo: err.motivo
      }));
      return { items, errors, totalLinhas: items.length + errors.length };
    } else {
      // Fallback to original implementation
      const normalized = normalizeText(text);
      const lines = normalized.split('\n');
      const items = [];
      const errors = [];

      const pattern = /^\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*$/;

      lines.forEach((line, index) => {
        const raw = line.trim();
        if (!raw || raw.startsWith('#') || raw.startsWith('//')) {
          return;
        }

        const match = raw.match(pattern);
        if (!match) {
          errors.push({ linha: index + 1, motivo: 'Formato invalido. Use "Pergunta | Resposta | Explicacao".' });
          return;
        }

        const pergunta = match[1].trim();
        const resposta = match[2].trim();
        const explicacao = match[3].trim();

        if (!pergunta || !resposta) {
          errors.push({ linha: index + 1, motivo: 'Pergunta e resposta sao obrigatorias.' });
          return;
        }

        items.push({
          linha: index + 1,
          pergunta,
          resposta,
          explicacao,
          bruta: raw
        });
      });

      return { items, errors, totalLinhas: lines.length };
    }
  }

  function parseSimuladoTxt(text) {
    if (global.ParserService && typeof global.ParserService.parseSimuladoTxt === 'function') {
      const result = global.ParserService.parseSimuladoTxt(text);
      // Convert to the format expected by admin-uploader.js
      const items = result.items.map((item, index) => ({
        linha: index + 1,
        pergunta: item.pergunta,
        alternativas: {
          A: { texto: item.A, bruta: 'A) ' + item.A },
          B: { texto: item.B, bruta: 'B) ' + item.B },
          C: { texto: item.C, bruta: 'C) ' + item.C },
          D: { texto: item.D, bruta: 'D) ' + item.D }
        },
        correta: item.correta,
        explicacao: item.explicacao,
        bruta: item.pergunta + ';A)' + item.A + ';B)' + item.B + ';C)' + item.C + ';D)' + item.D + ';' + item.correta + ';[' + item.explicacao + ']'
      }));
      const errors = result.errors.map(err => ({
        linha: err.linha,
        motivo: err.motivo
      }));
      return { items, errors, totalLinhas: items.length + errors.length };
    } else {
      // Fallback to original implementation
      const normalized = normalizeText(text);
      const lines = normalized.split('\n');
      const items = [];
      const errors = [];

      lines.forEach((line, index) => {
        const raw = line.trim();
        if (!raw || raw.startsWith('#') || raw.startsWith('//')) {
          return;
        }

        const parts = raw.split(';');
        if (parts.length < 6) {
          errors.push({ linha: index + 1, motivo: 'Numero incorreto de colunas. Esperado 6 ou 7 campos.' });
          return;
        }

        const pergunta = (parts[0] || '').trim();
        if (!pergunta) {
          errors.push({ linha: index + 1, motivo: 'Pergunta vazia.' });
          return;
        }

        const optionLetters = ['A', 'B', 'C', 'D'];
        const alternativas = {};
        let alternativaValida = true;

        optionLetters.forEach((letter, idx) => {
          const segment = (parts[idx + 1] || '').trim();
          const prefix = letter + ')';
          if (!segment.startsWith(prefix)) {
            alternativaValida = false;
            errors.push({ linha: index + 1, motivo: 'Alternativa ' + letter + ') deve iniciar com "' + prefix + '".' });
            return;
          }
          const texto = segment.slice(prefix.length).trim();
          if (!texto) {
            alternativaValida = false;
            errors.push({ linha: index + 1, motivo: 'Alternativa ' + letter + ') sem conteudo.' });
            return;
          }
          alternativas[letter] = {
            texto,
            bruta: segment
          };
        });

        if (!alternativaValida) {
          return;
        }

        const letraCorreta = (parts[5] || '').trim().toUpperCase();
        if (!optionLetters.includes(letraCorreta)) {
          errors.push({ linha: index + 1, motivo: 'Letra correta invalida. Use A, B, C ou D.' });
          return;
        }

        const explicacaoBruta = (parts[6] || '').trim();
        let explicacao = '';
        if (explicacaoBruta) {
          const match = explicacaoBruta.match(/^\[(.*)\]$/);
          if (!match) {
            errors.push({ linha: index + 1, motivo: 'Explicacao deve estar entre colchetes [ ].' });
            return;
          }
          explicacao = match[1].trim();
        }

        items.push({
          linha: index + 1,
          pergunta,
          alternativas,
          correta: letraCorreta,
          explicacao,
          bruta: raw
        });
      });

      return { items, errors, totalLinhas: lines.length };
    }
  }

  // Visual Editor functions

  function showSimuladoEditor() {
    checkAdminAccess();

    const modal = createEditorModal('simulado');
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Initialize the editor
    initSimuladoEditor(modal);
  }

  function showFlashcardEditor() {
    checkAdminAccess();

    const modal = createEditorModal('flashcard');
    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Initialize the editor
    initFlashcardEditor(modal);
  }

  function createEditorModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const title = type === 'simulado' ? 'Simulado' : 'Flashcards';
    const itemType = type === 'simulado' ? 'Questão' : 'Carta';
    modal.innerHTML = '<div class="modal-content editor-modal">' +
      '<div class="modal-header">' +
        '<h2>Criar Deck de ' + title + '</h2>' +
        '<button class="close-btn" onclick="this.closest(\'.modal\').remove()">&times;</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="deck-meta">' +
          '<input type="text" id="deckTitle" placeholder="Título do Deck" required>' +
          '<textarea id="deckDescription" placeholder="Descrição (opcional)"></textarea>' +
        '</div>' +
        '<div class="editor-content" id="editorContent"></div>' +
        '<div class="editor-actions">' +
          '<button id="addItemBtn" class="btn btn--primary">Adicionar ' + itemType + '</button>' +
          '<button id="saveDeckBtn" class="btn btn--success">Salvar Deck</button>' +
        '</div>' +
      '</div>' +
    '</div>';
    return modal;
  }

  function initSimuladoEditor(modal) {
    const content = modal.querySelector('#editorContent');
    const addBtn = modal.querySelector('#addItemBtn');
    const saveBtn = modal.querySelector('#saveDeckBtn');

    addBtn.addEventListener('click', () => addSimuladoItem(content));
    saveBtn.addEventListener('click', () => saveSimuladoDeckFromEditor(modal));

    // Add initial item
    addSimuladoItem(content);
  }

  function initFlashcardEditor(modal) {
    const content = modal.querySelector('#editorContent');
    const addBtn = modal.querySelector('#addItemBtn');
    const saveBtn = modal.querySelector('#saveDeckBtn');

    addBtn.addEventListener('click', () => addFlashcardItem(content));
    saveBtn.addEventListener('click', () => saveFlashcardDeckFromEditor(modal));

    // Add initial item
    addFlashcardItem(content);
  }

  function addSimuladoItem(container) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'editor-item simulado-item';
    const itemNumber = container.children.length + 1;
    itemDiv.innerHTML = '<div class="item-header">' +
      '<span class="item-number">Questão ' + itemNumber + '</span>' +
      '<button class="remove-item-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>' +
    '</div>' +
    '<textarea class="question-text" placeholder="Digite a pergunta" required></textarea>' +
    '<div class="alternatives">' +
      '<input type="text" class="alt-input" placeholder="A)" required>' +
      '<input type="text" class="alt-input" placeholder="B)" required>' +
      '<input type="text" class="alt-input" placeholder="C)" required>' +
      '<input type="text" class="alt-input" placeholder="D)" required>' +
    '</div>' +
    '<select class="correct-select" required>' +
      '<option value="">Selecione a correta</option>' +
      '<option value="A">A</option>' +
      '<option value="B">B</option>' +
      '<option value="C">C</option>' +
      '<option value="D">D</option>' +
    '</select>' +
    '<textarea class="explanation-text" placeholder="Explicação (opcional)"></textarea>';
    container.appendChild(itemDiv);
  }

  function addFlashcardItem(container) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'editor-item flashcard-item';
    const itemNumber = container.children.length + 1;
    itemDiv.innerHTML = '<div class="item-header">' +
      '<span class="item-number">Carta ' + itemNumber + '</span>' +
      '<button class="remove-item-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>' +
    '</div>' +
    '<textarea class="question-text" placeholder="Pergunta" required></textarea>' +
    '<textarea class="answer-text" placeholder="Resposta" required></textarea>' +
    '<textarea class="explanation-text" placeholder="Explicação (opcional)"></textarea>';
    container.appendChild(itemDiv);
  }

  function saveSimuladoDeckFromEditor(modal) {
    const title = modal.querySelector('#deckTitle').value.trim();
    const description = modal.querySelector('#deckDescription').value.trim();

    if (!title) {
      notify('Título do deck é obrigatório.', 'error');
      return;
    }

    const items = [];
    const itemElements = modal.querySelectorAll('.simulado-item');

    for (let itemEl of itemElements) {
      const question = itemEl.querySelector('.question-text').value.trim();
      const alts = itemEl.querySelectorAll('.alt-input');
      const correct = itemEl.querySelector('.correct-select').value;
      const explanation = itemEl.querySelector('.explanation-text').value.trim();

      if (!question || !correct) {
        notify('Preencha todos os campos obrigatórios.', 'error');
        return;
      }

      const alternativas = {};
      ['A', 'B', 'C', 'D'].forEach((letter, idx) => {
        const altText = alts[idx].value.trim();
        if (!altText) {
          notify('Todas as alternativas são obrigatórias.', 'error');
          return;
        }
        alternativas[letter] = altText;
      });

      items.push({
        pergunta: question,
        A: alternativas.A,
        B: alternativas.B,
        C: alternativas.C,
        D: alternativas.D,
        correta: correct,
        explicacao: explanation
      });
    }

    if (items.length === 0) {
      notify('Adicione pelo menos uma questão.', 'error');
      return;
    }

    saveSimuladoDeck({ title, description }, items)
      .then(() => {
        modal.remove();
      })
      .catch((error) => {
        console.error('Erro ao salvar deck:', error);
      });
  }

  function saveFlashcardDeckFromEditor(modal) {
    const title = modal.querySelector('#deckTitle').value.trim();
    const description = modal.querySelector('#deckDescription').value.trim();

    if (!title) {
      notify('Título do deck é obrigatório.', 'error');
      return;
    }

    const items = [];
    const itemElements = modal.querySelectorAll('.flashcard-item');

    for (let itemEl of itemElements) {
      const question = itemEl.querySelector('.question-text').value.trim();
      const answer = itemEl.querySelector('.answer-text').value.trim();
      const explanation = itemEl.querySelector('.explanation-text').value.trim();

      if (!question || !answer) {
        notify('Pergunta e resposta são obrigatórias.', 'error');
        return;
      }

      items.push({
        pergunta: question,
        resposta: answer,
        explicacao: explanation
      });
    }

    if (items.length === 0) {
      notify('Adicione pelo menos uma carta.', 'error');
      return;
    }

    saveFlashcardDeck({ title, description }, items)
      .then(() => {
        modal.remove();
      })
      .catch((error) => {
        console.error('Erro ao salvar deck:', error);
      });
  }

  // ... rest of the existing code ...

  global.AdminUploader = {
    initAdminUploadAndEditors,
    parseSimuladoTxt,
    parseFlashcardTxt,
    showFlashcardUploadModal,
    showSimuladoUploadModal,
    saveFlashcardDeck,
    saveSimuladoDeck,
    showSimuladoEditor,
    showFlashcardEditor
  };
})(window);
