/**
 * Formats a verse reference string based on chapter and verse numbers
 * @param {Object} verse - Verse object containing book, chapter, and verse numbers
 * @param {string} verse.book - Book name
 * @param {number|string} verse.start_chapter - Starting chapter number
 * @param {number|string} verse.start_verse - Starting verse number
 * @param {number|string} verse.end_chapter - Ending chapter number
 * @param {number|string} verse.end_verse - Ending verse number
 * @returns {string} Formatted verse reference
 */
export const formatVerseReference = (verse) => {
  const { start_chapter, end_chapter, start_verse, end_verse, book } = verse

  if (start_chapter === end_chapter && start_verse === end_verse) {
    return `${book} ${start_chapter}:${start_verse}`
  } else if (start_chapter === end_chapter) {
    return `${book} ${start_chapter}:${start_verse}-${end_verse}`
  } else {
    return `${book} ${start_chapter}:${start_verse}-${end_chapter}:${end_verse}`
  }
}

/**
 * Creates a display-ready verse object
 * @param {Object} verse - Raw verse data
 * @returns {Object} Verse object with display and verse number properties
 */
export const createDisplayVerse = (verse) => ({
  display: formatVerseReference(verse),
  startVerse: verse.start_verse_number,
  endVerse: verse.end_verse_number,
})

/**
 * Tests whether an entry's verse reference overlaps a verse-range filter.
 * Range fields other than book are optional: null start means "from the
 * beginning of the book", null end means "to the end".
 * @param {Object} verse - Entry verse ({ book, start_chapter, start_verse, end_chapter, end_verse })
 * @param {Object} range - Filter ({ book, startChapter, startVerse, endChapter, endVerse })
 * @returns {boolean}
 */
export const verseMatchesRange = (verse, range) => {
  if (verse.book !== range.book) return false
  const compare = (a, b) => a[0] - b[0] || a[1] - b[1]
  const entryStart = [verse.start_chapter, verse.start_verse]
  const entryEnd = [verse.end_chapter, verse.end_verse]
  const filterStart = [range.startChapter ?? 1, range.startVerse ?? 1]
  const filterEnd = [range.endChapter ?? Infinity, range.endVerse ?? Infinity]
  return compare(entryStart, filterEnd) <= 0 && compare(entryEnd, filterStart) >= 0
}

/**
 * Parses free-text "chapter:verse" input (e.g. "1:1") into { chapter, verse }.
 * Returns null for anything that doesn't match — callers trust the user to
 * type a valid reference rather than validating against live chapter/verse data.
 * @param {string} text
 * @returns {{chapter: number, verse: number}|null}
 */
const VERSE_REF_PATTERN = /^\s*(\d+)\s*:\s*(\d+)\s*$/

export const parseVerseRef = (text) => {
  const match = VERSE_REF_PATTERN.exec(text || '')
  if (!match) return null
  return { chapter: Number(match[1]), verse: Number(match[2]) }
}

/**
 * Like parseVerseRef, but also accepts a bare chapter number (e.g. "3"),
 * returning { chapter, verse: null } — used by the search filter, where a
 * whole-chapter match is meaningful. VerseSelectionModal keeps using the
 * stricter parseVerseRef since it must resolve to one exact verse.
 * @param {string} text
 * @returns {{chapter: number, verse: number|null}|null}
 */
const CHAPTER_ONLY_PATTERN = /^\s*(\d+)\s*$/

export const parseVerseFilterRef = (text) => {
  const verseMatch = VERSE_REF_PATTERN.exec(text || '')
  if (verseMatch) return { chapter: Number(verseMatch[1]), verse: Number(verseMatch[2]) }
  const chapterMatch = CHAPTER_ONLY_PATTERN.exec(text || '')
  if (chapterMatch) return { chapter: Number(chapterMatch[1]), verse: null }
  return null
}

/**
 * Parses a free-standing verse reference that includes the book name, e.g.
 * "John 3:16", "Genesis 1:1-2:3", "Psalm 23", "1 Corinthians 13:4-7",
 * "Luke 6:40,41" — used by the ChatGPT import, where there's no book
 * already selected in the UI for the reference to be relative to (unlike
 * parseVerseRef/parseVerseFilterRef), and by the inline `::` reference
 * scanner. Book names are matched case-insensitively by the caller.
 *
 * A comma-separated list ("C:V,V2[,V3...]") is a same-chapter verse list —
 * collapsed to the min..max span, since journal_verses (and every range
 * comparison in this app) only understands one contiguous start/end pair,
 * not a set of individually-cited verses.
 * @param {string} text
 * @returns {{book: string, startChapter: number, startVerse: number|null, endChapter: number, endVerse: number|null}|null}
 */
const FULL_REF_PATTERN = /^\s*(.+?)\s+(\d+)(?::(\d+)((?:\s*,\s*\d+)*))?(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?\s*$/

export const parseFullVerseReference = (text) => {
  const match = FULL_REF_PATTERN.exec(text || '')
  if (!match) return null
  const [, book, chapter, verse, commaList, endChapter, trailingNum] = match

  const startChapter = Number(chapter)
  const startVerse = verse != null ? Number(verse) : null

  if (commaList) {
    // commaList has a leading comma (e.g. ",41,45") — split() on it yields
    // an empty leading segment, and Number('') is 0, not NaN, so that must
    // be filtered out *before* converting to Number or it silently wins
    // the Math.min() below.
    const extraVerses = commaList.split(',').map((n) => n.trim()).filter((n) => n.length > 0).map(Number)
    const allVerses = [startVerse, ...extraVerses]
    return {
      book,
      startChapter,
      startVerse: Math.min(...allVerses),
      endChapter: startChapter,
      endVerse: Math.max(...allVerses),
    }
  }

  if (trailingNum == null) {
    // No range suffix at all: "Book C" or "Book C:V"
    return { book, startChapter, startVerse, endChapter: startChapter, endVerse: startVerse }
  }

  if (startVerse == null) {
    // "Book C-C2": trailingNum is an end chapter, whole chapters throughout
    return { book, startChapter, startVerse: null, endChapter: Number(trailingNum), endVerse: null }
  }

  if (endChapter != null) {
    // "Book C:V-C2:V2"
    return { book, startChapter, startVerse, endChapter: Number(endChapter), endVerse: Number(trailingNum) }
  }

  // "Book C:V-V2": same-chapter verse range
  return { book, startChapter, startVerse, endChapter: startChapter, endVerse: Number(trailingNum) }
}

/**
 * Human-readable label for a verse-range filter,
 * e.g. "John", "John 3", "John 3-5", "John 3:16", "John 3:16-18", "John 3:16-4:2"
 */
export const buildVerseRangeLabel = (range) => {
  const { book, startChapter, startVerse, endChapter, endVerse } = range
  if (!startChapter) return book
  let label = `${book} ${startChapter}`
  if (startVerse) label += `:${startVerse}`
  const sameChapter = !endChapter || endChapter === startChapter
  if (sameChapter) {
    if (endVerse && endVerse !== startVerse) label += `-${endVerse}`
    return label
  }
  label += `-${endChapter}`
  if (endVerse) label += `:${endVerse}`
  return label
}
