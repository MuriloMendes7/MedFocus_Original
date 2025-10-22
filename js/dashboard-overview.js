// Helpers para conectar botões legados ao novo painel de usuários.
(function () {
  function ensureAdminModule(action) {
    if (window.AdminUsuarios?.init && !window.AdminUsuarios.openCreateModal) {
      const api = window.AdminUsuarios.init();
      if (api && typeof api.openCreateModal === 'function') {
        window.AdminUsuarios.openCreateModal = api.openCreateModal.bind(api);
      }
    }
    action();
  }

  window.showCreateUserModal = function showCreateUserModal() {
    ensureAdminModule(() => {
      if (window.AdminUsuarios?.openCreateModal) {
        window.AdminUsuarios.openCreateModal();
      } else {
        console.warn('AdminUsuarios ainda não está disponível.');
      }
    });
  };

  window.showFlashcardUploadModal = function showFlashcardUploadModal() {
    if (window.app && typeof window.app.showModal === 'function') {
      window.app.showModal('flashcardUploadModal');
    } else {
      console.warn('Modal de upload não disponível.');
    }
  };
})();
