
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

  function parseSimuladoTxt(text) {
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
        const prefix = `${letter})`;
        if (!segment.startsWith(prefix)) {
          alternativaValida = false;
          errors.push({ linha: index + 1, motivo: `Alternativa ${letter}) deve iniciar com "${prefix}".` });
          return;
        }
        const texto = segment.slice(prefix.length).trim();
        if (!texto) {
          alternativaValida = false;
          errors.push({ linha: index + 1, motivo: `Alternativa ${letter}) sem conteudo.` });
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

  function notify(message, type) {
    if (global.app && typeof global.app.showNotification === 'function') {
      global.app.showNotification(message, type || 'info');
    } else {
      console[type === 'error' ? 'error' : 'log']('[admin]', message);
      if (type === 'error') {
        alert(message);
      }
    }
  }

  function ensureInput(id) {
    return document.getElementById(id);
  }

  function setButtonState(button, count) {
    if (!button) return;
    if (count > 0) {
      button.disabled = false;
      button.textContent = `Salvar (${count} validos)`;
    } else {
      button.disabled = true;
      button.textContent = 'Salvar';
    }
  }

  function renderFlashcardPreview() {
    const preview = document.getElementById('filePreview');
    const saveButton = document.querySelector('#flashcardUploadModal .modal-footer .btn.btn--primary');
    const current = state.upload.flashcard;

    if (!preview) {
      return;
    }

    if (!current || !current.items.length) {
      preview.innerHTML = '<div class="empty-state">Selecione um arquivo .txt para processar.</div>';
      setButtonState(saveButton, 0);
      return;
    }

    const total = current.items.length;
    const errors = current.errors.length;
    const rows = current.items.slice(0, 5).map((item) => {
      const explicacao = item.explicacao ? `<span class="preview-explanation">${item.explicacao}</span>` : '';
      return `<tr draggable="false"><td>${item.pergunta}</td><td>${item.resposta}</td><td>${explicacao}</td></tr>`;
    }).join('');

    const errorList = errors
      ? `<div class="preview-errors"><strong>Erros (${errors}):</strong><ul>${current.errors.map((err) => `<li>Linha ${err.linha}: ${err.motivo}</li>`).join('')}</ul></div>`
      : '';

    preview.innerHTML = `
      <div class="preview-summary">
        <div><strong>Arquivo:</strong> ${current.fileName}</div>
        <div><strong>Total linhas:</strong> ${current.totalLinhas}</div>
        <div><strong>Validos:</strong> ${total}</div>
        <div><strong>Ignorados:</strong> ${errors}</div>
      </div>
      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr><th>Pergunta</th><th>Resposta</th><th>Explicacao</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${errors > 0 ? '<p>Somente itens validos serao salvos.</p>' : ''}
      ${errorList}
    `;

    setButtonState(saveButton, total);
  }

  function renderSimuladoPreview() {
    const preview = document.getElementById('quizFilePreview');
    const saveButton = document.querySelector('#quizUploadModal .modal-footer .btn.btn--primary');
    const current = state.upload.simulado;

    if (!preview) {
      return;
    }

    if (!current || !current.items.length) {
      preview.innerHTML = '<div class="empty-state">Selecione um arquivo .txt para processar.</div>';
      setButtonState(saveButton, 0);
      return;
    }

    const total = current.items.length;
    const errors = current.errors.length;
    const rows = current.items.slice(0, 5).map((item) => {
      const alternativas = ['A', 'B', 'C', 'D'].map((letter) => {
        const texto = item.alternativas[letter]?.texto || '';
        const marker = item.correta === letter ? ' class="correct"' : '';
        return `<li${marker}>${letter}) ${texto}</li>`;
      }).join('');
      const explicacao = item.explicacao ? `<div class="preview-explanation">Explicacao: ${item.explicacao}</div>` : '';
      return `<div class="preview-question"><strong>${item.pergunta}</strong><ul>${alternativas}</ul>${explicacao}</div>`;
    }).join('');

    const errorList = errors
      ? `<div class="preview-errors"><strong>Erros (${errors}):</strong><ul>${current.errors.map((err) => `<li>Linha ${err.linha}: ${err.motivo}</li>`).join('')}</ul></div>`
      : '';

    preview.innerHTML = `
      <div class="preview-summary">
        <div><strong>Arquivo:</strong> ${current.fileName}</div>
        <div><strong>Total linhas:</strong> ${current.totalLinhas}</div>
        <div><strong>Validos:</strong> ${total}</div>
        <div><strong>Ignorados:</strong> ${errors}</div>
      </div>
      <div class="preview-questions">${rows}</div>
      ${errors > 0 ? '<p>Somente itens validos serao salvos.</p>' : ''}
      ${errorList}
    `;

    setButtonState(saveButton, total);
  }

  function resetFlashcardUpload() {
    state.upload.flashcard = null;
    const preview = document.getElementById('filePreview');
    if (preview) {
      preview.innerHTML = '<div class="empty-state">Selecione um arquivo .txt para processar.</div>';
    }
    const input = document.getElementById('fileInput');
    if (input) {
      input.value = '';
    }
    setButtonState(document.querySelector('#flashcardUploadModal .modal-footer .btn.btn--primary'), 0);
  }

  function resetSimuladoUpload() {
    state.upload.simulado = null;
    const preview = document.getElementById('quizFilePreview');
    if (preview) {
      preview.innerHTML = '<div class="empty-state">Selecione um arquivo .txt para processar.</div>';
    }
    const input = document.getElementById('quizUploadInput');
    if (input) {
      input.value = '';
    }
    setButtonState(document.querySelector('#quizUploadModal .modal-footer .btn.btn--primary'), 0);
  }

  async function readFileText(file) {
    if (!file) return '';
    if (typeof file.text === 'function') {
      return file.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function handleFlashcardFileSelection(event) {
    const files = Array.from(event?.target?.files || []);
    if (!files.length) {
      resetFlashcardUpload();
      return;
    }

    if (files.length > 1) {
      notify('Selecione apenas um arquivo por vez. Apenas o primeiro sera usado.', 'warning');
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.txt')) {
      notify('Use apenas arquivos .txt.', 'error');
      resetFlashcardUpload();
      return;
    }

    try {
      const text = await readFileText(file);
      const parsed = parseFlashcardTxt(text);
      state.upload.flashcard = {
        fileName: file.name,
        items: parsed.items,
        errors: parsed.errors,
        totalLinhas: parsed.totalLinhas
      };

      const titleInput = document.getElementById('flashcardDeckTitle');
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^.]+$/, '');
      }

      renderFlashcardPreview();
    } catch (error) {
      console.error('[admin] Falha ao ler arquivo de flashcards', error);
      notify('Nao foi possivel ler o arquivo selecionado.', 'error');
      resetFlashcardUpload();
    }
  }

  async function handleSimuladoFileSelection(event) {
    const files = Array.from(event?.target?.files || []);
    if (!files.length) {
      resetSimuladoUpload();
      return;
    }

    if (files.length > 1) {
      notify('Selecione apenas um arquivo por vez. Apenas o primeiro sera usado.', 'warning');
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.txt')) {
      notify('Use apenas arquivos .txt.', 'error');
      resetSimuladoUpload();
      return;
    }

    try {
      const text = await readFileText(file);
      const parsed = parseSimuladoTxt(text);
      state.upload.simulado = {
        fileName: file.name,
        items: parsed.items,
        errors: parsed.errors,
        totalLinhas: parsed.totalLinhas
      };

      const titleInput = document.getElementById('quizUploadTitle');
      if (titleInput && !titleInput.value.trim()) {
        titleInput.value = file.name.replace(/\.[^.]+$/, '');
      }

      renderSimuladoPreview();
    } catch (error) {
      console.error('[admin] Falha ao ler arquivo de simulado', error);
      notify('Nao foi possivel ler o arquivo selecionado.', 'error');
      resetSimuladoUpload();
    }
  }

  function getCurrentUserId() {
    try {
      if (global.app && global.app.currentUser && global.app.currentUser.id) {
        return global.app.currentUser.id;
      }
    } catch (error) {
      console.warn('[admin] Falha ao recuperar usuario atual', error);
    }
    return 'admin_local';
  }

  async function ensureAdminAccess() {
    const localUser = global.app?.currentUser;
    if (localUser && localUser.role === 'admin') {
      return true;
    }

    if (storageService && typeof storageService.isSupabase === 'function' && storageService.isSupabase() && storageService.supabase) {
      try {
        const { data, error } = await storageService.supabase.rpc('is_admin');
        if (error) {
          console.warn('[admin] RPC is_admin falhou', error);
        } else if (data === true) {
          return true;
        }
      } catch (rpcError) {
        console.warn('[admin] Erro ao verificar permissao admin', rpcError);
      }
    }

    notify('Acesso restrito a administradores.', 'error');
    if (typeof global.showPage === 'function') {
      global.showPage('loginPage');
    }
    return false;
  }

  function closeModalById(id) {
    if (global.closeModal) {
      global.closeModal(id);
      return;
    }
    if (global.app && typeof global.app.closeModal === 'function') {
      global.app.closeModal(id);
      return;
    }
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  function openModalById(id) {
    if (global.app && typeof global.app.showModal === 'function') {
      global.app.showModal(id);
      return;
    }
    if (typeof global.openModal === 'function') {
      global.openModal(id);
      return;
    }
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function collectFlashcardMeta() {
    const title = ensureInput('flashcardDeckTitle')?.value.trim() || (state.upload.flashcard?.fileName || 'Baralho importado');
    const description = ensureInput('flashcardDeckDescription')?.value.trim() || '';
    const category = ensureInput('uploadCategory')?.value || 'geral';
    const visibility = ensureInput('flashcardDeckVisibility')?.value || 'private';
    const createdBy = getCurrentUserId();

    return {
      title,
      description,
      category,
      visibility,
      createdBy
    };
  }

  function collectSimuladoMeta() {
    const title = ensureInput('quizUploadTitle')?.value.trim() || (state.upload.simulado?.fileName || 'Simulado importado');
    const description = ensureInput('quizUploadDescription')?.value.trim() || '';
    const category = ensureInput('quizUploadSubject')?.value || 'geral';
    const visibility = ensureInput('simuladoDeckVisibility')?.value || 'private';
    const timeLimit = parseInt(ensureInput('quizUploadTimeLimit')?.value || '30', 10);
    const createdBy = getCurrentUserId();

    return {
      title,
      description,
      category,
      visibility,
      timeLimit: Number.isFinite(timeLimit) && timeLimit > 0 ? timeLimit : 30,
      createdBy
    };
  }

  async function saveFlashcardDeck() {
    const allowed = await ensureAdminAccess();
    if (!allowed) return;

    const current = state.upload.flashcard;
    if (!current || !current.items.length) {
      notify('Nenhum card valido para salvar.', 'error');
      return;
    }

    try {
      const meta = collectFlashcardMeta();
      const result = await storageService.saveDeckWithItems('flashcard', meta, current.items);
      notify(`Baralho salvo com ${result.items.length} cards.`, 'success');
      closeModalById('flashcardUploadModal');
      resetFlashcardUpload();
      if (global.app) {
        global.app.loadFlashcards?.();
        global.app.loadAdminFlashcardsGrid?.();
      }
    } catch (error) {
      console.error('[admin] Falha ao salvar flashcards', error);
      notify('Nao foi possivel salvar os flashcards.', 'error');
    }
  }

  async function saveSimuladoDeck() {
    const allowed = await ensureAdminAccess();
    if (!allowed) return;

    const current = state.upload.simulado;
    if (!current || !current.items.length) {
      notify('Nenhuma questao valida para salvar.', 'error');
      return;
    }

    try {
      const meta = collectSimuladoMeta();
      const result = await storageService.saveDeckWithItems('simulado', meta, current.items, { timeLimit: meta.timeLimit });
      notify(`Simulado salvo com ${result.items.length} questoes.`, 'success');
      closeModalById('quizUploadModal');
      resetSimuladoUpload();
      if (global.app) {
        global.app.loadQuizzes?.();
        global.app.loadAdminFlashcardsGrid?.();
      }
    } catch (error) {
      console.error('[admin] Falha ao salvar simulado', error);
      notify('Nao foi possivel salvar o simulado.', 'error');
    }
  }

  function injectFlashcardMetaFields() {
    const modal = document.getElementById('flashcardUploadModal');
    if (!modal || modal.dataset.metaBound === '1') {
      return;
    }
    modal.dataset.metaBound = '1';

    const categoryGroup = modal.querySelector('.modal-body .form-group');
    if (!categoryGroup) {
      return;
    }

    const fragment = document.createDocumentFragment();

    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    titleGroup.innerHTML = `
      <label class="form-label" for="flashcardDeckTitle">Nome do baralho</label>
      <input type="text" id="flashcardDeckTitle" class="form-control" placeholder="Ex.: Sistema nervoso" />
    `;

    const descriptionGroup = document.createElement('div');
    descriptionGroup.className = 'form-group';
    descriptionGroup.innerHTML = `
      <label class="form-label" for="flashcardDeckDescription">Descricao (opcional)</label>
      <textarea id="flashcardDeckDescription" class="form-control" rows="2" placeholder="Resumo do conteudo"></textarea>
    `;

    const visibilityGroup = document.createElement('div');
    visibilityGroup.className = 'form-group';
    visibilityGroup.innerHTML = `
      <label class="form-label" for="flashcardDeckVisibility">Visibilidade</label>
      <select id="flashcardDeckVisibility" class="form-control">
        <option value="private">Privado</option>
        <option value="public">Publico</option>
      </select>
    `;

    modal.querySelector('.modal-body').insertBefore(fragment, categoryGroup);
  }

  function injectSimuladoMetaFields() {
    const modal = document.getElementById('quizUploadModal');
    if (!modal || modal.dataset.metaBound === '1') {
      return;
    }
    modal.dataset.metaBound = '1';

    const timeGroup = modal.querySelector('#quizUploadTimeLimit')?.closest('.form-group');
    if (!timeGroup) {
      return;
    }

    const visibilityGroup = document.createElement('div');
    visibilityGroup.className = 'form-group';
    visibilityGroup.innerHTML = `
      <label class="form-label" for="simuladoDeckVisibility">Visibilidade</label>
      <select id="simuladoDeckVisibility" class="form-control">
        <option value="private">Privado</option>
        <option value="public">Publico</option>
      </select>
    `;
    timeGroup.parentNode.insertBefore(visibilityGroup, timeGroup.nextSibling);
  }

  function setupFlashcardModal() {
    const modal = document.getElementById('flashcardUploadModal');
    if (!modal || modal.dataset.listeners === '1') {
      return;
    }
    modal.dataset.listeners = '1';

    injectFlashcardMetaFields();

    const input = document.getElementById('fileInput');
    const dropArea = document.getElementById('uploadArea');
    if (input) {
      input.addEventListener('change', handleFlashcardFileSelection);
    }
    if (dropArea) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropArea.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropArea.classList.add('dragging');
        });
      });
      ['dragleave', 'drop'].forEach((eventName) => {
        dropArea.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropArea.classList.remove('dragging');
        });
      });
      dropArea.addEventListener('drop', (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (file) {
          handleFlashcardFileSelection({ target: { files: [file] } });
        }
      });
      dropArea.addEventListener('click', () => input?.click());
    }

    const saveButton = document.querySelector('#flashcardUploadModal .modal-footer .btn.btn--primary');
    if (saveButton) {
      saveButton.addEventListener('click', saveFlashcardDeck);
      setButtonState(saveButton, 0);
    }
  }

  function setupSimuladoModal() {
    const modal = document.getElementById('quizUploadModal');
    if (!modal || modal.dataset.listeners === '1') {
      return;
    }
    modal.dataset.listeners = '1';

    injectSimuladoMetaFields();

    const input = document.getElementById('quizUploadInput');
    const dropArea = document.getElementById('quizUploadArea');
    if (input) {
      input.addEventListener('change', handleSimuladoFileSelection);
    }
    if (dropArea) {
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropArea.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropArea.classList.add('dragging');
        });
      });
      ['dragleave', 'drop'].forEach((eventName) => {
        dropArea.addEventListener(eventName, (event) => {
          event.preventDefault();
          dropArea.classList.remove('dragging');
        });
      });
      dropArea.addEventListener('drop', (event) => {
        const file = event.dataTransfer?.files?.[0];
        if (file) {
          handleSimuladoFileSelection({ target: { files: [file] } });
        }
      });
      dropArea.addEventListener('click', () => input?.click());
    }

    const saveButton = document.querySelector('#quizUploadModal .modal-footer .btn.btn--primary');
    if (saveButton) {
      saveButton.addEventListener('click', saveSimuladoDeck);
      setButtonState(saveButton, 0);
    }
  }

  function bindToolbarButtons() {
    const flashcardsToolbar = document.querySelector('#adminFlashcards .admin-toolbar');
    if (flashcardsToolbar && !flashcardsToolbar.dataset.editorBound) {
      const editorButton = Array.from(flashcardsToolbar.querySelectorAll('button')).find((btn) => btn.textContent?.toLowerCase().includes('editor'));
      if (editorButton) {
        editorButton.addEventListener('click', openFlashcardEditor);
      }
      flashcardsToolbar.dataset.editorBound = '1';
    }

    const quizzesToolbar = document.querySelector('#adminQuizzes .admin-toolbar');
    if (quizzesToolbar && !quizzesToolbar.dataset.editorBound) {
      const editorButton = Array.from(quizzesToolbar.querySelectorAll('button')).find((btn) => btn.textContent?.toLowerCase().includes('criar simulado'));
      if (editorButton) {
        editorButton.addEventListener('click', openSimuladoEditor);
      }
      quizzesToolbar.dataset.editorBound = '1';
    }
  }

  async function showFlashcardUploadModal() {
    const allowed = await ensureAdminAccess();
    if (!allowed) return;
    setupFlashcardModal();
    openModalById('flashcardUploadModal');
  }

  async function showSimuladoUploadModal() {
    const allowed = await ensureAdminAccess();
    if (!allowed) return;
    setupSimuladoModal();
    openModalById('quizUploadModal');
  }

  const editorDom = {
    flashcard: {},
    simulado: {}
  };

  function buildFlashcardEditorModal() {
    if (document.getElementById('flashcardEditorModal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'flashcardEditorModal';
    modal.className = 'modal hidden';

    const content = document.createElement('div');
    content.className = 'modal-content modal-lg';
    content.innerHTML = `
      <div class="modal-header">
        <h3>Criar baralho de flashcards</h3>
        <button class="modal-close" type="button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="editorFlashcardTitle">Nome do baralho</label>
          <input id="editorFlashcardTitle" class="form-control" type="text" placeholder="Ex.: Sistema renal" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editorFlashcardDescription">Descricao</label>
          <textarea id="editorFlashcardDescription" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="editorFlashcardCategory">Categoria</label>
          <select id="editorFlashcardCategory" class="form-control"></select>
        </div>
        <div class="form-group">
          <label class="form-label" for="editorFlashcardVisibility">Visibilidade</label>
          <select id="editorFlashcardVisibility" class="form-control">
            <option value="private">Privado</option>
            <option value="public">Publico</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="editorFlashcardBulkInput">Conteudo dos flashcards (formato: pergunta | resposta | explicacao por linha)</label>
          <textarea id="editorFlashcardBulkInput" class="form-control" rows="8" placeholder="Exemplo:\nQual a cor do sangue? | Vermelho | O sangue é vermelho devido à hemoglobina.\nQual o maior osso do corpo? | Femur | O fêmur é o maior osso do corpo humano."></textarea>
        </div>
        <div class="form-actions" style="display:flex; gap:8px;">
          <button type="button" class="btn btn--secondary" id="editorFlashcardParse">Processar conteudo</button>
          <button type="button" class="btn btn--outline" id="editorFlashcardReset">Limpar campos</button>
        </div>
        <div class="editor-list" id="editorFlashcardList"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn--outline" id="editorFlashcardCancel">Cancelar</button>
        <button type="button" class="btn btn--primary" id="editorFlashcardSave">Salvar baralho</button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    editorDom.flashcard = {
      modal,
      title: content.querySelector('#editorFlashcardTitle'),
      description: content.querySelector('#editorFlashcardDescription'),
      category: content.querySelector('#editorFlashcardCategory'),
      visibility: content.querySelector('#editorFlashcardVisibility'),
      bulkInput: content.querySelector('#editorFlashcardBulkInput'),
      parseButton: content.querySelector('#editorFlashcardParse'),
      resetButton: content.querySelector('#editorFlashcardReset'),
      list: content.querySelector('#editorFlashcardList'),
      saveButton: content.querySelector('#editorFlashcardSave'),
      cancelButton: content.querySelector('#editorFlashcardCancel'),
      closeButton: content.querySelector('.modal-close')
    };

    if (editorDom.flashcard.closeButton) {
      editorDom.flashcard.closeButton.addEventListener('click', closeFlashcardEditor);
    }
    if (editorDom.flashcard.cancelButton) {
      editorDom.flashcard.cancelButton.addEventListener('click', closeFlashcardEditor);
    }
    if (editorDom.flashcard.resetButton) {
      editorDom.flashcard.resetButton.addEventListener('click', () => {
        editorDom.flashcard.bulkInput.value = '';
        state.editor.flashcard.items = [];
        state.editor.flashcard.editingIndex = null;
        renderFlashcardEditorList();
      });
    }
    if (editorDom.flashcard.parseButton) {
      editorDom.flashcard.parseButton.addEventListener('click', () => {
        const text = editorDom.flashcard.bulkInput.value;
        const parsed = parseFlashcardTxt(text);
        state.editor.flashcard.items = parsed.items;
        state.editor.flashcard.editingIndex = null;
        if (parsed.errors.length > 0) {
          notify(`Erros encontrados: ${parsed.errors.map(e => `Linha ${e.linha}: ${e.motivo}`).join('; ')}`, 'error');
        }
        renderFlashcardEditorList();
      });
    }
    if (editorDom.flashcard.saveButton) {
      editorDom.flashcard.saveButton.addEventListener('click', saveFlashcardEditorDeck);
    }

    populateCategorySelect(editorDom.flashcard.category);
    renderFlashcardEditorList();
  }
  function buildSimuladoEditorModal() {
    if (document.getElementById('simuladoEditorModal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'simuladoEditorModal';
    modal.className = 'modal hidden';

    const content = document.createElement('div');
    content.className = 'modal-content modal-lg';
    content.innerHTML = `
      <div class="modal-header">
        <h3>Criar simulado</h3>
        <button class="modal-close" type="button">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="editorSimuladoTitle">Titulo</label>
          <input id="editorSimuladoTitle" class="form-control" type="text" placeholder="Ex.: Simulado de anatomia" />
        </div>
        <div class="form-group">
          <label class="form-label" for="editorSimuladoDescription">Descricao</label>
          <textarea id="editorSimuladoDescription" class="form-control" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="editorSimuladoCategory">Assunto</label>
          <select id="editorSimuladoCategory" class="form-control"></select>
        </div>
        <div class="form-group">
          <label class="form-label" for="editorSimuladoVisibility">Visibilidade</label>
          <select id="editorSimuladoVisibility" class="form-control">
            <option value="private">Privado</option>
            <option value="public">Publico</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="editorSimuladoTime">Tempo limite (min)</label>
          <input id="editorSimuladoTime" class="form-control" type="number" min="5" max="240" value="30" />
        </div>
        <div class="editor-inline">
          <div class="form-group">
            <label class="form-label" for="editorSimuladoQuestion">Pergunta</label>
            <textarea id="editorSimuladoQuestion" class="form-control" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="editorSimuladoOptionA">Alternativa A)</label>
            <textarea id="editorSimuladoOptionA" class="form-control" rows="1"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="editorSimuladoOptionB">Alternativa B)</label>
            <textarea id="editorSimuladoOptionB" class="form-control" rows="1"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="editorSimuladoOptionC">Alternativa C)</label>
            <textarea id="editorSimuladoOptionC" class="form-control" rows="1"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="editorSimuladoOptionD">Alternativa D)</label>
            <textarea id="editorSimuladoOptionD" class="form-control" rows="1"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="editorSimuladoCorrect">Correta</label>
            <select id="editorSimuladoCorrect" class="form-control">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="editorSimuladoExplanation">Explicacao</label>
            <textarea id="editorSimuladoExplanation" class="form-control" rows="2"></textarea>
          </div>
        </div>
        <div class="form-actions" style="display:flex; gap:8px;">
          <button type="button" class="btn btn--secondary" id="editorSimuladoAdd">Adicionar questao</button>
          <button type="button" class="btn btn--outline" id="editorSimuladoReset">Limpar campos</button>
        </div>
        <div class="editor-list" id="editorSimuladoList"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn--outline" id="editorSimuladoCancel">Cancelar</button>
        <button type="button" class="btn btn--primary" id="editorSimuladoSave">Salvar simulado</button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    editorDom.simulado = {
      modal,
      title: content.querySelector('#editorSimuladoTitle'),
      description: content.querySelector('#editorSimuladoDescription'),
      category: content.querySelector('#editorSimuladoCategory'),
      visibility: content.querySelector('#editorSimuladoVisibility'),
      timeLimit: content.querySelector('#editorSimuladoTime'),
      question: content.querySelector('#editorSimuladoQuestion'),
      optionA: content.querySelector('#editorSimuladoOptionA'),
      optionB: content.querySelector('#editorSimuladoOptionB'),
      optionC: content.querySelector('#editorSimuladoOptionC'),
      optionD: content.querySelector('#editorSimuladoOptionD'),
      correct: content.querySelector('#editorSimuladoCorrect'),
      explanation: content.querySelector('#editorSimuladoExplanation'),
      addButton: content.querySelector('#editorSimuladoAdd'),
      resetButton: content.querySelector('#editorSimuladoReset'),
      list: content.querySelector('#editorSimuladoList'),
      saveButton: content.querySelector('#editorSimuladoSave'),
      cancelButton: content.querySelector('#editorSimuladoCancel'),
      closeButton: content.querySelector('.modal-close')
    };

    if (editorDom.simulado.closeButton) {
      editorDom.simulado.closeButton.addEventListener('click', closeSimuladoEditor);
    }
    if (editorDom.simulado.cancelButton) {
      editorDom.simulado.cancelButton.addEventListener('click', closeSimuladoEditor);
    }
    if (editorDom.simulado.resetButton) {
      editorDom.simulado.resetButton.addEventListener('click', () => {
        editorDom.simulado.question.value = '';
        editorDom.simulado.optionA.value = '';
        editorDom.simulado.optionB.value = '';
        editorDom.simulado.optionC.value = '';
        editorDom.simulado.optionD.value = '';
        editorDom.simulado.explanation.value = '';
        state.editor.simulado.editingIndex = null;
        editorDom.simulado.addButton.textContent = 'Adicionar questao';
      });
    }
    if (editorDom.simulado.addButton) {
      editorDom.simulado.addButton.addEventListener('click', addSimuladoItem);
    }
    if (editorDom.simulado.saveButton) {
      editorDom.simulado.saveButton.addEventListener('click', saveSimuladoEditorDeck);
    }

    populateCategorySelect(editorDom.simulado.category);
    renderSimuladoEditorList();
  }
  function populateCategorySelect(select) {
    if (!select) return;
    const source = ensureInput('uploadCategory') || ensureInput('quizUploadSubject');
    if (!source) return;
    select.innerHTML = source.innerHTML;
  }

  function openFlashcardEditor() {
    ensureAdminAccess().then((allowed) => {
      if (!allowed) return;
      buildFlashcardEditorModal();
      state.editor.flashcard.items = [];
      state.editor.flashcard.editingIndex = null;
      renderFlashcardEditorList();
      editorDom.flashcard.bulkInput.value = '';
      editorDom.flashcard.title.value = '';
      editorDom.flashcard.description.value = '';
      openModal(editorDom.flashcard.modal);
    });
  }

  function openSimuladoEditor() {
    ensureAdminAccess().then((allowed) => {
      if (!allowed) return;
      buildSimuladoEditorModal();
      state.editor.simulado.items = [];
      state.editor.simulado.editingIndex = null;
      renderSimuladoEditorList();
      editorDom.simulado.question.value = '';
      editorDom.simulado.optionA.value = '';
      editorDom.simulado.optionB.value = '';
      editorDom.simulado.optionC.value = '';
      editorDom.simulado.optionD.value = '';
      editorDom.simulado.explanation.value = '';
      editorDom.simulado.title.value = '';
      editorDom.simulado.description.value = '';
      editorDom.simulado.addButton.textContent = 'Adicionar questao';
      openModal(editorDom.simulado.modal);
    });
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeFlashcardEditor() {
    if (editorDom.flashcard.modal) {
      editorDom.flashcard.modal.classList.add('hidden');
    }
  }

  function closeSimuladoEditor() {
    if (editorDom.simulado.modal) {
      editorDom.simulado.modal.classList.add('hidden');
    }
  }
  function addFlashcardItem() {
    // This function is no longer used since we have bulk input
  }

  function addSimuladoItem() {
    const question = editorDom.simulado.question.value.trim();
    const optionA = editorDom.simulado.optionA.value.trim();
    const optionB = editorDom.simulado.optionB.value.trim();
    const optionC = editorDom.simulado.optionC.value.trim();
    const optionD = editorDom.simulado.optionD.value.trim();
    const correct = editorDom.simulado.correct.value;
    const explanation = editorDom.simulado.explanation.value.trim();

    if (!question || !optionA || !optionB || !optionC || !optionD) {
      notify('Preencha a pergunta e todas as alternativas.', 'error');
      return;
    }

    const item = {
      linha: state.editor.simulado.items.length + 1,
      pergunta: question,
      alternativas: {
        A: { texto: optionA, bruta: `A) ${optionA}` },
        B: { texto: optionB, bruta: `B) ${optionB}` },
        C: { texto: optionC, bruta: `C) ${optionC}` },
        D: { texto: optionD, bruta: `D) ${optionD}` }
      },
      correta: correct,
      explicacao: explanation,
      bruta: `${question};A)${optionA};B)${optionB};C)${optionC};D)${optionD};${correct};[${explanation}]`
    };

    if (state.editor.simulado.editingIndex !== null) {
      state.editor.simulado.items[state.editor.simulado.editingIndex] = item;
      state.editor.simulado.editingIndex = null;
      editorDom.simulado.addButton.textContent = 'Adicionar questao';
    } else {
      state.editor.simulado.items.push(item);
    }

    editorDom.simulado.question.value = '';
    editorDom.simulado.optionA.value = '';
    editorDom.simulado.optionB.value = '';
    editorDom.simulado.optionC.value = '';
    editorDom.simulado.optionD.value = '';
    editorDom.simulado.explanation.value = '';

    renderSimuladoEditorList();
  }
  function renderFlashcardEditorList() {
    const container = editorDom.flashcard.list;
    if (!container) return;

    if (!state.editor.flashcard.items.length) {
      container.innerHTML = '<div class="empty-state">Nenhum card adicionado.</div>';
      return;
    }

    const rows = state.editor.flashcard.items.map((item, index) => `
      <tr draggable="true" data-index="${index}">
        <td>${item.pergunta}</td>
        <td>${item.resposta}</td>
        <td>${item.explicacao || ''}</td>
        <td>
          <button type="button" class="btn btn--secondary btn--sm" data-action="edit" data-index="${index}">Editar</button>
          <button type="button" class="btn btn--outline btn--sm" data-action="remove" data-index="${index}">Remover</button>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Pergunta</th><th>Resposta</th><th>Explicacao</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const tbody = container.querySelector('tbody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach((row) => {
        row.addEventListener('dragstart', handleFlashcardDragStart);
        row.addEventListener('dragover', handleFlashcardDragOver);
        row.addEventListener('drop', handleFlashcardDrop);
      });
      tbody.addEventListener('click', handleFlashcardListClick);
    }
  }

  function handleFlashcardListClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const index = Number(target.dataset.index);

    if (target.dataset.action === 'edit') {
      // Flashcard editor uses bulk input, so individual editing is not supported
      notify('Para editar, use o campo de conteudo em massa acima.', 'info');
      return;
    }

    if (target.dataset.action === 'remove') {
      state.editor.flashcard.items.splice(index, 1);
      state.editor.flashcard.editingIndex = null;
      renderFlashcardEditorList();
    }
  }

  let dragFlashcardIndex = null;

  function swapArrayItems(arr, fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const item = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, item);
  }

  function handleFlashcardDragStart(event) {
    dragFlashcardIndex = Number(event.currentTarget.dataset.index);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleFlashcardDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleFlashcardDrop(event) {
    event.preventDefault();
    const targetIndex = Number(event.currentTarget.dataset.index);
    if (dragFlashcardIndex === null || Number.isNaN(targetIndex)) return;
    swapArrayItems(state.editor.flashcard.items, dragFlashcardIndex, targetIndex);
    dragFlashcardIndex = null;
    renderFlashcardEditorList();
  }
  function renderSimuladoEditorList() {
    const container = editorDom.simulado.list;
    if (!container) return;

    if (!state.editor.simulado.items.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma questao adicionada.</div>';
      return;
    }

    const rows = state.editor.simulado.items.map((item, index) => {
      const alternativas = ['A', 'B', 'C', 'D'].map((letter) => {
        const texto = item.alternativas[letter]?.texto || '';
        const badge = item.correta === letter ? ' <span class="badge">Correta</span>' : '';
        return `<div>${letter}) ${texto}${badge}</div>`;
      }).join('');
      return `
        <tr draggable="true" data-index="${index}">
          <td>${item.pergunta}</td>
          <td>${alternativas}</td>
          <td>${item.explicacao || ''}</td>
          <td>
            <button type="button" class="btn btn--secondary btn--sm" data-action="edit" data-index="${index}">Editar</button>
            <button type="button" class="btn btn--outline btn--sm" data-action="remove" data-index="${index}">Remover</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="admin-table">
          <thead><tr><th>Pergunta</th><th>Alternativas</th><th>Explicacao</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const tbody = container.querySelector('tbody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach((row) => {
        row.addEventListener('dragstart', handleSimuladoDragStart);
        row.addEventListener('dragover', handleSimuladoDragOver);
        row.addEventListener('drop', handleSimuladoDrop);
      });
      tbody.addEventListener('click', handleSimuladoListClick);
    }
  }

  function handleSimuladoListClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const index = Number(target.dataset.index);

    if (target.dataset.action === 'edit') {
      const item = state.editor.simulado.items[index];
      if (!item) return;
      editorDom.simulado.question.value = item.pergunta;
      editorDom.simulado.optionA.value = item.alternativas.A?.texto || '';
      editorDom.simulado.optionB.value = item.alternativas.B?.texto || '';
      editorDom.simulado.optionC.value = item.alternativas.C?.texto || '';
      editorDom.simulado.optionD.value = item.alternativas.D?.texto || '';
      editorDom.simulado.correct.value = item.correta;
      editorDom.simulado.explanation.value = item.explicacao || '';
      state.editor.simulado.editingIndex = index;
      editorDom.simulado.addButton.textContent = 'Atualizar questao';
    }

    if (target.dataset.action === 'remove') {
      state.editor.simulado.items.splice(index, 1);
      state.editor.simulado.editingIndex = null;
      editorDom.simulado.addButton.textContent = 'Adicionar questao';
      renderSimuladoEditorList();
    }
  }

  let dragSimuladoIndex = null;

  function handleSimuladoDragStart(event) {
    dragSimuladoIndex = Number(event.currentTarget.dataset.index);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleSimuladoDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleSimuladoDrop(event) {
    event.preventDefault();
    const targetIndex = Number(event.currentTarget.dataset.index);
    if (dragSimuladoIndex === null || Number.isNaN(targetIndex)) return;
    swapArrayItems(state.editor.simulado.items, dragSimuladoIndex, targetIndex);
    dragSimuladoIndex = null;
    renderSimuladoEditorList();
  }
  async function saveFlashcardEditorDeck() {
    const allowed = await ensureAdminAccess();
    if (!allowed) return;

    if (!state.editor.flashcard.items.length) {
      notify('Adicione ao menos um card antes de salvar.', 'error');
      return;
    }

    const meta = {
      title: editorDom.flashcard.title.value.trim() || 'Baralho manual',
      description: editorDom.flashcard.description.value.trim(),
      category: editorDom.flashcard.category.value || 'geral',
      visibility: editorDom.flashcard.visibility.value || 'private',
      createdBy: getCurrentUserId()
    };

    try {
      const result = await storageService.saveDeckWithItems('flashcard', meta, state.editor.flashcard.items);
      notify(`Baralho criado com ${result.items.length} cards.`, 'success');
      closeFlashcardEditor();
      if (global.app) {
        global.app.loadFlashcards?.();
        global.app.loadAdminFlashcardsGrid?.();
      }
    } catch (error) {
      console.error('[admin] Falha ao salvar baralho manual', error);
      notify('Nao foi possivel salvar o baralho manual.', 'error');
    }
  }

  async function saveSimuladoEditorDeck() {
    const allowed = await ensureAdminAccess();
    if (!allowed) return;

    if (!state.editor.simulado.items.length) {
      notify('Adicione ao menos uma questao antes de salvar.', 'error');
      return;
    }

    const timeLimit = parseInt(editorDom.simulado.timeLimit.value || '30', 10);
    const meta = {
      title: editorDom.simulado.title.value.trim() || 'Simulado manual',
      description: editorDom.simulado.description.value.trim(),
      category: editorDom.simulado.category.value || 'geral',
      visibility: editorDom.simulado.visibility.value || 'private',
      timeLimit: Number.isFinite(timeLimit) && timeLimit > 0 ? timeLimit : 30,
      createdBy: getCurrentUserId()
    };

    try {
      const result = await storageService.saveDeckWithItems('simulado', meta, state.editor.simulado.items, { timeLimit: meta.timeLimit });
      notify(`Simulado criado com ${result.items.length} questoes.`, 'success');
      closeSimuladoEditor();
      if (global.app) {
        global.app.loadQuizzes?.();
        global.app.loadAdminFlashcardsGrid?.();
      }
    } catch (error) {
      console.error('[admin] Falha ao salvar simulado manual', error);
      notify('Nao foi possivel salvar o simulado manual.', 'error');
    }
  }

  function initAdminUploadAndEditors(options = {}) {
    storageService = new global.AdminStorageService({
      supabaseClientOrNull: options.supabaseClientOrNull || null
    });

    const start = () => {
      storageService.init?.();
      bindToolbarButtons();

      global.showFlashcardUploadModal = showFlashcardUploadModal;
      global.showQuizUploadModal = showSimuladoUploadModal;
      global.processUpload = saveFlashcardDeck;
      global.processQuizUpload = saveSimuladoDeck;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  global.AdminUploader = {
    initAdminUploadAndEditors,
    parseSimuladoTxt,
    parseFlashcardTxt,
    showFlashcardUploadModal,
    showSimuladoUploadModal,
    saveFlashcardDeck,
    saveSimuladoDeck
  };
})(window);

