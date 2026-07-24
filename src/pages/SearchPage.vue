<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center ">
      <div class="col-12 col-sm-8 col-md-6 q-pa-lg rounded-borders parchment">
        <!-- Header with search info -->
        <div class="text-h6 text-center q-mb-sm">Search Results</div>
        <div class="row items-center q-mb-md">
          <div class="col-auto">
            <q-btn flat round icon="arrow_back" color="primary" @click="router.go(-1)" />
          </div>
          <q-space />
          <div class="col-auto">
            <q-btn flat color="primary" icon="filter_list" label="Filters" @click="showFilterModal = true">
              <q-badge v-if="activeFilterChips.length > 0" color="secondary" floating>
                {{ activeFilterChips.length }}
              </q-badge>
            </q-btn>
            <q-btn flat round color="primary" icon="print" :disable="filteredEntries.length === 0"
              @click="router.push('/print')">
              <q-tooltip>Print / Export to PDF</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Active filters -->
        <div v-if="activeFilterChips.length > 0" class="q-mb-md">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle2 col">Active Filters:</div>
            <q-btn flat dense size="sm" color="grey" label="Clear All" @click="clearAllFilters" />
          </div>
          <div class="row q-col-gutter-sm">
            <q-chip v-for="chip in activeFilterChips" :key="`${chip.facetType}-${chip.value}`" removable
              @remove="removeFacetValue(chip.facetType, chip.value)" color="primary" text-color="white">
              {{ chip.label }}
            </q-chip>
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

    <FilterModal v-model="showFilterModal" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useJournalStore } from 'src/stores/journalData'
import FilterModal from 'src/components/FilterModal.vue'

const router = useRouter()
const route = useRoute()
const journalStore = useJournalStore()

const loading = ref(true)
const showFilterModal = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Search box drives the store's search term
const searchQuery = computed({
  get: () => journalStore.searchTerm,
  set: (value) => journalStore.setSearchTerm(value || ''),
})

// Results come from the store's facet + search filtering
const filteredEntries = computed(() => journalStore.filteredEntries)

const facetLabels = {
  types: 'Type',
  verses: 'Verse',
  resourceTypes: 'Resource Type',
  resources: 'Resource',
  tags: 'Tag',
  quotes: 'Quote',
  links: 'Link',
}

// Verse facets are range objects with a .label; everything else is a string
const facetValueText = (value) => (typeof value === 'string' ? value : value.label)

const activeFilterChips = computed(() =>
  Object.entries(journalStore.selectedFacets).flatMap(([facetType, values]) =>
    (values || []).map((value) => ({
      facetType,
      value,
      label: `${facetLabels[facetType] || facetType}: ${facetValueText(value)}`,
    })),
  ),
)

const removeFacetValue = (facetType, value) => {
  journalStore.updateFacet(
    facetType,
    journalStore.selectedFacets[facetType].filter((v) => v !== value),
  )
}

const clearAllFilters = () => {
  journalStore.clearFacets()
}

// Translate query params from the Browse page into store facets
const applyRouteFilters = () => {
  const query = route.query
  if (!query.type && !query.resources && !query.resourceType) return

  journalStore.clearFacets()

  if (query.type) {
    journalStore.updateFacet('types', [query.type])
  }

  if (query.resourceType) {
    journalStore.updateFacet('resourceTypes', [query.resourceType])
  }

  if (query.resources) {
    try {
      const parsed = JSON.parse(query.resources)
      journalStore.updateFacet(
        'resources',
        parsed
          .filter((r) => r.title && r.type)
          .map((r) => ({ type: r.type, title: r.title, label: r.title })),
      )
    } catch {
      // Malformed query param — ignore
    }
  }
}

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

// Re-apply filters when navigated here with new query params
watch(() => route.query, () => {
  applyRouteFilters()
})

// Reset pagination whenever the result set changes
watch(filteredEntries, () => {
  currentPage.value = 1
})

// Load data
onMounted(async () => {
  if (!journalStore.entries.length) {
    await journalStore.fetchEntries()
  }
  applyRouteFilters()
  loading.value = false
})
</script>
