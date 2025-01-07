import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, decryptData } from 'src/utils/encryption'

export const useJournalStore = defineStore('journalData', () => {
  const entries = ref([])
  const loading = ref(false)
  const searchTerm = ref('')
  const decryptedEntries = ref([])

  // New facet state
  const selectedFacets = ref({
    types: [], // journal types like 'Bible', 'Sermon', etc.
    verses: [], // selected verse references
    resourceTypes: [], // types of resources
    resources: [], // specific resources
    tags: [], // selected tags
  })

  // Computed property to get all available facets from the current entries
  const availableFacets = computed(() => {
    const facets = {
      types: new Set(),
      verses: new Set(),
      resourceTypes: new Set(),
      resources: new Set(),
      tags: new Set(),
    }

    decryptedEntries.value.forEach((entry) => {
      // Add entry type
      facets.types.add(entry.type)

      // Add verses
      entry.verses?.forEach((verse) => {
        facets.verses.add(verse.display)
      })

      // Add resources and resource types
      entry.resources?.forEach((resource) => {
        facets.resourceTypes.add(resource.type)
        facets.resources.add(resource.title)
      })

      // Add tags
      entry.tags?.forEach((tag) => {
        facets.tags.add(tag.name)
      })
    })

    // Convert Sets to sorted arrays
    return {
      types: Array.from(facets.types).sort(),
      verses: Array.from(facets.verses).sort(),
      resourceTypes: Array.from(facets.resourceTypes).sort(),
      resources: Array.from(facets.resources).sort(),
      tags: Array.from(facets.tags).sort(),
    }
  })

  // Updated filteredEntries computed property with faceted search
  const filteredEntries = computed(() => {
    let filtered = [...decryptedEntries.value]

    // Apply text search if there's a search term
    if (searchTerm.value) {
      const search = searchTerm.value.toLowerCase()
      filtered = filtered.filter((entry) => {
        // Search in title
        if (entry.title?.toLowerCase().includes(search)) return true

        // Search in content sections
        const content = entry.decryptedContent
        for (const section of Object.values(content)) {
          if (
            section?.title?.toLowerCase().includes(search) ||
            section?.content?.toLowerCase().includes(search)
          ) {
            return true
          }
        }

        // Search in verses
        if (entry.verses?.some((verse) => verse.display?.toLowerCase().includes(search)))
          return true

        // Search in resources
        if (
          entry.resources?.some(
            (resource) =>
              resource.title?.toLowerCase().includes(search) ||
              resource.type?.toLowerCase().includes(search),
          )
        )
          return true

        // Search in tags
        if (entry.tags?.some((tag) => tag.name.toLowerCase().includes(search))) return true

        return false
      })
    }

    // Apply facet filters
    if (selectedFacets.value.types.length > 0) {
      filtered = filtered.filter((entry) => selectedFacets.value.types.includes(entry.type))
    }

    if (selectedFacets.value.verses.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.verses?.some((verse) => selectedFacets.value.verses.includes(verse.display)),
      )
    }

    if (selectedFacets.value.resourceTypes.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.resources?.some((resource) =>
          selectedFacets.value.resourceTypes.includes(resource.type),
        ),
      )
    }

    if (selectedFacets.value.resources.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.resources?.some((resource) =>
          selectedFacets.value.resources.includes(resource.title),
        ),
      )
    }

    if (selectedFacets.value.tags.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.tags?.some((tag) => selectedFacets.value.tags.includes(tag.name)),
      )
    }

    return filtered
  })

  // Function to update facets
  const updateFacet = (facetType, values) => {
    selectedFacets.value[facetType] = values
  }

  // Function to clear all facets
  const clearFacets = () => {
    selectedFacets.value = {
      types: [],
      verses: [],
      resourceTypes: [],
      resources: [],
      tags: [],
    }
  }

  // Existing functions...
  const fetchEntries = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase.rpc('get_all_journal_entry_details', {
        p_user_id: session.user.id,
      })

      if (error) throw error

      entries.value = data.map((item) => ({
        ...item.entry_data,
        verses: item.verses_data,
        tags: item.tags_data,
        resources: item.resources_data,
      }))

      await decryptEntries()
    } catch (error) {
      console.error('Error fetching entries:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getEntry = async (id) => {
    // First check if we already have the entry in our store
    const existingEntry = decryptedEntries.value.find((entry) => entry.id === id)
    if (existingEntry) return existingEntry

    // If not, fetch it from the database
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error } = await supabase.rpc('get_journal_entry_details', {
        p_entry_id: id,
        p_user_id: session.user.id,
      })

      if (error) throw error
      if (!data || data.length === 0) return null

      const entry = {
        ...data[0].entry_data,
        verses: data[0].verses_data,
        tags: data[0].tags_data,
        resources: data[0].resources_data,
      }

      const encryptionKey = await getEncryptionKey(session.user.id)
      const decryptedContent = await decryptData(entry.content, encryptionKey)

      return {
        ...entry,
        decryptedContent,
      }
    } catch (error) {
      console.error('Error fetching entry:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const decryptEntries = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const encryptionKey = await getEncryptionKey(session.user.id)

      decryptedEntries.value = await Promise.all(
        entries.value.map(async (entry) => ({
          ...entry,
          decryptedContent: await decryptData(entry.content, encryptionKey),
        })),
      )
    } catch (error) {
      console.error('Error decrypting entries:', error)
      throw error
    }
  }

  const addEntry = async (entry) => {
    entries.value.unshift(entry)
    await decryptEntries()
  }

  const removeEntry = async (entryId) => {
    entries.value = entries.value.filter((e) => e.id !== entryId)
    decryptedEntries.value = decryptedEntries.value.filter((e) => e.id !== entryId)
  }

  const setSearchTerm = (term) => {
    searchTerm.value = term
  }

  return {
    entries,
    loading,
    searchTerm,
    filteredEntries,
    selectedFacets,
    availableFacets,
    fetchEntries,
    addEntry,
    removeEntry,
    setSearchTerm,
    updateFacet,
    clearFacets,
    getEntry,
  }
})
