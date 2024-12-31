<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">Select Church</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input v-model="searchTerm" label="Search churches" dense class="q-mb-md" clearable>
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="!showAddForm">
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
          </div>
          <div v-else-if="filteredResources.length === 0" class="text-center q-pa-md">
            No churches found
            <q-btn flat color="primary" label="Add New Church" @click="showAddForm = true" />
          </div>
          <q-list v-else separator>
            <q-item v-for="resource in filteredResources" :key="resource.id" clickable
              @click="selectResource(resource)">
              <q-item-section>
                <q-item-label>{{ resource.metadata.name }}</q-item-label>
                <q-item-label caption>{{ resource.metadata.location }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="text-center q-mt-md">
            <q-btn flat color="primary" label="Add New Church" @click="showAddForm = true" />
          </div>
        </div>

        <div v-else>
          <q-form @submit="addResource" class="q-gutter-md">
            <q-input v-model="newResource.name" label="Name *" :rules="[val => !!val || 'Name is required']" />
            <q-input v-model="newResource.location" label="Location *"
              :rules="[val => !!val || 'Location is required']" />

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
import { useResourcesStore, RESOURCE_TYPES } from 'stores/resources'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'select'])

const resourcesStore = useResourcesStore()
const loading = ref(false)
const saving = ref(false)
const searchTerm = ref('')
const showAddForm = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Initialize newResource based on the resource type
const newResource = ref(getEmptyResource())

function getEmptyResource() {
  // Each component will override this with their specific fields
  return {}
}

// Each component will override this to use their specific resource type
const filteredResources = computed(() => {
  if (!searchTerm.value) return []  // Override in each component
  return []  // Override in each component
})

const selectResource = (resource) => {
  emit('select', resource)
  isOpen.value = false
}

const addResource = async () => {
  saving.value = true
  try {
    // Each component will override this with their specific resource type
    const resource = await resourcesStore.addResource(RESOURCE_TYPES.CHURCH, newResource.value)
    selectResource(resource)
    showAddForm.value = false
    newResource.value = getEmptyResource()
  } catch (error) {
    console.error('Error adding resource:', error)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await resourcesStore.loadResources()
  } finally {
    loading.value = false
  }
})
</script>
