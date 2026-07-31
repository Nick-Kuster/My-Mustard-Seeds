// Standard 66-book Protestant canon, in canonical reading order. This is a
// static reference list purely for classifying a verse's book name into a
// testament (and for canonical sort order) when building the "Bible"
// implied-resource hierarchy in RecentEntries.vue — it doesn't touch the
// bible_books table or any of the real verse-picker data.
const OLD_TESTAMENT_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
]

const NEW_TESTAMENT_BOOKS = [
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation',
]

export const BIBLE_BOOKS = [
  ...OLD_TESTAMENT_BOOKS.map((name, index) => ({ name, testament: 'Old Testament', order: index })),
  ...NEW_TESTAMENT_BOOKS.map((name, index) => ({ name, testament: 'New Testament', order: OLD_TESTAMENT_BOOKS.length + index })),
]

const bookByName = new Map(BIBLE_BOOKS.map((b) => [b.name.toLowerCase(), b]))

// Case-insensitive; returns null for anything unrecognized (apocryphal
// books, typos, a differently-spelled name in the live data, ...) so
// callers can gracefully fall back rather than mis-group it.
export const getBibleBook = (bookName) => {
  if (!bookName) return null
  return bookByName.get(bookName.trim().toLowerCase()) || null
}
