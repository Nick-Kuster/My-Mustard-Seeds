import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

// Named, reusable search-filter presets. facets mirrors the shape of
// journalData.js's selectedFacets — applying a saved filter is just
// feeding that object back into the store facet-by-facet.
export const useSavedFiltersStore = defineStore('savedFilters', () => {
  const filters = ref([])
  const loading = ref(false)

  const fetchFilters = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      filters.value = data
    } catch (error) {
      console.error('Error fetching saved filters:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const saveFilter = async (name, facets) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const { data, error } = await supabase
      .from('saved_filters')
      .insert({ user_id: session.user.id, name, facets })
      .select()
      .single()

    if (error) throw error

    filters.value.push(data)
    filters.value.sort((a, b) => a.name.localeCompare(b.name))
    return data
  }

  // patch may update name, facets, or both — used both for renaming a
  // saved filter and for re-saving its facets from the current selection.
  const updateFilter = async (id, patch) => {
    const { error } = await supabase
      .from('saved_filters')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    const filter = filters.value.find((f) => f.id === id)
    if (filter) Object.assign(filter, patch)
    filters.value.sort((a, b) => a.name.localeCompare(b.name))
  }

  const deleteFilter = async (id) => {
    const { error } = await supabase.from('saved_filters').delete().eq('id', id)
    if (error) throw error
    filters.value = filters.value.filter((f) => f.id !== id)
  }

  return { filters, loading, fetchFilters, saveFilter, updateFilter, deleteFilter }
})
