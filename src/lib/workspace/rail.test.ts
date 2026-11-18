import { describe, expect, it } from 'vitest'
import { RAIL_TABS, isRailTab, isTabAvailable } from '#lib/workspace/rail.ts'

describe('isRailTab', () => {
  it('accepts every panel tab', () => {
    for (const tab of RAIL_TABS) expect(isRailTab(tab)).toBe(true)
  })

  it('rejects the help item and unknown ids', () => {
    expect(isRailTab('help')).toBe(false)
    expect(isRailTab('')).toBe(false)
    expect(isRailTab('Data')).toBe(false)
  })
})

describe('isTabAvailable', () => {
  const view = { is3DMode: true, dataHasCodes: false }

  it('offers Select only in 2D', () => {
    expect(isTabAvailable('select', view)).toBe(false)
    expect(isTabAvailable('select', { ...view, is3DMode: false })).toBe(true)
  })

  it('offers Codes only when codes are loaded', () => {
    expect(isTabAvailable('codes', view)).toBe(false)
    expect(isTabAvailable('codes', { ...view, dataHasCodes: true })).toBe(true)
  })

  it('always offers the other tabs', () => {
    for (const tab of ['data', 'people', 'talk', 'filters', 'settings'] as const) {
      expect(isTabAvailable(tab, view)).toBe(true)
    }
  })
})
