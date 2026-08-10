<template>
  <q-dialog v-model="isOpen">
    <q-card class="verse-modal" style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ reference }}</div>
        <q-space />
        <q-btn v-if="searchFacet" icon="search" flat round dense color="primary" aria-label="Find entries"
          @click="openVerseSearch">
          <q-tooltip>Find entries with this passage</q-tooltip>
        </q-btn>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-lg">
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="2em" />
        </div>
        <div v-else>
          <div v-for="verse in verses" :key="verse.verse" class="q-mb-md">
            <div class="verse-content">
              <span class="verse-number text-weight-medium">{{ verse.verse }}</span>
              <template v-for="(word, index) in verse.words" :key="index">
                <span
                  v-if="word.strongsNumber"
                  class="verse-word verse-word--tagged"
                  role="button"
                  tabindex="0"
                  @click="openStrongs(word.strongsNumber)"
                  @keydown.enter="openStrongs(word.strongsNumber)"
                  @keydown.space.prevent="openStrongs(word.strongsNumber)"
                >{{ word.text }}</span>
                <span v-else>{{ word.text }}</span>
              </template>
            </div>
          </div>
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>

  <StrongsDisplayModal :model-value="!!viewingEntry" :entry="viewingEntry" @update:model-value="viewingEntry = null" />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'
import StrongsDisplayModal from './StrongsDisplayModal.vue'
import { searchRouteForFacet } from 'src/utils/searchRoute'

const props = defineProps({
  modelValue: Boolean,
  reference: {
    type: String,
    default: ''
  },
  startVerse: Number,
  endVerse: Number,
  searchFacet: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(true)
const verses = ref([])
const viewingEntry = ref(null)

// Populated per fetchVerses() call from whatever strongs_entries this
// reference range actually needs — looked up once in bulk rather than
// per-word-click, since a verse range can repeat the same number many
// times (e.g. "the" tagged G3588 a dozen times in one chapter).
let strongsEntriesByNumber = new Map()

const openStrongs = (strongsNumber) => {
  viewingEntry.value = strongsEntriesByNumber.get(strongsNumber) || null
}

const openVerseSearch = () => {
  if (!props.searchFacet) return
  isOpen.value = false
  router.push(searchRouteForFacet('verses', props.searchFacet))
}

const fetchVerses = async () => {
  if (!props.startVerse || !props.endVerse) {
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('bible_verse_words')
      .select('verse, position, word_text, strongs_number')
      .gte('verse_number', props.startVerse)
      .lte('verse_number', props.endVerse)
      .order('verse_number')
      .order('position')

    if (error) throw error

    const byVerse = new Map()
    for (const row of data || []) {
      if (!byVerse.has(row.verse)) byVerse.set(row.verse, [])
      byVerse.get(row.verse).push({ text: row.word_text, strongsNumber: row.strongs_number })
    }
    verses.value = [...byVerse.entries()].map(([verse, words]) => ({ verse, words }))

    const neededNumbers = [...new Set((data || []).map((row) => row.strongs_number).filter(Boolean))]
    if (neededNumbers.length > 0) {
      const { data: entries, error: entriesError } = await supabase
        .from('strongs_entries')
        .select('*')
        .in('strongs_number', neededNumbers)
      if (entriesError) throw entriesError
      strongsEntriesByNumber = new Map((entries || []).map((entry) => [entry.strongs_number, entry]))
    } else {
      strongsEntriesByNumber = new Map()
    }
  } catch (error) {
    console.error('Error fetching verses:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      fetchVerses()
    }
  }
)
</script>

<style scoped>
.verse-modal {
  background-color: var(--color-parchment);
}

.verse-modal :deep(.q-card__section) {
  background-color: var(--color-parchment);
}

/* Style the header section slightly differently */
.verse-modal :deep(.q-card__section:first-child) {
  background-color: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border-light);
}

.verse-number {
  margin-right: 0.5rem;
  color: var(--color-text-secondary);
}

.verse-content {
  line-height: 1.6;
}

.verse-word--tagged {
  cursor: pointer;
  border-bottom: 1px dotted var(--color-text-secondary);
}

.verse-word--tagged:hover,
.verse-word--tagged:focus {
  background-color: var(--color-hover);
  outline: none;
}
</style>
