// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const SCORE_STORAGE_KEY = 'sudoku-top-scores';
const THEME_STORAGE_KEY = 'sudoku-theme';
let puzzle = [];
let solution = [];
let timerStart = null;
let timerInterval = null;
let currentDifficulty = 'medium';

function formatTime(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateTimer() {
  if (!timerStart) {
    return;
  }
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  document.getElementById('timer').textContent = `Time: ${formatTime(elapsed)}`;
}

function startTimer() {
  timerStart = Date.now();
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function loadScores() {
  const stored = localStorage.getItem(SCORE_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
}

function saveScore(score) {
  const scores = loadScores();
  scores.push(score);
  scores.sort((a, b) => a.timeSeconds - b.timeSeconds);
  const topScores = scores.slice(0, 10);
  localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(topScores));
  renderScores(topScores);
}

function renderScores(scores) {
  const list = document.getElementById('scores-list');
  if (!list) {
    return;
  }

  list.innerHTML = '';
  if (scores.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No scores yet';
    list.appendChild(item);
    return;
  }

  scores.forEach((score, index) => {
    const item = document.createElement('li');
    item.textContent = `${index + 1}. ${score.player || 'Anonymous'} - ${formatTime(score.timeSeconds)} - ${score.difficulty}`;
    list.appendChild(item);
  });
}

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) {
    toggleButton.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function renderPuzzle(puz, solved = null) {
  puzzle = puz;
  solution = solved || [];
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      if (val !== 0) {
        inp.value = val;
        inp.readOnly = true;
        inp.className = 'sudoku-cell prefilled';
      } else {
        inp.value = '';
        inp.readOnly = false;
        inp.className = 'sudoku-cell';
      }
    }
  }
}

async function newGame() {
  currentDifficulty = document.getElementById('difficulty').value;
  const res = await fetch(`/new?difficulty=${currentDifficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle, data.solution);
  document.getElementById('message').innerText = '';
  startTimer();
}

function applyHint() {
  if (!solution || solution.length === 0) {
    return;
  }

  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const emptyCells = [];

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      if (!inp.readOnly && puzzle[i][j] === 0) {
        emptyCells.push({row: i, col: j, idx});
      }
    }
  }

  if (emptyCells.length === 0) {
    return;
  }

  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = solution[target.row][target.col];
  puzzle[target.row][target.col] = value;
  const inp = inputs[target.idx];
  inp.value = value;
  inp.readOnly = true;
  inp.className = 'sudoku-cell prefilled';
}

function isBoardComplete() {
  if (!solution || solution.length === 0) {
    return false;
  }

  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      const value = inp.value ? parseInt(inp.value, 10) : 0;
      if (value !== solution[i][j]) {
        return false;
      }
    }
  }

  return true;
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  const msg = document.getElementById('message');
  if (data.error) {
    msg.style.color = '#d32f2f';
    msg.innerText = data.error;
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }
  if (incorrect.size === 0 && isBoardComplete()) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    const elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
    saveScore({
      player: 'Anonymous',
      timeSeconds: elapsedSeconds,
      difficulty: currentDifficulty,
    });
  } else {
    msg.style.color = '#d32f2f';
    msg.innerText = 'Some cells are incorrect.';
  }
}

// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint').addEventListener('click', applyHint);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  applyTheme(savedTheme);
  renderScores(loadScores());
  startTimer();
  // initialize
  newGame();
});