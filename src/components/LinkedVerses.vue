<template>
  <div class="q-mb-lg">
    <div v-if="!displayOnly" class="row items-center no-wrap q-mb-sm section-header" role="button"
      @click="showVerseModal = true">
      <div class="text-subtitle1 text-weight-medium">Add Linked Verse</div>
      <q-btn flat round dense color="secondary" icon="link" class="q-ml-xs" />
    </div>
    <div v-else class="row items-center no-wrap q-mb-sm display-header">
      <div class="text-subtitle1 text-weight-medium">Linked Verses</div>
    </div>

    <div v-if="linkedVerses.length > 0" class="row q-gutter-sm">
      <VerseChip v-for="(verse, index) in linkedVerses" :key="index" :verse="verse" color="secondary"
        @remove="removeVerse(index)" :removable="!displayOnly" />
    </div>

    <VerseSelectionModal v-model="showVerseModal" @select="onVerseSelect" />
  </div>

</template>

<script setup>
import { ref, watch } from 'vue'
import VerseSelectionModal from './VerseSelectionModal.vue'
import VerseChip from 'components/VerseChip.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  displayOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const showVerseModal = ref(false)
const linkedVerses = ref([])

// Watch for changes in modelValue prop
watch(() => props.modelValue, (newValue) => {
  linkedVerses.value = [...newValue]
}, { immediate: true, deep: true })

const onVerseSelect = (verseData) => {
  linkedVerses.value.push(verseData)
  emit('update:modelValue', linkedVerses.value)
}

const removeVerse = (index) => {
  linkedVerses.value.splice(index, 1)
  emit('update:modelValue', linkedVerses.value)
}
</script>

<style scoped>
.section-header {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.display-header {
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
}

.section-header:hover {
  background: rgba(0, 0, 0, 0.05);
}

.section-header .q-btn {
  pointer-events: none;
}
</style>
