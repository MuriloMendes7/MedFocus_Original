// Simple guard to make sure menu toggles remain interactive even if app.js fails early.
(function () {
  function ensureNavVisible() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.classList.remove('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', ensureNavVisible);
})();
