// stores/bibleData.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useBibleDataStore = defineStore('bibleData', () => {
  const books = ref([])
  const chaptersCache = ref({})
  const versesCache = ref({})

  const loadBooks = async () => {
    if (books.value.length > 0) return // Already loaded

    const { data, error } = await supabase.from('bible_books').select('*').order('book_order')

    if (!error && data) {
      books.value = data
    }
  }

  const getChapters = async (book) => {
    if (chaptersCache.value[book]) {
      return chaptersCache.value[book]
    }

    const { data, error } = await supabase.rpc('get_book_chapters', { book_name: book })

    if (!error && data) {
      chaptersCache.value[book] = data
      return data
    }
    return []
  }

  const getVerses = async (book, chapter) => {
    const cacheKey = `${book}-${chapter}`
    if (versesCache.value[cacheKey]) {
      return versesCache.value[cacheKey]
    }

    const { data, error } = await supabase
      .from('bible_glossary')
      .select('verse_count')
      .eq('book', book)
      .eq('chapter', chapter)
      .single()

    if (!error && data) {
      const verses = Array.from({ length: data.verse_count }, (_, i) => i + 1)
      versesCache.value[cacheKey] = verses
      return verses
    }
    return []
  }

  const clearCache = () => {
    chaptersCache.value = {}
    versesCache.value = {}
  }

  return {
    books,
    loadBooks,
    getChapters,
    getVerses,
    clearCache,
  }
})
