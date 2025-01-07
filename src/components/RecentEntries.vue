<template>
  <div class="q-mt-lg">
    <h5 class="text-h6 q-mb-md">My Seeds</h5>

    <q-input v-model="searchTerm" outlined placeholder="Search seeds..." class="q-mb-md">
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
      <template v-slot:append v-if="searchTerm">
        <q-icon name="clear" class="cursor-pointer" @click="searchTerm = ''" />
      </template>
    </q-input>

    <EntryList :entries="paginatedEntries" :loading="journalStore.loading" :show-preview="!!searchTerm"
      empty-message="No seeds planted yet. Start your journey by planting your first seed." />

    <!-- Pagination Controls -->
    <div v-if="filteredEntries.length > 0">
      <!-- Pagination Controls Container -->
      <div class="q-mt-md">
        <!-- Pagination centered -->
        <div class="row justify-center q-mb-sm">
          <q-pagination v-model="currentPage" :max="totalPages" :max-pages="6" :boundary-numbers="true" direction-links
            unelevated color="primary" active-color="primary" />
        </div>
        <!-- Items per page selector - right aligned -->
        <div class="row justify-end">
          <q-select v-model="itemsPerPage" :options="[5, 10, 25, 50]" label="Items per page" dense outlined
            style="width: 120px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useJournalStore } from 'stores/journalData'
import EntryList from 'components/EntryList.vue'

const journalStore = useJournalStore()
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Filter entries based on search term
const filteredEntries = computed(() => {
  const entries = journalStore.filteredEntries || []
  if (!searchTerm.value) return entries

  const searchLower = searchTerm.value.toLowerCase()
  return entries.filter(entry => {
    // Search in title and type
    if (entry.title.toLowerCase().includes(searchLower) ||
      entry.type.toLowerCase().includes(searchLower)) {
      return true
    }

    // Search in decrypted content if available
    if (entry.decryptedContent) {
      for (const section of Object.values(entry.decryptedContent)) {
        if (section?.content?.toLowerCase().includes(searchLower)) {
          return true
        }
      }
    }
    return false
  }).map(entry => {
    if (entry.decryptedContent) {
      entry.preview = getContentPreview(entry)
    }
    return entry
  })
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredEntries.value.length / itemsPerPage.value)
})

const paginatedEntries = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value
  const endIndex = startIndex + itemsPerPage.value
  return filteredEntries.value.slice(startIndex, endIndex)
})

// Helper function to get content preview for search results
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

// Reset pagination when search term or items per page changes
watch([searchTerm, itemsPerPage], () => {
  currentPage.value = 1
})

// Ensure we have entries loaded
onMounted(async () => {
  if (!journalStore.filteredEntries.length) {
    await journalStore.fetchEntries()
  }
})
</script>
