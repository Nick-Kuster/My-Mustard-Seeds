<template>
  <q-dialog v-model="isOpen">
    <q-card class="verse-selection-modal">
      <q-card-section class="row items-center">
        <div class="text-h6">Select Passage</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="verse-selection-content">
        <q-input
          v-model="passageText"
          label="Passage"
          placeholder="e.g. John, John 3, John 3:16, John 3:16-18"
          dense
          autofocus
          :error="!!passageText.trim() && !resolvedRange"
          error-message="Type a book, chapter, verse, or range, e.g. John 3:16"
          @keyup.enter="confirmSelection"
        />

        <div v-if="passageText.trim() && resolvedRange" class="verse-preview">
          {{ previewText }}
        </div>

        <div class="text-caption text-grey q-mt-sm">
          Use the same passage format as content shortcuts, without needing the shortcut prefix.
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
import { parseFullVerseReference } from 'src/utils/verseUtils'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'select'])

const bibleData = useBibleDataStore()
const passageText = ref('')
const previewText = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const parsedPassage = computed(() => parseFullVerseReference(passageText.value, { allowBookOnly: true }))

const resolvedRange = computed(() => {
  const parsed = parsedPassage.value
  if (!parsed) return null
  const book = bibleData.books.find((b) => b.book.toLowerCase() === parsed.book.toLowerCase())
  return book ? { ...parsed, book: book.book } : null
})

const canConfirm = computed(() => !!resolvedRange.value)

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

const getLastChapter = async (book) => {
  const chapters = await bibleData.getChapters(book)
  const chapterNumbers = chapters
    .map((chapter) => Number(chapter?.chapter ?? chapter?.number ?? chapter))
    .filter(Number.isFinite)
  return chapterNumbers.length ? Math.max(...chapterNumbers) : 1
}

const getLastVerse = async (book, chapter) => {
  const verses = await bibleData.getVerses(book, chapter)
  return verses.length ? Math.max(...verses) : 1
}

watch(resolvedRange, async (range) => {
  if (!range) {
    previewText.value = ''
    return
  }

  if (range.startChapter == null) {
    previewText.value = `Whole book: ${range.book}`
    return
  }

  if (range.startVerse == null && range.endVerse == null) {
    previewText.value = range.startChapter === range.endChapter
      ? `Whole chapter: ${range.book} ${range.startChapter}`
      : `Chapter range: ${range.book} ${range.startChapter}-${range.endChapter}`
    return
  }

  const content = await fetchVerseContent(range.book, range.startChapter, range.startVerse)
  previewText.value = content || 'Verse not found'
})

const resolveVerseNumber = async (book, chapter, verse, isEnd) => {
  if (verse != null) return verse
  if (!isEnd) return 1
  return getLastVerse(book, chapter)
}

const resolveSelectionRange = async (range) => {
  const book = range.book
  let startChapter = range.startChapter
  let endChapter = range.endChapter
  let startVerse = range.startVerse
  let endVerse = range.endVerse
  const isWholeBook = startChapter == null

  if (isWholeBook) {
    startChapter = 1
    endChapter = await getLastChapter(book)
  }
  if (endChapter == null) endChapter = startChapter

  const chapterDiff = endChapter - startChapter
  const shouldSwap =
    chapterDiff < 0 ||
    (chapterDiff === 0 && startVerse != null && endVerse != null && endVerse < startVerse)
  if (shouldSwap) {
    ;[startChapter, endChapter] = [endChapter, startChapter]
    ;[startVerse, endVerse] = [endVerse, startVerse]
  }

  const startVerseNum = await resolveVerseNumber(book, startChapter, startVerse, false)
  const endVerseNum = await resolveVerseNumber(book, endChapter, endVerse, true)
  if (![startChapter, endChapter, startVerseNum, endVerseNum].every(Number.isFinite)) return null

  return { book, startChapter, startVerse, endChapter, endVerse, startVerseNum, endVerseNum, isWholeBook }
}

const buildDisplayText = (range) => {
  const { book, startChapter, startVerse, endChapter, endVerse, startVerseNum, endVerseNum, isWholeBook } = range

  if (isWholeBook) return book
  if (startVerse == null && endVerse == null) {
    return startChapter === endChapter
      ? `${book} ${startChapter}`
      : `${book} ${startChapter}-${endChapter}`
  }
  if (startChapter === endChapter && startVerseNum === endVerseNum) {
    return `${book} ${startChapter}:${startVerseNum}`
  }
  if (startChapter === endChapter) {
    return `${book} ${startChapter}:${startVerseNum}-${endVerseNum}`
  }
  return `${book} ${startChapter}:${startVerseNum}-${endChapter}:${endVerseNum}`
}

const reset = () => {
  passageText.value = ''
  previewText.value = ''
}

watch(isOpen, (open) => {
  if (!open) reset()
})

const confirmSelection = async () => {
  if (!canConfirm.value) return

  const selectionRange = await resolveSelectionRange(resolvedRange.value)
  if (!selectionRange) return
  const { book, startChapter, endChapter, startVerseNum, endVerseNum } = selectionRange

  const [{ data: startVerseData }, { data: endVerseData }] = await Promise.all([
    supabase.from('bible_verses').select('id, verse_number')
      .eq('book', book).eq('chapter', startChapter).eq('verse', startVerseNum).single(),
    supabase.from('bible_verses').select('id, verse_number')
      .eq('book', book).eq('chapter', endChapter).eq('verse', endVerseNum).single(),
  ])

  if (!startVerseData || !endVerseData) return

  emit('select', {
    startVerseId: startVerseData.id,
    startVerse: startVerseData.verse_number,
    endVerseId: endVerseData.id,
    endVerse: endVerseData.verse_number,
    display: buildDisplayText(selectionRange),
  })

  reset()
  isOpen.value = false
}

onMounted(async () => {
  await bibleData.loadBooks()
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
  margin-top: 12px;
}
</style>
