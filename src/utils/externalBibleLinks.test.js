import { describe, expect, it } from 'vitest'
import { blueLetterBibleUrl, logosBibleUrl } from './externalBibleLinks'

describe('externalBibleLinks', () => {
  it('builds Logos ref.ly links for single verses and ranges', () => {
    expect(logosBibleUrl('John 3:16')).toBe('https://ref.ly/logosref/Bible.Jn3.16')
    expect(logosBibleUrl('Romans 8:1-4')).toBe('https://ref.ly/logosref/Bible.Ro8.1-4')
  })

  it('builds direct Blue Letter Bible passage links', () => {
    expect(blueLetterBibleUrl('John 3:16')).toBe('https://www.blueletterbible.org/kjv/jhn/3/16/')
    expect(blueLetterBibleUrl('John 13:34-35', 'NASB20')).toBe(
      'https://www.blueletterbible.org/nasb20/jhn/13/34/',
    )
    expect(blueLetterBibleUrl('John 13:34-35', 'NIV')).toBe(
      'https://www.blueletterbible.org/niv/jhn/13/34/',
    )
    expect(blueLetterBibleUrl('John 13:34-35', 'NLT')).toBe(
      'https://www.blueletterbible.org/nlt/jhn/13/34/',
    )
  })

  it('falls back to KJV for BSB because Blue Letter Bible does not provide BSB', () => {
    expect(blueLetterBibleUrl('John 13:34-35', 'BSB')).toBe(
      'https://www.blueletterbible.org/kjv/jhn/13/34/',
    )
  })
})
