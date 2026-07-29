import generator
import validator


def test_fill_board_produces_valid_complete_board():
    board = generator.create_empty_board()
    assert generator.fill_board(board)
    assert validator.is_valid_board(board)
    assert validator.is_complete_board(board)


def test_is_valid_board_detects_duplicates():
    board = generator.create_empty_board()
    generator.fill_board(board)
    # introduce a duplicate in first row
    board[0][1] = board[0][0]
    assert not validator.is_valid_board(board)


def test_get_invalid_cells_identifies_duplicates_in_row_col_and_box():
    board = generator.create_empty_board()
    generator.fill_board(board)
    # duplicate in first row
    board[0][1] = board[0][0]
    invalid = validator.get_invalid_cells(board)
    assert [0, 0] in invalid or [0, 1] in invalid

    # duplicate in first column
    board = generator.create_empty_board()
    generator.fill_board(board)
    board[1][0] = board[0][0]
    invalid = validator.get_invalid_cells(board)
    assert [0, 0] in invalid and [1, 0] in invalid

    # duplicate in first 3x3 box
    board = generator.create_empty_board()
    generator.fill_board(board)
    board[1][1] = board[0][0]
    invalid = validator.get_invalid_cells(board)
    assert [0, 0] in invalid and [1, 1] in invalid
