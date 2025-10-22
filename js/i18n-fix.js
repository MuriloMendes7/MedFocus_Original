// Fallback i18n map so inline templates do not crash if the main bundle is unavailable.
(function () {
  if (!window.i18n) {
    window.i18n = { locale: 'pt-BR' };
  }
})();
