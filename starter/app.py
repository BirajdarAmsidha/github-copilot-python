"""Flask application entrypoint for the Sudoku game.

Exposes minimal JSON API endpoints for creating new puzzles and checking
user-submitted boards. NOTE: CURRENT in-memory storage is suitable for a
single-user demo but not for production; session-backed storage or a DB is
recommended for multi-user deployments.
"""

from flask import Flask, render_template, jsonify, request
import sudoku_logic
from validator import get_invalid_cells

app = Flask(__name__)

DIFFICULTY_CLUES = {
    'easy': 40,
    'medium': 32,
    'hard': 24,
}

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None,
    'difficulty': 'medium',
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty', CURRENT['difficulty']).lower()
    clues = DIFFICULTY_CLUES.get(difficulty, DIFFICULTY_CLUES['medium'])
    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    CURRENT['difficulty'] = difficulty
    return jsonify({'puzzle': puzzle, 'solution': solution, 'difficulty': difficulty})

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    if not isinstance(board, list) or len(board) != sudoku_logic.SIZE:
        return jsonify({'error': 'Invalid board format'}), 400

    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    invalid = get_invalid_cells(board)
    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != 0 and board[i][j] != solution[i][j]:
                incorrect.append([i, j])

    return jsonify({'incorrect': incorrect, 'invalid': invalid})

if __name__ == '__main__':
    app.run(debug=True)