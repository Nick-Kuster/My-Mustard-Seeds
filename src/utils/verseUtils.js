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
