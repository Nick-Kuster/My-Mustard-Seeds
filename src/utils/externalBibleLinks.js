import { parseFullVerseReference } from 'src/utils/verseUtils'
import { API_BIBLE_BOOK_CODES } from 'src/utils/apiBibleReference'

const REF_LY_BOOK_CODES = {
  Genesis: 'Ge',
  Exodus: 'Ex',
  Leviticus: 'Le',
  Numbers: 'Nu',
  Deuteronomy: 'Dt',
  Joshua: 'Jos',
  Judges: 'Jdg',
  Ruth: 'Ru',
  '1 Samuel': '1Sa',
  '2 Samuel': '2Sa',
  '1 Kings': '1Ki',
  '2 Kings': '2Ki',
  '1 Chronicles': '1Ch',
  '2 Chronicles': '2Ch',
  Ezra: 'Ezr',
  Nehemiah: 'Ne',
  Esther: 'Est',
  Job: 'Job',
  Psalms: 'Ps',
  Psalm: 'Ps',
  Proverbs: 'Pr',
  Ecclesiastes: 'Ec',
  'Song of Solomon': 'So',
  Isaiah: 'Is',
  Jeremiah: 'Je',
  Lamentations: 'La',
  Ezekiel: 'Eze',
  Daniel: 'Da',
  Hosea: 'Ho',
  Joel: 'Joe',
  Amos: 'Am',
  Obadiah: 'Ob',
  Jonah: 'Jon',
  Micah: 'Mic',
  Nahum: 'Na',
  Habakkuk: 'Hab',
  Zephaniah: 'Zep',
  Haggai: 'Hag',
  Zechariah: 'Zec',
  Malachi: 'Mal',
  Matthew: 'Mt',
  Mark: 'Mk',
  Luke: 'Lk',
  John: 'Jn',
  Acts: 'Ac',
  Romans: 'Ro',
  '1 Corinthians': '1Co',
  '2 Corinthians': '2Co',
  Galatians: 'Ga',
  Ephesians: 'Eph',
  Philippians: 'Php',
  Colossians: 'Col',
  '1 Thessalonians': '1Th',
  '2 Thessalonians': '2Th',
  '1 Timothy': '1Ti',
  '2 Timothy': '2Ti',
  Titus: 'Tit',
  Philemon: 'Phm',
  Hebrews: 'Heb',
  James: 'Jas',
  '1 Peter': '1Pe',
  '2 Peter': '2Pe',
  '1 John': '1Jn',
  '2 John': '2Jn',
  '3 John': '3Jn',
  Jude: 'Jude',
  Revelation: 'Re',
}

const refLyCodeForBook = (book) => {
  const normalized = book?.trim()
  if (!normalized) return null
  const direct = REF_LY_BOOK_CODES[normalized]
  if (direct) return direct

  const lower = normalized.toLowerCase()
  const match = Object.entries(REF_LY_BOOK_CODES).find(([name]) => name.toLowerCase() === lower)
  return match?.[1] || null
}

const refLyReferenceFromDisplay = (reference) => {
  const parsed = parseFullVerseReference(reference)
  const bookCode = refLyCodeForBook(parsed?.book)
  if (!parsed || !bookCode || !parsed.startChapter) return null

  const start = parsed.startVerse
    ? `${bookCode}${parsed.startChapter}.${parsed.startVerse}`
    : `${bookCode}${parsed.startChapter}`
  if (!parsed.endChapter || (parsed.endChapter === parsed.startChapter && parsed.endVerse === parsed.startVerse)) {
    return start
  }

  if (parsed.endChapter === parsed.startChapter) {
    return parsed.endVerse ? `${start}-${parsed.endVerse}` : `${start}-${parsed.endChapter}`
  }

  return parsed.endVerse
    ? `${start}-${bookCode}${parsed.endChapter}.${parsed.endVerse}`
    : `${start}-${bookCode}${parsed.endChapter}`
}

const BLUE_LETTER_BIBLE_TRANSLATIONS = {
  BSB: 'kjv',
  KJV: 'kjv',
  NASB20: 'nasb20',
  NIV: 'niv',
  NLT: 'nlt',
}

const blueLetterBibleTranslationCode = (translationAbbreviation) => {
  const normalized = String(translationAbbreviation || 'KJV').trim().toUpperCase()
  return BLUE_LETTER_BIBLE_TRANSLATIONS[normalized] || 'kjv'
}

const blueLetterBibleBookCode = (book) => {
  const normalized = book?.trim()
  if (!normalized) return null
  const direct = API_BIBLE_BOOK_CODES[normalized]
  if (direct) return direct.toLowerCase()

  const lower = normalized.toLowerCase()
  const match = Object.entries(API_BIBLE_BOOK_CODES).find(([name]) => name.toLowerCase() === lower)
  return match?.[1]?.toLowerCase() || null
}

export const logosBibleUrl = (reference) => {
  const ref = refLyReferenceFromDisplay(reference)
  return ref
    ? `https://ref.ly/logosref/Bible.${ref}`
    : `https://ref.ly/${encodeURIComponent(String(reference || '').replace(/\s+/g, ''))}`
}

export const blueLetterBibleUrl = (reference, translationAbbreviation = 'KJV') => {
  const parsed = parseFullVerseReference(reference)
  const bookCode = blueLetterBibleBookCode(parsed?.book)
  const translationCode = blueLetterBibleTranslationCode(translationAbbreviation)
  if (!parsed || !bookCode || !parsed.startChapter) {
    const criteria = encodeURIComponent(String(reference || '').trim())
    return `https://www.blueletterbible.org/search/search.cfm?Criteria=${criteria}&t=${translationCode.toUpperCase()}`
  }

  const versePath = parsed.startVerse ? `${parsed.startVerse}/` : ''
  return `https://www.blueletterbible.org/${translationCode}/${bookCode}/${parsed.startChapter}/${versePath}`
}

export const externalBibleLinksForReference = (reference, translationAbbreviation = 'KJV') => ({
  logos: logosBibleUrl(reference),
  blueLetterBible: blueLetterBibleUrl(reference, translationAbbreviation),
})
