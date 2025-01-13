// stores/resources.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { getResourceConfig } from 'src/configs/resourceConfigs'

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref([])
  const loading = ref(false)
  const error = ref(null)

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

      // Transform the data to get just the child resources
      return data.map((item) => item.child_resource)
    } catch (err) {
      console.error('Error fetching child resources:', err)
      throw err
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
      return childResource
    } catch (err) {
      console.error('Error adding child resource:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteResourceAndChildren = async (id) => {
    // The cascade delete in the database will handle the relationships
    return deleteResource(id)
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
    deleteResourceAndChildren,
  }
})

export { RESOURCE_TYPES }
