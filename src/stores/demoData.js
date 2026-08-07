import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

// Sample content for the guided tour's "Show with sample data" option —
// see sql/Demo Data Tables.sql, sql/Demo Prayer Requests Table.sql,
// sql/Demo Resources Table.sql. This is shared/global reference content
// (not per-user), read-only from the app. src/stores/tutorial.js is the
// only caller — it swaps these in for the real stores' data for the
// duration of a demo run, then restores the real data.

// No saved testimony table — it's one blob of text per user (see
// src/stores/testimony.js), so a real table would only ever hold one
// meaningful row. A plain constant is simpler and just as editable.
export const DEMO_TESTIMONY =
  'For a long time, prayer felt like a one-way conversation — I\'d talk, and mostly just hope ' +
  'something was listening. What changed wasn\'t a single dramatic moment, but a season of ' +
  'genuinely hard circumstances that stripped away every backup plan I had. I started keeping a ' +
  'record of the small, specific things I prayed for and what actually happened next, and over a ' +
  'few months the pattern became impossible to explain away as coincidence. I still have hard ' +
  'days. But I\'m not the same person who started this journal — I trust that I\'m being heard, ' +
  'and that\'s changed how I pray, not just that I pray.'

// group_name -> a stable synthetic id, so demo prayer rows and their
// derived group both agree on the same id without a second table to keep
// in sync (see sql/Demo Prayer Requests Table.sql's header comment).
const demoGroupId = (name) => `demo-group-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export const useDemoDataStore = defineStore('demoData', () => {
  const demoEntries = ref([])
  const demoSavedFilters = ref([])
  const demoPrayerRequests = ref([])
  const demoPrayerGroups = ref([])
  const demoResources = ref([])
  const loaded = ref(false)
  const loading = ref(false)

  const fetchDemoData = async () => {
    if (loaded.value) return
    loading.value = true
    try {
      const [entriesResult, filtersResult, prayersResult, resourcesResult] = await Promise.all([
        supabase.from('demo_entries').select('*').order('sort_order'),
        supabase.from('demo_saved_filters').select('*').order('sort_order'),
        supabase.from('demo_prayer_requests').select('*').order('sort_order'),
        supabase.from('demo_resources').select('*').order('sort_order'),
      ])

      if (entriesResult.error) throw entriesResult.error
      if (filtersResult.error) throw filtersResult.error
      if (prayersResult.error) throw prayersResult.error
      if (resourcesResult.error) throw resourcesResult.error

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

      // Matches usePrayerRequestsStore().requests' shape — decrypted fields
      // populated directly since there's nothing encrypted about fake demo
      // content (see useTestimonyStore.load()'s equivalent skip for why).
      demoPrayerRequests.value = prayersResult.data.map((row, index) => ({
        id: row.id,
        position: row.sort_order ?? index,
        group_id: row.group_name ? demoGroupId(row.group_name) : null,
        status: row.status,
        created_at: row.created_at,
        answered_at: row.answered_at,
        decryptedContent: row.content,
        decryptedAnswerNote: row.answer_note,
      }))

      const groupNames = [...new Set(prayersResult.data.map((row) => row.group_name).filter(Boolean))]
      demoPrayerGroups.value = groupNames.map((name, index) => ({
        id: demoGroupId(name),
        name,
        position: index,
      }))

      demoResources.value = resourcesResult.data.map((row) => ({
        id: row.id,
        type: row.type,
        metadata: row.metadata,
        created_at: row.created_at,
      }))

      loaded.value = true
    } catch (error) {
      console.error('Error fetching demo data:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    demoEntries,
    demoSavedFilters,
    demoPrayerRequests,
    demoPrayerGroups,
    demoResources,
    loaded,
    loading,
    fetchDemoData,
  }
})
