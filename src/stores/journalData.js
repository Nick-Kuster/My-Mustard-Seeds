import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, decryptData } from 'src/utils/encryption'

export const useJournalStore = defineStore('journalData', () => {
  const entries = ref([])
  const loading = ref(false)
  const searchTerm = ref('')
  const decryptedEntries = ref([])

  const filteredEntries = computed(() => {
    if (!searchTerm.value) return decryptedEntries.value

    const search = searchTerm.value.toLowerCase()
    return decryptedEntries.value.filter((entry) => {
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
      if (entry.verses?.some((verse) => verse.book?.toLowerCase().includes(search))) return true

      // Search in tags
      if (entry.tags?.some((tag) => tag.name.toLowerCase().includes(search))) return true

      return false
    })
  })

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

      // Just use the data directly since it's already in JSON format
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
    fetchEntries,
    addEntry,
    removeEntry,
    setSearchTerm,
    getEntry,
  }
})
