import sudoku_logic
import app as app_module


def test_valid_sudoku_solution_is_complete_and_valid():
    _, solution = sudoku_logic.generate_puzzle(36)

    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
    assert sudoku_logic.is_valid_sudoku_board(solution)
    assert sudoku_logic.is_complete_board(solution)


def test_puzzle_has_exactly_one_unique_solution():
    puzzle, _ = sudoku_logic.generate_puzzle(32)

    assert sudoku_logic.count_solutions(puzzle, limit=2) == 1


def test_check_route_highlights_incorrect_cells(client):
    client.get('/new?clues=40')
    solution = app_module.CURRENT['solution']
    board = [row[:] for row in solution]
    board[0][0] = 1 if board[0][0] != 1 else 2

    response = client.post('/check', json={'board': board})
    assert response.status_code == 200
    data = response.get_json()
    assert [0, 0] in data['incorrect']


def test_hint_simulation_fills_one_correct_empty_cell():
    puzzle, solution = sudoku_logic.generate_puzzle(36)
    empty_cells = [(i, j) for i in range(9) for j in range(9) if puzzle[i][j] == 0]
    assert empty_cells, 'Expected at least one empty cell in the puzzle'

    user_cell = empty_cells[0]
    puzzle[user_cell[0]][user_cell[1]] = solution[user_cell[0]][user_cell[1]]

    hint_candidates = [(i, j) for i, j in empty_cells if (i, j) != user_cell and puzzle[i][j] == 0]
    assert user_cell not in hint_candidates
    assert len(hint_candidates) >= 1

    target = hint_candidates[0]
    puzzle[target[0]][target[1]] = solution[target[0]][target[1]]
    assert puzzle[target[0]][target[1]] == solution[target[0]][target[1]]
