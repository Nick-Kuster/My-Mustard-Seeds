import { describe, expect, it } from 'vitest'
import { isSafeExternalUrl, openSafeExternalUrl } from './urlUtils'

describe('isSafeExternalUrl', () => {
  it('allows http and https URLs', () => {
    expect(isSafeExternalUrl('https://example.com')).toBe(true)
    expect(isSafeExternalUrl('http://example.com')).toBe(true)
  })

  it('trims whitespace before checking the protocol', () => {
    expect(isSafeExternalUrl('  https://example.com/path  ')).toBe(true)
  })

  it('blocks non-http protocols and non-string values', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('data:text/html,<h1>x</h1>')).toBe(false)
    expect(isSafeExternalUrl('/relative/path')).toBe(false)
    expect(isSafeExternalUrl(null)).toBe(false)
  })

  it('opens safe URLs without exposing window.opener', () => {
    const originalOpen = globalThis.open
    const calls = []
    globalThis.open = (...args) => {
      calls.push(args)
      return null
    }

    try {
      expect(openSafeExternalUrl(' https://example.com/path ')).toBe(true)
      expect(calls).toEqual([['https://example.com/path', '_blank', 'noopener,noreferrer']])
    } finally {
      globalThis.open = originalOpen
    }
  })

  it('does not open unsafe URLs', () => {
    const originalOpen = globalThis.open
    let called = false
    globalThis.open = () => {
      called = true
      return null
    }

    try {
      expect(openSafeExternalUrl('javascript:alert(1)')).toBe(false)
      expect(called).toBe(false)
    } finally {
      globalThis.open = originalOpen
    }
  })
})
