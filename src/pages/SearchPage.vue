<template>
  <q-page class="q-pa-md q-mt-lg">
    <div class="row q-col-gutter-md justify-center ">
      <div class="col-12 content-card q-pa-lg rounded-borders parchment">
        <!-- Header with search info -->
        <div class="text-h6 text-center q-mb-sm">Search Results</div>
        <div class="row items-center q-mb-md">
          <q-space />
          <div class="col-auto">
            <q-btn flat color="primary" icon="filter_list" label="Filters" data-tour="filters-btn"
              @click="showFilterModal = true">
              <q-badge v-if="activeFilterChips.length > 0" color="secondary" floating>
                {{ activeFilterChips.length }}
              </q-badge>
            </q-btn>
            <q-btn flat round color="primary" icon="print" data-tour="print-btn"
              :disable="filteredEntries.length === 0" @click="showPrintOptionsModal = true">
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
            <q-chip v-for="chip in activeFilterChips" :key="chip.key" removable
              @remove="removeFacetValue(chip.facetType, chip.value)" color="primary" text-color="white">
              {{ chip.label }}
            </q-chip>
          </div>
        </div>

        <!-- Search box -->
        <q-input v-model="searchQuery" placeholder="Search entries..." dense clearable class="q-mb-lg"
          data-tour="search-box">
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
          <q-item v-for="entry in paginatedEntries" :key="entry.id" clickable class="entry-item"
            :style="{ borderLeftColor: typeColorsStore.getColor(entry.type) }" @click="viewEntry(entry.id)">
            <q-item-section>
              <q-item-label>
                <q-icon v-if="entry.is_favorite" name="star" color="warning" size="16px" class="q-mr-xs" />
                {{ entry.title }}
              </q-item-label>
              <q-item-label caption>
                {{ formatDate(entry.updated_at || entry.created_at) }} • {{ entry.type }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center no-wrap">
                <FavoriteButton :entry="entry" />
                <q-icon name="chevron_right" />
              </div>
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

    <FilterModal v-model="showFilterModal" @applied="syncFiltersToRoute" />
    <PrintOptionsModal v-model="showPrintOptionsModal" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useJournalStore } from 'src/stores/journalData'
import { useJournalTypeColorsStore } from 'src/stores/journalTypeColors'
import { useTutorialStore } from 'src/stores/tutorial'
import FilterModal from 'src/components/FilterModal.vue'
import PrintOptionsModal from 'src/components/PrintOptionsModal.vue'
import FavoriteButton from 'src/components/FavoriteButton.vue'
import { FACET_KEYS } from 'src/utils/searchRoute'

const router = useRouter()
const route = useRoute()
const journalStore = useJournalStore()
const typeColorsStore = useJournalTypeColorsStore()
const tutorialStore = useTutorialStore()

const loading = ref(true)
const showFilterModal = ref(false)
const showPrintOptionsModal = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10

// Search box drives the store's search term
const searchQuery = computed({
  get: () => journalStore.searchTerm,
  set: (value) => journalStore.setSearchTerm(value || ''),
})

// Results come from the store's facet + search filtering. Favorites float to
// the top without changing the user's actual entry updated date.
const filteredEntries = computed(() =>
  [...journalStore.filteredEntries].sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1
    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  }),
)

const facetLabels = {
  types: 'Type',
  verses: 'Verse',
  books: 'Book',
  resourceTypes: 'Resource Type',
  resources: 'Resource',
  tags: 'Tag',
  quotes: 'Quote',
  links: 'Link',
  strongs: 'Strong\'s',
  favorites: 'Favorite',
}

// Verse facets are range objects with a .label; everything else is a string
const facetValueText = (value) => (typeof value === 'string' ? value : value.label)
const facetValueKey = (value) => (typeof value === 'string' ? value : JSON.stringify(value))

const activeFilterChips = computed(() =>
  Object.entries(journalStore.selectedFacets).flatMap(([facetType, values]) =>
    (values || []).map((value) => ({
      facetType,
      value,
      key: `${facetType}-${facetValueKey(value)}`,
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

// Reflects the full current facet state into the URL as its own history
// entry, so Back returns to exactly this filtered view instead of skipping
// straight past it to whatever was on screen before Apply was clicked.
const syncFiltersToRoute = () => {
  const query = { ...route.query }
  delete query.type
  delete query.resourceType
  delete query.resources

  const hasFacets = FACET_KEYS.some((key) => journalStore.selectedFacets[key]?.length > 0)
  if (hasFacets) {
    query.facets = JSON.stringify(journalStore.selectedFacets)
  } else {
    delete query.facets
  }

  router.push({ path: '/search', query })
}

// Translate query params from elsewhere into store facets — either the
// full facet set applied from within this page (?facets=, see
// syncFiltersToRoute above) or the narrower single-value shortcuts other
// pages link in with directly (Browse's type/resourceType/resources).
const applyRouteFilters = () => {
  const query = route.query

  if (query.facets) {
    try {
      const parsed = JSON.parse(query.facets)
      journalStore.clearFacets()
      FACET_KEYS.forEach((key) => {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          journalStore.updateFacet(key, parsed[key])
        }
      })
    } catch {
      // Malformed query param — ignore
    }
    return
  }

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

// Lets a mid-tour step (see src/constants/tutorialSteps.js) open/close the
// Filter modal without FilterModal.vue needing to know the tour exists.
watch(
  () => tutorialStore.pendingAction,
  (action) => {
    if (action === 'open-filter-modal') {
      showFilterModal.value = true
      tutorialStore.clearAction()
    } else if (action === 'close-filter-modal') {
      showFilterModal.value = false
      tutorialStore.clearAction()
    } else if (action === 'open-print-options') {
      showPrintOptionsModal.value = true
      tutorialStore.clearAction()
    } else if (action === 'close-print-options') {
      showPrintOptionsModal.value = false
      tutorialStore.clearAction()
    }
  },
)

// Load data
onMounted(async () => {
  if (!journalStore.entries.length) {
    await journalStore.fetchEntries()
  }
  applyRouteFilters()
  loading.value = false
})
</script>

<style scoped>
.entry-item {
  border-left: 3px solid transparent;
}
</style>
