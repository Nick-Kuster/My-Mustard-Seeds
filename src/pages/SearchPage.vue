<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <!-- Option 1: Smaller Filter Button -->
        <div class="row items-center q-mb-md">
          <div class="col">
            <q-input v-model="searchTerm" outlined label="Search your seeds">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append>
                <template v-if="searchTerm">
                  <q-icon name="clear" class="cursor-pointer" @click="clearSearch" />
                </template>
                <q-btn flat dense round color="primary" icon="filter_list" @click="showFilterModal = true">
                  <q-badge v-if="activeFilterCount" color="primary" floating>
                    {{ activeFilterCount }}
                  </q-badge>
                </q-btn>
              </template>
            </q-input>
          </div>
        </div>

        <!-- Option 2: Filter Button Below Search (commented out) -->
        <!-- <div class="q-mb-md">
          <q-input v-model="searchTerm" outlined label="Search your seeds" class="q-mb-sm">
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
            <template v-slot:append v-if="searchTerm">
              <q-icon name="clear" class="cursor-pointer" @click="clearSearch" />
            </template>
          </q-input>
          <q-btn
            outline
            color="primary"
            icon="filter_list"
            label="Filter Seeds"
            @click="showFilterModal = true"
            class="full-width"
            size="sm"
          >
            <q-badge
              v-if="activeFilterCount"
              color="primary"
              floating
              transparent
            >
              {{ activeFilterCount }}
            </q-badge>
          </q-btn>
        </div> -->

        <!-- Active Filters Display -->
        <div v-if="hasActiveFilters" class="q-mb-md">
          <div class="row q-col-gutter-sm items-center">
            <template v-for="(filters, type) in journalStore.selectedFacets" :key="type">
              <template v-for="filter in filters" :key="filter">
                <div class="col-auto">
                  <q-chip removable @remove="removeFilter(type, filter)" size="sm">
                    {{ filter }}
                  </q-chip>
                </div>
              </template>
            </template>
            <div class="col-auto">
              <q-btn flat dense color="grey" label="Clear all filters" @click="clearAllFilters" size="sm" />
            </div>
          </div>
        </div>

        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <div v-else-if="!journalStore.filteredEntries.length && (searchTerm || hasActiveFilters)"
          class="text-center text-grey q-pa-lg">
          No seeds found matching your criteria
        </div>

        <template v-else-if="journalStore.filteredEntries.length">
          <q-list bordered separator>
            <q-item v-for="entry in paginatedEntries" :key="entry.id" clickable @click="viewEntry(entry.id)">
              <q-item-section>
                <q-item-label>{{ entry.title }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(entry.created_at) }} • {{ entry.type }}
                </q-item-label>
                <q-item-label caption v-if="showPreview(entry)" class="text-body2">
                  {{ getContentPreview(entry) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Pagination Controls -->
          <div class="row justify-center q-mt-md">
            <q-pagination v-model="currentPage" :max="totalPages" :max-pages="6" :boundary-numbers="true"
              direction-links unelevated color="primary" active-color="primary" />
          </div>

          <!-- Entries per page selector -->
          <div class="row justify-end q-mt-sm">
            <q-select v-model="itemsPerPage" :options="[5, 10, 25, 50]" label="Items per page" dense outlined
              style="width: 150px" />
          </div>
        </template>
      </div>
    </div>

    <!-- Filter Modal -->
    <FilterModal v-model="showFilterModal" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore } from 'stores/journalData'
import FilterModal from 'components/FilterModal.vue'

const router = useRouter()
const journalStore = useJournalStore()
const searchTerm = ref('')
const searchTimeout = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showFilterModal = ref(false)

const {
  loading,
  fetchEntries,
  setSearchTerm,
} = journalStore

// Computed properties for filters
const hasActiveFilters = computed(() => {
  return Object.values(journalStore.selectedFacets).some(filters => filters.length > 0)
})

const activeFilterCount = computed(() => {
  return Object.values(journalStore.selectedFacets)
    .reduce((total, filters) => total + filters.length, 0)
})

// Computed properties for pagination
const totalPages = computed(() => {
  return Math.ceil(journalStore.filteredEntries.length / itemsPerPage.value)
})

const paginatedEntries = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return journalStore.filteredEntries.slice(startIndex, endIndex)
})

// Reset to first page when search term changes
watch(searchTerm, (newTerm) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1
    setSearchTerm(newTerm)
  }, 300)
})

// Reset to first page when items per page changes
watch(itemsPerPage, () => {
  currentPage.value = 1
})

const clearSearch = () => {
  searchTerm.value = ''
}

const removeFilter = (type, value) => {
  const currentFilters = [...journalStore.selectedFacets[type]]
  const updatedFilters = currentFilters.filter(filter => filter !== value)
  journalStore.updateFacet(type, updatedFilters)
}

const clearAllFilters = () => {
  journalStore.clearFacets()
}

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

const showPreview = (entry) => {
  return searchTerm.value && entry.decryptedContent
}

const getContentPreview = (entry) => {
  const searchLower = searchTerm.value.toLowerCase()
  const content = entry.decryptedContent
  for (const section of Object.values(content)) {
    if (section) {
      const text = section?.content?.toLowerCase()
      const index = text?.indexOf(searchLower)
      if (index > -1) {
        const start = Math.max(0, index - 40)
        const end = Math.min(text.length, index + 40)
        let preview = text.slice(start, end)
        if (start > 0) preview = '...' + preview
        if (end < text.length) preview = preview + '...'
        return preview
      }
    }
  }
  return ''
}

onMounted(async () => {
  if (!journalStore.filteredEntries.length) {
    await fetchEntries()
  }
})
</script>
