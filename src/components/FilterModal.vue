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
          <!-- Saved Filters -->
          <q-expansion-item v-if="savedFiltersStore.filters.length" label="Saved Filters" data-tour="filter-saved"
            :caption="`${savedFiltersStore.filters.length} saved`" icon="bookmark" default-opened>
            <q-list dense class="q-pb-sm">
              <q-item v-for="saved in savedFiltersStore.filters" :key="saved.id" clickable
                @click="applySavedFilter(saved)">
                <q-item-section v-if="editingSavedFilterId !== saved.id">
                  {{ saved.name }}
                </q-item-section>
                <q-item-section v-else @click.stop>
                  <q-input v-model="editSavedFilterName" dense outlined autofocus
                    @keyup.enter="confirmRenameSavedFilter(saved)" @keyup.esc="cancelRenameSavedFilter" />
                </q-item-section>
                <q-item-section side>
                  <div class="row no-wrap q-gutter-xs">
                    <template v-if="editingSavedFilterId === saved.id">
                      <q-btn flat round dense icon="check" color="primary" size="sm"
                        :loading="savingSavedFilterEdit" :disable="!editSavedFilterName.trim()"
                        @click.stop="confirmRenameSavedFilter(saved)" />
                      <q-btn flat round dense icon="close" size="sm" @click.stop="cancelRenameSavedFilter" />
                    </template>
                    <template v-else>
                      <q-btn flat round dense icon="edit" size="sm" @click.stop="startRenameSavedFilter(saved)">
                        <q-tooltip>Rename</q-tooltip>
                      </q-btn>
                      <q-btn flat round dense icon="delete" size="sm" color="negative"
                        @click.stop="openDeleteSavedFilter(saved)">
                        <q-tooltip>Delete</q-tooltip>
                      </q-btn>
                    </template>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <!-- Journal Types -->
          <q-expansion-item v-if="availableFacets.types.length" label="Journal Types" data-tour="filter-types"
            :caption="selectionCaption(selectedTypes)" icon="category">
            <div class="q-px-md q-pb-md row q-col-gutter-x-md items-center">
              <div v-for="type in availableFacets.types" :key="type" class="col-auto">
                <q-checkbox v-model="selectedTypes" :val="type" :label="type" dense />
              </div>
            </div>
          </q-expansion-item>

          <!-- Tags -->
          <q-expansion-item v-if="availableFacets.tags.length" label="Tags" data-tour="filter-tags"
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
          <q-expansion-item v-if="availableFacets.books.length" label="Bible Verses" data-tour="filter-verses"
            :caption="selectionCaption(selectedVerseRanges)" icon="auto_stories">
            <div class="q-px-md q-pb-md">
              <div class="row q-col-gutter-sm items-start">
                <div class="col-12 col-sm-5">
                  <q-select v-model="verseBook" :options="filteredVerseBooks" label="Book" outlined dense clearable
                    options-dense hide-bottom-space use-input fill-input hide-selected input-debounce="0"
                    @filter="filterVerseBooks" />
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
            data-tour="filter-resources" :caption="selectionCaption(flatSelectedResources)" icon="library_books">
            <div class="q-px-md q-pb-md">
              <q-select v-for="section in resourceTypeSections" :key="section.type"
                :model-value="selectedResourcesByType[section.type] || []"
                @update:model-value="(v) => setResourceSelection(section.type, v)"
                :options="resourceOptionsFor(section)"
                multiple outlined dense use-chips stack-label :label="section.label" options-dense
                use-input input-debounce="0" @filter="(val, update) => filterResourceSection(section, val, update)"
                class="q-mb-sm" />
              <div class="text-caption text-grey">
                Options narrow to match your other selected filters
              </div>
            </div>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-py-sm" data-tour="filter-save-row">
        <div class="row items-center q-gutter-sm">
          <q-input v-model="newFilterName" dense outlined :disable="!hasActiveFilters"
            placeholder="Save current selection as..." class="col" @keyup.enter="saveCurrentFilter" />
          <q-btn outline dense no-caps color="primary" icon="bookmark_add" label="Save Filter"
            :disable="!hasActiveFilters || !newFilterName.trim()" :loading="savingFilter"
            @click="saveCurrentFilter" />
        </div>
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
            <q-btn color="primary" label="Apply Filters" data-tour="filter-apply-btn" @click="applyFilters" />
          </div>
        </div>
      </q-card-actions>
    </q-card>

    <!-- Delete saved filter confirmation -->
    <q-dialog v-model="showDeleteSavedFilterDialog">
      <q-card style="width: 90vw; max-width: 320px">
        <q-card-section>
          <div class="text-h6">Delete "{{ deletingSavedFilter?.name }}"?</div>
        </q-card-section>
        <q-card-section class="q-pt-none text-body2">
          This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deletingSavedFilterBusy"
            @click="confirmDeleteSavedFilter" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useJournalStore, getResourceTitle } from 'stores/journalData'
import { useBibleDataStore } from 'stores/bibleData'
import { useSavedFiltersStore } from 'stores/savedFilters'
import { verseMatchesRange, buildVerseRangeLabel, parseVerseFilterRef } from 'src/utils/verseUtils'
import { getResourceConfig, pluralizeTitle } from 'src/configs/resourceConfigs'
import { RESOURCE_TYPES } from 'src/constants/resourceTypes'
import { FACET_KEYS } from 'src/utils/searchRoute'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'applied'])

const $q = useQuasar()
const journalStore = useJournalStore()
const bibleDataStore = useBibleDataStore()
const savedFiltersStore = useSavedFiltersStore()
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
const selectedQuotes = ref([...journalStore.selectedFacets.quotes])
const selectedLinks = ref([...journalStore.selectedFacets.links])
const selectedStrongs = ref([...journalStore.selectedFacets.strongs])
const selectedFavorites = ref([...journalStore.selectedFacets.favorites])

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

// Type-ahead filtering for the verse-range book select — kept in sync with
// sortedBooks (not just set once) since it can change while the dialog is
// open (entries/facets loading in).
const filteredVerseBooks = ref([])
watch(sortedBooks, (books) => { filteredVerseBooks.value = books }, { immediate: true })

const filterVerseBooks = (val, update) => {
  update(() => {
    if (!val) {
      filteredVerseBooks.value = sortedBooks.value
      return
    }
    const needle = val.toLowerCase()
    filteredVerseBooks.value = sortedBooks.value.filter((b) => b.toLowerCase().includes(needle))
  })
}

// Type-ahead filtering for the per-resource-type multi-selects, keyed by
// section.type since each renders its own q-select instance. Cleared
// whenever the dialog reopens so a stale filtered list from a previous
// visit doesn't linger; typing derives a fresh one from that section's
// current (already facet-narrowed) options.
const filteredResourceOptionsByType = reactive({})

const resourceOptionsFor = (section) => filteredResourceOptionsByType[section.type] || section.options

const filterResourceSection = (section, val, update) => {
  update(() => {
    if (!val) {
      filteredResourceOptionsByType[section.type] = section.options
      return
    }
    const needle = val.toLowerCase()
    filteredResourceOptionsByType[section.type] = section.options.filter((o) => o.toLowerCase().includes(needle))
  })
}

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
  if (selectedQuotes.value.length && !entry.quotes?.some((q) => selectedQuotes.value.includes(q.source)))
    return false
  if (selectedLinks.value.length && !entry.links?.some((l) => selectedLinks.value.includes(l.name)))
    return false
  if (selectedStrongs.value.length && !entry.strongs?.some((s) => selectedStrongs.value.includes(s.strongs_number)))
    return false
  if (selectedFavorites.value.length && !entry.is_favorite) return false
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
    selectedQuotes.value = [...journalStore.selectedFacets.quotes]
    selectedLinks.value = [...journalStore.selectedFacets.links]
    selectedStrongs.value = [...journalStore.selectedFacets.strongs]
    selectedFavorites.value = [...journalStore.selectedFacets.favorites]
    Object.keys(filteredResourceOptionsByType).forEach((key) => delete filteredResourceOptionsByType[key])
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
    flatSelectedResources.value.length > 0 ||
    selectedQuotes.value.length > 0 ||
    selectedLinks.value.length > 0 ||
    selectedStrongs.value.length > 0 ||
    selectedFavorites.value.length > 0
})

const getSelectedCount = () => {
  return selectedTypes.value.length +
    selectedTags.value.length +
    selectedBooks.value.length +
    selectedVerseRanges.value.length +
    selectedResourceTypes.value.length +
    flatSelectedResources.value.length +
    selectedQuotes.value.length +
    selectedLinks.value.length +
    selectedStrongs.value.length +
    selectedFavorites.value.length
}

const clearAllFilters = () => {
  selectedTypes.value = []
  selectedTags.value = []
  selectedBooks.value = []
  selectedVerseRanges.value = []
  selectedResourceTypes.value = []
  selectedResourcesByType.value = {}
  selectedQuotes.value = []
  selectedLinks.value = []
  selectedStrongs.value = []
  selectedFavorites.value = []
}

const applyFilters = () => {
  journalStore.updateFacet('types', selectedTypes.value)
  journalStore.updateFacet('tags', selectedTags.value)
  journalStore.updateFacet('books', selectedBooks.value)
  journalStore.updateFacet('verses', selectedVerseRanges.value)
  journalStore.updateFacet('resourceTypes', selectedResourceTypes.value)
  journalStore.updateFacet('resources', flatSelectedResources.value)
  journalStore.updateFacet('quotes', selectedQuotes.value)
  journalStore.updateFacet('links', selectedLinks.value)
  journalStore.updateFacet('strongs', selectedStrongs.value)
  journalStore.updateFacet('favorites', selectedFavorites.value)
  isOpen.value = false
  emit('applied')
}

// Saved filters: named presets of the same facet shape as the store's
// selectedFacets. quotes/links are always saved empty since this modal has
// no controls for them (nothing else here ever sets those facet keys).
const currentFacetsSnapshot = () => ({
  types: selectedTypes.value,
  tags: selectedTags.value,
  books: selectedBooks.value,
  verses: selectedVerseRanges.value,
  resourceTypes: selectedResourceTypes.value,
  resources: flatSelectedResources.value,
  quotes: selectedQuotes.value,
  links: selectedLinks.value,
  strongs: selectedStrongs.value,
  favorites: selectedFavorites.value,
})

const newFilterName = ref('')
const savingFilter = ref(false)

// Saving under a name that already exists updates that saved filter's
// facets in place (an easy "refresh this preset with today's selection")
// rather than erroring on the table's unique-name constraint.
const saveCurrentFilter = async () => {
  const name = newFilterName.value.trim()
  if (!name || !hasActiveFilters.value) return

  savingFilter.value = true
  try {
    const existing = savedFiltersStore.filters.find((f) => f.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      await savedFiltersStore.updateFilter(existing.id, { facets: currentFacetsSnapshot() })
      $q.notify({ type: 'positive', message: `Updated "${name}"` })
    } else {
      await savedFiltersStore.saveFilter(name, currentFacetsSnapshot())
      $q.notify({ type: 'positive', message: `Saved "${name}" to Home` })
    }
    newFilterName.value = ''
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save filter' })
  } finally {
    savingFilter.value = false
  }
}

// Applying a saved filter writes straight to the store (bypassing this
// modal's local staged refs) and closes immediately, same as Apply Filters
// — it's meant to be a one-click "jump to this view," not a starting point
// to tweak further.
const applySavedFilter = (saved) => {
  FACET_KEYS.forEach((key) => {
    const values = saved.facets?.[key]
    journalStore.updateFacet(key, Array.isArray(values) ? values : [])
  })
  isOpen.value = false
  emit('applied')
}

const editingSavedFilterId = ref(null)
const editSavedFilterName = ref('')
const savingSavedFilterEdit = ref(false)

const startRenameSavedFilter = (saved) => {
  editingSavedFilterId.value = saved.id
  editSavedFilterName.value = saved.name
}

const cancelRenameSavedFilter = () => {
  editingSavedFilterId.value = null
  editSavedFilterName.value = ''
}

const confirmRenameSavedFilter = async (saved) => {
  const name = editSavedFilterName.value.trim()
  if (!name || name === saved.name) {
    cancelRenameSavedFilter()
    return
  }
  savingSavedFilterEdit.value = true
  try {
    await savedFiltersStore.updateFilter(saved.id, { name })
    cancelRenameSavedFilter()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.code === '23505' ? 'A saved filter with that name already exists' : 'Failed to rename filter',
    })
  } finally {
    savingSavedFilterEdit.value = false
  }
}

const showDeleteSavedFilterDialog = ref(false)
const deletingSavedFilter = ref(null)
const deletingSavedFilterBusy = ref(false)

const openDeleteSavedFilter = (saved) => {
  deletingSavedFilter.value = saved
  showDeleteSavedFilterDialog.value = true
}

const confirmDeleteSavedFilter = async () => {
  deletingSavedFilterBusy.value = true
  try {
    await savedFiltersStore.deleteFilter(deletingSavedFilter.value.id)
    showDeleteSavedFilterDialog.value = false
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to delete saved filter' })
  } finally {
    deletingSavedFilterBusy.value = false
  }
}

onMounted(() => {
  bibleDataStore.loadBooks()
  savedFiltersStore.fetchFilters()
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
