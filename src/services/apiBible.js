import { supabase } from 'src/boot/supabase'

export const API_BIBLE_CONTENT_TYPES = ['text', 'html', 'json']

const invokeApiBible = async (body) => {
  const { data, error } = await supabase.functions.invoke('api-bible', { body })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return data
}

const requireString = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required`)
  }
  return value.trim()
}

export const listApiBibleTranslations = () => invokeApiBible({ action: 'listBibles' })

export const getApiBibleBooks = (bibleId) =>
  invokeApiBible({
    action: 'getBooks',
    bibleId: requireString(bibleId, 'bibleId'),
  })

export const getApiBibleChapters = (bibleId, bookId) =>
  invokeApiBible({
    action: 'getChapters',
    bibleId: requireString(bibleId, 'bibleId'),
    bookId: requireString(bookId, 'bookId'),
  })

export const getApiBiblePassage = ({
  bibleId,
  passageId,
  contentType = 'text',
  includeNotes = false,
  includeTitles = true,
  includeChapterNumbers = false,
  includeVerseNumbers = true,
  includeVerseSpans = false,
}) => {
  if (!API_BIBLE_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`contentType must be one of: ${API_BIBLE_CONTENT_TYPES.join(', ')}`)
  }

  return invokeApiBible({
    action: 'getPassage',
    bibleId: requireString(bibleId, 'bibleId'),
    passageId: requireString(passageId, 'passageId'),
    contentType,
    includeNotes,
    includeTitles,
    includeChapterNumbers,
    includeVerseNumbers,
    includeVerseSpans,
  })
}
