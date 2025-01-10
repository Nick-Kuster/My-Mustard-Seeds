<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <q-btn v-if="selectionPath.length > 0 && !showAddForm && !editingResource" flat round dense icon="arrow_back"
          @click="goBack" />
        <div class="text-h6 q-ml-sm">{{ currentTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div v-if="!showAddForm && !editingResource">
          <!-- Selection path breadcrumbs -->
          <div v-if="selectionPath.length > 0" class="q-mb-md text-grey">
            <template v-for="(item, index) in selectionPath" :key="index">
              {{ getDisplayTitle(item) }}
              <q-icon name="chevron_right" size="1em" class="q-mx-xs" v-if="index < selectionPath.length - 1" />
            </template>
          </div>

          <!-- Search field -->
          <q-input v-model="searchTerm" :label="`Search ${currentResourceConfig.title.toLowerCase()}`" dense
            class="q-mb-md" clearable>
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <!-- Resource list -->
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="currentResources.length === 0" class="text-center q-pa-md">
            No {{ currentResourceConfig.title.toLowerCase() }} found
            <div class="q-mt-sm">
              <q-btn flat color="primary" :label="`Add New ${currentResourceConfig.title}`"
                @click="showAddForm = true" />
            </div>
          </div>
          <q-list v-else separator>
            <q-item v-for="resource in currentResources" :key="resource.id" clickable @click="selectResource(resource)"
              class="resource-item">
              <q-item-section>
                <q-item-label>{{ getDisplayTitle(resource) }}</q-item-label>
                <q-item-label caption v-if="getDisplaySubtitle(resource)">
                  {{ getDisplaySubtitle(resource) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row no-wrap items-center">
                  <q-btn flat round dense color="primary" icon="edit" @click.stop="startEdit(resource)">
                    <q-tooltip>Edit {{ currentResourceConfig.title.toLowerCase() }}</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense color="negative" icon="delete" @click.stop="confirmDelete(resource)">
                    <q-tooltip>Delete {{ currentResourceConfig.title.toLowerCase() }}</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Add new button -->
          <div class="text-center q-mt-md" v-if="currentResources.length > 0">
            <q-btn flat color="primary" :label="`Add New ${currentResourceConfig.title}`" @click="showAddForm = true" />
          </div>
        </div>

        <!-- Add/Edit form -->
        <div v-else>
          <q-form @submit="editingResource ? updateResource() : addResource()" class="q-gutter-md">
            <div class="text-subtitle1 q-mb-sm">
              {{ formTitle }}
            </div>

            <template v-for="(field, key) in currentResourceConfig.fields" :key="key">
              <!-- Date Field -->
              <template v-if="field.type === 'date'">
                <q-input v-model="formData[key]" :label="field.label"
                  :rules="field.required ? [val => !!val || `${field.label} is required`] : []" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData[key]" mask="YYYY-MM-DD" today-btn minimal>
                          <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                            <q-btn flat label="Cancel" color="primary" v-close-popup />
                            <q-btn flat label="OK" color="primary" v-close-popup />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </template>

              <!-- Regular Text Field -->
              <template v-else>
                <q-input v-model="formData[key]" :label="`${field.label} ${field.required ? '*' : ''}`"
                  :rules="field.required ? [val => !!val || `${field.label} is required`] : []" />
              </template>
            </template>

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
        <div class="text-h6">Delete {{ currentResourceConfig.title }}</div>
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
  }
})

const emit = defineEmits(['update:modelValue', 'select'])
const $q = useQuasar()
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

// Selection path tracking
const selectionPath = ref([])
const currentResources = ref([])

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const currentResourceConfig = computed(() => {
  if (selectionPath.value.length === 0) {
    return getResourceConfig(props.resourceType)
  }
  const parentResource = selectionPath.value[selectionPath.value.length - 1]
  const childTypes = resourcesStore.canHaveChildOfType(parentResource.type)
  return getResourceConfig(childTypes[0])
})

const currentTitle = computed(() => {
  if (editingResource.value) return `Edit ${currentResourceConfig.value.title}`
  if (showAddForm.value) return `Add New ${currentResourceConfig.value.title}`
  return `Select ${currentResourceConfig.value.title}`
})

const formTitle = computed(() => {
  if (editingResource.value) return `Edit ${currentResourceConfig.value.title}`
  return `Add New ${currentResourceConfig.value.title}`
})

// const filteredResources = computed(() => {
//   if (!searchTerm.value) return currentResources.value

//   const search = searchTerm.value.toLowerCase()
//   return currentResources.value.filter(resource => {
//     const title = getDisplayTitle(resource).toLowerCase()
//     const subtitle = getDisplaySubtitle(resource)?.toLowerCase()
//     return title.includes(search) || (subtitle && subtitle.includes(search))
//   })
// })

// Methods
const loadResources = async () => {
  loading.value = true
  try {
    if (selectionPath.value.length === 0) {
      // Load root level resources
      await resourcesStore.loadResources()
      currentResources.value = resourcesStore.getResourcesByType(props.resourceType)
    } else {
      // Load child resources
      const parentResource = selectionPath.value[selectionPath.value.length - 1]
      const children = await resourcesStore.getChildResources(parentResource.id)
      currentResources.value = children
    }
  } catch (error) {
    console.error('Error loading resources:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading resources'
    })
  } finally {
    loading.value = false
  }
}

const selectResource = async (resource) => {
  const allowedChildTypes = resourcesStore.canHaveChildOfType(resource.type)

  if (allowedChildTypes && allowedChildTypes.length > 0) {
    // Resource has children, move to next level
    selectionPath.value.push(resource)
    await loadResources()
  } else {
    // No children, complete selection
    const fullPath = [...selectionPath.value, resource]
    emit('select', fullPath)
    isOpen.value = false
  }
}


const goBack = () => {
  selectionPath.value.pop()
  searchTerm.value = '' // Clear search when going back
  loadResources()
}

const getDisplayTitle = (resource) => {
  const config = getResourceConfig(resource.type)
  return config.getDisplayTitle(resource)
}

const getDisplaySubtitle = (resource) => {
  const config = getResourceConfig(resource.type)
  return config.getDisplaySubtitle?.(resource)
}

const startEdit = (resource) => {
  editingResource.value = resource
  formData.value = { ...resource.metadata }
}

const cancelForm = () => {
  editingResource.value = null
  showAddForm.value = false
  formData.value = {}
}

const addResource = async () => {
  saving.value = true
  try {
    if (selectionPath.value.length === 0) {
      // Adding a root level resource
      await resourcesStore.addResource(props.resourceType, formData.value)
    } else {
      // Adding a child resource
      const parentResource = selectionPath.value[selectionPath.value.length - 1]
      const childType = resourcesStore.canHaveChildOfType(parentResource.type)[0]
      await resourcesStore.addChildResource(parentResource.id, childType, formData.value)
    }

    // Refresh the current list
    await loadResources()

    showAddForm.value = false
    formData.value = {}

    $q.notify({
      type: 'positive',
      message: `${currentResourceConfig.value.title} added successfully`
    })
  } catch (error) {
    console.error('Error adding resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error adding ${currentResourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    saving.value = false
  }
}

const updateResource = async () => {
  if (!editingResource.value) return

  saving.value = true
  try {
    await resourcesStore.updateResource(editingResource.value.id, formData.value)

    // Refresh the current list
    await loadResources()

    cancelForm()
    $q.notify({
      type: 'positive',
      message: `${currentResourceConfig.value.title} updated successfully`
    })
  } catch (error) {
    console.error('Error updating resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error updating ${currentResourceConfig.value.title.toLowerCase()}`
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

    // Refresh the current list
    await loadResources()

    showDeleteDialog.value = false
    resourceToDelete.value = null

    $q.notify({
      type: 'positive',
      message: `${currentResourceConfig.value.title} deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error deleting ${currentResourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    deleting.value = false
  }
}

// Add reset on modal close
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // Reset when modal opens
    selectionPath.value = []
    searchTerm.value = ''
    showAddForm.value = false
    editingResource.value = null
    formData.value = {}
    loadResources() // Reload root level resources
  } else {
    // Reset when modal closes
    selectionPath.value = []
    searchTerm.value = ''
    showAddForm.value = false
    editingResource.value = null
    formData.value = {}
    currentResources.value = []
  }
})


// Initial load
onMounted(async () => {
  await loadResources()
})
</script>

<style scoped>
.resource-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.child-resource {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
