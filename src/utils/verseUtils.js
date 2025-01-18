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
