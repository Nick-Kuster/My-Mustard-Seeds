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

      <q-card-actions v-if="blueLetterBibleUrl" align="right">
        <q-btn flat no-caps label="Open in Blue Letter Bible" icon="open_in_new" type="a" :href="blueLetterBibleUrl"
          target="_blank" rel="noopener noreferrer" />
      </q-card-actions>
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

// BLB's lexicon URLs are keyed by the lowercased H/G strongs number, then a
// fixed translation code and an underlying-text code that differs by
// language — "wlc" (Westminster Leningrad Codex) for Hebrew entries, "tr"
// (Textus Receptus) for Greek, distinguishable from the number's own H/G
// prefix alone.
const blueLetterBibleUrl = computed(() => {
  const number = props.entry?.strongs_number
  if (!number) return null

  const lower = number.toLowerCase()
  const textCode = lower.startsWith('h') ? 'wlc' : 'tr'
  return `https://www.blueletterbible.org/lexicon/${lower}/nasb20/${textCode}/0-1/`
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
