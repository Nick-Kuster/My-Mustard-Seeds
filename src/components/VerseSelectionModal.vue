<template>
  <q-dialog v-model="isOpen">
    <q-card class="verse-selection-modal">
      <q-card-section class="row items-center">
        <div class="text-h6">Select Verse Range</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="verse-selection-content">
        <q-select v-model="selectedBook" :options="filteredBooks" option-label="book" label="Book" dense
          use-input fill-input hide-selected input-debounce="0" @filter="filterBooks"
          menu-self="top start" menu-anchor="bottom start" popup-content-class="verse-select-menu" />

        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col">
            <q-input v-model="fromText" label="From" placeholder="e.g. 1:1 or 1" dense :disable="!selectedBook"
              :error="!!fromText && !fromRef" error-message="Use chapter:verse or just chapter, e.g. 1:1 or 1" />
            <div v-if="fromText && fromRef" class="verse-preview">
              {{ fromPreview || 'Verse not found' }}
            </div>
          </div>
          <div class="col">
            <q-input v-model="toText" label="To" placeholder="e.g. 2:3 or 2" dense :disable="!fromRef"
              :error="!!toText && !parseVerseFilterRef(toText)"
              error-message="Use chapter:verse or just chapter, e.g. 2:3 or 2" />
            <div v-if="toText && parseVerseFilterRef(toText)" class="verse-preview">
              {{ toPreview || 'Verse not found' }}
            </div>
          </div>
        </div>

        <div class="text-caption text-grey q-mt-sm">
          Leave "To" blank to select a single verse; type just a chapter number for the whole chapter
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn color="primary" label="Confirm Selection" :disable="!canConfirm" @click="confirmSelection" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useBibleDataStore } from 'stores/bibleData'
import { supabase } from 'src/boot/supabase'
import { parseVerseFilterRef } from 'src/utils/verseUtils'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const bibleData = useBibleDataStore()
const selectedBook = ref(null)
const fromText = ref('')
const toText = ref('')
const fromPreview = ref('')
const toPreview = ref('')
const filteredBooks = ref([])

const filterBooks = (val, update) => {
  update(() => {
    if (!val) {
      filteredBooks.value = bibleData.books
      return
    }
    const needle = val.toLowerCase()
    filteredBooks.value = bibleData.books.filter((b) => b.book.toLowerCase().includes(needle))
  })
}

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// A bare chapter number (no colon) parses to { chapter, verse: null } —
// resolved to the chapter's first/last verse in confirmSelection()
const fromRef = computed(() => parseVerseFilterRef(fromText.value))
// Blank "to" means a single-verse (or single-chapter) selection, same as "from"
const toRef = computed(() => (toText.value.trim() ? parseVerseFilterRef(toText.value) : fromRef.value))

const canConfirm = computed(() => !!(selectedBook.value && fromRef.value && toRef.value))

watch(selectedBook, () => {
  fromText.value = ''
  toText.value = ''
  fromPreview.value = ''
  toPreview.value = ''
})

// Mirror "From" into "To" as the user types, so a single-verse selection
// doesn't require retyping the reference twice — but once "To" is edited
// independently, stop overwriting it (unless "From" changes again while
// "To" still matches what was last auto-filled).
watch(fromText, (newVal, oldVal) => {
  if (!toText.value || toText.value === oldVal) {
    toText.value = newVal
  }
})

const fetchVerseContent = async (book, chapter, verse) => {
  const { data } = await supabase
    .from('bible_verses')
    .select('content')
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .single()
  return data?.content || ''
}

watch(fromRef, async (ref) => {
  if (!ref || !selectedBook.value) {
    fromPreview.value = ''
    return
  }
  if (ref.verse == null) {
    fromPreview.value = `(Whole chapter ${ref.chapter})`
    return
  }
  fromPreview.value = await fetchVerseContent(selectedBook.value.book, ref.chapter, ref.verse)
})

watch(toRef, async (ref) => {
  if (!ref || !selectedBook.value || !toText.value.trim()) {
    toPreview.value = ''
    return
  }
  if (ref.verse == null) {
    toPreview.value = `(Whole chapter ${ref.chapter})`
    return
  }
  toPreview.value = await fetchVerseContent(selectedBook.value.book, ref.chapter, ref.verse)
})

const confirmSelection = async () => {
  if (!canConfirm.value) return

  const book = selectedBook.value.book
  let start = fromRef.value
  let end = toRef.value

  // Normalize a reversed range — verse is only compared when both sides have one
  if (start && end) {
    const chapterDiff = end.chapter - start.chapter
    const shouldSwap =
      chapterDiff < 0 ||
      (chapterDiff === 0 && start.verse != null && end.verse != null && end.verse < start.verse)
    if (shouldSwap) {
      ;[start, end] = [end, start]
    }
  }

  // A bare chapter number resolves to that chapter's first verse (as the
  // start) or last verse (as the end), so "3" alone means the whole chapter
  const resolveVerseNumber = async (ref, isEnd) => {
    if (ref.verse != null) return ref.verse
    if (!isEnd) return 1
    const verses = await bibleData.getVerses(book, ref.chapter)
    return verses.length ? Math.max(...verses) : 1
  }
  const startVerseNum = await resolveVerseNumber(start, false)
  const endVerseNum = await resolveVerseNumber(end, true)

  const [{ data: startVerseData }, { data: endVerseData }] = await Promise.all([
    supabase.from('bible_verses').select('id, verse_number')
      .eq('book', book).eq('chapter', start.chapter).eq('verse', startVerseNum).single(),
    supabase.from('bible_verses').select('id, verse_number')
      .eq('book', book).eq('chapter', end.chapter).eq('verse', endVerseNum).single(),
  ])

  // A typed reference that doesn't exist (e.g. a chapter the book doesn't
  // have) — leave the dialog open so the "Verse not found" preview stays visible
  if (!startVerseData || !endVerseData) return

  // Both ends were typed as bare chapters — show it as a chapter reference,
  // not the verse range it happens to resolve to
  let displayText
  if (start.verse == null && end.verse == null) {
    displayText = start.chapter === end.chapter
      ? `${book} ${start.chapter}`
      : `${book} ${start.chapter}-${end.chapter}`
  } else if (start.chapter === end.chapter && startVerseNum === endVerseNum) {
    displayText = `${book} ${start.chapter}:${startVerseNum}`
  } else if (start.chapter === end.chapter) {
    displayText = `${book} ${start.chapter}:${startVerseNum}-${endVerseNum}`
  } else {
    displayText = `${book} ${start.chapter}:${startVerseNum}-${end.chapter}:${endVerseNum}`
  }

  emit('select', {
    startVerseId: startVerseData.id,
    startVerse: startVerseData.verse_number,
    endVerseId: endVerseData.id,
    endVerse: endVerseData.verse_number,
    display: displayText
  })

  selectedBook.value = null
  fromText.value = ''
  toText.value = ''
  fromPreview.value = ''
  toPreview.value = ''
  isOpen.value = false
}

onMounted(async () => {
  await bibleData.loadBooks()
  filteredBooks.value = bibleData.books
})
</script>

<style scoped>
.verse-selection-modal {
  width: 90vw;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}

.verse-selection-content {
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

.verse-preview {
  background: var(--color-surface-muted);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.85em;
  margin-top: 4px;
}

/* Target the select menu globally */
:global(.verse-select-menu) {
  max-height: 300px !important;
  z-index: 10000 !important;
}
</style>
