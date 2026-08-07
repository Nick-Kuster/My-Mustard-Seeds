import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

const STRONGS_NUMBER_RE = /^[HG]\d+$/i
const SEARCH_TERM_RE = /^[\p{L}\p{M}\p{N}\s'-]+$/u
const MAX_SEARCH_LENGTH = 48

export const normalizeStrongsSearchTerm = (query) => {
  const trimmed = (query || '').trim().replace(/\s+/g, ' ')
  if (!trimmed || trimmed.length > MAX_SEARCH_LENGTH) return null
  if (STRONGS_NUMBER_RE.test(trimmed)) return trimmed
  if (!SEARCH_TERM_RE.test(trimmed)) return null
  return trimmed
}

// ~14,300 rows — unlike bibleData.js's small bible_books table, this is
// never preloaded client-side. Mirrors VerseSelectionModal.vue's
// live-per-keystroke query pattern against bible_verses instead.
export const useStrongsDataStore = defineStore('strongsData', () => {
  const searching = ref(false)

  const search = async (query, { language = null, limit = 25 } = {}) => {
    const trimmed = normalizeStrongsSearchTerm(query)
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
      const orFilter = `lemma.ilike.${pattern},transliteration.ilike.${pattern},kjv_def.ilike.${pattern},strongs_def.ilike.${pattern}`

      if (language) {
        const { data, error } = await supabase
          .from('strongs_entries')
          .select('*')
          .or(orFilter)
          .eq('language', language)
          .limit(limit)
        if (error) throw error
        return data || []
      }

      // No language filter (e.g. the inline `$` mention search) — query
      // each language separately and merge, rather than one flat
      // .limit(limit) query. Without an ORDER BY, a common English word
      // like "love" can match far more Hebrew entries than Greek ones, so
      // a single unordered query can fill its whole limit with Hebrew
      // rows before any Greek ones are returned — splitting the limit
      // across both languages guarantees each gets a chance to appear.
      const perLanguageLimit = Math.ceil(limit / 2)
      const [hebrewResult, greekResult] = await Promise.all(
        ['hebrew', 'greek'].map((lang) => supabase
          .from('strongs_entries')
          .select('*')
          .or(orFilter)
          .eq('language', lang)
          .limit(perLanguageLimit)),
      )
      if (hebrewResult.error) throw hebrewResult.error
      if (greekResult.error) throw greekResult.error
      return [...(hebrewResult.data || []), ...(greekResult.data || [])]
    } finally {
      searching.value = false
    }
  }

  return { searching, search }
})
