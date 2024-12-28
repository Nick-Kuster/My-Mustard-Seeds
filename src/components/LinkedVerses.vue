<template>
  <div class="linked-verses">
    <div class="text-subtitle1 text-weight-medium q-mb-sm">Linked Verses</div>

    <!-- Display selected verses as chips -->
    <div v-if="linkedVerses.length > 0" class="q-mb-md">
      <div class="row q-gutter-sm">
        <VerseChip v-for="(verse, index) in linkedVerses" :key="index" :verse="verse" color="secondary"
          @remove="removeVerse(index)" />
      </div>
    </div>


    <!-- Add verse button -->
    <q-btn unelevated color="secondary" :label="linkedVerses.length ? 'Add Another Verse' : 'Add Linked Verse'"
      @click="showVerseModal = true" :icon="linkedVerses.length ? 'add' : 'link'" />

    <!-- Reuse the same verse selection modal -->
    <VerseSelectionModal v-model="showVerseModal" @select="onVerseSelect" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VerseSelectionModal from './VerseSelectionModal.vue'
import VerseChip from 'components/VerseChip.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const showVerseModal = ref(false)
const linkedVerses = ref(props.modelValue || [])

const onVerseSelect = (verseData) => {
  linkedVerses.value.push(verseData)
  emit('update:modelValue', linkedVerses.value)
}

const removeVerse = (index) => {
  linkedVerses.value.splice(index, 1)
  emit('update:modelValue', linkedVerses.value)
}
</script>
