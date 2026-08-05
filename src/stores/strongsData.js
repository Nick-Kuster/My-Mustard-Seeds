import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

const STRONGS_NUMBER_RE = /^[HG]\d+$/i

// ~14,300 rows — unlike bibleData.js's small bible_books table, this is
// never preloaded client-side. Mirrors VerseSelectionModal.vue's
// live-per-keystroke query pattern against bible_verses instead.
export const useStrongsDataStore = defineStore('strongsData', () => {
  const searching = ref(false)

  const search = async (query, { language = null, limit = 25 } = {}) => {
    const trimmed = (query || '').trim()
    if (!trimmed) return []

    searching.value = true
    try {
      if (STRONGS_NUMBER_RE.test(trimmed)) {
        const number = trimmed[0].toUpperCase() + trimmed.slice(1)
        const { data, error } = await supabase
          .from('strongs_entries')
          .select('*')
          .eq('strongs_number', number)
        if (error) throw error
        return data || []
      }

      const pattern = `%${trimmed}%`
      let request = supabase
        .from('strongs_entries')
        .select('*')
        .or(
          `lemma.ilike.${pattern},transliteration.ilike.${pattern},kjv_def.ilike.${pattern},strongs_def.ilike.${pattern}`,
        )
        .limit(limit)

      if (language) request = request.eq('language', language)

      const { data, error } = await request
      if (error) throw error
      return data || []
    } finally {
      searching.value = false
    }
  }

  return { searching, search }
})
