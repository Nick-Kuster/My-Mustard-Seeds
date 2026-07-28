<!-- FilterModal.vue -->
<template>
  <q-dialog v-model="isOpen">
    <q-card class="filter-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Filter Seeds</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="scroll filter-body q-pt-sm q-px-none">
        <q-list separator>
          <!-- Journal Types -->
          <q-expansion-item v-if="availableFacets.types.length" label="Journal Types"
            :caption="selectionCaption(selectedTypes)" icon="category">
            <div class="q-px-md q-pb-md row q-col-gutter-x-md items-center">
              <div v-for="type in availableFacets.types" :key="type" class="col-auto">
                <q-checkbox v-model="selectedTypes" :val="type" :label="type" dense />
              </div>
            </div>
          </q-expansion-item>

          <!-- Tags -->
          <q-expansion-item v-if="availableFacets.tags.length" label="Tags"
            :caption="selectionCaption(selectedTags)" icon="sell">
            <div class="q-px-md q-pb-md row q-col-gutter-x-md items-center">
              <div v-for="tag in availableFacets.tags" :key="tag" class="col-auto">
                <q-checkbox v-model="selectedTags" :val="tag" :label="tag" dense />
              </div>
            </div>
          </q-expansion-item>

          <!-- Bible Verses -->
          <q-expansion-item v-if="availableFacets.books.length" label="Bible Verses"
            :caption="selectionCaption(selectedVerseRanges)" icon="auto_stories">
            <div class="q-px-md q-pb-md">
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-4">
                  <q-select v-model="verseBook" :options="sortedBooks" label="Book" outlined dense clearable
                    options-dense />
                </div>
                <div class="col-3 col-sm-2">
                  <q-input v-model.number="chapterFrom" type="number" min="1" label="Ch. from" outlined dense
                    :disable="!verseBook" />
                </div>
                <div class="col-3 col-sm-2">
                  <q-input v-model.number="chapterTo" type="number" min="1" label="Ch. to" outlined dense
                    :disable="!verseBook || !chapterFrom" />
                </div>
                <div class="col-3 col-sm-2">
                  <q-input v-model.number="verseFrom" type="number" min="1" label="Vs. from" outlined dense
                    :disable="!verseBook || !chapterFrom" />
                </div>
                <div class="col-3 col-sm-2">
                  <q-input v-model.number="verseTo" type="number" min="1" label="Vs. to" outlined dense
                    :disable="!verseBook || !chapterFrom" />
                </div>
              </div>
              <div class="row items-center q-mt-sm q-col-gutter-sm">
                <div class="col-auto">
                  <q-btn outline dense color="primary" icon="add" label="Add Verse Filter" :disable="!verseBook"
                    @click="addVerseRange" />
                </div>
                <div class="col text-caption text-grey">
                  Book alone matches the whole book; add chapters/verses to narrow it
                </div>
              </div>
              <div v-if="selectedVerseRanges.length" class="q-mt-sm">
                <q-chip v-for="range in selectedVerseRanges" :key="range.label" removable dense color="primary"
                  text-color="white" @remove="removeVerseRange(range)">
                  {{ range.label }}
                </q-chip>
              </div>
            </div>
          </q-expansion-item>

          <!-- Resource Types -->
          <q-expansion-item v-if="availableFacets.resourceTypes.length" label="Resource Types"
            :caption="selectionCaption(selectedResourceTypes)" icon="folder">
            <div class="q-px-md q-pb-md row q-col-gutter-x-md items-center">
              <div v-for="type in availableFacets.resourceTypes" :key="type" class="col-auto">
                <q-checkbox v-model="selectedResourceTypes" :val="type" :label="type" dense />
              </div>
            </div>
          </q-expansion-item>

          <!-- Resources, grouped by type; options narrow to the other selections -->
          <q-expansion-item v-if="resourceTypeSections.length || flatSelectedResources.length" label="Resources"
            :caption="selectionCaption(flatSelectedResources)" icon="library_books">
            <div class="q-px-md q-pb-md">
              <q-select v-for="section in resourceTypeSections" :key="section.type"
                :model-value="selectedResourcesByType[section.type] || []"
                @update:model-value="(v) => setResourceSelection(section.type, v)" :options="section.options"
                multiple outlined dense use-chips stack-label :label="section.label" options-dense
                class="q-mb-sm" />
              <div class="text-caption text-grey">
                Options narrow to match your other selected filters
              </div>
            </div>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions class="q-pa-md">
        <div class="row items-center full-width">
          <div class="col">
            <div class="text-grey text-caption">
              {{ getSelectedCount() }} filters selected
            </div>
          </div>
          <div class="col-auto">
            <q-btn flat color="grey" label="Clear All" @click="clearAllFilters" :disable="!hasActiveFilters"
              class="q-mr-sm" />
            <q-btn color="primary" label="Apply Filters" @click="applyFilters" />
          </div>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useJournalStore, getResourceTitle } from 'stores/journalData'
import { useBibleDataStore } from 'stores/bibleData'
import { verseMatchesRange, buildVerseRangeLabel } from 'src/utils/verseUtils'
import { getResourceConfig, pluralizeTitle } from 'src/configs/resourceConfigs'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const journalStore = useJournalStore()
const bibleDataStore = useBibleDataStore()
const availableFacets = computed(() => journalStore.availableFacets)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Selected values, synced from the store when the dialog opens
const selectedTypes = ref([...journalStore.selectedFacets.types])
const selectedTags = ref([...journalStore.selectedFacets.tags])
const selectedVerseRanges = ref([...journalStore.selectedFacets.verses])
const selectedResourceTypes = ref([...journalStore.selectedFacets.resourceTypes])
const selectedResourcesByType = ref(groupResourceSelections(journalStore.selectedFacets.resources))

// Verse range builder inputs
const verseBook = ref(null)
const chapterFrom = ref(null)
const chapterTo = ref(null)
const verseFrom = ref(null)
const verseTo = ref(null)

// Books that appear in entries, in canonical order when known
const sortedBooks = computed(() => {
  const books = availableFacets.value.books
  if (!bibleDataStore.books.length) return books
  const order = new Map(bibleDataStore.books.map((b, i) => [b.book ?? b.name ?? b, i]))
  return [...books].sort((a, b) => (order.get(a) ?? 999) - (order.get(b) ?? 999))
})

function groupResourceSelections(selections) {
  const grouped = {}
  selections.forEach((sel) => {
    if (typeof sel === 'string' || !sel.type) return
    if (!grouped[sel.type]) grouped[sel.type] = []
    grouped[sel.type].push(sel.title)
  })
  return grouped
}

const flatSelectedResources = computed(() =>
  Object.entries(selectedResourcesByType.value).flatMap(([type, titles]) =>
    (titles || []).map((title) => ({ type, title, label: title })),
  ),
)

const setResourceSelection = (type, values) => {
  selectedResourcesByType.value = { ...selectedResourcesByType.value, [type]: values }
}

/**
 * Does the entry pass every pending filter except resource selections of
 * `excludedResourceType`? Used to narrow each resource group by everything
 * else that's selected (standard faceted-search behavior: a group is never
 * narrowed by its own selections).
 */
const entryMatchesPending = (entry, excludedResourceType) => {
  if (selectedTypes.value.length && !selectedTypes.value.includes(entry.type)) return false
  if (selectedTags.value.length && !entry.tags?.some((t) => selectedTags.value.includes(t.name)))
    return false
  if (
    selectedVerseRanges.value.length &&
    !entry.verses?.some((v) => selectedVerseRanges.value.some((r) => verseMatchesRange(v, r)))
  )
    return false
  if (
    selectedResourceTypes.value.length &&
    !entry.resources?.some((r) => selectedResourceTypes.value.includes(r.type))
  )
    return false
  for (const [type, titles] of Object.entries(selectedResourcesByType.value)) {
    if (type === excludedResourceType || !titles?.length) continue
    if (!entry.resources?.some((r) => r.type === type && titles.includes(getResourceTitle(r))))
      return false
  }
  return true
}

const RESOURCE_TYPE_ORDER = Object.values(RESOURCE_TYPES)

const resourceTypeSections = computed(() => {
  const byType = new Map()
  journalStore.decryptedEntries.forEach((entry) => {
    entry.resources?.forEach((resource) => {
      if (!entryMatchesPending(entry, resource.type)) return
      const title = getResourceTitle(resource)
      if (!title) return
      if (!byType.has(resource.type)) byType.set(resource.type, new Set())
      byType.get(resource.type).add(title)
    })
  })
  return RESOURCE_TYPE_ORDER.filter((type) => byType.has(type)).map((type) => {
    let label
    try {
      label = pluralizeTitle(getResourceConfig(type).title)
    } catch {
      label = type
    }
    return { type, label, options: Array.from(byType.get(type)).sort() }
  })
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedTypes.value = [...journalStore.selectedFacets.types]
    selectedTags.value = [...journalStore.selectedFacets.tags]
    selectedVerseRanges.value = [...journalStore.selectedFacets.verses]
    selectedResourceTypes.value = [...journalStore.selectedFacets.resourceTypes]
    selectedResourcesByType.value = groupResourceSelections(journalStore.selectedFacets.resources)
  }
})

const selectionCaption = (selected) =>
  selected.length > 0 ? `${selected.length} selected` : undefined

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

const addVerseRange = () => {
  if (!verseBook.value) return

  let startChapter = toNumber(chapterFrom.value)
  let endChapter = toNumber(chapterTo.value) ?? startChapter
  let startVerse = startChapter ? toNumber(verseFrom.value) : null
  let endVerse = startChapter ? toNumber(verseTo.value) : null

  // Normalize reversed inputs
  if (startChapter && endChapter && endChapter < startChapter) {
    ;[startChapter, endChapter] = [endChapter, startChapter]
  }
  if (startChapter === endChapter && startVerse && endVerse && endVerse < startVerse) {
    ;[startVerse, endVerse] = [endVerse, startVerse]
  }
  // "John 3:16" with no end means just that verse
  if (startVerse && !endVerse && startChapter === endChapter) {
    endVerse = startVerse
  }

  const range = {
    book: verseBook.value,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  }
  range.label = buildVerseRangeLabel(range)

  if (!selectedVerseRanges.value.some((r) => r.label === range.label)) {
    selectedVerseRanges.value = [...selectedVerseRanges.value, range]
  }

  verseBook.value = null
  chapterFrom.value = null
  chapterTo.value = null
  verseFrom.value = null
  verseTo.value = null
}

const removeVerseRange = (range) => {
  selectedVerseRanges.value = selectedVerseRanges.value.filter((r) => r.label !== range.label)
}

const hasActiveFilters = computed(() => {
  return selectedTypes.value.length > 0 ||
    selectedTags.value.length > 0 ||
    selectedVerseRanges.value.length > 0 ||
    selectedResourceTypes.value.length > 0 ||
    flatSelectedResources.value.length > 0
})

const getSelectedCount = () => {
  return selectedTypes.value.length +
    selectedTags.value.length +
    selectedVerseRanges.value.length +
    selectedResourceTypes.value.length +
    flatSelectedResources.value.length
}

const clearAllFilters = () => {
  selectedTypes.value = []
  selectedTags.value = []
  selectedVerseRanges.value = []
  selectedResourceTypes.value = []
  selectedResourcesByType.value = {}
}

const applyFilters = () => {
  journalStore.updateFacet('types', selectedTypes.value)
  journalStore.updateFacet('tags', selectedTags.value)
  journalStore.updateFacet('verses', selectedVerseRanges.value)
  journalStore.updateFacet('resourceTypes', selectedResourceTypes.value)
  journalStore.updateFacet('resources', flatSelectedResources.value)
  isOpen.value = false
}

onMounted(() => {
  bibleDataStore.loadBooks()
})
</script>

<style scoped>
.filter-card {
  width: 640px;
  max-width: 95vw;
}

.filter-body {
  max-height: 65vh;
}
</style>
