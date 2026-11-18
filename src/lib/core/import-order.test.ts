import { describe, expect, it } from 'vitest'
import { csvImportPriority, sortFilesForImport } from './import-order'

const file = (name: string, text = '') => new File([text], name)
const names = async (files: File[]) => (await sortFilesForImport(files)).map((f) => f.name)

describe('csvImportPriority', () => {
  it('ranks movement before conversation before codes before unknown', () => {
    const movement = csvImportPriority('time,x,y')
    const conversation = csvImportPriority('time,speaker,talk')
    const codes = csvImportPriority('start,end')
    const unknown = csvImportPriority('a,b,c')
    expect([movement, conversation, codes, unknown]).toEqual(
      [...[movement, conversation, codes, unknown]].sort((a, b) => a - b)
    )
    expect(new Set([movement, conversation, codes, unknown]).size).toBe(4)
  })

  it('treats both GPS header spellings as movement', () => {
    const movement = csvImportPriority('time,x,y')
    expect(csvImportPriority('time,lat,lng')).toBe(movement)
    expect(csvImportPriority('time,latitude,longitude')).toBe(movement)
  })

  it('treats single-code and multi-code files alike', () => {
    expect(csvImportPriority('code,start,end')).toBe(csvImportPriority('start,end'))
  })

  it('ignores case, spacing, quotes and extra columns', () => {
    expect(csvImportPriority('"Time", X ,y,notes')).toBe(csvImportPriority('time,x,y'))
  })
})

describe('sortFilesForImport', () => {
  it('puts floor plans and video first, then movement, conversation, codes, unknown', async () => {
    const sorted = await names([
      file('codes.csv', 'code,start,end\nA,1,2'),
      file('mystery.csv', 'a,b\n1,2'),
      file('talk.csv', 'time,speaker,talk\n1,ana,hi'),
      file('plan.png'),
      file('ana.csv', 'time,x,y\n0,1,2'),
    ])
    expect(sorted).toEqual(['plan.png', 'ana.csv', 'talk.csv', 'codes.csv', 'mystery.csv'])
  })

  it('keeps the chosen order among files of the same kind', async () => {
    const sorted = await names([
      file('zed.csv', 'time,x,y\n0,1,2'),
      file('ana.csv', 'time,x,y\n0,1,2'),
    ])
    expect(sorted).toEqual(['zed.csv', 'ana.csv'])
  })

  it('reads only the header line', async () => {
    const sorted = await names([
      file('talk.csv', 'time,speaker,talk\n1,ana,"x,y"'),
      file('ana.csv', 'time,x,y\n0,1,2'),
    ])
    expect(sorted).toEqual(['ana.csv', 'talk.csv'])
  })
})
