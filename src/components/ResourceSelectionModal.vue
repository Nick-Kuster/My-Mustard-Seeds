<template>
  <q-dialog v-model="isOpen">
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
          <q-input v-model="searchTerm" :label="`Search ${currentLevelTitle.toLowerCase()}`" dense
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
            No {{ currentLevelTitle.toLowerCase() }} found
            <div class="q-mt-sm q-gutter-sm">
              <q-btn v-for="type in currentChildTypes" :key="type" flat color="primary"
                :label="`Add New ${displayLabel(type)}`" @click="startAdd(type)" />
            </div>
          </div>
          <q-list v-else separator>
            <template v-for="row in groupedRows" :key="row.kind === 'header' ? `year-${row.label}` : row.resource.id">
              <q-item v-if="row.kind === 'header'" clickable dense @click="toggleYear(row.label)" class="year-header">
                <q-item-section avatar style="min-width: 0">
                  <q-icon :name="expandedYears.has(row.label) ? 'expand_more' : 'chevron_right'" size="20px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-grey-8">{{ row.label }} ({{ row.count }})</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-else clickable @click="selectResource(row.resource)" class="resource-item">
                <q-item-section>
                  <q-item-label>{{ getDisplayTitle(row.resource) }}</q-item-label>
                  <q-item-label caption v-if="currentChildTypes.length > 1">
                    <span :style="{ color: getResourceConfig(row.resource.type).color }" class="text-weight-medium">{{
                      displayLabel(row.resource.type) }}</span><template
                      v-if="getDisplaySubtitle(row.resource) && getDisplaySubtitle(row.resource) !== `(${row.year})`">
                      · {{ getDisplaySubtitle(row.resource) }}</template>
                  </q-item-label>
                  <q-item-label caption v-else-if="getDisplaySubtitle(row.resource)">
                    {{ getDisplaySubtitle(row.resource) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row no-wrap items-center">
                    <q-btn flat round dense color="primary" icon="edit" @click.stop="startEdit(row.resource)">
                      <q-tooltip>Edit {{ displayLabel(row.resource.type).toLowerCase() }}</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense color="negative" icon="delete" @click.stop="confirmDelete(row.resource)">
                      <q-tooltip>Delete {{ displayLabel(row.resource.type).toLowerCase() }}</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </q-list>

          <!-- Add new button(s) -->
          <div class="text-center q-mt-md q-gutter-sm" v-if="currentResources.length > 0">
            <q-btn v-for="type in currentChildTypes" :key="type" flat color="primary"
              :label="`Add New ${displayLabel(type)}`" @click="startAdd(type)" />
          </div>
        </div>

        <!-- Add/Edit form -->
        <div v-else>
          <q-form @submit="editingResource ? updateResource() : addResource()" class="q-gutter-md">
            <div class="text-subtitle1 q-mb-sm">
              {{ currentTitle }}
            </div>

            <template v-for="(field, key) in activeFormConfig.fields" :key="key">
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
        <div class="text-h6">Delete {{ resourceToDelete ? displayLabel(resourceToDelete.type) : '' }}</div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
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
const addingChildType = ref(null)

// Selection path tracking
const selectionPath = ref([])
const currentResources = ref([])

// Year sections (see groupedRows) collapse/expand independently; the
// current year starts open so the most relevant sermons/series are visible
// right away, everything older starts collapsed
const currentYear = String(new Date().getFullYear())
const expandedYears = reactive(new Set([currentYear]))
const toggleYear = (year) => {
  if (expandedYears.has(year)) expandedYears.delete(year)
  else expandedYears.add(year)
}

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// All types this level can hold — usually one (e.g. Book, Season) but a
// Pastor can hold either a full Sermon Series or a one-off Sermon directly
const currentChildTypes = computed(() => {
  if (selectionPath.value.length === 0) return [props.resourceType]
  const parentResource = selectionPath.value[selectionPath.value.length - 1]
  return resourcesStore.canHaveChildOfType(parentResource.type)
})

// A type's short label where one is set (e.g. Sermon Series -> "Series"),
// falling back to its full title — keeps mixed-type lists (a Pastor's
// Series and one-off Sermons together) readable at a glance
const displayLabel = (type) => {
  const config = getResourceConfig(type)
  return config.shortTitle || config.title
}

// Label for this level when nothing is being added/edited — joins multiple
// allowed types ("Series or Sermon") so list/search wording stays accurate
// even when a level accepts more than one type
const currentLevelTitle = computed(() =>
  currentChildTypes.value.map((type) => displayLabel(type)).join(' or '),
)

// Flattens the current list into resource rows, or — when this level holds
// more than one type (e.g. a Pastor's Series and one-off Sermons) — groups
// them into year sections (most recent first, undated items last) with a
// header row between groups
const groupedRows = computed(() => {
  if (currentChildTypes.value.length <= 1) {
    return currentResources.value.map((resource) => ({ kind: 'resource', resource, year: null }))
  }

  const groups = new Map()
  currentResources.value.forEach((resource) => {
    const year = getResourceConfig(resource.type).getYear?.(resource) || 'No Year'
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(resource)
  })

  const sortedYears = [...groups.keys()].sort((a, b) => {
    if (a === 'No Year') return 1
    if (b === 'No Year') return -1
    return b.localeCompare(a)
  })

  const rows = []
  sortedYears.forEach((year) => {
    rows.push({ kind: 'header', label: year, count: groups.get(year).length })
    if (expandedYears.has(year)) {
      groups.get(year).forEach((resource) => rows.push({ kind: 'resource', resource, year }))
    }
  })
  return rows
})

// The type actually being created/edited right now, driving which fields
// and labels the add/edit form uses
const activeFormType = computed(() => {
  if (editingResource.value) return editingResource.value.type
  return addingChildType.value || currentChildTypes.value[0]
})
const activeFormConfig = computed(() => getResourceConfig(activeFormType.value))
const activeFormLabel = computed(() => displayLabel(activeFormType.value))

const currentTitle = computed(() => {
  if (editingResource.value) return `Edit ${activeFormLabel.value}`
  if (showAddForm.value) return `Add New ${activeFormLabel.value}`
  return `Select ${currentLevelTitle.value}`
})

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
  addingChildType.value = null
  formData.value = {}
}

const startAdd = (type) => {
  addingChildType.value = type
  showAddForm.value = true
}

const addResource = async () => {
  saving.value = true
  try {
    if (selectionPath.value.length === 0) {
      // Adding a root level resource
      await resourcesStore.addResource(activeFormType.value, formData.value)
    } else {
      // Adding a child resource
      const parentResource = selectionPath.value[selectionPath.value.length - 1]
      await resourcesStore.addChildResource(parentResource.id, activeFormType.value, formData.value)
    }

    // Refresh the current list
    await loadResources()

    showAddForm.value = false
    addingChildType.value = null
    formData.value = {}

    $q.notify({
      type: 'positive',
      message: `${activeFormLabel.value} added successfully`
    })
  } catch (error) {
    console.error('Error adding resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error adding ${activeFormLabel.value.toLowerCase()}`
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
      message: `${activeFormLabel.value} updated successfully`
    })
  } catch (error) {
    console.error('Error updating resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error updating ${activeFormLabel.value.toLowerCase()}`
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

  const typeTitle = displayLabel(resourceToDelete.value.type)
  deleting.value = true
  try {
    await resourcesStore.deleteResource(resourceToDelete.value.id, { cascade: true })

    // Refresh the current list
    await loadResources()

    showDeleteDialog.value = false
    resourceToDelete.value = null

    $q.notify({
      type: 'positive',
      message: `${typeTitle} deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting resource:', error)
    $q.notify({
      type: 'negative',
      message: `Error deleting ${typeTitle.toLowerCase()}`
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
    addingChildType.value = null
    formData.value = {}
    expandedYears.clear()
    expandedYears.add(currentYear)
    loadResources() // Reload root level resources
  } else {
    // Reset when modal closes
    selectionPath.value = []
    searchTerm.value = ''
    showAddForm.value = false
    editingResource.value = null
    addingChildType.value = null
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

.year-header {
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.child-resource {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
