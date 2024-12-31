import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

export const RESOURCE_TYPES = {
  BOOK: 'Book',
  PODCAST: 'Podcast',
  PASTOR: 'Pastor',
  SONG_ARTIST: 'SongArtist',
  CHURCH: 'Church',
  MINISTRY: 'Ministry',
}

// Metadata templates for each resource type
export const METADATA_TEMPLATES = {
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
    genre: '',
    denomination: '',
  },
  [RESOURCE_TYPES.CHURCH]: {
    name: '',
    denomination: '',
    location: '',
    website: '',
    pastor: '',
  },
  [RESOURCE_TYPES.MINISTRY]: {
    name: '',
    type: '',
    website: '',
    focus: '',
  },
}

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed properties for filtering resources by type
  const bookResources = computed(() =>
    resources.value.filter((r) => r.type === RESOURCE_TYPES.BOOK),
  )
  const podcastResources = computed(() =>
    resources.value.filter((r) => r.type === RESOURCE_TYPES.PODCAST),
  )
  const pastorResources = computed(() =>
    resources.value.filter((r) => r.type === RESOURCE_TYPES.PASTOR),
  )
  const songArtistResources = computed(() =>
    resources.value.filter((r) => r.type === RESOURCE_TYPES.SONG_ARTIST),
  )
  const churchResources = computed(() =>
    resources.value.filter((r) => r.type === RESOURCE_TYPES.CHURCH),
  )
  const ministryResources = computed(() =>
    resources.value.filter((r) => r.type === RESOURCE_TYPES.MINISTRY),
  )

  // Load all resources for the current user
  const loadResources = async () => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error: err } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      resources.value = data
    } catch (err) {
      console.error('Error loading resources:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Add a new resource
  const addResource = async (type, metadata) => {
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error: err } = await supabase
        .from('resources')
        .insert({
          type,
          metadata,
          user_id: session.user.id,
        })
        .select()
        .single()

      if (err) throw err
      resources.value.unshift(data)
      return data
    } catch (err) {
      console.error('Error adding resource:', err)
      error.value = err.message
      throw err
    }
  }

  // Update an existing resource
  const updateResource = async (id, metadata) => {
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('resources')
        .update({ metadata })
        .eq('id', id)
        .select()
        .single()

      if (err) throw err

      const index = resources.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        resources.value[index] = data
      }

      return data
    } catch (err) {
      console.error('Error updating resource:', err)
      error.value = err.message
      throw err
    }
  }

  // Delete a resource
  const deleteResource = async (id) => {
    error.value = null
    try {
      const { error: err } = await supabase.from('resources').delete().eq('id', id)

      if (err) throw err

      resources.value = resources.value.filter((r) => r.id !== id)
    } catch (err) {
      console.error('Error deleting resource:', err)
      error.value = err.message
      throw err
    }
  }

  // Get a new metadata template for a resource type
  const getMetadataTemplate = (type) => {
    return { ...METADATA_TEMPLATES[type] }
  }

  return {
    resources,
    loading,
    error,
    bookResources,
    podcastResources,
    pastorResources,
    songArtistResources,
    churchResources,
    ministryResources,
    loadResources,
    addResource,
    updateResource,
    deleteResource,
    getMetadataTemplate,
  }
})
