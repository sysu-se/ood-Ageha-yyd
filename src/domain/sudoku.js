function cloneGrid(grid) {
  return grid.map((row) => row.slice())
}

function assertGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== 9) {
    throw new TypeError('Grid must be a 9x9 numeric matrix')
  }

  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== 9) {
      throw new TypeError('Grid must be a 9x9 numeric matrix')
    }
    for (const value of row) {
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        throw new TypeError('Grid values must be integers between 0 and 9')
      }
    }
  }
}

function assertMove(move) {
  if (typeof move !== 'object' || move === null) {
    throw new TypeError('Move must be an object')
  }

  const { row, col, value } = move
  if (!Number.isInteger(row) || row < 0 || row > 8) {
    throw new RangeError('row must be an integer between 0 and 8')
  }
  if (!Number.isInteger(col) || col < 0 || col > 8) {
    throw new RangeError('col must be an integer between 0 and 8')
  }
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    throw new RangeError('value must be an integer between 0 and 9')
  }
}

export function createSudoku(initialGrid) {
  assertGrid(initialGrid)
  let grid = cloneGrid(initialGrid)

  return {
    getGrid() {
      return cloneGrid(grid)
    },
    guess(move) {
      assertMove(move)
      grid[move.row][move.col] = move.value
      return this
    },
    clone() {
      return createSudoku(grid)
    },
    toJSON() {
      return { grid: cloneGrid(grid) }
    },
    toString() {
      return grid
        .map((row) => row.map((cell) => (cell === 0 ? '.' : String(cell))).join(' '))
        .join('\n')
    },
  }
}

export function createSudokuFromJSON(payload) {
  const grid = Array.isArray(payload) ? payload : payload?.grid
  return createSudoku(grid)
}
