import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

// Sample content for the guided tour's "Show with sample data" option —
// see sql/Demo Data Tables.sql. This is shared/global reference content
// (not per-user), read-only from the app. src/stores/tutorial.js is the
// only caller — it swaps these in for the real journalStore/savedFilters
// data for the duration of a demo run, then restores the real data.
export const useDemoDataStore = defineStore('demoData', () => {
  const demoEntries = ref([])
  const demoSavedFilters = ref([])
  const loaded = ref(false)
  const loading = ref(false)

  const fetchDemoData = async () => {
    if (loaded.value) return
    loading.value = true
    try {
      const [entriesResult, filtersResult] = await Promise.all([
        supabase.from('demo_entries').select('*').order('sort_order'),
        supabase.from('demo_saved_filters').select('*').order('sort_order'),
      ])

      if (entriesResult.error) throw entriesResult.error
      if (filtersResult.error) throw filtersResult.error

      // Reshape into exactly what decryptedEntries/savedFiltersStore.filters
      // items already look like elsewhere in the app.
      demoEntries.value = entriesResult.data.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        created_at: row.created_at,
        ...row.data,
      }))

      demoSavedFilters.value = filtersResult.data.map((row) => ({
        id: row.id,
        name: row.name,
        facets: row.facets,
      }))

      loaded.value = true
    } catch (error) {
      console.error('Error fetching demo data:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return { demoEntries, demoSavedFilters, loaded, loading, fetchDemoData }
})
