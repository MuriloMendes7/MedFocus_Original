// Minimal fallback for legacy stats hooks used in index.html
(function () {
  if (!window.updateStatsCards) {
    window.updateStatsCards = function updateStatsCards() {
      // No-op fallback to avoid runtime errors in legacy dashboard widgets.
    };
  }
})();
