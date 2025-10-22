// Simple local realtime sync across tabs using BroadcastChannel
(function(){
  try {
    const ch = new BroadcastChannel('medfocus-sync');
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value){
      origSetItem(key, value);
      try { ch.postMessage({ key, ts: Date.now() }); } catch(_) {}
    };
    ch.onmessage = (e) => {
      const key = e?.data?.key;
      if (!window.app) return;
      if (key && key.startsWith('medFocusDecks')) {
        if (window.app.currentPage === 'dashboardPage' && window.app.currentDashboardView === 'flashcards') {
          window.app.loadFlashcards();
        }
      }
      if (key && key.startsWith('medFocusQuizzes')) {
        if (window.app.currentPage === 'dashboardPage' && window.app.currentDashboardView === 'quizzes') {
          window.app.loadQuizzes();
        }
      }
      if (key && key.startsWith('medFocusUsers')) {
        if (window.app.currentPage === 'dashboardPage' && window.app.currentDashboardView === 'admin') {
          window.app.loadUsersTable?.();
          window.app.loadAdminStats?.();
        }
      }
    };
    // Expose minimal backend bootstrap for Firebase later
    window.backend = window.backend || {};
    window.backend.initFirebase = async (config) => {
      // Placeholder wiring point for real-time DB; to be implemented with Firebase SDK
      console.info('Firebase config received, wire SDK here.', config);
    };
  } catch (e) {
    console.warn('Realtime sync unavailable:', e);
  }
})();



