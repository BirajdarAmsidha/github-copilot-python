# GitHub Copilot Instructions for Sudoku Application

## Project Overview
This repository contains a 9×9 Sudoku web application with a Python Flask backend and a plain HTML/CSS/JavaScript frontend. The goal is to produce a modern, accessible, and maintainable Sudoku game that:
- Generates puzzles with exactly one solution
- Supports difficulty levels (Easy / Medium / Hard)
- Is responsive and accessible (WCAG 2.1 AA where feasible)
- Provides interactive features: timer, hints, validation, and a local leaderboard

This instruction file guides GitHub Copilot to produce consistent, modular code and implement required features.

---

## High-level Architecture and Code Organization
- Python (Flask) backend responsibilities:
  - Provide API endpoints for generating puzzles and (optionally) verifying solutions
  - Keep core Sudoku generation and solving logic in a separate module (e.g., sudoku_logic.py)
  - Keep Flask app small — only routing, JSON request/response handling, and simple app configuration
- Frontend responsibilities (static files served by Flask):
  - UI rendering, user interactions, timer, and local persistence (localStorage)
  - Modular JavaScript: separate modules/files for UI rendering, input handling, game state, and storage
  - Plain CSS for styling, including responsive layout and dark-mode support

Project file suggestions:
- starter/
  - app.py (Flask routes, minimal glue)
  - sudoku_logic.py (puzzle generation & solver)
  - static/
    - main.js (entry: wire up UI and events)
    - ui.js (rendering & accessibility helpers)
    - game.js (game state: board, timer, hints)
    - storage.js (leaderboard & settings persistence)
    - styles.css (responsive + dark mode)
  - templates/
    - index.html

Keep functions small, well-named, and single-responsibility. Add docstrings for all public functions and comments where non-obvious logic is used (e.g., uniqueness checks).

---

## Sudoku Generation & Solving
Goal: generate puzzles with exactly one solution and verify solutions when needed.

Requirements:
- Generation must start from a completed valid 9×9 board and remove cells while maintaining a single unique solution.
- Use a robust backtracking solver to:
  - Produce a finished board
  - Verify uniqueness of a puzzle (count number of solutions up to 2 and stop early when >1)

API and module responsibilities:
- sudoku_logic.py public functions:
  - generate_complete_board() -> board: creates a full valid solution board
  - solve(board, find_multiple=False, limit=2) -> list_of_solutions or solution_count: flexible solver to return either one solution or count solutions up to a limit
  - generate_puzzle(clues=35) -> (puzzle, solution): builds a puzzle with given number of clues while ensuring uniqueness
  - is_valid_move(board, row, col, value) -> bool: check whether placing value is safe (row/col/box)
  - deep_copy(board) and create_empty_board() helpers

Generation strategy (recommended):
1. Fill board completely using randomized backtracking to get a valid solution.
2. Remove cells one by one in a random order. After each removal, run the solver with find_multiple=True and limit=2 to confirm exactly one solution remains.
3. Stop removing when desired clue count reached or no further removals preserve uniqueness.

Difficulty mapping (clues = number of prefilled cells):
- Easy: 40–45 clues
- Medium: 30–35 clues
- Hard: 25–28 clues

Implementation notes:
- Use randomness but seedable randomness for determinism in tests (allow optional random_seed parameter).
- Keep heavy operations (uniqueness checks) in Python backend — avoid running them in the browser.

---

## Flask API Endpoints
Keep API surface minimal and JSON-based.
- GET /new?difficulty=easy|medium|hard (or ?clues=N)
  - Returns: { puzzle: [[...], ...] } where empty cells are 0
  - Server stores the solution in session or an in-memory store for that user (for the starter, an in-memory CURRENT dict is acceptable, but document this is not production-safe)
- POST /check
  - Request: { board: [[...], ...] }
  - Response: { incorrect: [[row, col], ...] }
  - Validate incoming JSON; return 400 for malformed requests

Security and robustness:
- Validate shapes and value ranges in incoming boards
- Return clear error messages when requests are invalid

---

## Frontend: UI & Accessibility Requirements
Design goals: responsive, keyboard-accessible, color-independent cues for state, and clear focus indicators.

Grid rendering and structure:
- Use semantic elements where possible (a <table> is acceptable) or a div grid with role="grid" and appropriate ARIA attributes.
- Each cell must be either editable (input) or read-only (prefilled).
- Prefilled cells must be visually distinct and non-editable (use disabled inputs or readonly with aria-readonly).
- 3×3 sub-grids must alternate background colors in a checkerboard pattern (two colors alternating by sub-grid position). This makes block boundaries visually clear for users.
  - Implement using CSS: compute block color using (floor(row/3) + floor(col/3)) % 2 and apply colorA or colorB.
  - Ensure alternating colors do not convey status alone; combine with icons/text where necessary.

Responsive layout:
- Mobile-first: grid scales to fit screen width with a maximum size on larger viewports.
- Ensure font sizes use relative units (em/rem) and touch targets follow recommended sizes (>=44px) for interactive elements.
- No horizontal scrolling at reasonable breakpoints.

Accessibility:
- Keyboard navigation: arrow keys move between cells; Tab navigates; Enter confirms entry; Esc cancels note mode.
- Provide clear focus outlines with CSS for keyboard users.
- Add aria-label to each cell (e.g., "Row 1 Column 1, empty" or "Row 2 Column 3, prefilled 5").
- When validation finds conflicts or errors, update an ARIA live region to announce "Conflict at row X column Y".
- Ensure color contrast > 4.5:1 for normal text vs background; test dark mode and light mode.

Dark mode:
- Provide a toggle; persist preference to localStorage
- Use CSS variables for colors to switch themes easily

---

## Frontend Features & Behavior
Implement the following interactive features; keep UI logic in modular JS files.

Timer:
- Start when puzzle is generated or when the player makes the first move (choose consistent behavior and document it)
- Display MM:SS
- Pause optionally on blur (page hide), resume on focus
- Stop and freeze on completion

Hint button:
- When clicked, the app should request (or use stored) solution and fill exactly one empty, non-locked cell with the correct value.
- Hinted cell becomes locked/prefilled after the hint and counts towards hints used.
- Track hints used in game state for leaderboard stats.

Check button:
- Compare current board with stored solution and highlight all incorrect cells (red border plus an icon); do not change correct entries.
- Return a count of incorrect cells and display it to the user
- Also expose this via API by posting to /check and using the returned incorrect cell list to paint the board

Notes / Pencil marks (optional but recommended):
- Toggle Note Mode; in this mode, typing numbers adds/removes small candidate marks in the cell instead of final entry
- Store notes in an internal data structure and render them in smaller font size

Completion behavior:
- When all 81 cells are filled and match the solution, show a congratulatory modal with time taken, hints used, and difficulty
- Prompt the user for their name to record to Top 10 leaderboard

Number tracking visualization (optional):
- Show counts of each digit placed on board and mark numbers that are completed (9/9)

---

## Leaderboard & Persistence
- Use localStorage to persist top scores per difficulty
- On completion: save { name, time_seconds, difficulty, hints_used, date_iso }
- Keep top 10 sorted by time (fastest first)
- Provide a UI to view top 10 and clear leaderboard

Storage module responsibilities:
- Provide getLeaderboard(difficulty), addScore(difficulty, entry), clearLeaderboard(difficulty)
- Validate entries and cap length to 10

---

## Tests and Determinism
- Provide unit tests for core sudoku_logic functions (board generation, solver, is_valid_move)
- Provide integration tests for Flask endpoints (GET /new, POST /check) using pytest and Flask test_client
- Allow passing a deterministic seed to generation functions to make tests reproducible

---

## Performance and Edge Cases
- Uniqueness checks are potentially expensive; implement them efficiently by stopping once more than one solution is found
- Avoid blocking the UI: do heavy work on the server, not in the browser
- Validate inputs thoroughly to avoid server-side crashes

---

## Developer Notes and Guidance for Copilot
When generating code, prefer:
- Small, testable functions
- Clear names and typed docstrings
- Reuse helper functions across modules
- Plain CSS with CSS variables for theming — do not introduce large frameworks
- Minimal dependencies: Flask + pytest; no heavy front-end frameworks

When generating UI, include ARIA attributes, keyboard support, and comments explaining accessibility choices.

---

## Example API Usage
- Start new game (medium): GET /new?difficulty=medium
- Check board: POST /check { "board": [[...], ...] }

Return format examples:
- { "puzzle": [[0,5,0,...], ...] }
- { "incorrect": [[0,0], [1,3]] }

---

## Submission Checklist (for Udacity)
- [ ] Puzzle generation ensures a unique solution and supports three difficulty tiers
- [ ] Prefilled cells are locked and non-editable
- [ ] 3x3 subgrids alternate colors (checker pattern) and are responsive
- [ ] Check button highlights incorrect cells (all of them)
- [ ] Hint fills one valid cell and locks it
- [ ] Timer present and stops on completion
- [ ] Local top-10 leaderboard persists in localStorage and records name, time, difficulty, hints
- [ ] Accessibility: keyboard navigation, ARIA labels, focus indicators
- [ ] Tests: unit tests for solver and generation; integration tests for Flask endpoints

---

If any clarification is needed about structure or implementation decisions, provide details and examples in a short note at the top of the file so Copilot can use them as context.