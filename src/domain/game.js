import { createSudokuFromJSON } from './sudoku.js'

function cloneSudoku(sudoku) {
  return sudoku.clone()
}

function assertSudoku(sudoku) {
  if (!sudoku || typeof sudoku.getGrid !== 'function' || typeof sudoku.clone !== 'function') {
    throw new TypeError('A valid sudoku instance is required')
  }
}

function createGameState({ sudoku, undoStack = [], redoStack = [] }) {
  assertSudoku(sudoku)

  let current = cloneSudoku(sudoku)
  let undo = undoStack.map(cloneSudoku)
  let redo = redoStack.map(cloneSudoku)

  return {
    getSudoku() {
      return current
    },
    guess(move) {
      undo.push(cloneSudoku(current))
      current.guess(move)
      redo = []
      return this
    },
    undo() {
      if (!undo.length) return false
      redo.push(cloneSudoku(current))
      current = undo.pop()
      return true
    },
    redo() {
      if (!redo.length) return false
      undo.push(cloneSudoku(current))
      current = redo.pop()
      return true
    },
    canUndo() {
      return undo.length > 0
    },
    canRedo() {
      return redo.length > 0
    },
    toJSON() {
      return {
        sudoku: current.toJSON(),
        undoStack: undo.map((item) => item.toJSON()),
        redoStack: redo.map((item) => item.toJSON()),
      }
    },
  }
}

export function createGame({ sudoku } = {}) {
  return createGameState({ sudoku })
}

export function createGameFromJSON(payload) {
  const sudoku = createSudokuFromJSON(payload?.sudoku ?? payload)
  const undoStack = Array.isArray(payload?.undoStack)
    ? payload.undoStack.map((item) => createSudokuFromJSON(item))
    : []
  const redoStack = Array.isArray(payload?.redoStack)
    ? payload.redoStack.map((item) => createSudokuFromJSON(item))
    : []

  return createGameState({ sudoku, undoStack, redoStack })
}
