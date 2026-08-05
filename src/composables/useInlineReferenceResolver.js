import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useBibleDataStore } from 'stores/bibleData'
import { useTagsStore } from 'stores/tags'
import { findInlineTriggers } from 'src/utils/inlineReferenceUtils'

const DEBOUNCE_MS = 550

// A bare chapter number resolves to that chapter's first verse (as the
// start) or last verse (as the end) — same convention VerseSelectionModal
// uses for a typed bare-chapter reference.
const resolveVerseNumber = async (bibleData, book, chapter, verse, isEnd) => {
  if (verse != null) return verse
  if (!isEnd) return 1
  const verses = await bibleData.getVerses(book, chapter)
  return verses.length ? Math.max(...verses) : 1
}

// Mirrors VerseSelectionModal.vue's confirmSelection display convention
// exactly (whole-chapter vs single-verse vs range) — not buildVerseRangeLabel,
// which is built for filter labels and doesn't have the whole-chapter case.
const buildVerseDisplay = (book, verseRange, startVerseNum, endVerseNum) => {
  if (verseRange.startVerse == null && verseRange.endVerse == null) {
    return verseRange.startChapter === verseRange.endChapter
      ? `${book} ${verseRange.startChapter}`
      : `${book} ${verseRange.startChapter}-${verseRange.endChapter}`
  }
  if (verseRange.startChapter === verseRange.endChapter && startVerseNum === endVerseNum) {
    return `${book} ${verseRange.startChapter}:${startVerseNum}`
  }
  if (verseRange.startChapter === verseRange.endChapter) {
    return `${book} ${verseRange.startChapter}:${startVerseNum}-${endVerseNum}`
  }
  return `${book} ${verseRange.startChapter}:${startVerseNum}-${verseRange.endChapter}:${endVerseNum}`
}

// Resolves a scanned { verseRange } candidate to real verse IDs, or null if
// the book/chapter/verse doesn't actually exist — same two-query pattern
// VerseSelectionModal.vue and journalImport.js already use.
const resolveVerseMatch = async (match, bibleData) => {
  const book = bibleData.books.find((b) => b.book.toLowerCase() === match.verseRange.book.toLowerCase())
  if (!book) return null

  const { verseRange } = match
  const startVerseNum = await resolveVerseNumber(bibleData, book.book, verseRange.startChapter, verseRange.startVerse, false)
  const endVerseNum = await resolveVerseNumber(bibleData, book.book, verseRange.endChapter, verseRange.endVerse, true)

  const [{ data: startVerseData }, { data: endVerseData }] = await Promise.all([
    supabase.from('bible_verses').select('id, verse_number')
      .eq('book', book.book).eq('chapter', verseRange.startChapter).eq('verse', startVerseNum).single(),
    supabase.from('bible_verses').select('id, verse_number')
      .eq('book', book.book).eq('chapter', verseRange.endChapter).eq('verse', endVerseNum).single(),
  ])

  if (!startVerseData || !endVerseData) return null

  return {
    startVerseId: startVerseData.id,
    startVerse: startVerseData.verse_number,
    endVerseId: endVerseData.id,
    endVerse: endVerseData.verse_number,
    // Display text uses the per-chapter verse numbers (startVerseNum/
    // endVerseNum), NOT .verse_number — verse_number is a separate column
    // (used elsewhere for fetching a contiguous span of verse text) that
    // doesn't reset per chapter, so using it here produced a display like
    // "Luke 6:40" for what should read "Luke 6:24" — same distinction
    // VerseSelectionModal.vue's confirmSelection already carefully keeps.
    display: buildVerseDisplay(book.book, verseRange, startVerseNum, endVerseNum),
  }
}

// Detects `::verse`/`#tag`/`$strongsNumber` patterns as the user types a
// journal entry's content and silently adds them to the entry's existing
// linkedVerses/selectedTags/selectedStrongs — same arrays the picker UI
// already manages, so saveEntry()/updateEntry() persist them with no
// changes of their own. Used by NewEntryPage.vue and EditEntryPage.vue
// only; ContentSectionView.vue renders the same triggers at view time via
// inlineReferenceUtils directly, without this composable (no Supabase
// calls needed there).
export const useInlineReferenceResolver = ({ linkedVerses, selectedTags, selectedStrongs, mainVerse }) => {
  const $q = useQuasar()
  const bibleData = useBibleDataStore()
  const tagsStore = useTagsStore()

  // Nothing else guarantees tags are loaded on the entry-editing pages —
  // TagSelectionModal only fetches when its own modal opens.
  let tagsLoaded = false
  const ensureTagsLoaded = async () => {
    if (tagsLoaded) return
    await tagsStore.fetchTags()
    tagsLoaded = true
  }

  // Per-section resolvedKeys/failedKeys, keyed by the match's raw text (not
  // position, since edits shift offsets) — makes repeated debounce ticks
  // idempotent and stops a persistently-invalid reference from re-hitting
  // Supabase on every tick, until its exact text actually changes.
  const sectionState = {}
  const getSectionState = (sectionId) => {
    if (!sectionState[sectionId]) {
      sectionState[sectionId] = { resolvedKeys: new Set(), failedKeys: new Set(), timer: null }
    }
    return sectionState[sectionId]
  }

  const isDuplicateVerse = (resolved) =>
    (mainVerse?.value?.startVerseId === resolved.startVerseId && mainVerse?.value?.endVerseId === resolved.endVerseId) ||
    linkedVerses.value.some((v) => v.startVerseId === resolved.startVerseId && v.endVerseId === resolved.endVerseId)

  const isDuplicateTag = (tag) => selectedTags.value.some((t) => t.id === tag.id)

  const isDuplicateStrongs = (entry) =>
    selectedStrongs.value.some((s) => s.strongs_number === entry.strongs_number)

  const processMatch = async (match, state) => {
    if (state.resolvedKeys.has(match.raw) || state.failedKeys.has(match.raw)) return

    if (match.type === 'strongs') {
      const { data } = await supabase
        .from('strongs_entries')
        .select('*')
        .eq('strongs_number', match.strongsNumber)
        .maybeSingle()
      if (!data) {
        state.failedKeys.add(match.raw)
        return
      }
      state.resolvedKeys.add(match.raw)
      if (!isDuplicateStrongs(data)) {
        selectedStrongs.value.push(data)
        $q.notify({ type: 'info', message: `Linked ${data.strongs_number} (${data.lemma})`, timeout: 1500 })
      }
      return
    }

    if (match.type === 'verse') {
      await bibleData.loadBooks()
      const resolved = await resolveVerseMatch(match, bibleData)
      if (!resolved) {
        state.failedKeys.add(match.raw)
        return
      }
      state.resolvedKeys.add(match.raw)
      if (!isDuplicateVerse(resolved)) {
        linkedVerses.value.push(resolved)
        $q.notify({ type: 'info', message: `Linked ${resolved.display}`, timeout: 1500 })
      }
      return
    }

    await ensureTagsLoaded()
    const existing = tagsStore.tags.find((t) => t.name.toLowerCase() === match.tagName.toLowerCase())
    let tag = existing
    let created = false
    if (!tag) {
      try {
        tag = await tagsStore.createTag(match.tagName)
        created = true
      } catch {
        state.failedKeys.add(match.raw)
        return
      }
    }
    state.resolvedKeys.add(match.raw)
    if (!isDuplicateTag(tag)) {
      selectedTags.value.push(tag)
      $q.notify({
        type: 'info',
        message: created ? `Created and linked tag "${tag.name}"` : `Tagged #${tag.name}`,
        timeout: 1500,
      })
    }
  }

  const processSection = async (section) => {
    const state = getSectionState(section.id)
    const matches = findInlineTriggers(section.content || '')
    for (const match of matches) {
      await processMatch(match, state)
    }
  }

  const onSectionContentChange = (section) => {
    const state = getSectionState(section.id)
    if (state.timer) clearTimeout(state.timer)
    state.timer = setTimeout(() => {
      state.timer = null
      processSection(section)
    }, DEBOUNCE_MS)
  }

  const onSectionBlur = (section) => {
    const state = getSectionState(section.id)
    if (state.timer) {
      clearTimeout(state.timer)
      state.timer = null
    }
    processSection(section)
  }

  // Safety net for saveEntry()/updateEntry() — catches pasted text and
  // anything a debounce tick didn't get to in time. Runs uniformly across
  // every section including list-type ones (their content is the same
  // newline-joined string format, and '\n' is already a hard boundary).
  const resolveAllInlineReferences = async (contentSections) => {
    await Promise.all((contentSections || []).map((section) => processSection(section)))
  }

  return { onSectionContentChange, onSectionBlur, resolveAllInlineReferences }
}
