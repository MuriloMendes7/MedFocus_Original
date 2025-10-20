// Keeps footer year in sync if needed by legacy templates.
(function () {
  const footerYear = document.querySelector('[data-footer-year]');
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }
})();
