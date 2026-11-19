import { describe, expect, it } from 'vitest'
import { registry, cheatsheetSections } from '#lib/app-actions/registry.ts'

describe('app action registry', () => {
  it('has no two actions on the same chord', () => {
    expect(registry.conflicts).toEqual([])
  })

  it('lists every shortcut in some cheatsheet section', () => {
    const listed = registry
      .groups({ actions: registry.shortcuts(), sections: cheatsheetSections })
      .flatMap((group) => group.actions.map((action) => action.id))
    expect(listed.sort()).toEqual(
      registry
        .shortcuts()
        .map((action) => action.id)
        .sort()
    )
  })

  it('orders the cheatsheet sections', () => {
    const labels = registry
      .groups({ actions: registry.shortcuts(), sections: cheatsheetSections })
      .map((group) => group.label)
    expect(labels).toEqual(['Playback', 'View', 'Selection', 'Navigation', 'Data', 'Modal'])
  })

  it('runs speed up from both = and +', () => {
    const equals = registry.match({
      key: '=',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    })
    const plus = registry.match({
      key: '+',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
    })
    expect(equals?.id).toBe('playback-speed-up')
    expect(plus?.id).toBe('playback-speed-up')
  })

  it('keeps undo and redo out of the palette but on the keyboard', () => {
    for (const id of ['undo', 'redo']) {
      expect(registry.get(id)?.hidden).toBe(true)
      expect(registry.shortcuts().some((action) => action.id === id)).toBe(true)
    }
  })

  it('binds Download Codes to mod+shift+S', () => {
    const event = {
      key: 'S',
      ctrlKey: !registry.mac,
      altKey: false,
      shiftKey: true,
      metaKey: registry.mac,
    }
    expect(registry.match(event)?.id).toBe('download-codes')
  })
})
