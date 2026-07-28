import random

from solver import count_solutions
from validator import EMPTY, SIZE, is_safe


def deep_copy(board):
    return [row[:] for row in board]


def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def fill_board(board):
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
    positions = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(positions)
    attempts = SIZE * SIZE - clues

    for row, col in positions:
        if attempts <= 0:
            break
        if board[row][col] == EMPTY:
            continue

        value = board[row][col]
        board[row][col] = EMPTY
        if count_solutions(board, limit=2) != 1:
            board[row][col] = value
        else:
            attempts -= 1


def generate_puzzle(clues=35):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution


__all__ = ["create_empty_board", "deep_copy", "fill_board", "generate_puzzle", "remove_cells"]
