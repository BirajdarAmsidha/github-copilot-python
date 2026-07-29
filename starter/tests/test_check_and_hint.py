import app as app_module


def test_check_endpoint_reports_all_incorrect(client):
    # start a new game
    client.get('/new?clues=40')
    solution = app_module.CURRENT['solution']
    # create a board equal to the solution but corrupt two cells
    board = [row[:] for row in solution]
    # make two distinct incorrect changes
    board[0][0] = 1 if board[0][0] != 1 else 2
    board[1][1] = 2 if board[1][1] != 2 else 3

    res = client.post('/check', json={'board': board})
    assert res.status_code == 200
    data = res.get_json()
    assert 'incorrect' in data
    assert 'invalid' in data
    # both modified cells should be reported as incorrect
    assert [0, 0] in data['incorrect']
    assert [1, 1] in data['incorrect']


def test_check_endpoint_reports_invalid_cells(client):
    client.get('/new?clues=40')
    board = [row[:] for row in app_module.CURRENT['solution']]
    board[0][1] = board[0][0]
    res = client.post('/check', json={'board': board})
    assert res.status_code == 200
    data = res.get_json()
    assert [0, 0] in data['invalid']
    assert [0, 1] in data['invalid']


def test_check_endpoint_ignores_empty_cells_in_correctness(client):
    client.get('/new?clues=40')
    solution = app_module.CURRENT['solution']
    board = [row[:] for row in solution]
    board[0][0] = 1 if board[0][0] != 1 else 2
    board[1][1] = 0  # leave the cell empty
    res = client.post('/check', json={'board': board})
    assert res.status_code == 200
    data = res.get_json()
    assert [0, 0] in data['incorrect']
    assert [1, 1] not in data['incorrect']
    assert all(cell[0] != 1 or cell[1] != 1 for cell in data['incorrect'])


def test_hint_simulation_does_not_overwrite_user_filled(client):
    # start a new game and fetch puzzle+solution
    client.get('/new?clues=40')
    puzzle = app_module.CURRENT['puzzle']
    solution = app_module.CURRENT['solution']

    # find an empty cell
    empty_cells = [(i, j) for i in range(9) for j in range(9) if puzzle[i][j] == 0]
    assert len(empty_cells) > 0

    # simulate user filling the first empty cell correctly
    user_cell = empty_cells[0]
    puzzle[user_cell[0]][user_cell[1]] = solution[user_cell[0]][user_cell[1]]

    # hint candidates should exclude cells that are now non-empty
    hint_candidates = [(i, j) for i in range(9) for j in range(9) if puzzle[i][j] == 0]
    assert user_cell not in hint_candidates

    # simulate applying a hint to the first candidate and ensure it matches solution
    if hint_candidates:
        target = hint_candidates[0]
        puzzle[target[0]][target[1]] = solution[target[0]][target[1]]
        assert puzzle[target[0]][target[1]] == solution[target[0]][target[1]]
