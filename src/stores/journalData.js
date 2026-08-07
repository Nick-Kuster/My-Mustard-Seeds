import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData, decryptData } from 'src/utils/encryption'
import { formatVerseReference, verseMatchesRange } from 'src/utils/verseUtils'
import { getResourceConfig } from 'src/configs/resourceConfigs'
import { getSectionSearchText } from 'src/utils/richTextContent'

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

// section.content is a plain string for legacy/list sections, or a
// TipTap rich-doc object for a migrated longText section (see the rich
// text migration) — getSectionSearchText handles both shapes; calling
// .toLowerCase() directly on an object here would throw.
const sectionsMatchSearch = (sections, search) => {
  return sections.some((section) => {
    if (
      section?.title?.toLowerCase().includes(search) ||
      getSectionSearchText(section?.content).toLowerCase().includes(search)
    ) {
      return true
    }
    return section?.children ? sectionsMatchSearch(section.children, search) : false
  })
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
    books: [], // selected Bible book names
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

        // Search in content sections (recursing into nested subsections)
        const sections = entry.decryptedContent?.sections || []
        if (sectionsMatchSearch(sections, search)) return true

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

    // Book facet matches any verse from that book, independent of chapter/verse
    if (selectedFacets.value.books.length > 0) {
      filtered = filtered.filter((entry) =>
        entry.verses?.some((verse) => selectedFacets.value.books.includes(verse.book)),
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
      books: [],
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
        strongs: item.strongs_data,
      }))

      await decryptEntries()
    } catch (error) {
      console.error('Error fetching entries:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Fetches a single entry fresh from the server (bypassing any cache) and
  // decrypts it — shared by getEntry (cache-first) and refreshEntry
  // (always fresh, see below).
  const fetchEntryFromServer = async (id) => {
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
      strongs: data[0].strongs_data,
    }

    const encryptionKey = await getEncryptionKey(session.user.id)
    const decryptedContent = await decryptData(entry.content, encryptionKey)

    return {
      ...entry,
      decryptedContent,
    }
  }

  // Update the getEntry function to include links
  const getEntry = async (id) => {
    const existingEntry = decryptedEntries.value.find((entry) => entry.id === id)
    if (existingEntry) return existingEntry

    loading.value = true
    try {
      return await fetchEntryFromServer(id)
    } catch (error) {
      console.error('Error fetching entry:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Always fetches fresh from the server (skipping the cache getEntry
  // checks) and writes the result into both entry caches — for use right
  // after a save, when the cache is known to be stale and a cache hit
  // would silently hand back pre-save data to whoever asks next (e.g. the
  // view page navigated to immediately after saving an edit).
  const refreshEntry = async (id) => {
    loading.value = true
    try {
      const fresh = await fetchEntryFromServer(id)
      if (!fresh) return null

      const index = entries.value.findIndex((e) => e.id === id)
      if (index !== -1) entries.value[index] = fresh

      const decryptedIndex = decryptedEntries.value.findIndex((e) => e.id === id)
      if (decryptedIndex !== -1) decryptedEntries.value[decryptedIndex] = fresh
      else decryptedEntries.value.push(fresh)

      return fresh
    } catch (error) {
      console.error('Error refreshing entry:', error)
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

  const updateEntryCollection = (journalId, updater) => {
    const rawIndex = entries.value.findIndex((e) => e.id === journalId)
    if (rawIndex !== -1) updater(entries.value[rawIndex], false)

    const decryptedIndex = decryptedEntries.value.findIndex((e) => e.id === journalId)
    if (decryptedIndex !== -1) updater(decryptedEntries.value[decryptedIndex], true)
  }

  const updateEveryCachedEntry = (updater) => {
    entries.value.forEach((entry) => updater(entry, false))
    decryptedEntries.value.forEach((entry) => updater(entry, true))
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
      updateEntryCollection(journalId, (entry, isDecrypted) => {
        entry.quotes = entry.quotes || []
        entry.quotes.push(isDecrypted ? { ...data, decryptedQuote: quoteData.quote } : data)
      })

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

      updateEveryCachedEntry((entry, isDecrypted) => {
        if (!Array.isArray(entry.quotes)) return
        const index = entry.quotes.findIndex((quote) => quote.id === quoteId)
        if (index !== -1) {
          entry.quotes[index] = isDecrypted ? { ...data, decryptedQuote: quoteData.quote } : data
        }
      })

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

      updateEveryCachedEntry((entry) => {
        if (Array.isArray(entry.quotes)) {
          entry.quotes = entry.quotes.filter((quote) => quote.id !== quoteId)
        }
      })
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
      updateEntryCollection(journalId, (entry) => {
        entry.links = entry.links || []
        entry.links.push(data)
      })

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

      updateEveryCachedEntry((entry) => {
        if (!Array.isArray(entry.links)) return
        const index = entry.links.findIndex((link) => link.id === linkId)
        if (index !== -1) entry.links[index] = data
      })

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

      updateEveryCachedEntry((entry) => {
        if (Array.isArray(entry.links)) {
          entry.links = entry.links.filter((link) => link.id !== linkId)
        }
      })
    } catch (error) {
      console.error('Error deleting link:', error)
      throw error
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
    refreshEntry,
    addQuote,
    updateQuote,
    deleteQuote,
    addLink,
    updateLink,
    deleteLink,
  }
})
