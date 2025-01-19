# RecentEntries.vue
<template>
  <div class="q-mt-lg">
    <h5 class="text-h6 q-mb-md">My Seeds</h5>
    <div class="entries-container">
      <div v-if="journalStore.loading" class="text-center entries-content flex flex-center">
        <q-spinner color="primary" size="3em" />
      </div>
      <div v-else-if="journalStore.entries.length === 0" class="text-center text-grey entries-content flex flex-center">
        No seeds planted yet. Start your journey by planting your first seed.
      </div>
      <template v-else>
        <q-list bordered class="entries-content">
          <q-item v-for="index in 5" :key="index" :clickable="index <= paginatedEntries.length"
            @click="index <= paginatedEntries.length && viewEntry(paginatedEntries[index - 1].id)" class="entry-item"
            :class="{ 'placeholder-item': index > paginatedEntries.length }">
            <q-item-section>
              <template v-if="index <= paginatedEntries.length">
                <q-item-label>{{ paginatedEntries[index - 1].title }}</q-item-label>
                <q-item-label caption>
                  {{ formatDate(paginatedEntries[index - 1].created_at) }} •
                  {{ paginatedEntries[index - 1].type }}
                </q-item-label>
              </template>
              <template v-else>
                <div class="placeholder-content"></div>
              </template>
            </q-item-section>
            <q-item-section v-if="index <= paginatedEntries.length" side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Pagination -->
        <div v-if="journalStore.entries.length > 5" class="row justify-center q-mt-md">
          <q-pagination v-model="currentPage" :max="totalPages" :max-pages="6" direction-links boundary-numbers
            color="primary" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useJournalStore } from 'stores/journalData'

const router = useRouter()
const $q = useQuasar()
const journalStore = useJournalStore()
const currentPage = ref(1)
const itemsPerPage = 5

// Use the entries directly from the store
const entries = computed(() => journalStore.entries || [])

// Computed properties for pagination
const totalPages = computed(() => Math.ceil(entries.value.length / itemsPerPage))
const paginatedEntries = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return entries.value.slice(startIndex, endIndex)
})

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

onMounted(async () => {
  try {
    if (!journalStore.entries.length) {
      await journalStore.fetchEntries()
    }
  } catch (error) {
    console.error('Error fetching entries:', error)
    $q.notify({
      type: 'negative',
      message: 'Error loading entries'
    })
  }
})
</script>

<style scoped>
.entries-container {
  display: flex;
  flex-direction: column;
}

.entries-content {
  min-height: 300px;
}

.entry-item {
  height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  /* Consistent separator for all items */
}

.entry-item:last-child {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  /* Ensure last item has border */
}

.placeholder-item {
  opacity: 0.1;
  cursor: default !important;
}

.placeholder-content {
  height: 48px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

/* Center loading and empty states */
.flex.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
