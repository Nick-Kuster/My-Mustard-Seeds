import { describe, expect, it } from 'vitest'
import { parseFullVerseReference } from './verseUtils'

describe('parseFullVerseReference', () => {
  it('keeps bare book references opt-in', () => {
    expect(parseFullVerseReference('John')).toBeNull()
    expect(parseFullVerseReference('John', { allowBookOnly: true })).toEqual({
      book: 'John',
      startChapter: null,
      startVerse: null,
      endChapter: null,
      endVerse: null,
    })
  })

  it('accepts shortcut prefixes for free-text passage fields', () => {
    expect(parseFullVerseReference('::John 3:16', { allowBookOnly: true })).toMatchObject({
      book: 'John',
      startChapter: 3,
      startVerse: 16,
      endChapter: 3,
      endVerse: 16,
    })
  })
})
