<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 240px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1">Text Style</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-list class="q-pb-sm">
        <q-item v-for="option in OPTIONS" :key="option.label" clickable @click="apply(option)">
          <q-item-section :class="option.previewClass">{{ option.label }}</q-item-section>
          <q-item-section v-if="isActive(option)" side>
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editor: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Blockquote is its own dedicated toolbar button now, not in here — it's
// a wrapper that can apply on top of a paragraph or heading, not a
// mutually-exclusive "which text style is this" choice like the options
// below are, so it didn't fit this list's single-select shape.
const OPTIONS = [
  { label: 'Normal Text', kind: 'paragraph', previewClass: 'text-body1' },
  { label: 'Heading 1', kind: 'heading', level: 1, previewClass: 'text-h5' },
  { label: 'Heading 2', kind: 'heading', level: 2, previewClass: 'text-h6' },
  { label: 'Heading 3', kind: 'heading', level: 3, previewClass: 'text-subtitle1' },
]

// Checked once per render, when the dialog opens — no live-updating
// reactive subscription needed here the way the toolbar's `revision` hack
// is, since a q-dialog's content only exists in the DOM while open, and
// every option here closes the dialog immediately on selection.
const isActive = (option) => {
  if (option.kind === 'paragraph') return props.editor.isActive('paragraph')
  return props.editor.isActive('heading', { level: option.level })
}

const apply = (option) => {
  const chain = props.editor.chain().focus()
  if (option.kind === 'paragraph') chain.setParagraph()
  else chain.toggleHeading({ level: option.level })
  chain.run()
  show.value = false
}
</script>
