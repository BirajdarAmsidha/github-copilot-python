// UI helper module: formatting, rendering leaderboard, and theme application
// Exposes window.uiAPI with renderScores, formatTime, applyTheme

(function () {
  function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function renderScores(scores) {
    const list = document.getElementById('scores-list');
    if (!list) return;
    list.innerHTML = '';
    if (!Array.isArray(scores) || scores.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'No scores yet';
      list.appendChild(item);
      return;
    }

    scores.forEach((score, index) => {
      const item = document.createElement('li');
      const name = score.player || 'Anonymous';
      const time = formatTime(score.timeSeconds || 0);
      const difficulty = score.difficulty || 'medium';
      const hints = typeof score.hintsUsed === 'number' ? ` (hints: ${score.hintsUsed})` : '';
      item.textContent = `${index + 1}. ${name} - ${time} - ${difficulty}${hints}`;
      list.appendChild(item);
    });
  }

  function applyTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    document.body.classList.toggle('dark-mode', normalized === 'dark');
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
      toggleButton.textContent = normalized === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      toggleButton.setAttribute('aria-pressed', normalized === 'dark');
    }
  }

  window.uiAPI = {
    formatTime,
    renderScores,
    applyTheme,
  };
})();
