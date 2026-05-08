import { describe, expect, it } from 'vitest'
import { loadDomainApi, makePuzzle } from './helpers/domain-api.js'

describe('HW1 explore mode behavior', () => {
  it('detects conflict and marks current exploration as failed', async () => {
    const { createGame, createSudoku } = await loadDomainApi()
    const game = createGame({ sudoku: createSudoku(makePuzzle()) })

    expect(game.enterExplore()).toBe(true)
    game.guess({ row: 0, col: 2, value: 5 })

    expect(game.hasConflict()).toBe(true)
    expect(game.isExploreFailed()).toBe(true)
  })

  it('can rollback to exploration start and try another candidate', async () => {
    const { createGame, createSudoku } = await loadDomainApi()
    const game = createGame({ sudoku: createSudoku(makePuzzle()) })

    expect(game.enterExplore()).toBe(true)
    game.guess({ row: 0, col: 2, value: 4 })
    game.guess({ row: 1, col: 1, value: 7 })

    expect(game.rollbackExplore()).toBe(true)
    expect(game.inExplore()).toBe(false)
    expect(game.getSudoku().getGrid()[0][2]).toBe(0)
    expect(game.getSudoku().getGrid()[1][1]).toBe(0)

    expect(game.enterExplore()).toBe(true)
    game.guess({ row: 0, col: 2, value: 4 })
    expect(game.commitExplore()).toBe(true)
    expect(game.getSudoku().getGrid()[0][2]).toBe(4)
  })

  it('remembers previously failed board states across exploration branches', async () => {
    const { createGame, createSudoku } = await loadDomainApi()
    const game = createGame({ sudoku: createSudoku(makePuzzle()) })

    expect(game.enterExplore()).toBe(true)
    game.guess({ row: 0, col: 2, value: 5 })
    expect(game.isExploreFailed()).toBe(true)
    expect(game.getFailedExploreStateCount()).toBe(1)
    expect(game.rollbackExplore()).toBe(true)

    expect(game.enterExplore()).toBe(true)
    game.guess({ row: 0, col: 2, value: 5 })
    expect(game.hasFailedExploreState()).toBe(true)
    expect(game.isExploreFailed()).toBe(true)
    expect(game.getFailedExploreStateCount()).toBe(1)
  })
})
