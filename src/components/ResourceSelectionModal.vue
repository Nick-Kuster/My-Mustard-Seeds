<template>
  <q-dialog v-model="modelValue" persistent @update:model-value="updateModelValue">
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

          <!-- Resource list -->
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="filteredResources.length === 0" class="text-center q-pa-md">
            No {{ resourceConfig.title.toLowerCase() }} found
          </div>
          <q-list v-else separator>
            <q-item v-for="resource in filteredResources" :key="resource.id" clickable
              @click="selectResource(resource)">
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
          </q-list>

          <!-- Add new button -->
          <div class="text-center q-mt-md">
            <q-btn flat color="primary" :label="`Add New ${resourceConfig.title}`" @click="showAddForm = true" />
          </div>
        </div>

        <!-- Add/Edit form -->
        <div v-else>
          <q-form @submit="editingResource ? updateResource() : addResource()" class="q-gutter-md">
            <div class="text-subtitle1 q-mb-sm">
              {{ editingResource ? `Edit ${resourceConfig.title}` : `Add New ${resourceConfig.title}` }}
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useResourcesStore } from 'stores/resources'
import { getResourceConfig } from 'src/configs/resourceConfigs'

const props = defineProps({
  modelValue: Boolean,
  resourceType: {
    type: String,
    required: true
  }
})

const $q = useQuasar()
const resourceConfig = computed(() => getResourceConfig(props.resourceType))
const emit = defineEmits(['update:modelValue', 'select'])
const resourcesStore = useResourcesStore()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const searchTerm = ref('')
const showAddForm = ref(false)
const showDeleteDialog = ref(false)
const resourceToDelete = ref(null)
const editingResource = ref(null)
const formData = ref({})

const modelValue = computed(() => props.modelValue)
const updateModelValue = (value) => {
  emit('update:modelValue', value)
}

const filteredResources = computed(() => {
  const resources = resourcesStore.getResourcesByType(props.resourceType)
  if (!searchTerm.value) return resources

  const search = searchTerm.value.toLowerCase()
  return resources.filter(resource => {
    const title = resourceConfig.value.getDisplayTitle(resource).toLowerCase()
    const subtitle = resourceConfig.value.getDisplaySubtitle(resource)?.toLowerCase()
    return title.includes(search) || (subtitle && subtitle.includes(search))
  })
})

const getDisplayTitle = (resource) => {
  return resourceConfig.value.getDisplayTitle(resource)
}

const getDisplaySubtitle = (resource) => {
  return resourceConfig.value.getDisplaySubtitle(resource)
}

const selectResource = (resource) => {
  emit('select', resource)
  emit('update:modelValue', false)
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

const updateResource = async () => {
  if (!editingResource.value) return

  saving.value = true
  try {
    await resourcesStore.updateResource(editingResource.value.id, formData.value)
    cancelForm()
    $q.notify({
      type: 'positive',
      message: `${resourceConfig.value.title} updated successfully`
    })
  } catch (error) {
    console.error(`Error updating ${props.resourceType}:`, error)
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
    await resourcesStore.deleteResource(resourceToDelete.value.id)
    showDeleteDialog.value = false
    resourceToDelete.value = null
    $q.notify({
      type: 'positive',
      message: `${resourceConfig.value.title} deleted successfully`
    })
  } catch (error) {
    console.error(`Error deleting ${props.resourceType}:`, error)
    $q.notify({
      type: 'negative',
      message: `Error deleting ${resourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    deleting.value = false
  }
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
    console.error(`Error adding ${props.resourceType}:`, error)
    $q.notify({
      type: 'negative',
      message: `Error adding ${resourceConfig.value.title.toLowerCase()}`
    })
  } finally {
    saving.value = false
  }
}

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
