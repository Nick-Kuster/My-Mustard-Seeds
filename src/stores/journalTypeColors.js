import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'

// Neutral fallback for a type that somehow has no default (custom/legacy data)
const FALLBACK_COLOR = '#9aa398'

// Single source of truth for "what color represents this journal type".
// Today it only ever returns the built-in defaults, but the shape is ready
// for user customization: overrides (keyed by type id) take precedence over
// defaultColors whenever they're populated, so a future settings screen can
// call setOverride()/persist it to Supabase without any caller of getColor()
// needing to change.
export const useJournalTypeColorsStore = defineStore('journalTypeColors', () => {
  const overrides = ref({})

  const defaultColors = computed(() => {
    const map = {}
    JOURNAL_TYPES.forEach((t) => { map[t.id] = t.color })
    return map
  })

  const getColor = (type) => overrides.value[type] || defaultColors.value[type] || FALLBACK_COLOR

  const setOverride = (type, color) => {
    overrides.value = { ...overrides.value, [type]: color }
  }

  const clearOverride = (type) => {
    const next = { ...overrides.value }
    delete next[type]
    overrides.value = next
  }

  return { overrides, defaultColors, getColor, setOverride, clearOverride }
})
