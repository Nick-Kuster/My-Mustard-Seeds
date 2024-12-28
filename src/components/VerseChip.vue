<template>
  <div class="verse-chip">
    <q-chip :color="color" text-color="white" :removable="removable" @remove="$emit('remove')" clickable
      @click="showVerseModal = true">
      {{ verse.display }}
    </q-chip>

    <VerseDisplayModal v-model="showVerseModal" :reference="verse.display" :start-verse-id="verse.startVerseId"
      :end-verse-id="verse.endVerseId" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VerseDisplayModal from './VerseDisplayModal.vue'

defineProps({
  verse: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    default: 'primary'
  },
  removable: {
    type: Boolean,
    default: true
  }
})

defineEmits(['remove'])

const showVerseModal = ref(false)
</script>
