// Client-side rendering and interaction for the Flask-backed Sudoku
// This file focuses on game orchestration. UI rendering and storage are
// provided by helper modules attached to window.uiAPI and window.storageAPI

const SIZE = 9;
const THEME_STORAGE_KEY = 'sudoku-theme';
let puzzle = [];
let solution = [];
let timerStart = null;
let timerInterval = null;
let currentDifficulty = 'medium';
let hintsUsed = 0; // track hints used in current game

// Bind to UI and storage helpers exposed by other scripts. These scripts are
// loaded before this file in index.html so window.uiAPI and window.storageAPI
// should be available. Provide minimal fallbacks to avoid runtime errors.
const storage = window.storageAPI || {
  getLeaderboard: () => [],
  addScoreEntry: () => [],
  loadAllScores: () => ({ easy: [], medium: [], hard: [] }),
  loadTheme: () => 'light',
  saveTheme: () => {},
};

const ui = window.uiAPI || {
  formatTime: (s) => `${Math.floor(s / 60)}:${s % 60}`,
  renderScores: () => {},
  applyTheme: () => {},
};

function updateTimer() {
  if (!timerStart) return;
  const elapsed = Math.floor((Date.now() - timerStart) / 1000);
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = `Time: ${ui.formatTime(elapsed)}`;
}

function startTimer() {
  timerStart = Date.now();
  if (timerInterval) clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  // Build the board and apply block classes at creation time to avoid layout shifts
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.autocomplete = 'off';
      input.inputMode = 'numeric';
      input.pattern = '[1-9]';
      // compute block index based on 3x3 subgrid
      const blockIndex = (Math.floor(i / 3) + Math.floor(j / 3)) % 2;
      input.classList.add('sudoku-cell', `block-${blockIndex}`);
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('keydown', (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape'];
        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
          return;
        }
        if (!/^[1-9]$/.test(e.key)) {
          e.preventDefault();
        }
      });
      input.addEventListener('paste', (e) => {
        const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
        if (!/^[1-9]$/.test(pasted.trim())) {
          e.preventDefault();
        }
      });
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        e.target.classList.remove('incorrect', 'invalid');
        validateBoardInputs();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function getBoardValues() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const value = inputs[idx].value;
      board[i][j] = value ? parseInt(value, 10) : 0;
    }
  }

  return board;
}

function findInvalidCells(board) {
  const invalid = new Set();

  function markDuplicate(positions) {
    if (positions.length > 1) {
      positions.forEach((pos) => invalid.add(pos[0] * SIZE + pos[1]));
    }
  }

  for (let i = 0; i < SIZE; i++) {
    const seen = {};
    for (let j = 0; j < SIZE; j++) {
      const value = board[i][j];
      if (value === 0) continue;
      if (seen[value]) {
        seen[value].push([i, j]);
      } else {
        seen[value] = [[i, j]];
      }
    }
    Object.values(seen).forEach(markDuplicate);
  }

  for (let j = 0; j < SIZE; j++) {
    const seen = {};
    for (let i = 0; i < SIZE; i++) {
      const value = board[i][j];
      if (value === 0) continue;
      if (seen[value]) {
        seen[value].push([i, j]);
      } else {
        seen[value] = [[i, j]];
      }
    }
    Object.values(seen).forEach(markDuplicate);
  }

  for (let boxRow = 0; boxRow < SIZE; boxRow += 3) {
    for (let boxCol = 0; boxCol < SIZE; boxCol += 3) {
      const seen = {};
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const i = boxRow + dr;
          const j = boxCol + dc;
          const value = board[i][j];
          if (value === 0) continue;
          if (seen[value]) {
            seen[value].push([i, j]);
          } else {
            seen[value] = [[i, j]];
          }
        }
      }
      Object.values(seen).forEach(markDuplicate);
    }
  }

  return Array.from(invalid).map((idx) => [Math.floor(idx / SIZE), idx % SIZE]);
}

function clearValidationHighlights(inputs) {
  for (let idx = 0; idx < inputs.length; idx++) {
    inputs[idx].classList.remove('invalid');
  }
}

function validateBoardInputs() {
  const board = getBoardValues();
  const invalidCells = findInvalidCells(board);
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');

  clearValidationHighlights(inputs);
  invalidCells.forEach(([row, col]) => {
    const idx = row * SIZE + col;
    inputs[idx].classList.add('invalid');
  });
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
        // preserve block-* class and add prefilled style
        inp.classList.remove('incorrect', 'invalid');
        inp.classList.add('prefilled');
      } else {
        inp.value = '';
        inp.readOnly = false;
        // remove state classes but keep block-* present
        inp.classList.remove('prefilled', 'incorrect', 'invalid');
      }
    }
  }
  validateBoardInputs();
}

async function newGame() {
  currentDifficulty = document.getElementById('difficulty').value;
  hintsUsed = 0; // reset hints counter for new game
  const res = await fetch(`/new?difficulty=${currentDifficulty}`);
  const data = await res.json();
  renderPuzzle(data.puzzle, data.solution);
  document.getElementById('message').innerText = '';
  // refresh leaderboard display for selected difficulty
  ui.renderScores(storage.getLeaderboard(currentDifficulty));
  startTimer();
}

function getHintableCells(inputs) {
  const emptyCells = [];

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const inp = inputs[idx];
      const value = (inp.value || '').toString().trim();

      if (!inp.readOnly && value === '') {
        emptyCells.push({row: i, col: j, idx});
      }
    }
  }

  return emptyCells;
}

function applyHint() {
  if (!solution || solution.length === 0) {
    return;
  }

  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const emptyCells = getHintableCells(inputs);

  if (emptyCells.length === 0) {
    const msg = document.getElementById('message');
    msg.style.color = '#1976d2';
    msg.innerText = 'No empty cells available for a hint.';
    return;
  }

  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = solution[target.row][target.col];

  if (Array.isArray(puzzle) && puzzle.length === SIZE) {
    puzzle[target.row][target.col] = value;
  }

  const inp = inputs[target.idx];
  inp.value = value;
  inp.readOnly = true;
  inp.classList.remove('incorrect', 'invalid');
  inp.classList.add('prefilled', 'hinted');

  hintsUsed = (hintsUsed || 0) + 1;

  validateBoardInputs();

  const msg = document.getElementById('message');
  msg.style.color = '#1976d2';
  msg.innerText = `A hint was applied and the cell was locked. Hints used: ${hintsUsed}`;
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
  const invalid = new Set(data.invalid.map(x => x[0]*SIZE + x[1]));
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));

  // Remove previous validation highlights
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    inp.classList.remove('incorrect', 'invalid');
  }

  // Add invalid class to every server-reported invalid cell
  for (const pos of data.invalid) {
    const idx = pos[0] * SIZE + pos[1];
    if (idx >= 0 && idx < inputs.length) {
      inputs[idx].classList.add('invalid');
    }
  }

  // Add incorrect class to every server-reported incorrect cell
  for (const pos of data.incorrect) {
    const idx = pos[0] * SIZE + pos[1];
    if (idx >= 0 && idx < inputs.length) {
      inputs[idx].classList.add('incorrect');
    }
  }

  const invalidCount = data.invalid.length;
  const incorrectCount = data.incorrect.length;
  if (invalidCount > 0 && incorrectCount > 0) {
    msg.style.color = '#d32f2f';
    msg.innerText = `${invalidCount} invalid cell${invalidCount === 1 ? '' : 's'} and ${incorrectCount} incorrect cell${incorrectCount === 1 ? '' : 's'} highlighted.`;
  } else if (invalidCount > 0) {
    msg.style.color = '#d32f2f';
    msg.innerText = `${invalidCount} invalid cell${invalidCount === 1 ? '' : 's'} highlighted.`;
  } else if (incorrectCount > 0) {
    msg.style.color = '#d32f2f';
    msg.innerText = `${incorrectCount} incorrect cell${incorrectCount === 1 ? '' : 's'} highlighted.`;
  } else if (isBoardComplete()) {
    msg.style.color = '#388e3c';
    msg.innerText = 'Congratulations! You solved it!';
    const elapsedSeconds = Math.floor((Date.now() - timerStart) / 1000);
    const player = window.prompt('Enter your name for the leaderboard:', 'Anonymous') || 'Anonymous';
    const entry = {
      player,
      timeSeconds: elapsedSeconds,
      difficulty: currentDifficulty,
      hintsUsed: hintsUsed || 0,
      date: new Date().toISOString(),
    };
    storage.addScoreEntry(entry);
    ui.renderScores(storage.getLeaderboard(currentDifficulty));
  } else {
    // No incorrect cells but board not complete
    msg.style.color = '#1976d2';
    msg.innerText = 'No incorrect entries, but the puzzle is not complete.';
  }
}


// Wire buttons
window.addEventListener('load', () => {
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint').addEventListener('click', applyHint);
  document.getElementById('difficulty').addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    ui.renderScores(storage.getLeaderboard(currentDifficulty));
  });
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    storage.saveTheme(THEME_STORAGE_KEY, nextTheme);
    ui.applyTheme(nextTheme);
  });
  const savedTheme = storage.loadTheme(THEME_STORAGE_KEY) || 'light';
  ui.applyTheme(savedTheme);
  // ensure currentDifficulty matches the select on load
  currentDifficulty = document.getElementById('difficulty').value || currentDifficulty;
  ui.renderScores(storage.getLeaderboard(currentDifficulty));
  startTimer();
  // initialize
  newGame();
});