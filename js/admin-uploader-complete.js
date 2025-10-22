(function (global) {
  'use strict';

  const FLASHCARD_PREVIEW_LIMIT = 5;
  const QUIZ_PREVIEW_LIMIT = 3;
  const ADMIN_ROLE = 'admin';

  const state = {
    initialized: false,
    supabase: null,
    flashcard: { files: [], items: [], errors: [] },
    simulado: { file: null, items: [], errors: [] }
  };

  let storageService = null;

  const AdminUploader = {
    initAdminUploadAndEditors,
    showFlashcardUploadModal,
    showSimuladoUploadModal,
    finalizeFlashcardImport,
    finalizeSimuladoImport
  };

  global.AdminUploader = AdminUploader;
  global.showFlashcardUploadModal = showFlashcardUploadModal;
  global.showSimuladoUploadModal = showSimuladoUploadModal;
  global.processUpload = finalizeFlashcardImport;
  global.processQuizUpload = finalizeSimuladoImport;
  global.closeModal = closeModal;

  async function initAdminUploadAndEditors(options) {
    if (state.initialized) {
      return;
    }

    state.supabase = options && options.supabaseClientOrNull ? options.supabaseClientOrNull : null;

    const user = await waitForCurrentUser();
    if (!ensureAdminAccess(user, true)) {
      return;
    }

    storageService = await waitForStorageService();

    if (state.supabase && storageService) {
      storageService.supabaseClient = state.supabase;
      storageService.useSupabase = true;
    }

    bindToolbarButtons();
    setupFlashcardModal();
    setupSimuladoModal();

    state.initialized = true;
  }

  function bindToolbarButtons() {
    const flashcardsSection = document.getElementById('adminFlashcards');
    if (flashcardsSection) {
      const uploadBtn = flashcardsSection.querySelector('.btn.btn--primary');
      if (uploadBtn && !uploadBtn.dataset.adminUploaderBound) {
        uploadBtn.addEventListener('click', showFlashcardUploadModal);
        uploadBtn.dataset.adminUploaderBound = 'true';
      }
    }

    const quizzesSection = document.getElementById('adminQuizzes');
    if (quizzesSection) {
      const uploadBtn = quizzesSection.querySelector('.btn.btn--primary');
      if (uploadBtn && !uploadBtn.dataset.adminUploaderBound) {
        uploadBtn.addEventListener('click', showSimuladoUploadModal);
        uploadBtn.dataset.adminUploaderBound = 'true';
      }
    }
  }

  function setupFlashcardModal() {
    const modal = document.getElementById('flashcardUploadModal');
    if (!modal || modal.dataset.adminUploaderSetup === 'true') {
      return;
    }
    modal.dataset.adminUploaderSetup = 'true';

    const input = modal.querySelector('#fileInput');
    if (input) {
      input.accept = '.txt';
      input.multiple = true;
      input.addEventListener('change', function (event) {
        handleFlashcardFiles(event.target.files);
      });
    }

    const uploadArea = modal.querySelector('#uploadArea');
    if (uploadArea) {
      configureDropzone(uploadArea, handleFlashcardFiles);
    }

    const footerBtn = modal.querySelector('.modal-footer .btn.btn--primary');
    if (footerBtn) {
      footerBtn.disabled = true;
    }

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal('flashcardUploadModal');
      });
    }
  }

  function setupSimuladoModal() {
    const modal = document.getElementById('quizUploadModal');
    if (!modal || modal.dataset.adminUploaderSetup === 'true') {
      return;
    }
    modal.dataset.adminUploaderSetup = 'true';

    const input = modal.querySelector('#quizUploadInput');
    if (input) {
      input.accept = '.txt';
      input.addEventListener('change', function (event) {
        handleSimuladoFiles(event.target.files);
      });
    }

    const uploadArea = modal.querySelector('#quizUploadArea');
    if (uploadArea) {
      configureDropzone(uploadArea, handleSimuladoFiles);
    }

    const footerBtn = modal.querySelector('.modal-footer .btn.btn--primary');
    if (footerBtn) {
      footerBtn.disabled = true;
    }

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeModal('quizUploadModal');
      });
    }
  }

  function configureDropzone(area, handler) {
    area.addEventListener('dragover', function (event) {
      event.preventDefault();
      area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', function () {
      area.classList.remove('drag-over');
    });

    area.addEventListener('drop', function (event) {
      event.preventDefault();
      area.classList.remove('drag-over');
      if (event.dataTransfer && event.dataTransfer.files) {
        handler(event.dataTransfer.files);
      }
    });

    area.addEventListener('click', function () {
      const input = area.querySelector('input[type="file"]');
      if (input) {
        input.click();
      }
    });
  }

  function showFlashcardUploadModal() {
    if (!ensureAdminAccess(global.app && global.app.currentUser, true)) {
      return;
    }
    resetFlashcardState();
    setupFlashcardModal();
    openModal('flashcardUploadModal');
  }

  function showSimuladoUploadModal() {
    if (!ensureAdminAccess(global.app && global.app.currentUser, true)) {
      return;
    }
    resetSimuladoState();
    setupSimuladoModal();
    openModal('quizUploadModal');
  }

  function resetFlashcardState() {
    state.flashcard = { files: [], items: [], errors: [] };

    const preview = document.getElementById('filePreview');
    if (preview) {
      preview.innerHTML = '<div class="empty-state">Nenhum arquivo selecionado.</div>';
    }

    const modal = document.getElementById('flashcardUploadModal');
    if (modal) {
      const footerBtn = modal.querySelector('.modal-footer .btn.btn--primary');
      if (footerBtn) {
        footerBtn.disabled = true;
      }
      const input = modal.querySelector('#fileInput');
      if (input) {
        input.value = '';
      }
    }
  }

  function resetSimuladoState() {
    state.simulado = { file: null, items: [], errors: [] };

    const preview = document.getElementById('quizFilePreview');
    if (preview) {
      preview.innerHTML = '<div class="empty-state">Nenhum arquivo selecionado.</div>';
    }

    const modal = document.getElementById('quizUploadModal');
    if (modal) {
      const footerBtn = modal.querySelector('.modal-footer .btn.btn--primary');
      if (footerBtn) {
        footerBtn.disabled = true;
      }
      const input = modal.querySelector('#quizUploadInput');
      if (input) {
        input.value = '';
      }
    }
  }

  async function handleFlashcardFiles(fileList) {
    const files = Array.from(fileList || []).filter(function (file) {
      return /\.txt$/i.test(file.name);
    });
    if (!files.length) {
      notify('Selecione arquivos .txt para importar.', 'warning');
      return;
    }

    resetFlashcardState();
    state.flashcard.files = files;

    const aggregatedItems = [];
    const aggregatedErrors = [];

    for (const file of files) {
      try {
        const text = await readFileText(file);
        const parsed = parseFlashcardText(text);
        parsed.items.forEach(function (item, index) {
          aggregatedItems.push({
            fileName: file.name,
            line: item.line || index + 1,
            question: item.question,
            answer: item.answer,
            explanation: item.explanation || ''
          });
        });
        parsed.errors.forEach(function (error) {
          aggregatedErrors.push({
            fileName: file.name,
            line: error.line,
            reason: error.reason
          });
        });
      } catch (error) {
        aggregatedErrors.push({ fileName: file.name, line: 0, reason: error.message || 'Falha ao ler arquivo' });
      }
    }

    state.flashcard.items = aggregatedItems;
    state.flashcard.errors = aggregatedErrors;
    renderFlashcardPreview();
  }

  async function handleSimuladoFiles(fileList) {
    const file = Array.from(fileList || []).find(function (entry) {
      return /\.txt$/i.test(entry.name);
    });
    if (!file) {
      notify('Selecione um arquivo .txt para importar.', 'warning');
      return;
    }

    resetSimuladoState();
    state.simulado.file = file;

    try {
      const text = await readFileText(file);
      const parsed = parseSimuladoText(text);
      state.simulado.items = parsed.items;
      state.simulado.errors = parsed.errors;
      renderSimuladoPreview();
    } catch (error) {
      state.simulado.items = [];
      state.simulado.errors = [{ line: 0, reason: error.message || 'Falha ao ler arquivo' }];
      renderSimuladoPreview();
    }
  }

  function renderFlashcardPreview() {
    const preview = document.getElementById('filePreview');
    if (!preview) {
      return;
    }

    const items = state.flashcard.items;
    const errors = state.flashcard.errors;
    const total = items.length + errors.length;

    if (total === 0) {
      preview.innerHTML = '<div class="empty-state">Nenhum dado valido encontrado.</div>';
      updateFlashcardProcessButton(false);
      return;
    }

    let html = '';
    html += '<div class="preview-summary">';
    html += '<p><strong>Arquivos:</strong> ' + state.flashcard.files.length + '</p>';
    html += '<p><strong>Linhas validas:</strong> ' + items.length + ' &bull; <strong>Invalidas:</strong> ' + errors.length + '</p>';
    html += '</div>';

    if (items.length) {
      html += '<table class="preview-table">';
      html += '<thead><tr><th>Pergunta</th><th>Resposta</th><th>Explicacao</th></tr></thead><tbody>';
      items.slice(0, FLASHCARD_PREVIEW_LIMIT).forEach(function (item) {
        html += '<tr><td>' + escapeHtml(item.question) + '</td><td>' + escapeHtml(item.answer) + '</td><td>' + escapeHtml(item.explanation) + '</td></tr>';
      });
      html += '</tbody></table>';
      if (items.length > FLASHCARD_PREVIEW_LIMIT) {
        html += '<p class="preview-hint">Mostrando ' + FLASHCARD_PREVIEW_LIMIT + ' de ' + items.length + ' cartas.</p>';
      }
    }

    if (errors.length) {
      html += '<div class="preview-errors">';
      html += '<h4>Erros detectados</h4>';
      html += '<ul>';
      errors.slice(0, 10).forEach(function (error) {
        const label = error.fileName ? error.fileName + ' ' : '';
        html += '<li>' + escapeHtml(label + 'Linha ' + error.line + ': ' + error.reason) + '</li>';
      });
      if (errors.length > 10) {
        html += '<li>+ ' + (errors.length - 10) + ' outros erros.</li>';
      }
      html += '</ul></div>';
    }

    preview.innerHTML = html;
    updateFlashcardProcessButton(items.length > 0);
  }

  function renderSimuladoPreview() {
    const preview = document.getElementById('quizFilePreview');
    if (!preview) {
      return;
    }

    const items = state.simulado.items;
    const errors = state.simulado.errors;

    if (!state.simulado.file) {
      preview.innerHTML = '<div class="empty-state">Nenhum arquivo selecionado.</div>';
      updateSimuladoProcessButton(false);
      return;
    }

    let html = '';
    html += '<div class="preview-summary">';
    html += '<p><strong>Arquivo:</strong> ' + escapeHtml(state.simulado.file.name) + '</p>';
    html += '<p><strong>Questoes validas:</strong> ' + items.length + ' &bull; <strong>Invalidas:</strong> ' + errors.length + '</p>';
    html += '</div>';

    if (items.length) {
      html += '<div class="preview-card-list">';
      items.slice(0, QUIZ_PREVIEW_LIMIT).forEach(function (item, index) {
        html += '<div class="preview-card">';
        html += '<p><strong>Q' + (index + 1) + ':</strong> ' + escapeHtml(item.question) + '</p>';
        html += '<ul class="preview-options">';
        ['A', 'B', 'C', 'D'].forEach(function (letter, optIndex) {
          const text = item.options[optIndex] || '';
          const prefix = item.correct === letter ? '<strong>' + letter + ')</strong>' : letter + ')';
          html += '<li>' + prefix + ' ' + escapeHtml(text) + '</li>';
        });
        html += '</ul>';
        if (item.explanation) {
          html += '<p class="preview-explanation"><em>Explicacao:</em> ' + escapeHtml(item.explanation) + '</p>';
        }
        html += '</div>';
      });
      html += '</div>';
      if (items.length > QUIZ_PREVIEW_LIMIT) {
        html += '<p class="preview-hint">Mostrando ' + QUIZ_PREVIEW_LIMIT + ' de ' + items.length + ' Questoes.</p>';
      }
    }

    if (errors.length) {
      html += '<div class="preview-errors">';
      html += '<h4>Erros detectados</h4>';
      html += '<ul>';
      errors.slice(0, 10).forEach(function (error) {
        html += '<li>Linha ' + error.line + ': ' + escapeHtml(error.reason) + '</li>';
      });
      if (errors.length > 10) {
        html += '<li>+ ' + (errors.length - 10) + ' outros erros.</li>';
      }
      html += '</ul></div>';
    }

    preview.innerHTML = html;
    updateSimuladoProcessButton(items.length > 0);
  }

  function updateFlashcardProcessButton(enabled) {
    const modal = document.getElementById('flashcardUploadModal');
    if (!modal) {
      return;
    }
    const footerBtn = modal.querySelector('.modal-footer .btn.btn--primary');
    if (footerBtn) {
      footerBtn.disabled = !enabled;
    }
  }

  function updateSimuladoProcessButton(enabled) {
    const modal = document.getElementById('quizUploadModal');
    if (!modal) {
      return;
    }
    const footerBtn = modal.querySelector('.modal-footer .btn.btn--primary');
    if (footerBtn) {
      footerBtn.disabled = !enabled;
    }
  }

  async function finalizeFlashcardImport() {
    if (!ensureAdminAccess(global.app && global.app.currentUser, true)) {
      return;
    }

    if (!state.flashcard.items.length) {
      notify('Nenhum flashcard valido para salvar.', 'error');
      return;
    }

    const categoryEl = document.getElementById('uploadCategory');
    const themeEl = document.getElementById('uploadTheme');
    const category = categoryEl ? categoryEl.value : '';
    const theme = themeEl ? themeEl.value.trim() : '';

    if (!category) {
      notify('Selecione uma categoria antes de salvar.', 'error');
      return;
    }

    const title = theme || inferTitleFromFiles(state.flashcard.files) || 'Deck importado';
    const description = theme || 'Importado em ' + new Date().toLocaleDateString('pt-BR');

    const cards = state.flashcard.items.map(function (item, index) {
      return {
        question: item.question,
        answer: item.answer,
        explanation: item.explanation,
        position: index
      };
    });

    const meta = { title: title, description: description, category: category, theme: theme };

    try {
      const storedDeck = await persistDeck('flashcard', meta, cards);
      updateLocalCollections('flashcard', storedDeck, meta);
      notify(cards.length + ' flashcards importados com sucesso!', 'success');
      closeModal('flashcardUploadModal');
      resetFlashcardState();
      refreshDashboards();
    } catch (error) {
      console.error('[AdminUploader] Falha ao salvar flashcards', error);
      notify('Nao foi possivel salvar os flashcards.', 'error');
    }
  }

  async function finalizeSimuladoImport() {
    if (!ensureAdminAccess(global.app && global.app.currentUser, true)) {
      return;
    }

    if (!state.simulado.items.length) {
      notify('Nenhuma Questao valida para salvar.', 'error');
      return;
    }

    const titleEl = document.getElementById('quizUploadTitle');
    const subjectEl = document.getElementById('quizUploadSubject');
    const timeLimitEl = document.getElementById('quizUploadTimeLimit');
    const descriptionEl = document.getElementById('quizUploadDescription');

    const title = titleEl ? titleEl.value.trim() : '';
    const subject = subjectEl ? subjectEl.value : '';
    const timeLimitValue = timeLimitEl ? timeLimitEl.value : '30';
    const description = descriptionEl ? descriptionEl.value.trim() : '';

    if (!subject) {
      notify('Selecione um assunto antes de salvar.', 'error');
      return;
    }

    const timeLimit = Math.max(parseInt(timeLimitValue, 10) || 30, 5);
    const fallbackTitle = state.simulado.file ? state.simulado.file.name.replace(/\.txt$/i, '') : 'Simulado';

    const questions = state.simulado.items.map(function (item, index) {
      return {
        question: item.question,
        options: item.options,
        correct: item.correct,
        explanation: item.explanation,
        position: index
      };
    });

    const meta = {
      title: title || fallbackTitle,
      description: description || 'Importado em ' + new Date().toLocaleDateString('pt-BR'),
      subject: subject,
      timeLimit: timeLimit
    };

    try {
      const storedQuiz = await persistDeck('simulado', meta, questions);
      updateLocalCollections('simulado', storedQuiz, meta);
      notify(questions.length + ' Questoes importadas com sucesso!', 'success');
      closeModal('quizUploadModal');
      resetSimuladoState();
      refreshDashboards();
    } catch (error) {
      console.error('[AdminUploader] Falha ao salvar simulado', error);
      notify('Nao foi possivel salvar o simulado.', 'error');
    }
  }

  async function persistDeck(type, meta, items) {
    if (!storageService) {
      storageService = await waitForStorageService();
    }

    if (!storageService) {
      throw new Error('Servico de armazenamento indisponivel.');
    }

    if (typeof storageService.saveDeckWithItems === 'function') {
      return storageService.saveDeckWithItems(type, meta, items);
    }

    if (type === 'flashcard' && typeof storageService.saveFlashcardDeck === 'function') {
      return storageService.saveFlashcardDeck(meta, items);
    }

    if (type === 'simulado' && typeof storageService.saveQuizDeck === 'function') {
      return storageService.saveQuizDeck(meta, items);
    }

    throw new Error('Metodos de persistencia nao disponiveis.');
  }

  function updateLocalCollections(type, storedDeck, meta) {
    if (type === 'flashcard') {
      const decks = readLocalCollection('medFocusDecks');
      const normalized = normalizeFlashcardDeck(storedDeck, meta);
      upsertLocalCollection('medFocusDecks', decks, normalized);
    } else {
      const quizzes = readLocalCollection('medFocusQuizzes');
      const normalized = normalizeSimuladoDeck(storedDeck, meta);
      upsertLocalCollection('medFocusQuizzes', quizzes, normalized);
    }
  }

  function normalizeFlashcardDeck(deck, meta) {
    const userId = deck && deck.userId ? deck.userId : (storageService && typeof storageService.getCurrentUserId === 'function' ? storageService.getCurrentUserId() : 'admin_local');
    const cards = Array.isArray(deck && deck.cards) ? deck.cards.map(normalizeFlashcardCard) : [];

    return {
      id: deck && deck.id ? deck.id : generateId('deck'),
      name: deck && deck.title ? deck.title : meta.title,
      description: deck && deck.description ? deck.description : (meta.description || ''),
      category: deck && deck.category ? deck.category : (meta.category || ''),
      userId: userId,
      created: deck && deck.createdAt ? deck.createdAt : new Date().toISOString(),
      cards: cards
    };
  }

  function normalizeFlashcardCard(card) {
    const question = card.question || card.pergunta || '';
    const answer = card.answer || card.resposta || '';
    const explanation = card.explanation || card.explicacao || '';

    return {
      id: card.id || generateId('card'),
      question: question,
      answer: answer,
      explanation: explanation,
      interval: card.interval || 1,
      repetitions: card.repetitions || 0,
      easeFactor: card.easeFactor || 2.5,
      nextReview: card.nextReview || new Date().toISOString().slice(0, 10),
      reviews: Array.isArray(card.reviews) ? card.reviews : []
    };
  }

  function normalizeSimuladoDeck(deck, meta) {
    const userId = deck && deck.userId ? deck.userId : (storageService && typeof storageService.getCurrentUserId === 'function' ? storageService.getCurrentUserId() : 'admin_local');
    const questions = Array.isArray(deck && deck.questions) ? deck.questions.map(normalizeSimuladoQuestion) : [];

    return {
      id: deck && deck.id ? deck.id : generateId('quiz'),
      title: deck && deck.title ? deck.title : meta.title,
      subject: deck && deck.subject ? deck.subject : (meta.subject || ''),
      description: deck && deck.description ? deck.description : (meta.description || ''),
      timeLimit: deck && deck.timeLimit ? deck.timeLimit : (meta.timeLimit || 30),
      userId: userId,
      created: deck && deck.createdAt ? deck.createdAt : new Date().toISOString(),
      questions: questions
    };
  }

  function normalizeSimuladoQuestion(question) {
    const options = Array.isArray(question.options) ? question.options.slice(0, 4) : [];
    const cleaned = options.map(function (option, index) {
      const letter = ['A', 'B', 'C', 'D'][index] || '';
      const text = (option || '').replace(/^\s*[A-D]\)\s*/i, '').trim();
      return letter + ') ' + text;
    });

    while (cleaned.length < 4) {
      const letter = ['A', 'B', 'C', 'D'][cleaned.length] || '';
      cleaned.push(letter + ') ');
    }

    return {
      id: question.id || generateId('question'),
      question: question.question || '',
      options: cleaned,
      correct: (question.correct || 'A').toUpperCase(),
      explanation: question.explanation || ''
    };
  }

  function upsertLocalCollection(key, collection, entity) {
    if (!entity) {
      return;
    }

    const index = collection.findIndex(function (item) {
      return item.id === entity.id;
    });
    if (index >= 0) {
      collection[index] = entity;
    } else {
      collection.push(entity);
    }

    writeLocalCollection(key, collection);
  }

  function readLocalCollection(key) {
    if (global.Storage && typeof global.Storage.get === 'function') {
      const data = global.Storage.get(key);
      return Array.isArray(data) ? data.slice() : [];
    }
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.warn('Nao foi possivel ler a colecao local', error);
      return [];
    }
  }

  function writeLocalCollection(key, collection) {
    if (global.Storage && typeof global.Storage.set === 'function') {
      global.Storage.set(key, collection);
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(collection));
    } catch (error) {
      console.warn('Nao foi possivel salvar a colecao local', error);
    }
  }

  function refreshDashboards() {
    if (!global.app) {
      return;
    }
    if (typeof global.app.loadAdminFlashcardsGrid === 'function') {
      global.app.loadAdminFlashcardsGrid();
    }
    if (typeof global.app.loadAdminStats === 'function') {
      global.app.loadAdminStats();
    }
    if (typeof global.app.loadFlashcardsFromStorage === 'function') {
      global.app.loadFlashcardsFromStorage();
    }
    if (typeof global.app.loadSimuladosFromStorage === 'function') {
      global.app.loadSimuladosFromStorage();
    }
    if (typeof global.app.renderSidebar === 'function') {
      global.app.renderSidebar();
    }
  }

  function parseFlashcardText(text) {
    if (global.ParserService && typeof global.ParserService.parseFlashcardTxt === 'function') {
      const result = global.ParserService.parseFlashcardTxt(text);
      const items = (result.items || []).map(function (item, index) {
        return {
          question: item.pergunta || item.question || '',
          answer: item.resposta || item.answer || '',
          explanation: item.explicacao || item.explanation || '',
          line: item.linha || index + 1
        };
      }).filter(function (item) {
        return item.question && item.answer;
      });
      const errors = (result.errors || []).map(function (error) {
        return {
          line: error.linha || error.line || 0,
          reason: error.motivo || error.reason || 'Linha invalida'
        };
      });
      return { items: items, errors: errors };
    }

    const items = [];
    const errors = [];
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const pattern = /^\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*$/;

    lines.forEach(function (line, index) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return;
      }
      const match = trimmed.match(pattern);
      if (!match) {
        errors.push({ line: index + 1, reason: 'Formato invalido. Use "Pergunta | Resposta | Explicacao".' });
        return;
      }
      const question = match[1].trim();
      const answer = match[2].trim();
      const explanation = match[3].trim();
      if (!question || !answer) {
        errors.push({ line: index + 1, reason: 'Pergunta e resposta sao obrigatorias.' });
        return;
      }
      items.push({ question: question, answer: answer, explanation: explanation, line: index + 1 });
    });

    return { items: items, errors: errors };
  }

  function parseSimuladoText(text) {
    if (global.ParserService && typeof global.ParserService.parseSimuladoTxt === 'function') {
      const result = global.ParserService.parseSimuladoTxt(text);
      const items = (result.items || []).map(function (item, index) {
        return {
          question: item.pergunta || item.question || '',
          options: [item.A, item.B, item.C, item.D].map(function (option) {
            return (option || '').trim();
          }),
          correct: (item.correta || item.correct || 'A').toUpperCase(),
          explanation: item.explicacao || item.explanation || '',
          line: item.linha || index + 1
        };
      }).filter(function (item) {
        return item.question && item.options.every(function (opt) {
          return opt;
        });
      });
      const errors = (result.errors || []).map(function (error) {
        return {
          line: error.linha || error.line || 0,
          reason: error.motivo || error.reason || 'Linha invalida'
        };
      });
      return { items: items, errors: errors };
    }

    const items = [];
    const errors = [];
    const lines = text.replace(/\r\n/g, '\n').split('\n');

    lines.forEach(function (line, index) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return;
      }
      const parts = trimmed.split(';');
      if (parts.length < 7) {
        errors.push({ line: index + 1, reason: 'Esperado 7 campos por linha.' });
        return;
      }
      const question = parts[0].trim();
      const alternatives = [];
      let valid = true;
      ['A)', 'B)', 'C)', 'D)'].forEach(function (prefix, altIndex) {
        const raw = (parts[altIndex + 1] || '').trim();
        if (!raw.startsWith(prefix)) {
          errors.push({ line: index + 1, reason: 'Alternativa ' + prefix + ' deve iniciar com "' + prefix + '".' });
          valid = false;
          return;
        }
        const content = raw.slice(2).trim();
        if (!content) {
          errors.push({ line: index + 1, reason: 'Alternativa ' + prefix + ' vazia.' });
          valid = false;
          return;
        }
        alternatives.push(content);
      });
      if (!valid) {
        return;
      }
      const correct = (parts[5] || 'A').trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(correct)) {
        errors.push({ line: index + 1, reason: 'Gabarito invalido: ' + correct });
        return;
      }
      const explanationRaw = (parts[6] || '').trim();
      const explanationMatch = explanationRaw.match(/^\[(.*)\]$/);
      const explanation = explanationMatch ? explanationMatch[1] : explanationRaw;
      items.push({
        question: question,
        options: alternatives,
        correct: correct,
        explanation: explanation.trim(),
        line: index + 1
      });
    });

    return { items: items, errors: errors };
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      return;
    }
    modal.style.display = 'block';
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      return;
    }
    modal.style.display = 'none';
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  function ensureAdminAccess(user, redirectIfNeeded) {
    if (user && user.role === ADMIN_ROLE) {
      return true;
    }
    notify('Acesso restrito a administradores.', 'error');
    if (redirectIfNeeded) {
      setTimeout(function () {
        global.location.hash = '#login';
      }, 400);
    }
    return false;
  }

  async function waitForCurrentUser() {
    const maxAttempts = 40;
    let attempts = 0;
    while (attempts < maxAttempts) {
      if (global.app && global.app.currentUser) {
        return global.app.currentUser;
      }
      await delay(150);
      attempts += 1;
    }
    return null;
  }

  async function waitForStorageService() {
    const maxAttempts = 40;
    let attempts = 0;
    while (attempts < maxAttempts) {
      if (global.AdminStorageService) {
        return global.AdminStorageService;
      }
      await delay(150);
      attempts += 1;
    }
    return null;
  }

  function inferTitleFromFiles(files) {
    if (!files || !files.length) {
      return '';
    }
    const first = files[0].name.replace(/\.txt$/i, '');
    if (files.length === 1) {
      return first;
    }
    return first + ' +' + (files.length - 1);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function generateId(prefix) {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  }

  function notify(message, type) {
    const container = document.getElementById('notifications');
    if (!container) {
      if (type === 'error') {
        alert(message);
      } else {
        console.log('[AdminUploader]', message);
      }
      return;
    }

    const note = document.createElement('div');
    note.className = 'notification notification--' + (type || 'info');
    note.textContent = message;
    container.appendChild(note);
    setTimeout(function () {
      if (note.parentNode) {
        note.parentNode.removeChild(note);
      }
    }, 4000);
  }

  function readFileText(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function (event) {
        resolve(event.target.result || '');
      };
      reader.onerror = function () {
        reject(new Error('Nao foi possivel ler o arquivo.'));
      };
      reader.readAsText(file);
    });
  }

})(window);
