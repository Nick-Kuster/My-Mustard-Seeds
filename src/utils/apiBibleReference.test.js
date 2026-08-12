import { describe, expect, it } from 'vitest'
import { apiBiblePassageIdFromDisplay } from './apiBibleReference'

describe('apiBiblePassageIdFromDisplay', () => {
  it('converts a single verse to an API.Bible passage id', () => {
    expect(apiBiblePassageIdFromDisplay('John 3:16')).toBe('JHN.3.16')
  })

  it('converts same-chapter and cross-chapter ranges', () => {
    expect(apiBiblePassageIdFromDisplay('Romans 8:1-4')).toBe('ROM.8.1-ROM.8.4')
    expect(apiBiblePassageIdFromDisplay('John 3:16-4:2')).toBe('JHN.3.16-JHN.4.2')
  })

  it('converts chapter-only references', () => {
    expect(apiBiblePassageIdFromDisplay('Psalm 23')).toBe('PSA.23')
    expect(apiBiblePassageIdFromDisplay('John 3-4')).toBe('JHN.3-JHN.4')
  })

  it('returns null for unsupported references', () => {
    expect(apiBiblePassageIdFromDisplay('Not a reference')).toBe(null)
  })
})
