<template>
  <q-dialog v-model="isOpen">
    <q-card class="strongs-modal" style="min-width: 320px; max-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">
          {{ entry?.lemma }}
          <span class="text-caption text-grey-6">{{ entry?.strongs_number }}</span>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section v-if="entry" class="q-pt-lg">
        <div v-if="entry.transliteration" class="text-subtitle2 text-grey-8 q-mb-sm">
          {{ entry.transliteration }}<span v-if="entry.pronunciation"> ({{ entry.pronunciation }})</span>
        </div>
        <div v-if="entry.strongs_def" class="q-mb-sm">{{ entry.strongs_def }}</div>
        <div v-if="entry.kjv_def" class="text-caption text-grey-8">KJV: {{ entry.kjv_def }}</div>
        <div v-if="entry.derivation" class="text-caption text-grey-8 q-mt-sm">{{ entry.derivation }}</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  entry: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<style scoped>
.strongs-modal {
  background-color: var(--color-parchment);
}

.strongs-modal :deep(.q-card__section) {
  background-color: var(--color-parchment);
}

.strongs-modal :deep(.q-card__section:first-child) {
  background-color: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border-light);
}
</style>
