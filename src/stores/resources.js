// stores/resources.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const RESOURCE_TYPES = {
  BOOK: 'Book',
  PODCAST: 'Podcast',
  PASTOR: 'Pastor',
  SONG_ARTIST: 'SongArtist',
  CHURCH: 'Church',
  MINISTRY: 'Ministry',
}

const METADATA_TEMPLATES = {
  [RESOURCE_TYPES.BOOK]: {
    title: '',
    author: '',
  },
  [RESOURCE_TYPES.PODCAST]: {
    title: '',
    host: '',
  },
  [RESOURCE_TYPES.PASTOR]: {
    name: '',
    church: '',
  },
  [RESOURCE_TYPES.SONG_ARTIST]: {
    name: '',
  },
  [RESOURCE_TYPES.CHURCH]: {
    name: '',
  },
  [RESOURCE_TYPES.MINISTRY]: {
    name: '',
  },
}

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getResourcesByType = (type) => {
    return resources.value.filter((resource) => resource.type === type)
  }

  const getResourceById = (id) => {
    return resources.value.find((resource) => resource.id === id)
  }

  // Get empty metadata template based on resource type
  const getMetadataTemplate = (type) => {
    return { ...METADATA_TEMPLATES[type] }
  }

  // Get display name for a resource based on its type
  const getResourceDisplayName = (resource) => {
    switch (resource.type) {
      case RESOURCE_TYPES.BOOK:
        return resource.metadata.title
      case RESOURCE_TYPES.PODCAST:
        return resource.metadata.title
      case RESOURCE_TYPES.PASTOR:
      case RESOURCE_TYPES.SONG_ARTIST:
      case RESOURCE_TYPES.CHURCH:
      case RESOURCE_TYPES.MINISTRY:
        return resource.metadata.name
      default:
        return 'Unnamed Resource'
    }
  }

  // Actions
  const loadResources = async () => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error: supabaseError } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError
      resources.value = data
    } catch (err) {
      console.error('Error loading resources:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addResource = async (type, metadata) => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error: supabaseError } = await supabase
        .from('resources')
        .insert({
          user_id: session.user.id,
          type,
          metadata,
        })
        .select()
        .single()

      if (supabaseError) throw supabaseError

      resources.value.unshift(data)
      return data
    } catch (err) {
      console.error('Error adding resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteResource = async (id) => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { error: supabaseError } = await supabase.from('resources').delete().match({ id })

      if (supabaseError) throw supabaseError

      // Remove from local state
      resources.value = resources.value.filter((r) => r.id !== id)
    } catch (err) {
      console.error('Error deleting resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateResource = async (id, metadata) => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error: supabaseError } = await supabase
        .from('resources')
        .update({ metadata })
        .eq('id', id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      // Update in local state
      const index = resources.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        resources.value[index] = data
      }

      return data
    } catch (err) {
      console.error('Error updating resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    resources,
    loading,
    error,

    // Getters
    getResourcesByType,
    getResourceById,
    getMetadataTemplate,
    getResourceDisplayName,

    // Actions
    loadResources,
    addResource,
    deleteResource,
    updateResource,
  }
})
