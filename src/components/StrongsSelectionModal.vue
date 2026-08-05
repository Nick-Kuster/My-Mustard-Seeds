<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="width: 500px; max-width: 95vw">
      <q-card-section class="row items-center">
        <div class="text-h6">Add Strong's Word</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input v-model="searchQuery" dense outlined placeholder="Search by number, word, or English gloss"
          autofocus>
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append>
            <q-spinner v-if="strongsData.searching" size="20px" />
          </template>
        </q-input>

        <q-btn-toggle v-model="language" class="q-mt-sm" dense no-caps unelevated toggle-color="primary"
          color="white" text-color="primary" :options="[
            { label: 'All', value: null },
            { label: 'Hebrew', value: 'hebrew' },
            { label: 'Greek', value: 'greek' },
          ]" />

        <div v-if="hasSearched && results.length === 0 && !strongsData.searching" class="text-center text-grey q-pa-md">
          No matches found
        </div>

        <q-list v-if="results.length > 0" bordered separator class="q-mt-sm result-list">
          <q-item v-for="entry in results" :key="entry.strongs_number" clickable
            :disable="excludeNumbers.includes(entry.strongs_number)" @click="selectEntry(entry)">
            <q-item-section>
              <q-item-label>
                <span class="text-weight-medium">{{ entry.lemma }}</span>
                <span v-if="entry.transliteration" class="text-grey-8"> ({{ entry.transliteration }})</span>
                <span class="text-caption text-grey-6"> — {{ entry.strongs_number }}</span>
              </q-item-label>
              <q-item-label caption lines="1">{{ entry.kjv_def || entry.strongs_def }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="excludeNumbers.includes(entry.strongs_number)" side>
              <q-icon name="check" color="positive" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStrongsDataStore } from 'stores/strongsData'

const props = defineProps({
  modelValue: Boolean,
  excludeNumbers: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const strongsData = useStrongsDataStore()
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const searchQuery = ref('')
const language = ref(null)
const results = ref([])
const hasSearched = ref(false)

let debounceTimer = null
watch([searchQuery, language], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(runSearch, 550)
})

const runSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    results.value = []
    hasSearched.value = false
    return
  }
  try {
    results.value = await strongsData.search(query, { language: language.value })
  } catch (error) {
    console.error('Error searching Strong\'s entries:', error)
    results.value = []
  } finally {
    hasSearched.value = true
  }
}

const selectEntry = (entry) => {
  if (props.excludeNumbers.includes(entry.strongs_number)) return
  emit('select', entry)
  isOpen.value = false
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    searchQuery.value = ''
    results.value = []
    hasSearched.value = false
  }
})
</script>

<style scoped>
.result-list {
  max-height: 320px;
  overflow-y: auto;
}
</style>
