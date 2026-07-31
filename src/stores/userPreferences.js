import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'

const DEFAULT_JOURNAL_ORDER = JOURNAL_TYPES.map((t) => t.id)

// Per-user app preferences, stored as a single jsonb blob (see
// sql/User Preferences Table.sql for why a blob over columns or a
// key/value table) rather than one row/column per setting. Loaded once per
// session and upserted back whenever a preference changes.
export const useUserPreferencesStore = defineStore('userPreferences', () => {
  const preferences = ref({})
  const loaded = ref(false)
  const loading = ref(false)

  const load = async () => {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error) throw error
      preferences.value = data?.preferences || {}
      loaded.value = true
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      loading.value = false
    }
  }

  // Merges `patch` into the stored preferences and persists the whole blob.
  // Updates local state first so callers see the change immediately.
  const setPreferences = async (patch) => {
    const next = { ...preferences.value, ...patch }
    preferences.value = next
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { error } = await supabase.from('user_preferences').upsert(
        {
          user_id: session.user.id,
          preferences: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

      if (error) throw error
    } catch (error) {
      console.error('Error saving preferences:', error)
      throw error
    }
  }

  // Journal type order for the homepage's type lanes. Any type missing
  // from the stored order (new types added after the user last customized
  // it, or before they've customized it at all) is appended in canonical
  // order at the end, so nothing silently disappears from the homepage.
  const journalOrder = computed(() => {
    const stored = preferences.value.journalOrder
    if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_JOURNAL_ORDER

    const known = new Set(DEFAULT_JOURNAL_ORDER)
    const valid = stored.filter((id) => known.has(id))
    const missing = DEFAULT_JOURNAL_ORDER.filter((id) => !valid.includes(id))
    return [...valid, ...missing]
  })

  const setJournalOrder = (order) => setPreferences({ journalOrder: order })

  // 'light' | 'dark' — see src/composables/useThemeMode.js for where this
  // is applied.
  const themeMode = computed(() => (preferences.value.themeMode === 'dark' ? 'dark' : 'light'))
  const setThemeMode = (mode) => setPreferences({ themeMode: mode })

  return {
    preferences,
    loaded,
    loading,
    load,
    setPreferences,
    journalOrder,
    setJournalOrder,
    themeMode,
    setThemeMode,
  }
})
