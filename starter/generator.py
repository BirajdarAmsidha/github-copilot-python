import random

from solver import count_solutions
from validator import EMPTY, SIZE, is_safe, is_valid_board, is_complete_board


def deep_copy(board):
    return [row[:] for row in board]


def create_empty_board():
    """Create an empty Sudoku board with all cells set to EMPTY."""
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def fill_board(board):
    """Fill the board completely using randomized backtracking.

    The board is filled in row-major order, but the candidate values for each
    cell are shuffled to produce varied solutions on different runs.
    """
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def remove_cells(board, clues):
    """
    Remove cells from a fully solved board while preserving uniqueness.
    Attempts removals in random order and makes multiple passes until no more
    cells can be removed without breaking uniqueness or until desired clue
    count is reached.
    """
    total_cells = SIZE * SIZE
    desired_prefilled = max(0, min(total_cells, clues))

    # Start with all positions and shuffle order for randomness
    positions = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(positions)

    # Keep track of whether we removed any cell during a full pass
    removed_any = True

    while removed_any and sum(1 for r in range(SIZE) for c in range(SIZE) if board[r][c] != EMPTY) > desired_prefilled:
        removed_any = False
        for row, col in positions:
            # Stop if we've reached desired prefilled count
            current_prefilled = sum(1 for r in range(SIZE) for c in range(SIZE) if board[r][c] != EMPTY)
            if current_prefilled <= desired_prefilled:
                return

            if board[row][col] == EMPTY:
                continue

            value = board[row][col]
            board[row][col] = EMPTY
            # check uniqueness; if multiple solutions, revert
            if count_solutions(board, limit=2) != 1:
                board[row][col] = value
            else:
                removed_any = True
                # continue trying other removals
        # reshuffle positions between passes to try different removal orders
        random.shuffle(positions)


def generate_puzzle(clues=35, random_seed=None):
    """Generate a Sudoku puzzle and its solution.

    The function first builds a complete valid Sudoku solution using backtracking,
    then removes numbers based on the requested clue count while preserving
    uniqueness.

    Returns:
        tuple[list[list[int]], list[list[int]]]: (puzzle, solution)
    """
    if random_seed is not None:
        random.seed(random_seed)

    board = create_empty_board()
    if not fill_board(board):
        raise RuntimeError('Failed to generate a complete Sudoku board')

    solution = deep_copy(board)
    if not is_valid_board(solution) or not is_complete_board(solution):
        raise RuntimeError('Generated solution board is invalid')

    remove_cells(board, clues)
    puzzle = deep_copy(board)

    if count_solutions(puzzle, limit=2) != 1:
        raise RuntimeError('Generated puzzle does not have a unique solution')

    return puzzle, solution


# Copilot suggested random board generation without validation,
# but I rejected it because it does not guarantee a valid Sudoku.
# The function below is intentionally left unused in the project.

def generate_random_board_unvalidated(random_seed=None):
    """Generate a 9x9 board filled with random numbers 1..9 without
    performing any Sudoku validity checks. This function is unsafe for
    actual gameplay and exists only for demonstration.

    DO NOT USE this function for puzzle generation in the application.
    """
    if random_seed is not None:
        random.seed(random_seed)
    return [[random.randint(1, SIZE) for _ in range(SIZE)] for _ in range(SIZE)]


__all__ = ["create_empty_board", "deep_copy", "fill_board", "generate_puzzle", "remove_cells"]