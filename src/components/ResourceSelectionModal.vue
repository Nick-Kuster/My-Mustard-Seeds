<template>
  <q-dialog v-model="modelValue" persistent @update:model-value="updateModelValue">
    <q-card style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">Select {{ resourceConfig.title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div v-if="!showAddForm">
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
            </q-item>
          </q-list>

          <!-- Add new button -->
          <div class="text-center q-mt-md">
            <q-btn flat color="primary" :label="`Add New ${resourceConfig.title}`" @click="showAddForm = true" />
          </div>
        </div>

        <!-- Add form -->
        <div v-else>
          <q-form @submit="addResource" class="q-gutter-md">
            <q-input v-for="(field, key) in resourceConfig.fields" :key="key" v-model="newResource[key]"
              :label="`${field.label} ${field.required ? '*' : ''}`"
              :rules="field.required ? [val => !!val || `${field.label} is required`] : []" />
            <div class="row q-mt-lg">
              <q-btn flat label="Back" color="primary" @click="showAddForm = false" class="q-mr-sm" />
              <q-btn type="submit" label="Save" color="primary" :loading="saving" />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useResourcesStore } from 'stores/resources'
import { getResourceConfig } from 'src/configs/resourceConfigs'

const props = defineProps({
  modelValue: Boolean,
  resourceType: {
    type: String,
    required: true
  }
})

const resourceConfig = computed(() => getResourceConfig(props.resourceType))
const emit = defineEmits(['update:modelValue', 'select'])
const resourcesStore = useResourcesStore()

const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')
const showAddForm = ref(false)


const modelValue = computed(() => props.modelValue)
const updateModelValue = (value) => {
  emit('update:modelValue', value)
}
const newResource = ref({})

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

const addResource = async () => {
  saving.value = true
  try {
    const resource = await resourcesStore.addResource(props.resourceType, newResource.value)
    selectResource(resource)
    showAddForm.value = false
    newResource.value = resourcesStore.getMetadataTemplate(props.resourceType)
  } catch (error) {
    console.error(`Error adding ${props.resourceType}:`, error)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await resourcesStore.loadResources()
    newResource.value = resourcesStore.getMetadataTemplate(props.resourceType)
  } finally {
    loading.value = false
  }
})
</script>
