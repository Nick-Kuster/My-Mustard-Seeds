import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from 'src/boot/supabase'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { getResourceConfig } from 'src/configs/resourceConfigs'

// Cache keys
const CACHE_KEYS = {
  RESOURCES: 'cached_resources',
  TIMESTAMP: 'resources_cache_timestamp',
  TTL: 1000 * 60 * 60, // 1 hour in milliseconds
}

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Initialize from cache
  const initFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEYS.RESOURCES)
      const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP)

      if (cachedData && timestamp) {
        const now = Date.now()
        const cacheAge = now - parseInt(timestamp)

        if (cacheAge < CACHE_KEYS.TTL) {
          resources.value = JSON.parse(cachedData)
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Error reading from cache:', err)
      return false
    }
  }

  // Update cache
  const updateCache = () => {
    try {
      localStorage.setItem(CACHE_KEYS.RESOURCES, JSON.stringify(resources.value))
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString())
    } catch (err) {
      console.error('Error updating cache:', err)
    }
  }

  // Watch for changes and update cache
  watch(resources, updateCache, { deep: true })

  // Helper functions
  const canHaveChildOfType = (parentType) => {
    const config = getResourceConfig(parentType)
    const allowedTypes = config.allowedChildren || []
    return allowedTypes
  }

  // Getters
  const getMetadataTemplate = (type) => {
    const config = getResourceConfig(type)
    return Object.keys(config.fields).reduce((template, key) => {
      template[key] = ''
      return template
    }, {})
  }

  const getResourcesByType = (type) => {
    return resources.value.filter((resource) => resource.type === type)
  }

  const getResourceById = (id) => {
    return resources.value.find((resource) => resource.id === id)
  }

  const getChildResources = async (parentId) => {
    try {
      // First check local cache
      const cachedRelations = localStorage.getItem(`child_resources_${parentId}`)
      if (cachedRelations) {
        const { data, timestamp } = JSON.parse(cachedRelations)
        if (Date.now() - timestamp < CACHE_KEYS.TTL) {
          return data
        }
      }

      const { data, error } = await supabase
        .from('resource_resources')
        .select(
          `
          child_resource:child_resource_id (
            id,
            type,
            metadata,
            created_at
          )
        `,
        )
        .eq('parent_resource_id', parentId)
        .eq('user_id', (await supabase.auth.getSession()).data.session.user.id)

      if (error) throw error

      // Transform and cache the data
      const childResources = data.map((item) => item.child_resource)
      localStorage.setItem(
        `child_resources_${parentId}`,
        JSON.stringify({
          data: childResources,
          timestamp: Date.now(),
        }),
      )

      return childResources
    } catch (err) {
      console.error('Error fetching child resources:', err)
      throw err
    }
  }

  // Actions
  const loadResources = async (forceRefresh = false) => {
    loading.value = true
    error.value = null

    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh && initFromCache()) {
        loading.value = false
        return
      }

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
      updateCache()
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
      updateCache()
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

      // Remove from local state and cache
      resources.value = resources.value.filter((r) => r.id !== id)
      localStorage.removeItem(`child_resources_${id}`)
      updateCache()
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

      // Update in local state and cache
      const index = resources.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        resources.value[index] = data
        updateCache()
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

  const addChildResource = async (parentId, childType, childMetadata) => {
    loading.value = true
    error.value = null
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) throw new Error('No active session')

      const parentResource = await getResourceById(parentId)
      if (!parentResource) throw new Error('Parent resource not found')

      if (!canHaveChildOfType(parentResource.type, childType)) {
        throw new Error(`${parentResource.type} cannot have child of type ${childType}`)
      }

      // Create child resource
      const { data: childResource, error: childError } = await supabase
        .from('resources')
        .insert({
          user_id: session.user.id,
          type: childType,
          metadata: childMetadata,
        })
        .select()
        .single()

      if (childError) throw childError

      // Create relationship
      const { error: relationError } = await supabase.from('resource_resources').insert({
        parent_resource_id: parentId,
        child_resource_id: childResource.id,
        user_id: session.user.id,
        relationship_type: childType.toLowerCase(),
      })

      if (relationError) throw relationError

      resources.value.push(childResource)

      // Clear the parent's child resources cache
      localStorage.removeItem(`child_resources_${parentId}`)
      updateCache()

      return childResource
    } catch (err) {
      console.error('Error adding child resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEYS.RESOURCES)
      localStorage.removeItem(CACHE_KEYS.TIMESTAMP)
      // Clear all child resources caches
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('child_resources_')) {
          localStorage.removeItem(key)
        }
      }
    } catch (err) {
      console.error('Error clearing cache:', err)
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
    getChildResources,
    canHaveChildOfType,

    // Actions
    loadResources,
    addResource,
    deleteResource,
    updateResource,
    addChildResource,
    clearCache,
  }
})

export { RESOURCE_TYPES }
