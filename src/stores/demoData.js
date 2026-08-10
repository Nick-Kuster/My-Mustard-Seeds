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

const DEMO_PRAYER_ROWS = [
  { id: 'demo-prayer-1', sort_order: 1, content: 'Healing for my mother\'s knee surgery recovery', group_name: 'Family', status: 'active', answer_note: null, answered_at: null, follow_up_date: '2026-08-10', follow_up_time: '08:00', last_followed_up_at: null, created_at: '2026-08-01T12:00:00.000Z' },
  { id: 'demo-prayer-2', sort_order: 2, content: 'Wisdom as we consider a move closer to family', group_name: 'Family', status: 'active', answer_note: null, answered_at: null, created_at: '2026-08-02T12:00:00.000Z' },
  { id: 'demo-prayer-3', sort_order: 3, content: 'Open hearts for our upcoming outreach event', group_name: 'Church & Ministry', status: 'active', answer_note: null, answered_at: null, created_at: '2026-08-03T12:00:00.000Z' },
  { id: 'demo-prayer-4', sort_order: 4, content: 'Provision for the youth ministry\'s summer camp costs', group_name: 'Church & Ministry', status: 'answered', answer_note: 'An anonymous donor covered the full amount within a week!', answered_at: '2026-08-04T12:00:00.000Z', created_at: '2026-08-04T12:00:00.000Z' },
  { id: 'demo-prayer-5', sort_order: 5, content: 'Peace and focus during a stressful season at work', group_name: null, status: 'active', answer_note: null, answered_at: null, created_at: '2026-08-05T12:00:00.000Z' },
  { id: 'demo-prayer-6', sort_order: 6, content: 'Safe travels for my sister\'s cross-country move', group_name: null, status: 'answered', answer_note: 'She arrived safely and already found a great apartment.', answered_at: '2026-08-06T12:00:00.000Z', created_at: '2026-08-06T12:00:00.000Z' },
]

const mapPrayerRows = (rows) => ({
  requests: rows.map((row, index) => ({
    id: row.id,
    position: row.sort_order ?? index,
    group_id: row.group_name ? demoGroupId(row.group_name) : null,
    status: row.status,
    created_at: row.created_at,
    answered_at: row.answered_at,
    follow_up_date: row.follow_up_date || null,
    follow_up_time: row.follow_up_time || null,
    last_followed_up_at: row.last_followed_up_at || null,
    decryptedContent: row.content,
    decryptedAnswerNote: row.answer_note,
  })),
  groups: [...new Set(rows.map((row) => row.group_name).filter(Boolean))].map((name, index) => ({
    id: demoGroupId(name),
    name,
    position: index,
  })),
})

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
      if (prayersResult.error && prayersResult.error.code !== 'PGRST205') throw prayersResult.error
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
      const prayerRows = prayersResult.error?.code === 'PGRST205' ? DEMO_PRAYER_ROWS : prayersResult.data
      const { requests, groups } = mapPrayerRows(prayerRows)
      demoPrayerRequests.value = requests
      demoPrayerGroups.value = groups

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
