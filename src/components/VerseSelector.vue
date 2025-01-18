<template>
  <div class="verse-selector">
    <!-- Book Selection -->
    <div class="row q-col-gutter-md q-mb-sm">
      <div class="col">
        <q-select v-model="selectedBook" :options="bibleData.books" option-label="book" label="Book"
          @update:model-value="onBookChange" dense />
      </div>
      <div class="col">
        <q-select v-model="selectedChapter" :options="chapterOptions" label="Chapter"
          @update:model-value="onChapterChange" :disable="!selectedBook" dense emit-value map-options
          :option-label="val => String(val)" :option-value="val => val" />
      </div>
    </div>

    <!-- Verse Selection -->
    <div class="row q-col-gutter-md">
      <div class="col">
        <q-select v-model="startVerse" :options="verseOptions" label="From Verse" :disable="!selectedChapter" dense
          emit-value map-options :option-label="val => String(val)" :option-value="val => val" />
      </div>
      <div class="col">
        <q-select v-model="endVerse" :options="verseOptions.filter(v => v >= startVerse)" label="To Verse"
          :disable="!startVerse" dense emit-value map-options :option-label="val => String(val)"
          :option-value="val => val" />
      </div>
    </div>

    <!-- Preview of selected verse -->
    <div v-if="verseContent" class="q-mt-sm text-body2">
      {{ verseContent }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useBibleDataStore } from 'stores/bibleData'

const bibleData = useBibleDataStore()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedBook = ref(null)
const selectedChapter = ref(null)
const startVerse = ref(null)
const endVerse = ref(null)
const chapterOptions = ref([])
const verseOptions = ref([])
const verseContent = ref('')
const startVerseId = ref(null)
const endVerseId = ref(null)
const fetchVerseContent = async () => {
  if (!selectedBook.value?.book || !selectedChapter.value || !startVerse.value) return

  const query = supabase
    .from('bible_verses')
    .select('id, content')
    .eq('book', selectedBook.value.book)
    .eq('chapter', Number(selectedChapter.value))

  if (endVerse.value) {
    query
      .gte('verse', Number(startVerse.value))
      .lte('verse', Number(endVerse.value))
      .order('verse')
  } else {
    query.eq('verse', Number(startVerse.value))
  }

  const { data, error } = await query

  if (error) {
    return
  }

  if (data?.length > 0) {
    startVerseId.value = data[0].id
    endVerseId.value = data[data.length - 1].id
    verseContent.value = data.map(v => v.content).join(' ')
  }
}

const onBookChange = async () => {
  selectedChapter.value = null
  startVerse.value = null
  endVerse.value = null
  verseContent.value = ''
  if (selectedBook.value) {
    const chapters = await bibleData.getChapters(selectedBook.value.book)
    // Ensure we're working with numbers
    chapterOptions.value = chapters.map(ch => Number(ch.chapter))
  }
  updateModelValue()
}

const onChapterChange = async () => {
  startVerse.value = null
  endVerse.value = null
  verseContent.value = ''
  if (selectedBook.value?.book && selectedChapter.value) {
    const verses = await bibleData.getVerses(selectedBook.value.book, Number(selectedChapter.value))
    verseOptions.value = verses.map(v => Number(v))
  }
  updateModelValue()
}

const updateModelValue = () => {
  emit('update:modelValue', {
    book: selectedBook.value?.book,
    chapter: selectedChapter.value ? Number(selectedChapter.value) : null,
    startVerse: startVerse.value ? Number(startVerse.value) : null,
    endVerse: endVerse.value ? Number(endVerse.value) : null,
    startVerseId: startVerseId.value,
    endVerseId: endVerseId.value,
    content: verseContent.value
  })
}

watch([startVerse, endVerse], async () => {
  if (startVerse.value) {
    await fetchVerseContent()
    updateModelValue()
  }
})

onMounted(async () => {
  await bibleData.loadBooks()
})

// Handle external modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && Object.keys(newValue).length > 0) {
    selectedBook.value = bibleData.books.find(b => b.book === newValue.book)
    selectedChapter.value = newValue.chapter
    startVerse.value = newValue.startVerse
    endVerse.value = newValue.endVerse
  }
}, { immediate: true })
</script>
