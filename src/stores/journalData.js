import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData, decryptData } from 'src/utils/encryption'
import { formatVerseReference, verseMatchesRange } from 'src/utils/verseUtils'
import { getResourceConfig } from 'src/configs/resourceConfigs'

// Entries carry resources as { id, type, metadata } — display titles live in metadata
export const getResourceTitle = (resource) => {
  try {
    return getResourceConfig(resource.type).getDisplayTitle(resource)
  } catch {
    return resource.title || 'Unknown'
  }
}

export const getVerseDisplay = (verse) => {
  try {
    return formatVerseReference(verse)
  } catch {
    return verse.display || null
  }
}

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
    quotes: [], // Will contain quote sources
    links: [], // Add this line
  })

  // Computed property to get all available facets from the current entries
  const availableFacets = computed(() => {
    const facets = {
      types: new Set(),
      verses: new Set(),
      books: new Set(),
      resourceTypes: new Set(),
      resources: new Set(),
      tags: new Set(),
      quotes: new Set(),
      links: new Set(),
    }

    decryptedEntries.value.forEach((entry) => {
      // Add entry type
      facets.types.add(entry.type)

      // Add verses and the books they come from
      entry.verses?.forEach((verse) => {
        const display = getVerseDisplay(verse)
        if (display) facets.verses.add(display)
        if (verse.book) facets.books.add(verse.book)
      })

      // Add resources and resource types
      entry.resources?.forEach((resource) => {
        facets.resourceTypes.add(resource.type)
        const title = getResourceTitle(resource)
        if (title) facets.resources.add(title)
      })

      // Add tags
      entry.tags?.forEach((tag) => {
        facets.tags.add(tag.name)
      })

      // Add links
      entry.links?.forEach((link) => {
        facets.links.add(link.name)
      })

      entry.quotes?.forEach((quote) => {
        if (quote.source) {
          facets.quotes.add(quote.source)
        }
      })
    })

    // Convert Sets to sorted arrays
    return {
      types: Array.from(facets.types).sort(),
      verses: Array.from(facets.verses).sort(),
      books: Array.from(facets.books).sort(),
      resourceTypes: Array.from(facets.resourceTypes).sort(),
      resources: Array.from(facets.resources).sort(),
      tags: Array.from(facets.tags).sort(),
      quotes: Array.from(facets.quotes).sort(),
      links: Array.from(facets.links).sort(),
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
        const content = entry.decryptedContent || {}
        for (const section of Object.values(content)) {
          if (
            section?.title?.toLowerCase().includes(search) ||
            section?.content?.toLowerCase().includes(search)
          ) {
            return true
          }
        }

        // Search in verses
        if (
          entry.verses?.some((verse) => getVerseDisplay(verse)?.toLowerCase().includes(search))
        )
          return true

        // Search in resources
        if (
          entry.resources?.some(
            (resource) =>
              getResourceTitle(resource)?.toLowerCase().includes(search) ||
              resource.type?.toLowerCase().includes(search),
          )
        )
          return true

        // Search in quotes
        if (
          entry.quotes?.some((quote) => {
            const decryptedQuote = quote.decryptedQuote
            return (
              decryptedQuote?.toLowerCase().includes(search) ||
              quote.source?.toLowerCase().includes(search) ||
              String(quote.page_number ?? '')
                .toLowerCase()
                .includes(search)
            )
          })
        )
          return true

        if (
          entry.links?.some(
            (link) =>
              link.name.toLowerCase().includes(search) || link.url.toLowerCase().includes(search),
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

    // Verse facets are range objects: { book, startChapter, startVerse,
    // endChapter, endVerse, label } — an entry matches if any of its verses
    // overlaps any selected range
    if (selectedFacets.value.verses.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.verses?.some((verse) =>
          selectedFacets.value.verses.some((range) => verseMatchesRange(verse, range)),
        ),
      )
    }

    if (selectedFacets.value.resourceTypes.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.resources?.some((resource) =>
          selectedFacets.value.resourceTypes.includes(resource.type),
        ),
      )
    }

    // Resource facets are { type, title, label } objects. Selections are
    // ANDed across types and ORed within a type, so Show "X" + Season "2"
    // means season 2 of that show. Plain-string values (legacy) match any type.
    if (selectedFacets.value.resources.length > 0) {
      const groups = {}
      selectedFacets.value.resources.forEach((sel) => {
        const type = typeof sel === 'string' ? '*' : sel.type
        const title = typeof sel === 'string' ? sel : sel.title
        if (!groups[type]) groups[type] = []
        groups[type].push(title)
      })
      filtered = filtered.filter((entry) =>
        Object.entries(groups).every(([type, titles]) =>
          entry.resources?.some(
            (resource) =>
              (type === '*' || resource.type === type) &&
              titles.includes(getResourceTitle(resource)),
          ),
        ),
      )
    }

    if (selectedFacets.value.tags.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.tags?.some((tag) => selectedFacets.value.tags.includes(tag.name)),
      )
    }
    if (selectedFacets.value.quotes.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.quotes?.some((quote) => selectedFacets.value.quotes.includes(quote.source)),
      )
    }
    if (selectedFacets.value.links.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.links?.some((link) => selectedFacets.value.links.includes(link.name)),
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
      quotes: [],
      links: [],
    }
  }

  // Update the fetchEntries function to include links
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
        quotes: item.quotes_data,
        links: item.links_data,
      }))

      await decryptEntries()
    } catch (error) {
      console.error('Error fetching entries:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update the getEntry function to include links
  const getEntry = async (id) => {
    const existingEntry = decryptedEntries.value.find((entry) => entry.id === id)
    if (existingEntry) return existingEntry

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
        quotes: data[0].quotes_data,
        links: data[0].links_data,
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
        entries.value.map(async (entry) => {
          // Decrypt quotes if they exist
          let decryptedQuotes = null
          if (entry.quotes && entry.quotes.length > 0) {
            decryptedQuotes = await Promise.all(
              entry.quotes.map(async (quote) => ({
                ...quote,
                decryptedQuote: await decryptData(quote.quote, encryptionKey),
              })),
            )
          }

          return {
            ...entry,
            decryptedContent: await decryptData(entry.content, encryptionKey),
            quotes: decryptedQuotes || entry.quotes,
          }
        }),
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

  // Add a quote to a journal entry
  const addQuote = async (journalId, quoteData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const encryptionKey = await getEncryptionKey(session.user.id)
      const encryptedQuote = await encryptData(quoteData.quote, encryptionKey)

      const { data, error } = await supabase
        .from('journal_quotes')
        .insert({
          journal_id: journalId,
          quote: encryptedQuote,
          source: quoteData.source,
          page_number: quoteData.page_number,
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      const entryIndex = entries.value.findIndex((e) => e.id === journalId)
      if (entryIndex !== -1) {
        const entry = entries.value[entryIndex]
        entry.quotes = entry.quotes || []
        entry.quotes.push(data)
        await decryptEntries() // Refresh decrypted entries
      }

      return data
    } catch (error) {
      console.error('Error adding quote:', error)
      throw error
    }
  }

  // Update a quote
  const updateQuote = async (quoteId, quoteData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const encryptionKey = await getEncryptionKey(session.user.id)
      const encryptedQuote = await encryptData(quoteData.quote, encryptionKey)

      const { data, error } = await supabase
        .from('journal_quotes')
        .update({
          quote: encryptedQuote,
          source: quoteData.source,
          page_number: quoteData.page_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      await fetchEntries() // Refresh all entries to ensure consistency

      return data
    } catch (error) {
      console.error('Error updating quote:', error)
      throw error
    }
  }

  // Delete a quote
  const deleteQuote = async (quoteId) => {
    try {
      const { error } = await supabase.from('journal_quotes').delete().eq('id', quoteId)

      if (error) throw error

      // Update local state
      await fetchEntries() // Refresh all entries to ensure consistency
    } catch (error) {
      console.error('Error deleting quote:', error)
      throw error
    }
  }

  // Add a link to a journal entry
  const addLink = async (journalId, linkData) => {
    try {
      const { data, error } = await supabase
        .from('related_links')
        .insert({
          journal_id: journalId,
          name: linkData.name,
          url: linkData.url,
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      const entryIndex = entries.value.findIndex((e) => e.id === journalId)
      if (entryIndex !== -1) {
        const entry = entries.value[entryIndex]
        entry.links = entry.links || []
        entry.links.push(data)
        await decryptEntries() // Refresh decrypted entries
      }

      return data
    } catch (error) {
      console.error('Error adding link:', error)
      throw error
    }
  }

  // Update a link
  const updateLink = async (linkId, linkData) => {
    try {
      const { data, error } = await supabase
        .from('related_links')
        .update({
          name: linkData.name,
          url: linkData.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      await fetchEntries() // Refresh all entries to ensure consistency

      return data
    } catch (error) {
      console.error('Error updating link:', error)
      throw error
    }
  }

  // Delete a link
  const deleteLink = async (linkId) => {
    try {
      const { error } = await supabase.from('related_links').delete().eq('id', linkId)

      if (error) throw error

      // Update local state
      await fetchEntries() // Refresh all entries to ensure consistency
    } catch (error) {
      console.error('Error deleting link:', error)
      throw error
    }
  }
  const updateEntry = async (updatedEntry) => {
    // Find and update the entry in the entries array
    const index = entries.value.findIndex((e) => e.id === updatedEntry.id)
    if (index !== -1) {
      entries.value[index] = { ...entries.value[index], ...updatedEntry }

      // Find and update in decryptedEntries as well
      const decryptedIndex = decryptedEntries.value.findIndex((e) => e.id === updatedEntry.id)
      if (decryptedIndex !== -1) {
        decryptedEntries.value[decryptedIndex] = {
          ...decryptedEntries.value[decryptedIndex],
          ...updatedEntry,
        }
      }

      // Refresh the decrypted content
      await decryptEntries()
    }
  }
  return {
    entries,
    decryptedEntries,
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
    updateEntry,
    addQuote,
    updateQuote,
    deleteQuote,
    addLink,
    updateLink,
    deleteLink,
  }
})
