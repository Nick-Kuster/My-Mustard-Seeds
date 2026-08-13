import { describe, expect, it } from 'vitest'
import { formatVerseReference, parseFullVerseReference } from './verseUtils'

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

describe('formatVerseReference', () => {
  it('collapses whole single-chapter ranges to the chapter label', () => {
    expect(formatVerseReference({
      book: 'John',
      start_chapter: 3,
      start_verse: 1,
      end_chapter: 3,
      end_verse: 36,
      end_chapter_verse_count: 36,
    })).toBe('John 3')
  })

  it('keeps partial chapter ranges expanded', () => {
    expect(formatVerseReference({
      book: 'John',
      start_chapter: 3,
      start_verse: 1,
      end_chapter: 3,
      end_verse: 35,
      end_chapter_verse_count: 36,
    })).toBe('John 3:1-35')
  })
})
