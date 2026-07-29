import generator
import validator
from solver import count_solutions


def test_generate_puzzle_has_unique_solution():
    puzzle, solution = generator.generate_puzzle(clues=35, random_seed=42)
    assert count_solutions(puzzle, limit=2) == 1
    assert validator.is_valid_board(solution)
    assert validator.is_complete_board(solution)
    assert puzzle != solution


def test_solution_rows_columns_and_boxes_are_valid():
    _, solution = generator.generate_puzzle(clues=40, random_seed=123)
    assert validator.is_valid_board(solution)
    # also verify individual row, column, and box contents
    for row in solution:
        assert set(row) == set(range(1, 10))
    for col in range(9):
        assert {solution[row][col] for row in range(9)} == set(range(1, 10))
    for box_row in range(0, 9, 3):
        for box_col in range(0, 9, 3):
            values = {
                solution[r][c]
                for r in range(box_row, box_row + 3)
                for c in range(box_col, box_col + 3)
            }
            assert values == set(range(1, 10))
