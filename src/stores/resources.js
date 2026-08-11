import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from 'src/boot/supabase'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { getResourceConfig } from 'src/configs/resourceConfigs'
import { demoModeActive } from 'src/utils/demoMode'

// Cache keys
const CACHE_KEYS = {
  PREFIX: 'resources_cache',
  TTL: 1000 * 60 * 60, // 1 hour in milliseconds
}

const resourceCacheKey = (userId) => `${CACHE_KEYS.PREFIX}:${userId}:resources`
const timestampCacheKey = (userId) => `${CACHE_KEYS.PREFIX}:${userId}:timestamp`
const childResourcesCacheKey = (userId, parentId) => `${CACHE_KEYS.PREFIX}:${userId}:child_resources:${parentId}`

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Initialize from cache
  const initFromCache = (userId) => {
    try {
      const cachedData = localStorage.getItem(resourceCacheKey(userId))
      const timestamp = localStorage.getItem(timestampCacheKey(userId))

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
  const updateCache = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return
      localStorage.setItem(resourceCacheKey(session.user.id), JSON.stringify(resources.value))
      localStorage.setItem(timestampCacheKey(session.user.id), Date.now().toString())
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
      const session = (await supabase.auth.getSession()).data.session
      if (!session) throw new Error('No active session')

      // First check local cache
      const cachedRelations = localStorage.getItem(childResourcesCacheKey(session.user.id, parentId))
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
        .eq('user_id', session.user.id)

      if (error) throw error

      // Transform and cache the data
      const childResources = data.map((item) => item.child_resource)
      localStorage.setItem(
        childResourcesCacheKey(session.user.id, parentId),
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
    // src/stores/tutorial.js swaps `resources` for demo content directly
    // during a "Show with sample data" run — a real fetch here would
    // silently overwrite that swap with the real account's data.
    if (demoModeActive.value) return
    loading.value = true
    error.value = null

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // Check cache only after the current user is known, so one account
      // can never read another account's local resource cache on a shared browser.
      if (!forceRefresh && initFromCache(session.user.id)) {
        loading.value = false
        return
      }

      const { data, error: supabaseError } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError
      resources.value = data
      await updateCache()
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
      await updateCache()
      return data
    } catch (err) {
      console.error('Error adding resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Recursively collect all descendant resource ids (children, grandchildren, ...)
  const getDescendantIds = async (rootId) => {
    const collected = []
    let frontier = [rootId]
    while (frontier.length > 0) {
      const { data, error: supabaseError } = await supabase
        .from('resource_resources')
        .select('child_resource_id')
        .in('parent_resource_id', frontier)

      if (supabaseError) throw supabaseError

      const childIds = (data || []).map((row) => row.child_resource_id)
      collected.push(...childIds)
      frontier = childIds
    }
    return collected
  }

  // Journal entries (id + title) that reference this resource, so a delete
  // confirmation can tell the user what will lose this link
  const getJournalUsage = async (resourceId) => {
    const { data, error: supabaseError } = await supabase
      .from('journal_resources')
      .select('journal_id, journal_entries(title)')
      .eq('resource_id', resourceId)

    if (supabaseError) throw supabaseError
    return (data || []).map((row) => ({ id: row.journal_id, title: row.journal_entries?.title }))
  }

  /**
   * Deletes a resource. With cascade=false (default), direct children are
   * detached instead of deleted — they become independent, top-level
   * resources (their own children, if any, stay attached to them). With
   * cascade=true, the entire subtree is deleted along with it. Either way,
   * any journal entry links to the deleted resource(s) are removed first —
   * the entries themselves are untouched, they just lose that reference.
   */
  const deleteResource = async (id, { cascade = false } = {}) => {
    loading.value = true
    error.value = null
    try {
      const idsToDelete = cascade ? [id, ...(await getDescendantIds(id))] : [id]

      const { error: journalLinkError } = await supabase
        .from('journal_resources')
        .delete()
        .in('resource_id', idsToDelete)
      if (journalLinkError) throw journalLinkError

      const { error: parentLinkError } = await supabase
        .from('resource_resources')
        .delete()
        .in('parent_resource_id', idsToDelete)
      if (parentLinkError) throw parentLinkError

      const { error: childLinkError } = await supabase
        .from('resource_resources')
        .delete()
        .in('child_resource_id', idsToDelete)
      if (childLinkError) throw childLinkError

      const { error: supabaseError } = await supabase
        .from('resources')
        .delete()
        .in('id', idsToDelete)
      if (supabaseError) throw supabaseError

      // Remove from local state and cache
      resources.value = resources.value.filter((r) => !idsToDelete.includes(r.id))
      const session = (await supabase.auth.getSession()).data.session
      idsToDelete.forEach((deletedId) => {
        if (session) localStorage.removeItem(childResourcesCacheKey(session.user.id, deletedId))
      })
      await updateCache()

      return idsToDelete
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
        await updateCache()
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

  const setResourceFavorite = async (id, isFavorite) => {
    loading.value = true
    error.value = null
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const { data, error: supabaseError } = await supabase
        .from('resources')
        .update({ is_favorite: isFavorite })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      const index = resources.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        resources.value[index] = data
        await updateCache()
      }

      return data
    } catch (err) {
      console.error('Error updating resource favorite:', err)
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
      localStorage.removeItem(childResourcesCacheKey(session.user.id, parentId))
      await updateCache()

      return childResource
    } catch (err) {
      console.error('Error adding child resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // All parent/child resource relationships for the current user, for
  // building a full tree client-side in one query rather than per-node
  const getAllRelationships = async () => {
    // Demo resources are seeded flat, with no relationships (see
    // sql/Demo Resources Table.sql) — a real query here would return the
    // real account's relationships instead, layering real structure onto
    // fake top-level rows.
    if (demoModeActive.value) return []

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const { data, error: supabaseError } = await supabase
      .from('resource_resources')
      .select('parent_resource_id, child_resource_id')
      .eq('user_id', session.user.id)

    if (supabaseError) throw supabaseError
    return data || []
  }

  // Look up a resource's parent (e.g. the Church a Pastor belongs to)
  const getParentResource = async (childId) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('resource_resources')
        .select('parent_resource:parent_resource_id (id, type, metadata)')
        .eq('child_resource_id', childId)
        .limit(1)

      if (supabaseError) throw supabaseError
      return data?.[0]?.parent_resource || null
    } catch (err) {
      console.error('Error fetching parent resource:', err)
      return null
    }
  }

  const clearCache = () => {
    try {
      // Clear all resource caches. Cache keys are user-scoped, but clearing
      // every resource cache is still useful on sign-out/account switches.
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(`${CACHE_KEYS.PREFIX}:`)) {
          localStorage.removeItem(key)
        }
      }
    } catch (err) {
      console.error('Error clearing cache:', err)
    }
  }

  const reset = () => {
    resources.value = []
    loading.value = false
    error.value = null
    clearCache()
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
    getParentResource,
    getDescendantIds,
    getJournalUsage,
    getAllRelationships,
    canHaveChildOfType,

    // Actions
    loadResources,
    addResource,
    deleteResource,
    updateResource,
    setResourceFavorite,
    addChildResource,
    clearCache,
    reset,
  }
})

export { RESOURCE_TYPES }
