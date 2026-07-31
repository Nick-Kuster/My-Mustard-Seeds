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

          <!-- Book of the Bible -->
          <q-expansion-item v-if="availableFacets.books.length" label="Book of the Bible"
            :caption="selectionCaption(selectedBooks)" icon="menu_book">
            <div class="q-px-md q-pb-md row q-col-gutter-x-md items-center">
              <div v-for="book in sortedBooks" :key="book" class="col-auto">
                <q-checkbox v-model="selectedBooks" :val="book" :label="book" dense />
              </div>
            </div>
          </q-expansion-item>

          <!-- Bible Verses -->
          <q-expansion-item v-if="availableFacets.books.length" label="Bible Verses"
            :caption="selectionCaption(selectedVerseRanges)" icon="auto_stories">
            <div class="q-px-md q-pb-md">
              <div class="row q-col-gutter-sm items-start">
                <div class="col-12 col-sm-5">
                  <q-select v-model="verseBook" :options="sortedBooks" label="Book" outlined dense clearable
                    options-dense hide-bottom-space />
                </div>
                <div class="col-5 col-sm-3">
                  <q-input v-model="verseFromText" label="From" placeholder="e.g. 1:1 or 1" outlined dense
                    hide-bottom-space :disable="!verseBook"
                    :error="!!verseFromText && !parseVerseFilterRef(verseFromText)"
                    error-message="chapter:verse or chapter" />
                </div>
                <div class="col-5 col-sm-3">
                  <q-input v-model="verseToText" label="To" placeholder="e.g. 2:3 or 2" outlined dense
                    hide-bottom-space :disable="!verseBook || !verseFromText"
                    :error="!!verseToText && !parseVerseFilterRef(verseToText)"
                    error-message="chapter:verse or chapter" />
                </div>
                <div class="col-2 col-sm-1 flex items-center justify-center verse-add-btn-col">
                  <q-btn round dense outline color="primary" icon="add" :disable="!canAddVerseRange"
                    @click="addVerseRange">
                    <q-tooltip>Add verse filter</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div class="text-caption text-grey q-mt-xs">
                Book alone matches the whole book; add a chapter or verse (e.g. 1 or 1:1) to narrow it
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
import { verseMatchesRange, buildVerseRangeLabel, parseVerseFilterRef } from 'src/utils/verseUtils'
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
const selectedBooks = ref([...journalStore.selectedFacets.books])
const selectedVerseRanges = ref([...journalStore.selectedFacets.verses])
const selectedResourceTypes = ref([...journalStore.selectedFacets.resourceTypes])
const selectedResourcesByType = ref(groupResourceSelections(journalStore.selectedFacets.resources))

// Verse range builder inputs — free-text "chapter:verse" (e.g. "1:1"),
// same trust-the-user pattern as VerseSelectionModal
const verseBook = ref(null)
const verseFromText = ref('')
const verseToText = ref('')

const canAddVerseRange = computed(() => {
  if (!verseBook.value) return false
  if (verseFromText.value && !parseVerseFilterRef(verseFromText.value)) return false
  if (verseToText.value && !parseVerseFilterRef(verseToText.value)) return false
  return true
})

// Mirror "From" into "To" as the user types, so a single-verse filter
// doesn't require retyping the same reference twice — but once "To" is
// edited independently, stop overwriting it (unless "From" changes again
// while "To" still matches what was last auto-filled).
watch(verseFromText, (newVal, oldVal) => {
  if (!verseToText.value || verseToText.value === oldVal) {
    verseToText.value = newVal
  }
})

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
  if (selectedBooks.value.length && !entry.verses?.some((v) => selectedBooks.value.includes(v.book)))
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
    selectedBooks.value = [...journalStore.selectedFacets.books]
    selectedVerseRanges.value = [...journalStore.selectedFacets.verses]
    selectedResourceTypes.value = [...journalStore.selectedFacets.resourceTypes]
    selectedResourcesByType.value = groupResourceSelections(journalStore.selectedFacets.resources)
  }
})

const selectionCaption = (selected) =>
  selected.length > 0 ? `${selected.length} selected` : undefined

const addVerseRange = () => {
  if (!canAddVerseRange.value) return

  const fromRef = parseVerseFilterRef(verseFromText.value)
  // Blank "to" means a single-verse (or single-chapter) selection, same as "from"
  const toRef = verseToText.value.trim() ? parseVerseFilterRef(verseToText.value) : fromRef

  let start = fromRef
  let end = toRef

  // Normalize a reversed range — verse is only compared when both sides have one
  if (start && end) {
    const chapterDiff = end.chapter - start.chapter
    const shouldSwap =
      chapterDiff < 0 ||
      (chapterDiff === 0 && start.verse != null && end.verse != null && end.verse < start.verse)
    if (shouldSwap) {
      ;[start, end] = [end, start]
    }
  }

  const range = {
    book: verseBook.value,
    startChapter: start?.chapter ?? null,
    startVerse: start?.verse ?? null,
    endChapter: end?.chapter ?? null,
    endVerse: end?.verse ?? null,
  }
  range.label = buildVerseRangeLabel(range)

  if (!selectedVerseRanges.value.some((r) => r.label === range.label)) {
    selectedVerseRanges.value = [...selectedVerseRanges.value, range]
  }

  verseBook.value = null
  verseFromText.value = ''
  verseToText.value = ''
}

const removeVerseRange = (range) => {
  selectedVerseRanges.value = selectedVerseRanges.value.filter((r) => r.label !== range.label)
}

const hasActiveFilters = computed(() => {
  return selectedTypes.value.length > 0 ||
    selectedTags.value.length > 0 ||
    selectedBooks.value.length > 0 ||
    selectedVerseRanges.value.length > 0 ||
    selectedResourceTypes.value.length > 0 ||
    flatSelectedResources.value.length > 0
})

const getSelectedCount = () => {
  return selectedTypes.value.length +
    selectedTags.value.length +
    selectedBooks.value.length +
    selectedVerseRanges.value.length +
    selectedResourceTypes.value.length +
    flatSelectedResources.value.length
}

const clearAllFilters = () => {
  selectedTypes.value = []
  selectedTags.value = []
  selectedBooks.value = []
  selectedVerseRanges.value = []
  selectedResourceTypes.value = []
  selectedResourcesByType.value = {}
}

const applyFilters = () => {
  journalStore.updateFacet('types', selectedTypes.value)
  journalStore.updateFacet('tags', selectedTags.value)
  journalStore.updateFacet('books', selectedBooks.value)
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

/* Matches the sibling columns' full height (their 8px gutter padding-top
   plus the 40px dense outlined field), so centering the button inside this
   column lines it up with the From/To boxes themselves. */
.verse-add-btn-col {
  min-height: 48px;
}
</style>
