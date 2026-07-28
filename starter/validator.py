SIZE = 9
EMPTY = 0


def is_safe(board, row, col, num):
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
    return is_valid_board(board) and all(value != EMPTY for row in board for value in row)


def is_valid_sudoku_board(board):
    return is_valid_board(board) and is_complete_board(board)
