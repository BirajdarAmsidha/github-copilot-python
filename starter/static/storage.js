// Storage helper module for leaderboard and settings
// Exposes window.storageAPI with functions to manage leaderboards in localStorage

(function () {
  const SCORE_STORAGE_KEY = 'sudoku-top-scores';

  function loadAllScores() {
    const stored = localStorage.getItem(SCORE_STORAGE_KEY);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      const scores = [];

      if (Array.isArray(parsed)) {
        scores.push(...parsed);
      } else if (parsed && typeof parsed === 'object') {
        ['easy', 'medium', 'hard'].forEach((key) => {
          if (Array.isArray(parsed[key])) {
            scores.push(...parsed[key]);
          }
        });
      }

      scores.sort((a, b) => (Number(a.timeSeconds) || 0) - (Number(b.timeSeconds) || 0));
      return scores;
    } catch (err) {
      // ignore parse failures and return an empty leaderboard
    }

    return [];
  }

  function saveScores(scores) {
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores.slice(0, 10)));
  }

  function getLeaderboard(difficulty) {
    const scores = loadAllScores();
    const filtered = difficulty
      ? scores.filter((entry) => entry.difficulty === difficulty)
      : scores;
    return filtered.slice(0, 10);
  }

  function addScoreEntry(entry) {
    const existingScores = loadAllScores();
    const entryCopy = {
      player: entry.player || 'Anonymous',
      timeSeconds: Number(entry.timeSeconds) || 0,
      difficulty: entry.difficulty || 'medium',
      hintsUsed: Number(entry.hintsUsed) || 0,
      date: entry.date || new Date().toISOString(),
    };

    const updated = [...existingScores, entryCopy];
    updated.sort((a, b) => a.timeSeconds - b.timeSeconds);
    const topScores = updated.slice(0, 10);
    saveScores(topScores);
    return topScores;
  }

  function clearLeaderboard(difficulty) {
    if (!difficulty) {
      localStorage.removeItem(SCORE_STORAGE_KEY);
      return;
    }

    const scores = loadAllScores().filter((entry) => entry.difficulty !== difficulty);
    saveScores(scores);
  }

  function loadTheme(key) {
    return localStorage.getItem(key) || 'light';
  }

  function saveTheme(key, value) {
    localStorage.setItem(key, value);
  }

  window.storageAPI = {
    loadAllScores,
    getLeaderboard,
    addScoreEntry,
    clearLeaderboard,
    loadTheme,
    saveTheme,
  };
})();
