import { createSudokuFromJSON } from './sudoku.js'

function cloneSudoku(sudoku) {
  return sudoku.clone()
}

function assertSudoku(sudoku) {
  if (!sudoku || typeof sudoku.getGrid !== 'function' || typeof sudoku.clone !== 'function') {
    throw new TypeError('A valid sudoku instance is required')
  }
}

function createLinearState(sudoku, undoStack = [], redoStack = []) {
  assertSudoku(sudoku)
  return {
    current: cloneSudoku(sudoku),
    undo: undoStack.map(cloneSudoku),
    redo: redoStack.map(cloneSudoku),
  }
}

function createGameState({
  sudoku,
  undoStack = [],
  redoStack = [],
  failedExploreStates = [],
  explore = null,
}) {
  assertSudoku(sudoku)

  let main = createLinearState(sudoku, undoStack, redoStack)
  let failedStates = new Set(Array.isArray(failedExploreStates) ? failedExploreStates : [])
  let exploreSession = null

  if (explore?.current) {
    exploreSession = {
      start: cloneSudoku(explore.start ?? sudoku),
      branch: createLinearState(explore.current, explore.undoStack ?? [], explore.redoStack ?? []),
      visited: new Set(Array.isArray(explore.visitedStates) ? explore.visitedStates : []),
      failed: Boolean(explore.failed),
    }
  }

  function activeSession() {
    return exploreSession ? exploreSession.branch : main
  }

  function markCurrentExploreStateVisited() {
    if (!exploreSession) return
    const signature = exploreSession.branch.current.getSignature()
    exploreSession.visited.add(signature)
    if (failedStates.has(signature)) {
      exploreSession.failed = true
    }
  }

  function evaluateExploreFailure() {
    if (!exploreSession) return false
    const signature = exploreSession.branch.current.getSignature()
    if (failedStates.has(signature) || exploreSession.branch.current.isFailedState()) {
      exploreSession.failed = true
      failedStates.add(signature)
      return true
    }
    return false
  }

  return {
    getSudoku() {
      return activeSession().current
    },
    guess(move) {
      const target = activeSession()
      target.undo.push(cloneSudoku(target.current))
      target.current.guess(move)
      target.redo = []
      markCurrentExploreStateVisited()
      evaluateExploreFailure()
      return this
    },
    undo() {
      const target = activeSession()
      if (!target.undo.length) return false
      target.redo.push(cloneSudoku(target.current))
      target.current = target.undo.pop()
      markCurrentExploreStateVisited()
      evaluateExploreFailure()
      return true
    },
    redo() {
      const target = activeSession()
      if (!target.redo.length) return false
      target.undo.push(cloneSudoku(target.current))
      target.current = target.redo.pop()
      markCurrentExploreStateVisited()
      evaluateExploreFailure()
      return true
    },
    canUndo() {
      return activeSession().undo.length > 0
    },
    canRedo() {
      return activeSession().redo.length > 0
    },
    hasConflict() {
      return this.getSudoku().hasConflict()
    },
    enterExplore() {
      if (exploreSession) return false
      exploreSession = {
        start: cloneSudoku(main.current),
        branch: createLinearState(main.current),
        visited: new Set([main.current.getSignature()]),
        failed: false,
      }
      evaluateExploreFailure()
      return true
    },
    startExplore() {
      return this.enterExplore()
    },
    inExplore() {
      return Boolean(exploreSession)
    },
    isExploreFailed() {
      if (!exploreSession) return false
      evaluateExploreFailure()
      return exploreSession.failed
    },
    rollbackExplore() {
      if (!exploreSession) return false
      exploreSession = null
      return true
    },
    backtrackExplore() {
      return this.rollbackExplore()
    },
    abandonExplore() {
      return this.rollbackExplore()
    },
    discardExplore() {
      return this.rollbackExplore()
    },
    commitExplore() {
      if (!exploreSession) return false
      evaluateExploreFailure()
      if (exploreSession.failed) return false

      main.undo.push(cloneSudoku(main.current))
      main.current = cloneSudoku(exploreSession.branch.current)
      main.redo = []
      exploreSession = null
      return true
    },
    hasFailedExploreState() {
      if (!exploreSession) return false
      const signature = exploreSession.branch.current.getSignature()
      return failedStates.has(signature)
    },
    getFailedExploreStateCount() {
      return failedStates.size
    },
    toJSON() {
      const explore = exploreSession
        ? {
            start: exploreSession.start.toJSON(),
            current: exploreSession.branch.current.toJSON(),
            undoStack: exploreSession.branch.undo.map((item) => item.toJSON()),
            redoStack: exploreSession.branch.redo.map((item) => item.toJSON()),
            visitedStates: Array.from(exploreSession.visited),
            failed: exploreSession.failed,
          }
        : null

      return {
        sudoku: main.current.toJSON(),
        undoStack: main.undo.map((item) => item.toJSON()),
        redoStack: main.redo.map((item) => item.toJSON()),
        failedExploreStates: Array.from(failedStates),
        explore,
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
  const failedExploreStates = Array.isArray(payload?.failedExploreStates)
    ? payload.failedExploreStates.slice()
    : []
  const explore = payload?.explore
    ? {
        start: createSudokuFromJSON(payload.explore.start ?? payload.sudoku ?? payload),
        current: createSudokuFromJSON(payload.explore.current ?? payload.sudoku ?? payload),
        undoStack: Array.isArray(payload.explore.undoStack)
          ? payload.explore.undoStack.map((item) => createSudokuFromJSON(item))
          : [],
        redoStack: Array.isArray(payload.explore.redoStack)
          ? payload.explore.redoStack.map((item) => createSudokuFromJSON(item))
          : [],
        visitedStates: Array.isArray(payload.explore.visitedStates)
          ? payload.explore.visitedStates.slice()
          : [],
        failed: Boolean(payload.explore.failed),
      }
    : null

  return createGameState({ sudoku, undoStack, redoStack, failedExploreStates, explore })
}
