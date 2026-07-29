"""Backtracking solver utilities.

Provides functions to solve a Sudoku board and to count solutions up to a
limit. The count_solutions helper is used by the generator to verify
uniqueness of puzzles.
"""

import copy

from validator import EMPTY, SIZE, is_safe, is_valid_board


def find_empty_cell(board):
    """Return the coordinates (row, col) of the first empty cell or (None, None).

    Scans rows then columns in order. This simple heuristic is sufficient for
    small puzzles; more advanced heuristics (MRV) can be added later.
    """
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None, None


def solve_board(board):
    """Attempt to solve the given board and return a completed board or None.

    The function performs a basic backtracking search on a deep copy of the
    board so the input is not mutated.
    """
    if not is_valid_board(board):
        return None

    working_board = copy.deepcopy(board)

    def backtrack():
        row, col = find_empty_cell(working_board)
        if row is None and col is None:
            return True

        for value in range(1, SIZE + 1):
            if is_safe(working_board, row, col, value):
                working_board[row][col] = value
                if backtrack():
                    return True
                working_board[row][col] = EMPTY

        return False

    if backtrack():
        return working_board
    return None


def count_solutions(board, limit=2):
    """Count up to `limit` solutions of the provided board.

    Stops early when at least `limit` solutions are found which makes it
    efficient for uniqueness checks (limit=2).
    """
    if not is_valid_board(board):
        return 0

    working_board = copy.deepcopy(board)
    solutions = 0

    def backtrack():
        nonlocal solutions
        if solutions >= limit:
            return

        row, col = find_empty_cell(working_board)
        if row is None and col is None:
            solutions += 1
            return

        for value in range(1, SIZE + 1):
            if is_safe(working_board, row, col, value):
                working_board[row][col] = value
                backtrack()
                working_board[row][col] = EMPTY
                if solutions >= limit:
                    return

    backtrack()
    return solutions


def solve_puzzle(board):
    """Compatibility wrapper around solve_board."""
    return solve_board(board)


__all__ = ["count_solutions", "find_empty_cell", "solve_board", "solve_puzzle"]
