import { describe, expect, it } from 'vitest'
import { findInlineTriggers } from './inlineReferenceUtils'

describe('findInlineTriggers', () => {
  it('does not resolve bare Bible book shortcuts', () => {
    expect(findInlineTriggers('Read ::John today')).toEqual([])
    expect(findInlineTriggers('Quote @John here')).toEqual([])
  })

  it('resolves Bible shortcuts once a chapter is present', () => {
    expect(findInlineTriggers('Read ::John 3 today')).toEqual([{
      type: 'verse',
      start: 5,
      end: 13,
      raw: '::John 3',
      verseRange: {
        book: 'John',
        startChapter: 3,
        startVerse: null,
        endChapter: 3,
        endVerse: null,
      },
    }])

    expect(findInlineTriggers('Quote @John 3:16 here')).toEqual([{
      type: 'verseQuote',
      start: 6,
      end: 16,
      raw: '@John 3:16',
      verseRange: {
        book: 'John',
        startChapter: 3,
        startVerse: 16,
        endChapter: 3,
        endVerse: 16,
      },
    }])
  })
})
