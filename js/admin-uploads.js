(function(global) {
  'use strict';

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-admin-loader="${src}"]`);
      if (existing && existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      const script = existing || document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.adminLoader = src;
      script.dataset.adminLoaderInitialized = 'true';
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));

      if (!existing) {
        document.head.appendChild(script);
      }
    });
  }

  function ensureStorageService() {
    if (global.AdminStorageService) {
      return Promise.resolve();
    }
    return loadScriptOnce('services/storageService.js');
  }

  function ensureUploaderModule() {
    return loadScriptOnce('admin-uploader-complete.js');
  }

  function startUploader() {
    if (!global.AdminUploader || typeof global.AdminUploader.initAdminUploadAndEditors !== 'function') {
      console.error('[admin-uploads] AdminUploader indisponivel.');
      return;
    }
    const supabaseClient = global.supabase || null;
    global.AdminUploader.initAdminUploadAndEditors({ supabaseClientOrNull: supabaseClient });
  }

  ensureStorageService()
    .then(ensureUploaderModule)
    .then(() => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startUploader, { once: true });
      } else {
        startUploader();
      }
    })
    .catch((error) => {
      console.error('[admin-uploads] Falha ao inicializar funcionalidades admin', error);
    });
})(window);
