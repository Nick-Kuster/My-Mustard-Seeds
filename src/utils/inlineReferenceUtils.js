import { parseFullVerseReference } from 'src/utils/verseUtils'

// Boundary characters that can end a trigger's candidate text. ':' is
// deliberately excluded — "John 3:16" contains its own colon, so treating
// it as a boundary would truncate the reference before the chapter/verse.
const BOUNDARY_CHARS = new Set([' ', '\n', '\t', '.', ',', ';'])

const isBoundary = (char) => char === undefined || BOUNDARY_CHARS.has(char)

const nextBoundaryIndex = (text, from) => {
  let i = from
  while (i < text.length && !isBoundary(text[i])) i++
  return i
}

// Boundary check for the `::` verse branch only — a comma followed
// (skipping spaces) by a digit is a same-chapter verse list continuing
// ("Luke 6:40, 41"), not a boundary, so scanning must keep going past it
// instead of cutting the candidate off right after "40".
const isVerseBoundary = (text, i) => {
  const char = text[i]
  if (char === undefined) return true
  if (char === ',') {
    let j = i + 1
    while (text[j] === ' ') j++
    return !/\d/.test(text[j] || '')
  }
  return BOUNDARY_CHARS.has(char)
}

const nextVerseBoundaryIndex = (text, from) => {
  let i = from
  while (i < text.length && !isVerseBoundary(text, i)) i++
  return i
}

// Safety caps against runaway scanning on pathological input — generous
// enough for a real reference ("1 Corinthians 13:4-7" has only 2 internal
// spaces; even "Song of Solomon 2:1-3:5" has 3).
const MAX_BOUNDARIES = 6
const MAX_CANDIDATE_LEN = 80

// A Strong's number has no internal spaces/punctuation (unlike a book name
// or multi-word tag), so unlike `::`/`#` it doesn't need a boundary-walk —
// a single plain-boundary slice is enough to grab the whole candidate.
const STRONGS_NUMBER_RE = /^[HG]\d+$/i

/**
 * Scans free text for `::<verse reference>`, `#<tag>`, and `$<strongs
 * number>` occurrences. Pure and dependency-free (besides the existing
 * verse-reference parser) — no Supabase/store calls, safe to run at
 * render time as well as while editing. Only validates *shape* (does it
 * look like a reference/tag/number?), not whether the book/tag/number
 * actually exists — that's the resolver's job.
 *
 * @param {string} text
 * @returns {Array<{type: 'verse'|'tag'|'strongs', start: number, end: number, raw: string, verseRange?: object, tagName?: string, strongsNumber?: string}>}
 */
export const findInlineTriggers = (text) => {
  if (!text) return []
  const matches = []
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (char === '#') {
      const end = nextBoundaryIndex(text, i + 1)
      const tagName = text.slice(i + 1, end).trim()
      if (tagName) {
        matches.push({ type: 'tag', start: i, end, raw: text.slice(i, end), tagName })
      }
      i = end
      continue
    }

    if (char === '$') {
      const end = nextBoundaryIndex(text, i + 1)
      const candidate = text.slice(i + 1, end).trim()
      if (STRONGS_NUMBER_RE.test(candidate)) {
        matches.push({ type: 'strongs', start: i, end, raw: text.slice(i, end), strongsNumber: candidate.toUpperCase() })
        i = end
      } else {
        i += 1
      }
      continue
    }

    if (char === ':' && text[i + 1] === ':') {
      const triggerStart = i + 2
      let cursor = triggerStart
      let boundaryCount = 0
      let resolved = null

      while (boundaryCount < MAX_BOUNDARIES && cursor - triggerStart < MAX_CANDIDATE_LEN) {
        const nextBoundary = nextVerseBoundaryIndex(text, cursor)
        const candidate = text.slice(triggerStart, nextBoundary).trim()

        // A new trigger started inside the candidate — abandon this one
        // rather than swallowing it into a longer, wrong match.
        if (candidate.includes('::') || candidate.includes('#')) break

        const parsed = parseFullVerseReference(candidate)
        if (parsed) {
          resolved = { end: nextBoundary, verseRange: parsed, raw: text.slice(i, nextBoundary) }
          break
        }

        if (nextBoundary >= text.length || text[nextBoundary] === '\n') break

        boundaryCount += 1
        cursor = nextBoundary + 1
      }

      if (resolved) {
        matches.push({ type: 'verse', start: i, end: resolved.end, raw: resolved.raw, verseRange: resolved.verseRange })
        i = resolved.end
      } else {
        i += 2
      }
      continue
    }

    i += 1
  }

  return matches
}
