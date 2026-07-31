import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData } from 'src/utils/encryption'
import { useBibleDataStore } from 'stores/bibleData'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { parseFullVerseReference } from 'src/utils/verseUtils'
import { isSafeExternalUrl } from 'src/utils/urlUtils'

const TYPE_IDS = JOURNAL_TYPES.map((t) => t.id)

const EXAMPLE_ENTRY = {
  type: 'Devotional',
  title: 'Trusting God in Uncertainty',
  date: '2024-03-12',
  sections: [
    { title: 'Summary', content: "Today's devotional was about resting in God's plan even when the outcome is unclear.", fieldType: 'longText' },
    { title: 'Key Points', content: 'Worry accomplishes nothing\nGod\'s timing is not our timing\nPrayer over anxiety', fieldType: 'list' },
  ],
  verses: [{ reference: 'Philippians 4:6-7', main: true }],
  tags: ['anxiety', 'trust'],
  quotes: [{ quote: 'Fear not, for I am with you.', source: 'Isaiah 41:10', page: null }],
  links: [{ name: 'Devotional source', url: 'https://example.com' }],
}

export const buildImportTemplateText = () => `INSTRUCTIONS FOR CHATGPT (or any other AI assistant):
You will be given a batch of disparate personal notes (sermon notes, devotional
reflections, journal entries, prayer records, etc.) — as text, or as photos of
handwritten or printed pages. If given photos, read/transcribe them first, then
convert everything into a JSON array matching the schema below, one object per
note/entry. Output ONLY the JSON array — no other text, no markdown code fences.

This isn't ChatGPT-specific — hand this template and your notes to any AI
assistant that can read images and produce text output, and paste whatever
JSON it gives back into the import box.

Schema for each entry:
{
  "type": one of ${JSON.stringify(TYPE_IDS)},   // REQUIRED
  "title": "string",                                // REQUIRED, short and descriptive
  "date": "YYYY-MM-DD",                             // optional, the original date of the note
  "sections": [ { "title": "string", "content": "string", "fieldType": "longText" or "list" } ],
  "verses": [ { "reference": "e.g. 'John 3:16' or 'Genesis 1:1-2:3' or 'Psalm 23'", "main": true or false } ],
  "tags": ["string", ...],
  "quotes": [ { "quote": "string", "source": "string (optional)", "page": number (optional) } ],
  "links": [ { "name": "string", "url": "string" } ]
}

Notes:
- Only "type" and "title" are required — omit any field you have no data for.
- Split each note into logically-titled "sections" (e.g. "Summary", "Key Points",
  "Application", "Prayer"). Use fieldType "list" for bullet-point content,
  "longText" for everything else.
- Mark at most one verse reference per entry as "main": true (the primary
  passage for that entry, if there is one).
- Bible verse references must include the full book name.

Example output:
${JSON.stringify([EXAMPLE_ENTRY], null, 2)}
`

const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0

// The manual entry editor lets a "link" section type open its content directly
// in a new tab (window.open) — only allow the plain text/list field types
// through import so a crafted payload can't smuggle a javascript: URI into a
// section that later gets opened that way.
const sanitizeSections = (sections) =>
  sections.map((s) => ({
    title: isNonEmptyString(s?.title) ? s.title : '',
    content: isNonEmptyString(s?.content) ? s.content : '',
    fieldType: s?.fieldType === 'list' ? 'list' : 'longText',
  }))

// related_links entries are opened via window.open(url) straight from the
// view page — same http(s)-only rule the manual link form enforces.
const isSafeUrl = (url) => isNonEmptyString(url) && isSafeExternalUrl(url)

const resolveVerseNumber = async (bibleData, book, chapter, verse, isEnd) => {
  if (verse != null) return verse
  if (!isEnd) return 1
  const verses = await bibleData.getVerses(book, chapter)
  return verses.length ? Math.max(...verses) : 1
}

// Resolves a single { reference, main } item into insertable journal_verses
// fields, or throws with a human-readable reason if it can't be resolved.
const resolveVerseItem = async (bibleData, item) => {
  const parsed = parseFullVerseReference(item.reference)
  if (!parsed) throw new Error(`could not parse reference "${item.reference}"`)

  const book = bibleData.books.find((b) => b.book.toLowerCase() === parsed.book.toLowerCase())
  if (!book) throw new Error(`unknown book "${parsed.book}"`)

  const startVerseNum = await resolveVerseNumber(bibleData, book.book, parsed.startChapter, parsed.startVerse, false)
  const endVerseNum = await resolveVerseNumber(bibleData, book.book, parsed.endChapter, parsed.endVerse, true)

  const [{ data: startVerseData }, { data: endVerseData }] = await Promise.all([
    supabase.from('bible_verses').select('id')
      .eq('book', book.book).eq('chapter', parsed.startChapter).eq('verse', startVerseNum).single(),
    supabase.from('bible_verses').select('id')
      .eq('book', book.book).eq('chapter', parsed.endChapter).eq('verse', endVerseNum).single(),
  ])

  if (!startVerseData || !endVerseData) throw new Error(`reference "${item.reference}" not found in this book/chapter`)

  return { startVerseId: startVerseData.id, endVerseId: endVerseData.id }
}

// Case-insensitive tag lookup/creation, shared across the whole batch so the
// same tag name typed in multiple entries only gets created once.
const makeTagResolver = (userId) => {
  const cache = new Map()
  let loaded = false

  const ensureLoaded = async () => {
    if (loaded) return
    const { data } = await supabase.from('tags').select('id, name').eq('user_id', userId)
    ;(data || []).forEach((tag) => cache.set(tag.name.toLowerCase(), tag))
    loaded = true
  }

  return async (name) => {
    await ensureLoaded()
    const key = name.trim().toLowerCase()
    if (cache.has(key)) return cache.get(key)
    const { data, error } = await supabase.from('tags').insert({ user_id: userId, name: name.trim() }).select().single()
    if (error) throw error
    cache.set(key, data)
    return data
  }
}

const importOneEntry = async (raw, { userId, encryptionKey, bibleData, resolveTag }) => {
  const warnings = []

  const contentObject = { sections: sanitizeSections(Array.isArray(raw.sections) ? raw.sections : []) }
  const encryptedContent = await encryptData(contentObject, encryptionKey)

  const insertPayload = { user_id: userId, title: raw.title.trim(), type: raw.type, content: encryptedContent }
  if (isNonEmptyString(raw.date)) {
    const parsedDate = new Date(raw.date)
    if (!Number.isNaN(parsedDate.getTime())) insertPayload.created_at = parsedDate.toISOString()
  }

  let { data: entry, error: entryError } = await supabase.from('journal_entries').insert(insertPayload).select().single()
  if (entryError && insertPayload.created_at) {
    // Best-effort date backdating — retry without it rather than failing the entry
    delete insertPayload.created_at
    ;({ data: entry, error: entryError } = await supabase.from('journal_entries').insert(insertPayload).select().single())
  }
  if (entryError) throw new Error(entryError.message)

  // Verses
  const verseItems = Array.isArray(raw.verses) ? raw.verses : []
  const resolvedVerses = []
  for (const item of verseItems) {
    if (!isNonEmptyString(item?.reference)) continue
    try {
      resolvedVerses.push({ ...(await resolveVerseItem(bibleData, item)), main: !!item.main })
    } catch (err) {
      warnings.push(`verse skipped — ${err.message}`)
    }
  }
  if (resolvedVerses.length > 0) {
    if (!resolvedVerses.some((v) => v.main) && resolvedVerses.length === 1) {
      resolvedVerses[0].main = true
    }
    const verseInserts = resolvedVerses.map((v) => ({
      journal_id: entry.id,
      start_verse_id: v.startVerseId,
      end_verse_id: v.endVerseId,
      main_verse: v.main,
    }))
    const { error } = await supabase.from('journal_verses').insert(verseInserts)
    if (error) warnings.push(`some verses could not be saved — ${error.message}`)
  }

  // Tags
  const tagNames = (Array.isArray(raw.tags) ? raw.tags : []).filter(isNonEmptyString)
  if (tagNames.length > 0) {
    const tags = await Promise.all(tagNames.map((name) => resolveTag(name)))
    const { error } = await supabase.from('journal_tags').insert(
      tags.map((tag) => ({ journal_id: entry.id, tag_id: tag.id, user_id: userId })),
    )
    if (error) warnings.push(`some tags could not be saved — ${error.message}`)
  }

  // Quotes
  const quoteItems = (Array.isArray(raw.quotes) ? raw.quotes : []).filter((q) => isNonEmptyString(q?.quote))
  if (quoteItems.length > 0) {
    try {
      await Promise.all(quoteItems.map(async (q) => {
        const encryptedQuote = await encryptData(q.quote, encryptionKey)
        const { error } = await supabase.from('journal_quotes').insert({
          journal_id: entry.id,
          quote: encryptedQuote,
          source: q.source || null,
          page_number: q.page ?? null,
        })
        if (error) throw error
      }))
    } catch (err) {
      warnings.push(`some quotes could not be saved — ${err.message}`)
    }
  }

  // Links
  const allLinkItems = Array.isArray(raw.links) ? raw.links : []
  const linkItems = allLinkItems.filter((l) => isSafeUrl(l?.url))
  if (linkItems.length < allLinkItems.length) {
    warnings.push('one or more links were skipped — only http:// and https:// URLs are allowed')
  }
  if (linkItems.length > 0) {
    const { error } = await supabase.from('related_links').insert(
      linkItems.map((l) => ({ journal_id: entry.id, name: l.name || l.url, url: l.url })),
    )
    if (error) warnings.push(`some links could not be saved — ${error.message}`)
  }

  return warnings
}

// Parses `rawText` as a JSON array of entries (or a single entry object) and
// creates each one, sequentially, in Supabase. Returns a summary rather than
// throwing on a per-entry problem — one bad entry shouldn't sink the batch.
export const importEntries = async (rawText) => {
  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('That doesn\'t look like valid JSON — check for missing commas/brackets or extra text around it.')
  }
  const rawEntries = Array.isArray(parsed) ? parsed : [parsed]
  if (rawEntries.length === 0) throw new Error('No entries found.')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')

  const encryptionKey = await getEncryptionKey(session.user.id)
  const bibleData = useBibleDataStore()
  await bibleData.loadBooks()
  const resolveTag = makeTagResolver(session.user.id)

  const succeeded = []
  const failed = []
  const warnings = []

  for (let i = 0; i < rawEntries.length; i++) {
    const raw = rawEntries[i]
    const title = isNonEmptyString(raw?.title) ? raw.title.trim() : `Entry ${i + 1}`

    if (!TYPE_IDS.includes(raw?.type)) {
      failed.push({ index: i, title, reason: `unknown type "${raw?.type}"` })
      continue
    }
    if (!isNonEmptyString(raw?.title)) {
      failed.push({ index: i, title, reason: 'missing title' })
      continue
    }

    try {
      const entryWarnings = await importOneEntry(raw, { userId: session.user.id, encryptionKey, bibleData, resolveTag })
      succeeded.push({ title })
      entryWarnings.forEach((message) => warnings.push({ index: i, title, message }))
    } catch (err) {
      failed.push({ index: i, title, reason: err.message || 'unknown error' })
    }
  }

  return { succeeded, failed, warnings }
}
