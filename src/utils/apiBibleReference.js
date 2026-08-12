import { parseFullVerseReference } from 'src/utils/verseUtils'

export const API_BIBLE_BOOK_CODES = {
  Genesis: 'GEN',
  Exodus: 'EXO',
  Leviticus: 'LEV',
  Numbers: 'NUM',
  Deuteronomy: 'DEU',
  Joshua: 'JOS',
  Judges: 'JDG',
  Ruth: 'RUT',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  Ezra: 'EZR',
  Nehemiah: 'NEH',
  Esther: 'EST',
  Job: 'JOB',
  Psalms: 'PSA',
  Psalm: 'PSA',
  Proverbs: 'PRO',
  Ecclesiastes: 'ECC',
  'Song of Solomon': 'SNG',
  Isaiah: 'ISA',
  Jeremiah: 'JER',
  Lamentations: 'LAM',
  Ezekiel: 'EZK',
  Daniel: 'DAN',
  Hosea: 'HOS',
  Joel: 'JOL',
  Amos: 'AMO',
  Obadiah: 'OBA',
  Jonah: 'JON',
  Micah: 'MIC',
  Nahum: 'NAM',
  Habakkuk: 'HAB',
  Zephaniah: 'ZEP',
  Haggai: 'HAG',
  Zechariah: 'ZEC',
  Malachi: 'MAL',
  Matthew: 'MAT',
  Mark: 'MRK',
  Luke: 'LUK',
  John: 'JHN',
  Acts: 'ACT',
  Romans: 'ROM',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  Galatians: 'GAL',
  Ephesians: 'EPH',
  Philippians: 'PHP',
  Colossians: 'COL',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  Titus: 'TIT',
  Philemon: 'PHM',
  Hebrews: 'HEB',
  James: 'JAS',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  Jude: 'JUD',
  Revelation: 'REV',
}

const codeForBook = (book) => {
  const normalized = book?.trim()
  if (!normalized) return null
  const direct = API_BIBLE_BOOK_CODES[normalized]
  if (direct) return direct

  const lower = normalized.toLowerCase()
  const match = Object.entries(API_BIBLE_BOOK_CODES).find(([name]) => name.toLowerCase() === lower)
  return match?.[1] || null
}

const partFor = (bookCode, chapter, verse) => {
  if (!chapter) return null
  return verse ? `${bookCode}.${chapter}.${verse}` : `${bookCode}.${chapter}`
}

export const apiBiblePassageIdFromDisplay = (display) => {
  const parsed = parseFullVerseReference(display)
  const bookCode = codeForBook(parsed?.book)
  if (!parsed || !bookCode || !parsed.startChapter) return null

  const start = partFor(bookCode, parsed.startChapter, parsed.startVerse)
  const end = partFor(bookCode, parsed.endChapter, parsed.endVerse)

  if (!start) return null
  if (!end || start === end) return start
  return `${start}-${end}`
}
