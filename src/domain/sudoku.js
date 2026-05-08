function cloneGrid(grid) {
  return grid.map((row) => row.slice())
}

function boardSignature(grid) {
  return grid.map((row) => row.join('')).join('|')
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

function hasDuplicate(values) {
  const seen = new Set()
  for (const value of values) {
    if (value === 0) continue
    if (seen.has(value)) return true
    seen.add(value)
  }
  return false
}

function getCandidatesForCell(grid, row, col) {
  if (grid[row][col] !== 0) return []

  const used = new Set()
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] !== 0) used.add(grid[row][i])
    if (grid[i][col] !== 0) used.add(grid[i][col])
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] !== 0) used.add(grid[r][c])
    }
  }

  const result = []
  for (let value = 1; value <= 9; value++) {
    if (!used.has(value)) result.push(value)
  }
  return result
}

function hasConflictOnGrid(grid) {
  for (let i = 0; i < 9; i++) {
    if (hasDuplicate(grid[i])) return true
    if (hasDuplicate(grid.map((row) => row[i]))) return true
  }

  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      const values = []
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          values.push(grid[r][c])
        }
      }
      if (hasDuplicate(values)) return true
    }
  }

  return false
}

function hasNoCandidateDeadEnd(grid) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0 && getCandidatesForCell(grid, row, col).length === 0) {
        return true
      }
    }
  }
  return false
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
    hasConflict() {
      return hasConflictOnGrid(grid)
    },
    getCandidates(row, col) {
      if (!Number.isInteger(row) || row < 0 || row > 8) {
        throw new RangeError('row must be an integer between 0 and 8')
      }
      if (!Number.isInteger(col) || col < 0 || col > 8) {
        throw new RangeError('col must be an integer between 0 and 8')
      }
      return getCandidatesForCell(grid, row, col)
    },
    isFailedState() {
      return hasConflictOnGrid(grid) || hasNoCandidateDeadEnd(grid)
    },
    getSignature() {
      return boardSignature(grid)
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
