import { describe, expect, it } from 'vitest'
import { normalizeStrongsSearchTerm } from './strongsData'

describe('normalizeStrongsSearchTerm', () => {
  it('allows Strong numbers, transliterations, English words, and accents', () => {
    expect(normalizeStrongsSearchTerm(' g25 ')).toBe('g25')
    expect(normalizeStrongsSearchTerm('agapao')).toBe('agapao')
    expect(normalizeStrongsSearchTerm('phileo love')).toBe('phileo love')
    expect(normalizeStrongsSearchTerm('agapaó')).toBe('agapaó')
  })

  it('normalizes repeated whitespace', () => {
    expect(normalizeStrongsSearchTerm('steadfast   love')).toBe('steadfast love')
  })

  it('rejects PostgREST filter punctuation and oversized terms', () => {
    expect(normalizeStrongsSearchTerm('love),strongs_def.ilike.%')).toBe(null)
    expect(normalizeStrongsSearchTerm('love*')).toBe(null)
    expect(normalizeStrongsSearchTerm('a'.repeat(49))).toBe(null)
  })
})
