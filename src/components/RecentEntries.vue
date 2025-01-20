<template>
  <div class="entries-wrapper">
    <div class="entries-container">
      <div class="entries-content">
        <div v-if="journalStore.loading" class="loader-container">
          <q-spinner color="primary" size="3em" />
        </div>
        <div v-else-if="journalStore.entries.length === 0" class="empty-container">
          No seeds planted yet. Start your journey by planting your first seed.
        </div>
        <q-list v-else bordered class="entries-list">
          <q-item v-for="index in 5" :key="index" :clickable="index <= paginatedEntries.length"
            @click="index <= paginatedEntries.length && viewEntry(paginatedEntries[index - 1].id)" class="entry-item"
            :class="{ 'placeholder-item': index > paginatedEntries.length }">
            <q-item-section>
              <template v-if="index <= paginatedEntries.length">
                <q-item-label class="text-wrap">{{ paginatedEntries[index - 1].title }}</q-item-label>
                <q-item-label caption class="text-wrap">
                  {{ formatDate(paginatedEntries[index - 1].created_at) }} •
                  {{ paginatedEntries[index - 1].type }}
                </q-item-label>
              </template>
              <template v-else>
                <div class="placeholder-content"></div>
              </template>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div class="pagination-container">
        <q-pagination v-if="journalStore.entries.length > 5" v-model="currentPage" :max="totalPages" :max-pages="6"
          direction-links boundary-numbers color="primary" />
      </div>
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

const entries = computed(() => journalStore.entries || [])
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
.entries-wrapper {
  height: 480px;
  display: flex;
  flex-direction: column;
}

.entries-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.entries-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  position: relative;
}

.loader-container,
.empty-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
}

.entries-list {
  height: 100%;
}

.entry-item {
  min-height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.entry-item:last-child {
  border-bottom: none;
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

.pagination-container {
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.q-item-section {
  min-width: 0;
}
</style>
