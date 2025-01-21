<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center ">
      <div class="col-12 col-sm-8 col-md-6 q-pa-lg rounded-borders parchment">
        <!-- Header with search info -->
        <div class=" text-h6 q-mb-md">Search Results</div>

        <!-- Active filters -->
        <div v-if="hasActiveFilters" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">Active Filters:</div>
          <div class="row q-col-gutter-sm">
            <q-chip v-if="selectedType" removable @remove="removeType" color="primary" text-color="white">
              Type: {{ selectedType }}
            </q-chip>
            <template v-if="selectedResources.length > 0">
              <q-chip v-for="resource in selectedResources" :key="resource.id" removable
                @remove="() => removeResource(resource)" color="secondary" text-color="white">
                {{ resource.type }}: {{ resource.title }}
              </q-chip>
            </template>
          </div>
        </div>

        <!-- Search box -->
        <q-input v-model="searchQuery" placeholder="Search entries..." dense clearable class="q-mb-lg">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <!-- Results list -->
        <div v-if="loading" class="text-center">
          <q-spinner color="primary" size="2em" />
        </div>
        <div v-else-if="filteredEntries.length === 0" class="text-center text-grey q-pa-lg">
          No entries found matching your search criteria
        </div>
        <q-list v-else bordered separator>
          <q-item v-for="entry in paginatedEntries" :key="entry.id" clickable @click="viewEntry(entry.id)">
            <q-item-section>
              <q-item-label>{{ entry.title }}</q-item-label>
              <q-item-label caption>
                {{ formatDate(entry.created_at) }} • {{ entry.type }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Pagination -->
        <div class="row justify-center q-mt-md">
          <q-pagination v-if="totalPages > 1" v-model="currentPage" :max="totalPages" :max-pages="6" direction-links
            boundary-numbers color="primary" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useJournalStore } from 'src/stores/journalData'

const router = useRouter()
const route = useRoute()
const journalStore = useJournalStore()

const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Get type and resources from route params
const selectedType = computed(() => route.query.type)
const selectedResources = computed(() => {
  if (!route.query.resources) return []
  try {
    return JSON.parse(route.query.resources)
  } catch {
    return []
  }
})

const hasActiveFilters = computed(() =>
  selectedType.value || selectedResources.value.length > 0
)

// Filter entries based on type, resources, and search query
const filteredEntries = computed(() => {
  let entries = journalStore.entries

  // Apply type filter
  if (selectedType.value) {
    entries = entries.filter(entry => entry.type === selectedType.value)
  }

  // Apply resources filter
  if (selectedResources.value.length > 0) {
    entries = entries.filter(entry => {
      return selectedResources.value.some(selectedResource =>
        entry.resources?.some(resource =>
          resource.id === selectedResource.id &&
          resource.type === selectedResource.type
        )
      )
    })
  }

  // Apply search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    entries = entries.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      Object.values(entry.decryptedContent || {}).some(section =>
        section.content?.toLowerCase().includes(query) ||
        section.title?.toLowerCase().includes(query)
      )
    )
  }

  return entries
})

// Pagination
const totalPages = computed(() =>
  Math.ceil(filteredEntries.value.length / itemsPerPage)
)

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEntries.value.slice(start, end)
})

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewEntry = (id) => {
  router.push(`/entry/${id}`)
}

const removeType = () => {
  const query = { ...route.query }
  delete query.type
  router.push({ query })
}

const removeResource = (resource) => {
  const updatedResources = selectedResources.value.filter(r =>
    r.id !== resource.id || r.type !== resource.type
  )
  const query = { ...route.query }
  if (updatedResources.length > 0) {
    query.resources = JSON.stringify(updatedResources)
  } else {
    delete query.resources
  }
  router.push({ query })
}

// Watch for query changes to reset pagination
watch([() => route.query, searchQuery], () => {
  currentPage.value = 1
})

// Load data
onMounted(async () => {
  if (!journalStore.entries.length) {
    await journalStore.fetchEntries()
  }
  loading.value = false
})
</script>
