"""Board validation helpers.

Defines board size constants and helpers to check if a move is safe, whether a
board is valid, and whether it's completely solved.
"""

SIZE = 9
EMPTY = 0


def is_safe(board, row, col, num):
    """Return True if placing num at (row, col) does not violate Sudoku rules."""
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False

    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True


def is_valid_board(board):
    """Validate overall board structure and Sudoku constraints.

    - correct dimensions
    - values are either EMPTY or in 1..SIZE
    - no duplicate numbers in rows, columns, or 3x3 boxes
    """
    if len(board) != SIZE:
        return False

    for row in board:
        if len(row) != SIZE:
            return False

        seen = set()
        for value in row:
            if value == EMPTY:
                continue
            if not 1 <= value <= SIZE or value in seen:
                return False
            seen.add(value)

    for col in range(SIZE):
        seen = set()
        for row in range(SIZE):
            value = board[row][col]
            if value == EMPTY:
                continue
            if not 1 <= value <= SIZE or value in seen:
                return False
            seen.add(value)

    for box_row in range(0, SIZE, 3):
        for box_col in range(0, SIZE, 3):
            seen = set()
            for row in range(box_row, box_row + 3):
                for col in range(box_col, box_col + 3):
                    value = board[row][col]
                    if value == EMPTY:
                        continue
                    if not 1 <= value <= SIZE or value in seen:
                        return False
                    seen.add(value)

    return True


def is_complete_board(board):
    """Return True when board is valid and has no EMPTY cells."""
    return is_valid_board(board) and all(value != EMPTY for row in board for value in row)


def get_invalid_cells(board):
    """Return a list of coordinates where Sudoku rules are violated.

    Cells that duplicate another cell value in the same row, column, or 3x3
    box are considered invalid.
    """
    invalid_positions = set()

    # Validate rows
    for row_index, row in enumerate(board):
        seen = {}
        for col_index, value in enumerate(row):
            if value == EMPTY:
                continue
            if value < 1 or value > SIZE:
                invalid_positions.add((row_index, col_index))
                continue
            if value in seen:
                invalid_positions.add((row_index, col_index))
                invalid_positions.add((row_index, seen[value]))
            else:
                seen[value] = col_index

    # Validate columns
    for col_index in range(SIZE):
        seen = {}
        for row_index in range(SIZE):
            value = board[row_index][col_index]
            if value == EMPTY:
                continue
            if value < 1 or value > SIZE:
                invalid_positions.add((row_index, col_index))
                continue
            if value in seen:
                invalid_positions.add((row_index, col_index))
                invalid_positions.add((seen[value], col_index))
            else:
                seen[value] = row_index

    # Validate 3x3 boxes
    for box_row in range(0, SIZE, 3):
        for box_col in range(0, SIZE, 3):
            seen = {}
            for row_offset in range(3):
                for col_offset in range(3):
                    row_index = box_row + row_offset
                    col_index = box_col + col_offset
                    value = board[row_index][col_index]
                    if value == EMPTY:
                        continue
                    if value < 1 or value > SIZE:
                        invalid_positions.add((row_index, col_index))
                        continue
                    if value in seen:
                        invalid_positions.add((row_index, col_index))
                        invalid_positions.add(seen[value])
                    else:
                        seen[value] = (row_index, col_index)

    return sorted([[row, col] for row, col in invalid_positions])


def is_valid_sudoku_board(board):
    """Alias for a fully valid and complete board check."""
    return is_valid_board(board) and is_complete_board(board)
