import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData } from 'src/utils/encryption'
import { useBibleDataStore } from 'stores/bibleData'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { getAllowedChildTypes, getResourceConfig } from 'src/configs/resourceConfigs'
import { parseFullVerseReference } from 'src/utils/verseUtils'
import { isSafeExternalUrl } from 'src/utils/urlUtils'
import { legacyStringToDoc } from 'src/utils/richTextContent'

const TYPE_IDS = JOURNAL_TYPES.map((t) => t.id)
const RESOURCE_TYPE_IDS = Object.values(RESOURCE_TYPES)

const EXAMPLE_ENTRY = {
  type: 'Devotional',
  title: 'Trusting God in Uncertainty',
  date: '2024-03-12',
  sections: [
    { title: 'Summary', content: "God's love in ::John 3:16 gives hope when the outcome is unclear. Remember #trust and study $G25 for agapao.", fieldType: 'longText' },
    { title: 'Key Points', content: 'Worry accomplishes nothing\nGod\'s timing is not our timing\nPrayer over anxiety', fieldType: 'list' },
  ],
  verses: [{ reference: 'Philippians 4:6-7', main: true }],
  tags: ['anxiety', 'trust'],
  resources: [
    { type: 'Devotional', metadata: { name: 'New Morning Mercies', author: 'Paul David Tripp' }, primary: true },
  ],
  strongs: [{ strongsNumber: 'G25', note: 'agapao / love' }],
  quotes: [{ quote: 'Fear not, for I am with you.', source: 'Isaiah 41:10', page: null }],
  links: [{ name: 'Devotional source', url: 'https://example.com' }],
}

const getResourceDisplayTitle = (resource) => {
  try {
    return getResourceConfig(resource.type).getDisplayTitle(resource)
  } catch {
    return resource.type
  }
}

const buildExistingResourceCatalogText = ({ resources = [], resourceRelationships = [] } = {}) => {
  if (!resources.length) {
    return `Existing resources already in the app:
There are no existing resources in this account yet. Create resources from the
source notes when they are clearly named.`
  }

  const resourceSummaries = resources.map((resource) => ({
    type: resource.type,
    title: getResourceDisplayTitle(resource),
    metadata: resource.metadata,
  }))

  const titleById = new Map(resources.map((resource) => [resource.id, getResourceDisplayTitle(resource)]))
  const relationshipSummaries = resourceRelationships
    .map((relationship) => {
      const parentTitle = titleById.get(relationship.parent_resource_id)
      const childTitle = titleById.get(relationship.child_resource_id)
      if (!parentTitle || !childTitle) return null
      return { parent: parentTitle, child: childTitle }
    })
    .filter(Boolean)

  return `Existing resources already in the app:
Use these exact type + metadata values when a note refers to the same resource.
Do not create near-duplicates with alternate spellings, shortened names, or
missing fields if a matching resource is listed here.

Existing resource catalog:
${JSON.stringify(resourceSummaries, null, 2)}

Existing resource relationships:
${relationshipSummaries.length ? JSON.stringify(relationshipSummaries, null, 2) : '[]'}`
}

export const buildImportTemplateText = (context = {}) => `INSTRUCTIONS FOR CHATGPT (or any other AI assistant):
You will be given a batch of disparate personal notes (sermon notes, devotional
reflections, journal entries, prayer records, etc.) — as text, or as photos of
handwritten or printed pages. If given photos, read/transcribe them first, then
convert everything into a JSON array matching the schema below, one object per
note/entry. Output ONLY the JSON array — no other text, no markdown code fences.

This isn't ChatGPT-specific — hand this template and your notes to any AI
assistant that can read images and produce text output, and paste whatever
JSON it gives back into the import box.

${buildExistingResourceCatalogText(context)}

Strict JSON requirements:
- The final answer must be valid JSON that can be parsed by JSON.parse.
- Use double quotes around every object key and string value.
- Inside title, content, quote, source, tag, link, and image text, do not use
  literal double quote characters. Convert quoted phrases to apostrophes/single
  quotes or remove the quote marks entirely. Good: "He said 'yes' before
  leaving." Bad: "He said "yes" before leaving."
- If you absolutely must keep double quotes inside note text, escape the inner
  quotes with a backslash. Example content value: "He said \\"yes\\" before leaving."
- Encode line breaks inside strings as \\n. Do not output raw multi-line strings.
- Do not use comments, trailing commas, smart quotes, markdown fences, or any
  text before or after the JSON array.

Schema for each entry:
{
  "type": one of ${JSON.stringify(TYPE_IDS)},   // REQUIRED
  "title": "string",                                // REQUIRED, short and descriptive
  "date": "YYYY-MM-DD",                             // optional, the original date of the note
  "sections": [ { "title": "string", "content": "string", "fieldType": "longText" or "list" } ],
  "verses": [ { "reference": "e.g. 'John 3:16' or 'Genesis 1:1-2:3' or 'Psalm 23'", "main": true or false } ],
  "tags": ["string", ...],
  "resources": [ { "type": "resource type", "metadata": { "field": "value" }, "primary": true or false } ],
  "strongs": [ "G25", { "strongsNumber": "H7225", "note": "optional note for the AI/user only" } ],
  "quotes": [ { "quote": "string", "source": "string (optional)", "page": number (optional) } ],
  "links": [ { "name": "string", "url": "string" } ],
  "images": [ { "alt": "optional description of an image that should be manually attached later" } ]
}

Notes:
- Only "type" and "title" are required — omit any field you have no data for.
- Split each note into logically-titled "sections" (e.g. "Summary", "Key Points",
  "Application", "Prayer"). Use fieldType "list" for bullet-point content,
  "longText" for everything else.
- Long-text sections import into the app's rich-text editor. Use blank lines for
  separate paragraphs. You may include inline shortcuts in the text such as
  #tag, ::John 3:16, or $G25.
- Strong's words can be found in the app by typing English, Greek transliteration,
  or Hebrew transliteration, but the structured "strongs" import field should use
  exact Strong's numbers like "G25" or "H7225".
- Mark at most one verse reference per entry as "main": true (the primary
  passage for that entry, if there is one).
- Bible verse references must include the full book name.
- Preserve resources named in the notes. Put them in the "resources" array, not
  only in section text. Use these exact resource types and metadata fields:
  Church { "name", "location" }, Pastor { "name" }, SermonSeries { "title", "year" },
  Sermon { "title", "date" }, Author { "name" }, Book { "title" },
  Chapter { "title", "number" }, Podcast { "title", "host" },
  PodcastEpisode { "title", "episodeNumber", "date" }, SongArtist { "name" },
  Devotional { "name", "author" }, Group { "name", "leader", "church" },
  Show { "name" }, Season { "seasonNumber" }, Episode { "name", "episodeNumber" }.
- Put hierarchical resources in parent-to-child order so the app can build the
  resource tree. Sermon example: Church, Pastor, SermonSeries, Sermon. Book
  example: Author, Book, Chapter. Podcast example: Podcast, PodcastEpisode.
- Mark the most useful browsing resource as "primary": true. For sermons, mark
  the Pastor primary; for books, mark the Author primary; for podcasts, mark
  the Podcast primary; for devotionals, mark the Devotional primary.
- Build each entry "title" from the selected resources using the same structure
  the app uses. Sermon with a series: "{Pastor Name} - {Series Title}: {Sermon Title}".
  Sermon without a series: "{Pastor Name}: {Sermon Title}". If only a pastor is
  known, use "{Pastor Name}"; if only a church is known, use "{Church Name}".
  Book with a chapter: "{Book Title} - Chapter {Chapter Number}: {Chapter Title}".
  Book without a chapter: "{Book Title}". Podcast episode:
  "{Podcast Title} - Episode {Episode Number}: {Episode Title}", or omit
  " - Episode {Episode Number}" when no episode number is known. Show episode:
  "{Show Name} Season {Season Number} Episode {Episode Number}". Song,
  Devotional, and Group titles should use the clearest title from the source note.
- Imported images cannot recreate encrypted uploaded image files. If a source
  note contains an image, describe it in section text or include an "images"
  note so it can be attached manually after import.
- Before answering, check the entire response as JSON. Phrases like
  "waiting room for heaven", "just not how you are", or "I'm praying about it"
  should become 'waiting room for heaven', 'just not how you are', and
  'I'm praying about it' when they appear inside JSON string values.

Example output:
${JSON.stringify([EXAMPLE_ENTRY], null, 2)}
`

const isNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0
const STRONGS_NUMBER_RE = /^[GH]\d+$/i
const RESOURCE_METADATA_KEYS = new Set(['type', 'metadata', 'primary'])

const normalizeSectionContent = (content, fieldType) => {
  if (fieldType === 'list') return isNonEmptyString(content) ? content : ''
  return legacyStringToDoc(isNonEmptyString(content) ? content : '')
}

// The manual entry editor lets a "link" section type open its content directly
// in a new tab (window.open) — only allow the plain text/list field types
// through import so a crafted payload can't smuggle a javascript: URI into a
// section that later gets opened that way.
const sanitizeSections = (sections) =>
  sections.map((s) => {
    const fieldType = s?.fieldType === 'list' ? 'list' : 'longText'
    return {
      title: isNonEmptyString(s?.title) ? s.title : '',
      content: normalizeSectionContent(s?.content, fieldType),
      fieldType,
    }
  })

// related_links entries are opened via window.open(url) straight from the
// view page — same http(s)-only rule the manual link form enforces.
const isSafeUrl = (url) => isNonEmptyString(url) && isSafeExternalUrl(url)

const RESOURCE_IDENTITY_FIELDS = {
  [RESOURCE_TYPES.AUTHOR]: ['name'],
  [RESOURCE_TYPES.BOOK]: ['title'],
  [RESOURCE_TYPES.CHAPTER]: ['number', 'title'],
  [RESOURCE_TYPES.CHURCH]: ['name'],
  [RESOURCE_TYPES.DEVOTIONAL]: ['name'],
  [RESOURCE_TYPES.EPISODE]: ['episodeNumber', 'name'],
  [RESOURCE_TYPES.GROUP]: ['name'],
  [RESOURCE_TYPES.PASTOR]: ['name'],
  [RESOURCE_TYPES.PODCAST]: ['title'],
  [RESOURCE_TYPES.PODCAST_EPISODE]: ['episodeNumber', 'title'],
  [RESOURCE_TYPES.SEASON]: ['seasonNumber'],
  [RESOURCE_TYPES.SERMON]: ['date', 'title'],
  [RESOURCE_TYPES.SERMON_SERIES]: ['title'],
  [RESOURCE_TYPES.SHOW]: ['name'],
  [RESOURCE_TYPES.SONG_ARTIST]: ['name'],
}

const normalizeResourceKeyPart = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ')

const resourceKey = (type, metadata = {}) => {
  const fields = RESOURCE_IDENTITY_FIELDS[type] || Object.keys(metadata).sort()
  const parts = fields
    .map((field) => normalizeResourceKeyPart(metadata[field]))
    .filter(Boolean)
  return `${type}:${parts.join('|')}`
}

const cleanResourceMetadata = (type, rawMetadata) => {
  if (!RESOURCE_TYPE_IDS.includes(type) || !rawMetadata || typeof rawMetadata !== 'object') return null

  const config = getResourceConfig(type)
  const metadata = {}
  Object.keys(config.fields).forEach((key) => {
    const value = rawMetadata[key]
    if (isNonEmptyString(value) || typeof value === 'number') {
      metadata[key] = String(value).trim()
    }
  })

  const hasRequiredFields = Object.entries(config.fields)
    .filter(([, field]) => field.required)
    .every(([key]) => isNonEmptyString(metadata[key]))

  return hasRequiredFields ? metadata : null
}

const normalizeResourceItem = (item) => {
  if (!item || typeof item !== 'object' || !RESOURCE_TYPE_IDS.includes(item.type)) return null
  const looseMetadata = Object.fromEntries(
    Object.entries(item).filter(([key]) => !RESOURCE_METADATA_KEYS.has(key)),
  )
  const metadata = cleanResourceMetadata(item.type, item.metadata || looseMetadata)
  if (!metadata) return null
  return { type: item.type, metadata, primary: item.primary === true }
}

const parseImportText = (rawText) => {
  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('That doesn\'t look like valid JSON — check for missing commas/brackets or extra text around it.')
  }
  const rawEntries = Array.isArray(parsed) ? parsed : [parsed]
  if (rawEntries.length === 0) throw new Error('No entries found.')
  return rawEntries
}

const entryTitleForPreview = (raw, index) =>
  isNonEmptyString(raw?.title) ? raw.title.trim() : `Entry ${index + 1}`

const validateImportEntry = (raw, index) => {
  const title = entryTitleForPreview(raw, index)
  if (!TYPE_IDS.includes(raw?.type)) {
    return { valid: false, index, title, reason: `unknown type "${raw?.type}"` }
  }
  if (!isNonEmptyString(raw?.title)) {
    return { valid: false, index, title, reason: 'missing title' }
  }
  return { valid: true, index, title, type: raw.type }
}

const summarizeResourceItem = (item) => ({
  key: resourceKey(item.type, item.metadata),
  type: item.type,
  title: getResourceDisplayTitle({ type: item.type, metadata: item.metadata }),
  metadata: item.metadata,
})

const buildResourceImportPreview = async (rawEntries, userId) => {
  const { data: existingResources, error } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error

  const existingByKey = new Map()
  ;(existingResources || []).forEach((resource) => {
    existingByKey.set(resourceKey(resource.type, resource.metadata), resource)
  })

  const reuse = new Map()
  const create = new Map()
  const skipped = []

  rawEntries.forEach((raw, index) => {
    const entryTitle = entryTitleForPreview(raw, index)
    const allResourceItems = Array.isArray(raw.resources) ? raw.resources : []
    allResourceItems.forEach((rawResource, resourceIndex) => {
      const normalized = normalizeResourceItem(rawResource)
      if (!normalized) {
        skipped.push({
          index,
          title: entryTitle,
          resourceIndex,
          reason: 'unsupported type or missing required metadata',
        })
        return
      }

      const summary = summarizeResourceItem(normalized)
      const existing = existingByKey.get(summary.key)
      const target = existing ? reuse : create
      const current = target.get(summary.key) || {
        ...summary,
        count: 0,
        entries: [],
        existingId: existing?.id,
      }
      current.count += 1
      if (!current.entries.includes(entryTitle)) current.entries.push(entryTitle)
      target.set(summary.key, current)
    })
  })

  return {
    reuse: Array.from(reuse.values()).sort((a, b) => a.title.localeCompare(b.title)),
    create: Array.from(create.values()).sort((a, b) => a.title.localeCompare(b.title)),
    skipped,
  }
}

const makeResourceResolver = async (userId) => {
  const { data: existingResources, error: resourcesError } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', userId)
  if (resourcesError) throw resourcesError

  const resourcesByKey = new Map()
  ;(existingResources || []).forEach((resource) => {
    resourcesByKey.set(resourceKey(resource.type, resource.metadata), resource)
  })

  const { data: existingRelationships, error: relationshipsError } = await supabase
    .from('resource_resources')
    .select('parent_resource_id, child_resource_id')
    .eq('user_id', userId)
  if (relationshipsError) throw relationshipsError

  const relationshipKeys = new Set(
    (existingRelationships || []).map((row) => `${row.parent_resource_id}:${row.child_resource_id}`),
  )

  const resolveResource = async ({ type, metadata }) => {
    const key = resourceKey(type, metadata)
    if (resourcesByKey.has(key)) return resourcesByKey.get(key)

    const { data, error } = await supabase
      .from('resources')
      .insert({ user_id: userId, type, metadata })
      .select()
      .single()
    if (error) throw error
    resourcesByKey.set(key, data)
    return data
  }

  const linkParentChild = async (parent, child) => {
    if (!parent || !child || !getAllowedChildTypes(parent.type).includes(child.type)) return false
    const key = `${parent.id}:${child.id}`
    if (relationshipKeys.has(key)) return true

    const { error } = await supabase.from('resource_resources').insert({
      parent_resource_id: parent.id,
      child_resource_id: child.id,
      user_id: userId,
      relationship_type: child.type.toLowerCase(),
    })
    if (error) throw error
    relationshipKeys.add(key)
    return true
  }

  return { resolveResource, linkParentChild }
}

const normalizeStrongsNumber = (item) => {
  const raw = typeof item === 'string' ? item : item?.strongsNumber || item?.strongs_number
  if (!isNonEmptyString(raw)) return null
  const normalized = raw.trim().toUpperCase()
  return STRONGS_NUMBER_RE.test(normalized) ? normalized : null
}

const resolveStrongsNumbers = async (items) => {
  const warnings = []
  const numbers = [...new Set(items.map(normalizeStrongsNumber).filter(Boolean))]
  const invalidCount = items.length - numbers.length
  if (invalidCount > 0) warnings.push('one or more Strong\'s items were skipped â€” use exact numbers like G25 or H7225')

  const resolved = []
  for (const number of numbers) {
    const { data, error } = await supabase.from('strongs_entries').select('strongs_number').eq('strongs_number', number).single()
    if (error || !data?.strongs_number) {
      warnings.push(`Strong's item skipped â€” ${number} was not found`)
    } else {
      resolved.push(data.strongs_number)
    }
  }
  return { resolved, warnings }
}

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

const importOneEntry = async (raw, { userId, encryptionKey, bibleData, resolveTag, resourceResolver }) => {
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

  // Resources
  const allResourceItems = Array.isArray(raw.resources) ? raw.resources : []
  const resourceItems = allResourceItems.map(normalizeResourceItem).filter(Boolean)
  if (resourceItems.length < allResourceItems.length) {
    warnings.push('one or more resources were skipped — use a supported resource type with required metadata fields')
  }
  if (resourceItems.length > 0) {
    const resolvedResources = []
    let parent = null

    for (const item of resourceItems) {
      const resource = await resourceResolver.resolveResource(item)
      resolvedResources.push({ resource, primary: item.primary })
      await resourceResolver.linkParentChild(parent, resource)
      parent = resource
    }

    if (!resolvedResources.some((item) => item.primary)) {
      resolvedResources[0].primary = true
    }

    const uniqueResources = []
    const seenResourceIds = new Set()
    resolvedResources.forEach((item) => {
      if (seenResourceIds.has(item.resource.id)) return
      seenResourceIds.add(item.resource.id)
      uniqueResources.push(item)
    })

    const { error } = await supabase.from('journal_resources').insert(
      uniqueResources.map(({ resource, primary }) => ({
        journal_id: entry.id,
        resource_id: resource.id,
        primary_resource: primary,
        user_id: userId,
      })),
    )
    if (error) warnings.push(`some resources could not be saved — ${error.message}`)
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

  // Strong's words
  const strongsItems = Array.isArray(raw.strongs) ? raw.strongs : []
  if (strongsItems.length > 0) {
    const { resolved, warnings: strongsWarnings } = await resolveStrongsNumbers(strongsItems)
    warnings.push(...strongsWarnings)
    if (resolved.length > 0) {
      const { error } = await supabase.from('journal_strongs').insert(
        resolved.map((strongsNumber) => ({ journal_id: entry.id, user_id: userId, strongs_number: strongsNumber })),
      )
      if (error) warnings.push(`some Strong's words could not be saved — ${error.message}`)
    }
  }

  if (Array.isArray(raw.images) && raw.images.length > 0) {
    warnings.push('image notes were not imported — encrypted image files must be attached in the editor')
  }

  return warnings
}

// Parses `rawText` as a JSON array of entries (or a single entry object) and
// creates each one, sequentially, in Supabase. Returns a summary rather than
// throwing on a per-entry problem — one bad entry shouldn't sink the batch.
export const importEntries = async (rawText) => {
  const rawEntries = parseImportText(rawText)

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')

  const encryptionKey = await getEncryptionKey(session.user.id)
  const bibleData = useBibleDataStore()
  await bibleData.loadBooks()
  const resolveTag = makeTagResolver(session.user.id)
  const resourceResolver = await makeResourceResolver(session.user.id)

  const succeeded = []
  const failed = []
  const warnings = []

  for (let i = 0; i < rawEntries.length; i++) {
    const raw = rawEntries[i]
    const validation = validateImportEntry(raw, i)
    const title = validation.title

    if (!validation.valid) {
      failed.push({ index: i, title, reason: validation.reason })
      continue
    }

    try {
      const entryWarnings = await importOneEntry(raw, {
        userId: session.user.id,
        encryptionKey,
        bibleData,
        resolveTag,
        resourceResolver,
      })
      succeeded.push({ title })
      entryWarnings.forEach((message) => warnings.push({ index: i, title, message }))
    } catch (err) {
      failed.push({ index: i, title, reason: err.message || 'unknown error' })
    }
  }

  return { succeeded, failed, warnings }
}

export const previewImportEntries = async (rawText) => {
  const rawEntries = parseImportText(rawText)

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')

  const entries = rawEntries.map((raw, index) => {
    const validation = validateImportEntry(raw, index)
    const warnings = []
    const allResourceItems = Array.isArray(raw.resources) ? raw.resources : []
    const resourceItems = allResourceItems.map(normalizeResourceItem).filter(Boolean)

    if (resourceItems.length < allResourceItems.length) {
      warnings.push('one or more resources will be skipped')
    }
    if (Array.isArray(raw.links) && raw.links.some((link) => !isSafeUrl(link?.url))) {
      warnings.push('one or more links will be skipped')
    }
    if (Array.isArray(raw.strongs) && raw.strongs.some((item) => !normalizeStrongsNumber(item))) {
      warnings.push('one or more Strong\'s items will be skipped')
    }
    if (Array.isArray(raw.images) && raw.images.length > 0) {
      warnings.push('image notes will not create uploaded image files')
    }

    return { ...validation, warnings }
  })

  const resources = await buildResourceImportPreview(rawEntries, session.user.id)
  const validCount = entries.filter((entry) => entry.valid).length

  return {
    total: rawEntries.length,
    validCount,
    failed: entries
      .filter((entry) => !entry.valid)
      .map(({ index, title, reason }) => ({ index, title, reason })),
    warnings: entries.flatMap((entry) =>
      entry.warnings.map((message) => ({ index: entry.index, title: entry.title, message })),
    ),
    entries,
    resources,
  }
}
