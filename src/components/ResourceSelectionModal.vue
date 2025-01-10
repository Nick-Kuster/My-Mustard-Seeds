<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">Select {{ resourceConfig.title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div v-if="!showAddForm && !editingResource">
          <!-- Search field -->
          <q-input v-model="searchTerm" :label="`Search ${resourceConfig.title.toLowerCase()}`" dense class="q-mb-md"
            clearable>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Resource list with child resources -->
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="filteredResources.length === 0" class="text-center q-pa-md">
            No {{ resourceConfig.title.toLowerCase() }} found
          </div>
          <q-list v-else separator>
            <!-- Parent Resources -->
            <template v-for="resource in filteredResources" :key="resource.id">
              <q-expansion-item :label="getDisplayTitle(resource)" :caption="getDisplaySubtitle(resource)"
                v-if="canHaveChildren(resource)" :default-opened="expandedResources[resource.id]"
                @after-show="() => loadChildResources(resource.id)" class="resource-item">
                <template v-slot:header>
                  <q-item-section avatar v-if="!hideSelection">
                    <q-radio v-model="selectedResourceId" :val="resource.id" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ getDisplayTitle(resource) }}</q-item-label>
                    <q-item-label caption v-if="getDisplaySubtitle(resource)">
                      {{ getDisplaySubtitle(resource) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row no-wrap items-center">
                      <q-btn flat round dense color="primary" icon="add" v-if="canAddChild(resource)"
                        @click.stop="startAddChild(resource)">
                        <q-tooltip>Add child resource</q-tooltip>
                      </q-btn>
                      <q-btn flat round dense color="primary" icon="edit" @click.stop="startEdit(resource)">
                        <q-tooltip>Edit {{ resourceConfig.title.toLowerCase() }}</q-tooltip>
                      </q-btn>
                      <q-btn flat round dense color="negative" icon="delete" @click.stop="confirmDelete(resource)">
                        <q-tooltip>Delete {{ resourceConfig.title.toLowerCase() }}</q-tooltip>
                      </q-btn>
                    </div>
                  </q-item-section>
                </template>

                <!-- Child Resources -->
                <q-list separator class="q-pl-md">
                  <template v-if="childResources[resource.id]">
                    <q-item v-for="child in childResources[resource.id]" :key="child.id" clickable
                      @click="selectResource(child)" class="child-resource">
                      <q-item-section avatar v-if="!hideSelection">
                        <q-radio v-model="selectedResourceId" :val="child.id" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ getDisplayTitle(child) }}</q-item-label>
                        <q-item-label caption v-if="getDisplaySubtitle(child)">
                          {{ getDisplaySubtitle(child) }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row no-wrap items-center">
                          <q-btn flat round dense color="primary" icon="edit" @click.stop="startEdit(child)">
                            <q-tooltip>Edit {{ resourceConfig.title.toLowerCase() }}</q-tooltip>
                          </q-btn>
                          <q-btn flat round dense color="negative" icon="delete" @click.stop="confirmDelete(child)">
                            <q-tooltip>Delete {{ resourceConfig.title.toLowerCase() }}</q-tooltip>
                          </q-btn>
                        </div>
                      </q-item-section>
                    </q-item>
                  </template>
                  <div v-else-if="loadingChildren[resource.id]" class="text-center q-pa-sm">
                    <q-spinner color="primary" size="1em" />
                  </div>
                </q-list>
              </q-expansion-item>

              <!-- Regular resource item without children -->
              <q-item v-else clickable @click="selectResource(resource)">
                <q-item-section avatar v-if="!hideSelection">
                  <q-radio v-model="selectedResourceId" :val="resource.id" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ getDisplayTitle(resource) }}</q-item-label>
                  <q-item-label caption v-if="getDisplaySubtitle(resource)">
                    {{ getDisplaySubtitle(resource) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row no-wrap items-center">
                    <q-btn flat round dense color="primary" icon="edit" @click.stop="startEdit(resource)">
                      <q-tooltip>Edit {{ resourceConfig.title.toLowerCase() }}</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense color="negative" icon="delete" @click.stop="confirmDelete(resource)">
                      <q-tooltip>Delete {{ resourceConfig.title.toLowerCase() }}</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </q-list>

          <!-- Add new button -->
          <div class="text-center q-mt-md">
            <q-btn flat color="primary" :label="`Add New ${resourceConfig.title}`" @click="showAddForm = true" />
          </div>
        </div>

        <!-- Add/Edit form -->
        <div v-else>
          <q-form @submit="editingResource ? updateResource() : (addingChildTo ? addChildResource() : addResource())"
            class="q-gutter-md">
            <div class="text-subtitle1 q-mb-sm">
              {{ formTitle }}
            </div>

            <q-input v-for="(field, key) in resourceConfig.fields" :key="key" v-model="formData[key]"
              :label="`${field.label} ${field.required ? '*' : ''}`"
              :rules="field.required ? [val => !!val || `${field.label} is required`] : []" />

            <div class="row q-mt-lg">
              <q-btn flat label="Cancel" color="primary" @click="cancelForm" class="q-mr-sm" />
              <q-btn type="submit" :label="editingResource ? 'Save Changes' : 'Save'" color="primary"
                :loading="saving" />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Delete Confirmation Dialog -->
  <q-dialog v-model="showDeleteDialog" persistent>
    <q-card style="min-width: 300px">
      <q-card-section class="row items-center">
        <div class="text-h6">Delete {{ resourceConfig.title }}</div>
      </q-card-section>

      <q-card-section>
        Are you sure you want to delete "{{ resourceToDelete ? getDisplayTitle(resourceToDelete) : '' }}"?
        This action cannot be undone.
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Delete" color="negative" :loading="deleting" @click="deleteResource" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>



<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useResourcesStore } from 'stores/resources'
import { getResourceConfig } from 'src/configs/resourceConfigs'

const props = defineProps({
  modelValue: Boolean,
  resourceType: {
    type: String,
    required: true
  },
  hideSelection: {
    type: Boolean,
    default: false
  },
  parentResource: {
    type: Object,
    default: null
  }
})


const $q = useQuasar()
const resourceConfig = computed(() => getResourceConfig(props.resourceType))
const emit = defineEmits(['update:modelValue', 'select'])
const resourcesStore = useResourcesStore()

// State
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const searchTerm = ref('')
const showAddForm = ref(false)
const showDeleteDialog = ref(false)
const resourceToDelete = ref(null)
const editingResource = ref(null)
const formData = ref({})
const selectedResourceId = ref(null)
const childResources = ref({})
const loadingChildren = ref({})
const expandedResources = ref({})
const addingChildTo = ref(null)

// Computed
const formTitle = computed(() => {
  if (editingResource.value) return `Edit ${resourceConfig.value.title}`
  if (addingChildTo.value) {
    const childType = resourcesStore.canHaveChildOfType(addingChildTo.value.type)[0]
    return `Add New ${getResourceConfig(childType).title}`
  }
  return `Add New ${resourceConfig.value.title}`
})

const filteredResources = computed(() => {
  const resources = resourcesStore.getResourcesByType(props.resourceType)
  if (!searchTerm.value) return resources

  const search = searchTerm.value.toLowerCase()
  return resources.filter(resource => {
    const title = getDisplayTitle(resource).toLowerCase()
    const subtitle = getDisplaySubtitle(resource)?.toLowerCase()
    return title.includes(search) || (subtitle && subtitle.includes(search))
  })
})
// Methods
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const getDisplayTitle = (resource) => {
  return resourceConfig.value.getDisplayTitle(resource)
}

const getDisplaySubtitle = (resource) => {
  return resourceConfig.value.getDisplaySubtitle(resource)
}

const canHaveChildren = (resource) => {
  console.log('Resource type:', resource.type)
  const allowedTypes = resourcesStore.canHaveChildOfType(resource.type)
  console.log('Allowed types:', allowedTypes)
  return Array.isArray(allowedTypes) && allowedTypes.length > 0
}

const canAddChild = (resource) => {
  return resourcesStore.canHaveChildOfType(resource.type).length > 0
}

const loadChildResources = async (parentId) => {
  console.log('Loading children for parent:', parentId)
  if (childResources.value[parentId] || loadingChildren.value[parentId]) {
    console.log('Already loaded or loading:', {
      existing: childResources.value[parentId],
      loading: loadingChildren.value[parentId]
    })
    return
  }

  loadingChildren.value[parentId] = true
  try {
    console.log('Fetching child resources...')
    const children = await resourcesStore.getChildResources(parentId)
    console.log('Received children:', children)
    childResources.value[parentId] = children
  } catch (error) {
    console.error('Error loading child resources:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading child resources'
    })
  } finally {
    loadingChildren.value[parentId] = false
  }
}

const selectResource = (resource) => {
  emit('select', resource)
  emit('update:modelValue', false)
}

const startEdit = (resource) => {
  editingResource.value = resource
  formData.value = { ...resource.metadata }
}

const startAddChild = (parentResource) => {
  addingChildTo.value = parentResource
  const childType = resourcesStore.canHaveChildOfType(parentResource.type)[0]
  formData.value = resourcesStore.getMetadataTemplate(childType)
  showAddForm.value = true
}

const cancelForm = () => {
  editingResource.value = null
  addingChildTo.value = null
  showAddForm.value = false
  formData.value = resourcesStore.getMetadataTemplate(props.resourceType)
}

const addResource = async () => {
  saving.value = true
  try {
    const resource = await resourcesStore.addResource(props.resourceType, formData.value)
    selectResource(resource)
    showAddForm.value = false
    formData.value = resourcesStore.getMetadataTemplate(props.resourceType)
    $q.notify({
      type: 'positive',
      message: `${resourceConfig.value.title} added successfully`
    })
  } catch (error) {
    console.error('Error adding resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error adding ${resourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    saving.value = false
  }
}

const addChildResource = async () => {
  if (!addingChildTo.value) return

  saving.value = true
  try {
    const childType = resourcesStore.canHaveChildOfType(addingChildTo.value.type)[0]
    const child = await resourcesStore.addChildResource(
      addingChildTo.value.id,
      childType,
      formData.value
    )

    // Update local state
    if (!childResources.value[addingChildTo.value.id]) {
      childResources.value[addingChildTo.value.id] = []
    }
    childResources.value[addingChildTo.value.id].push(child)

    cancelForm()
    $q.notify({
      type: 'positive',
      message: 'Child resource added successfully'
    })
  } catch (error) {
    console.error('Error adding child resource:', error)
    $q.notify({
      type: 'negative',
      message: 'Error adding child resource'
    })
  } finally {
    saving.value = false
  }
}

const updateResource = async () => {
  if (!editingResource.value) return

  saving.value = true
  try {
    const updated = await resourcesStore.updateResource(editingResource.value.id, formData.value)

    // Update in local state
    const isChild = Object.values(childResources.value).some(children =>
      children.some(child => child.id === updated.id)
    )

    if (isChild) {
      // Update in child resources
      Object.keys(childResources.value).forEach(parentId => {
        const index = childResources.value[parentId].findIndex(r => r.id === updated.id)
        if (index !== -1) {
          childResources.value[parentId][index] = updated
        }
      })
    } else {
      // Update in main resources list
      const index = filteredResources.value.findIndex(r => r.id === updated.id)
      if (index !== -1) {
        resourcesStore.resources[index] = updated
      }
    }

    cancelForm()
    $q.notify({
      type: 'positive',
      message: `${resourceConfig.value.title} updated successfully`
    })
  } catch (error) {
    console.error('Error updating resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error updating ${resourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (resource) => {
  resourceToDelete.value = resource
  showDeleteDialog.value = true
}

const deleteResource = async () => {
  if (!resourceToDelete.value) return

  deleting.value = true
  try {
    await resourcesStore.deleteResourceAndChildren(resourceToDelete.value.id)

    // Update local state
    const parentId = Object.keys(childResources.value).find(pid =>
      childResources.value[pid].some(child => child.id === resourceToDelete.value.id)
    )

    if (parentId) {
      // Remove from child resources
      childResources.value[parentId] = childResources.value[parentId].filter(
        r => r.id !== resourceToDelete.value.id
      )
    }

    showDeleteDialog.value = false
    resourceToDelete.value = null

    $q.notify({
      type: 'positive',
      message: `${resourceConfig.value.title} deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error deleting ${resourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    deleting.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    searchTerm.value = ''
    showAddForm.value = false
    editingResource.value = null
    addingChildTo.value = null
    formData.value = {}
    selectedResourceId.value = null
  }
})

onMounted(async () => {
  loading.value = true
  try {
    await resourcesStore.loadResources()
    formData.value = resourcesStore.getMetadataTemplate(props.resourceType)
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error loading resources'
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.child-resource {
  background-color: rgba(0, 0, 0, 0.02);
}

.resource-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
