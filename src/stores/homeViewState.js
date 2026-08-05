import { defineStore } from 'pinia'
import { ref } from 'vue'

// In-memory only (a plain Pinia store, no persistence plugin) — remembers
// which journal-type lane the user had active on the home screen's My
// Seeds tab (see RecentEntries.vue), so navigating to view an entry and
// coming back (browser Back, or tapping Home again) restores the same
// lane instead of always resetting to Recent. Reset on a full page
// reload, which is fine — this is only about preserving position across
// in-app navigation.
export const useHomeViewStateStore = defineStore('homeViewState', () => {
  const activeType = ref(null)

  const setActiveType = (type) => {
    activeType.value = type
  }

  return { activeType, setActiveType }
})
