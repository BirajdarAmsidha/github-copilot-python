import sudoku_logic
import app as app_module


def is_valid_sudoku_board(board):
    size = len(board)
    expected = set(range(1, size + 1))

    for row in board:
        if set(row) != expected:
            return False

    for col in range(size):
        if {board[row][col] for row in range(size)} != expected:
            return False

    box_size = 3
    for box_row in range(0, size, box_size):
        for box_col in range(0, size, box_size):
            values = {
                board[row][col]
                for row in range(box_row, box_row + box_size)
                for col in range(box_col, box_col + box_size)
            }
            if values != expected:
                return False

    return True


def test_create_empty_board_returns_9x9_zero_matrix():
    board = sudoku_logic.create_empty_board()

    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert board[0][0] == sudoku_logic.EMPTY
    assert board[8][8] == sudoku_logic.EMPTY


def test_generate_puzzle_returns_unique_puzzle_and_solution():
    puzzle, solution = sudoku_logic.generate_puzzle(35)

    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
    assert puzzle != solution
    assert is_valid_sudoku_board(solution)


def test_new_game_route_returns_puzzle_and_stores_current_solution(client):
    response = client.get("/new?difficulty=easy")

    assert response.status_code == 200
    payload = response.get_json()
    assert "puzzle" in payload
    assert payload["difficulty"] == "easy"
    assert len(payload["puzzle"]) == sudoku_logic.SIZE
    assert app_module.CURRENT["puzzle"] is not None
    assert app_module.CURRENT["solution"] is not None


def test_check_solution_route_reports_incorrect_cells(client):
    client.get("/new?clues=40")
    solution = app_module.CURRENT["solution"]
    board = [row[:] for row in solution]
    board[0][0] = board[0][0] + 1 if board[0][0] < 9 else 1

    response = client.post(
        "/check",
        json={"board": board},
    )

    assert response.status_code == 200
    assert response.get_json()["incorrect"] == [[0, 0]]


def test_solver_returns_complete_valid_solution_for_known_puzzle():
    puzzle = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]

    solution = sudoku_logic.solve_board(puzzle)

    assert solution is not None
    assert is_valid_sudoku_board(solution)


def test_generate_puzzle_keeps_a_unique_solution():
    puzzle, _ = sudoku_logic.generate_puzzle(35)

    assert sudoku_logic.count_solutions(puzzle, limit=2) == 1
