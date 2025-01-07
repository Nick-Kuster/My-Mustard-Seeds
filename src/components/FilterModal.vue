<!-- FilterModal.vue -->
<template>
  <q-dialog v-model="isOpen" persistent maximized>
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Filter Seeds</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <div class="row q-col-gutter-md">
          <!-- Journal Types -->
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Journal Types</div>
            <q-option-group v-model="selectedTypes"
              :options="availableFacets.types.map(type => ({ label: type, value: type }))" type="checkbox" dense />
          </div>

          <!-- Tags -->
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Tags</div>
            <div class="row q-col-gutter-sm items-center">
              <template v-for="tag in availableFacets.tags" :key="tag">
                <div class="col-auto">
                  <q-checkbox v-model="selectedTags" :val="tag" :label="tag" />
                </div>
              </template>
            </div>
          </div>

          <!-- Bible Verses -->
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Bible Verses</div>
            <q-select v-model="selectedVerses" :options="availableFacets.verses" multiple outlined dense use-chips
              stack-label label="Select verses" />
          </div>

          <!-- Resource Types -->
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Resource Types</div>
            <q-option-group v-model="selectedResourceTypes"
              :options="availableFacets.resourceTypes.map(type => ({ label: type, value: type }))" type="checkbox"
              dense />
          </div>

          <!-- Resources -->
          <div class="col-12">
            <div class="text-subtitle1 q-mb-sm">Resources</div>
            <q-select v-model="selectedResources" :options="availableFacets.resources" multiple outlined dense use-chips
              stack-label label="Select resources" />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
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
import { ref, computed, watch } from 'vue'
import { useJournalStore } from 'stores/journalData'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const journalStore = useJournalStore()
const availableFacets = computed(() => journalStore.availableFacets)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Initialize selected values from store
const selectedTypes = ref([...journalStore.selectedFacets.types])
const selectedTags = ref([...journalStore.selectedFacets.tags])
const selectedVerses = ref([...journalStore.selectedFacets.verses])
const selectedResourceTypes = ref([...journalStore.selectedFacets.resourceTypes])
const selectedResources = ref([...journalStore.selectedFacets.resources])

// Watch for dialog opening to sync with store state
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedTypes.value = [...journalStore.selectedFacets.types]
    selectedTags.value = [...journalStore.selectedFacets.tags]
    selectedVerses.value = [...journalStore.selectedFacets.verses]
    selectedResourceTypes.value = [...journalStore.selectedFacets.resourceTypes]
    selectedResources.value = [...journalStore.selectedFacets.resources]
  }
})

const hasActiveFilters = computed(() => {
  return selectedTypes.value.length > 0 ||
    selectedTags.value.length > 0 ||
    selectedVerses.value.length > 0 ||
    selectedResourceTypes.value.length > 0 ||
    selectedResources.value.length > 0
})

const getSelectedCount = () => {
  return selectedTypes.value.length +
    selectedTags.value.length +
    selectedVerses.value.length +
    selectedResourceTypes.value.length +
    selectedResources.value.length
}

const clearAllFilters = () => {
  selectedTypes.value = []
  selectedTags.value = []
  selectedVerses.value = []
  selectedResourceTypes.value = []
  selectedResources.value = []
}

const applyFilters = () => {
  journalStore.updateFacet('types', selectedTypes.value)
  journalStore.updateFacet('tags', selectedTags.value)
  journalStore.updateFacet('verses', selectedVerses.value)
  journalStore.updateFacet('resourceTypes', selectedResourceTypes.value)
  journalStore.updateFacet('resources', selectedResources.value)
  isOpen.value = false
}
</script>
