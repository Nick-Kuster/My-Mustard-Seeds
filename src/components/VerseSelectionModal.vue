<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="verse-selection-modal">
      <q-card-section class="row items-center">
        <div class="text-h6">Select Verse Range</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Starting Verse</div>
        <div class="q-gutter-y-md">
          <q-select v-model="selectedBook" :options="bibleData.books" option-label="book" label="Book" dense />

          <div class="row q-col-gutter-sm">
            <div class="col">
              <q-select v-model="selectedChapter" :options="chapterOptions" label="Chapter" :disable="!selectedBook"
                dense emit-value map-options />
            </div>
            <div class="col">
              <q-select v-model="selectedVerse" :options="verseOptions" label="Verse" :disable="!selectedChapter" dense
                emit-value map-options />
            </div>
          </div>

          <div v-if="startVerseContent" class="verse-preview">
            {{ startVerseContent }}
          </div>
        </div>

        <div class="text-weight-medium text-center q-my-md">To</div>

        <div class="text-subtitle2 q-mb-sm">Ending Verse</div>
        <div class="q-gutter-y-md" :class="{ 'disabled-section': !selectedVerse }">
          <div class="row q-col-gutter-sm">
            <div class="col">
              <q-select v-model="endChapter" :options="endChapterOptions" label="Chapter" :disable="!selectedVerse"
                dense emit-value map-options />
            </div>
            <div class="col">
              <q-select v-model="endVerse" :options="endVerseOptions" label="Verse" :disable="!endChapter" dense
                emit-value map-options />
            </div>
          </div>

          <div v-if="endVerseContent" class="verse-preview">
            {{ endVerseContent }}
          </div>
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

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const bibleData = useBibleDataStore()
const selectedBook = ref(null)
const selectedChapter = ref(null)
const selectedVerse = ref(null)
const endChapter = ref(null)
const endVerse = ref(null)
const chapterOptions = ref([])
const verseOptions = ref([])
const endVerseOptions = ref([])
const startVerseContent = ref('')
const endVerseContent = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canConfirm = computed(() =>
  selectedBook.value &&
  selectedChapter.value &&
  selectedVerse.value &&
  endChapter.value &&
  endVerse.value
)

const endChapterOptions = computed(() => {
  if (!selectedChapter.value) return []
  return chapterOptions.value.filter(ch => ch >= selectedChapter.value)
})

watch(selectedBook, async (book) => {
  if (book) {
    const chapters = await bibleData.getChapters(book.book)
    chapterOptions.value = chapters.map(ch => Number(ch.chapter))
    selectedChapter.value = null
    selectedVerse.value = null
    endChapter.value = null
    endVerse.value = null
  }
})

watch(selectedChapter, async (chapter) => {
  if (selectedBook.value?.book && chapter) {
    const verses = await bibleData.getVerses(selectedBook.value.book, chapter)
    verseOptions.value = verses.map(v => Number(v))
    selectedVerse.value = null
    endChapter.value = chapter
    endVerse.value = null
  }
})

watch(selectedVerse, async (verse) => {
  if (!selectedBook?.value?.book || !selectedChapter.value || !verse) return

  const { data } = await supabase
    .from('bible_verses')
    .select('content')
    .eq('book', selectedBook.value.book)
    .eq('chapter', selectedChapter.value)
    .eq('verse', verse)
    .single()

  if (data) {
    startVerseContent.value = data.content
  }

  // Set default end verse when start verse is selected
  endChapter.value = selectedChapter.value
  endVerse.value = verse
})

watch(endChapter, async (chapter) => {
  if (!chapter || !selectedBook.value?.book) return

  const verses = await bibleData.getVerses(selectedBook.value.book, chapter)
  endVerseOptions.value = verses.map(v => Number(v))

  // Filter start verse options if same chapter
  if (chapter === selectedChapter.value) {
    endVerseOptions.value = endVerseOptions.value.filter(v => v >= selectedVerse.value)
  }

  if (chapter !== selectedChapter.value) {
    endVerse.value = null
  }
})

watch([endChapter, endVerse], async () => {
  if (!endChapter.value || !endVerse.value || !selectedBook.value?.book) return

  const { data } = await supabase
    .from('bible_verses')
    .select('content')
    .eq('book', selectedBook.value.book)
    .eq('chapter', endChapter.value)
    .eq('verse', endVerse.value)
    .single()

  if (data) {
    endVerseContent.value = data.content
  }
})

const confirmSelection = async () => {
  // First get the verse_number for the start verse
  const { data: startVerseData } = await supabase
    .from('bible_verses')
    .select('id, verse_number')
    .eq('book', selectedBook.value.book)
    .eq('chapter', selectedChapter.value)
    .eq('verse', selectedVerse.value)
    .single()

  // Then get the verse_number for the end verse
  const { data: endVerseData } = await supabase
    .from('bible_verses')
    .select('id, verse_number')
    .eq('book', selectedBook.value.book)
    .eq('chapter', endChapter.value)
    .eq('verse', endVerse.value)
    .single()

  if (startVerseData && endVerseData) {
    let displayText = ''

    // Same chapter and verse
    if (selectedChapter.value === endChapter.value && selectedVerse.value === endVerse.value) {
      displayText = `${selectedBook.value.book} ${selectedChapter.value}:${selectedVerse.value}`
    }
    // Same chapter, different verses
    else if (selectedChapter.value === endChapter.value) {
      displayText = `${selectedBook.value.book} ${selectedChapter.value}:${selectedVerse.value}-${endVerse.value}`
    }
    // Different chapters
    else {
      displayText = `${selectedBook.value.book} ${selectedChapter.value}:${selectedVerse.value}-${endChapter.value}:${endVerse.value}`
    }

    emit('select', {
      startVerseId: startVerseData.id,
      startVerse: startVerseData.verse_number,
      endVerseId: endVerseData.id,
      endVerse: endVerseData.verse_number,
      display: displayText
    })
  }
  isOpen.value = false
}
onMounted(async () => {
  await bibleData.loadBooks()
})
</script>

<style scoped>
.verse-selection-modal {
  width: 90vw;
  max-width: 350px;
}

.verse-preview {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.disabled-section {
  opacity: 0.7;
  pointer-events: none;
}
</style>
