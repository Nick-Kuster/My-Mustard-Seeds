import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'

export const HOME_SECTION_IDS = {
  FAVORITES: '__favorites__',
  RECENT: '__recent__',
}

export const SAVED_FILTER_SECTION_PREFIX = '__saved_filter__:'
export const savedFilterSectionId = (id) => `${SAVED_FILTER_SECTION_PREFIX}${id}`
export const savedFilterIdFromSectionId = (sectionId) =>
  sectionId?.startsWith(SAVED_FILTER_SECTION_PREFIX)
    ? sectionId.slice(SAVED_FILTER_SECTION_PREFIX.length)
    : null

const DEFAULT_JOURNAL_ORDER = JOURNAL_TYPES.map((t) => t.id)
const DEFAULT_HOME_SECTION_ORDER = [HOME_SECTION_IDS.FAVORITES, HOME_SECTION_IDS.RECENT, ...DEFAULT_JOURNAL_ORDER]

// What PrintPage.vue includes per entry — all on by default so existing
// users (and anyone who's never opened Print Options) get today's behavior
// unchanged.
export const DEFAULT_PRINT_OPTIONS = {
  content: true,
  verses: true,
  tags: true,
  quotes: true,
  links: true,
}

// Per-user app preferences, stored as a single jsonb blob (see
// sql/User Preferences Table.sql for why a blob over columns or a
// key/value table) rather than one row/column per setting. Loaded once per
// session and upserted back whenever a preference changes.
export const useUserPreferencesStore = defineStore('userPreferences', () => {
  const preferences = ref({})
  const loaded = ref(false)
  const loading = ref(false)

  // Several components call load() independently on mount (MainLayout for
  // theme, RecentEntries for journal order, ...). Without de-duping to the
  // same in-flight promise, a caller that lands while another's fetch is
  // still pending would previously just no-op and read whatever was in
  // `preferences` at that instant — still the pre-load default — instead
  // of waiting for the real data. That's exactly what caused dark mode to
  // apply 'light' on refresh despite the (reactively-bound, so correct)
  // toggle icon showing 'dark': MainLayout's one-shot $q.dark.set() ran
  // against stale state and nothing re-triggered it once the real fetch
  // (kicked off by RecentEntries mounting first) actually resolved.
  let loadPromise = null

  const load = () => {
    if (loaded.value) return Promise.resolve()
    if (loadPromise) return loadPromise

    loadPromise = (async () => {
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
        loadPromise = null
      }
    })()

    return loadPromise
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

  // Home screen section order. The older journalOrder preference only
  // stored journal types, so treat it as a legacy fallback and prepend the
  // new built-in sections for existing users. Any type missing from the
  // stored order (new types added after the user last customized it, or
  // before they've customized it at all) is appended in canonical
  // order at the end, so nothing silently disappears from the homepage.
  const homeSectionOrder = computed(() => {
    const stored = Array.isArray(preferences.value.homeSectionOrder) && preferences.value.homeSectionOrder.length
      ? preferences.value.homeSectionOrder
      : Array.isArray(preferences.value.journalOrder) && preferences.value.journalOrder.length
        ? [HOME_SECTION_IDS.FAVORITES, HOME_SECTION_IDS.RECENT, ...preferences.value.journalOrder]
        : DEFAULT_HOME_SECTION_ORDER

    const known = new Set(DEFAULT_HOME_SECTION_ORDER)
    const valid = stored.filter((id) => known.has(id) || savedFilterIdFromSectionId(id))
    const missing = DEFAULT_HOME_SECTION_ORDER.filter((id) => !valid.includes(id))
    return [...valid, ...missing]
  })

  const setHomeSectionOrder = (order) => setPreferences({ homeSectionOrder: order })

  const hiddenHomeSectionIds = computed(() =>
    Array.isArray(preferences.value.hiddenHomeSectionIds) ? preferences.value.hiddenHomeSectionIds : [],
  )

  const setHomeSections = (order, hiddenIds) => setPreferences({
    homeSectionOrder: order,
    hiddenHomeSectionIds: hiddenIds,
  })

  const journalOrder = computed(() =>
    homeSectionOrder.value.filter((id) => DEFAULT_JOURNAL_ORDER.includes(id)),
  )

  const setJournalOrder = (order) => setPreferences({ journalOrder: order })

  // 'light' | 'dark' — see src/composables/useThemeMode.js for where this
  // is applied.
  const themeMode = computed(() => (preferences.value.themeMode === 'dark' ? 'dark' : 'light'))
  const setThemeMode = (mode) => setPreferences({ themeMode: mode })

  // Merged over the defaults so a preference saved before a new print
  // option existed still turns that new option on, same reasoning as
  // journalOrder appending unknown types rather than dropping them.
  const printOptions = computed(() => ({ ...DEFAULT_PRINT_OPTIONS, ...(preferences.value.printOptions || {}) }))
  const setPrintOptions = (options) => setPreferences({ printOptions: options })

  return {
    preferences,
    loaded,
    loading,
    load,
    setPreferences,
    homeSectionOrder,
    setHomeSectionOrder,
    hiddenHomeSectionIds,
    setHomeSections,
    journalOrder,
    setJournalOrder,
    themeMode,
    setThemeMode,
    printOptions,
    setPrintOptions,
  }
})
