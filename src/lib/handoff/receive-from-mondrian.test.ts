import { describe, expect, it } from 'vitest'
import { isAllowedMondrianOrigin, wantsMondrianImport } from './receive-from-mondrian'

describe('isAllowedMondrianOrigin', () => {
  it('accepts the production Mondrian origin', () => {
    expect(isAllowedMondrianOrigin('https://mondrian.interactiongeography.org', false)).toBe(true)
  })

  it('rejects look-alike and unrelated origins', () => {
    for (const origin of [
      'https://mondrian.interactiongeography.org.evil.example',
      'http://mondrian.interactiongeography.org',
      'https://interactiongeography.org',
      'https://example.com',
    ]) {
      expect(isAllowedMondrianOrigin(origin, false)).toBe(false)
    }
  })

  it('accepts localhost only in development', () => {
    expect(isAllowedMondrianOrigin('http://localhost:5178', true)).toBe(true)
    expect(isAllowedMondrianOrigin('http://localhost:5178', false)).toBe(false)
    expect(isAllowedMondrianOrigin('http://localhost.evil.example:5178', true)).toBe(false)
  })

  it('accepts configured extra origins, such as a preview deployment', () => {
    const preview = 'https://mondrian-git-feat-send-to-igs.vercel.app'
    expect(isAllowedMondrianOrigin(preview, false, [preview])).toBe(true)
  })
})

describe('wantsMondrianImport', () => {
  it('reads the import parameter', () => {
    expect(wantsMondrianImport(new URL('https://igs.example/?import=mondrian'))).toBe(true)
    expect(wantsMondrianImport(new URL('https://igs.example/?import=other'))).toBe(false)
    expect(wantsMondrianImport(new URL('https://igs.example/'))).toBe(false)
  })
})
