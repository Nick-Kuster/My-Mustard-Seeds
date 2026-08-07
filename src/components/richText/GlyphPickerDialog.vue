<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 280px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1">Insert symbol</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="glyph-grid">
        <button
          v-for="item in GRID_ITEMS"
          :key="item.label"
          type="button"
          class="glyph-btn"
          :aria-label="item.label"
          @click="select(item)"
        >
          <span v-if="item.type === 'svg'" class="glyph-svg" v-html="item.svg" />
          <template v-else>{{ item.char }}</template>
          <q-tooltip>{{ item.label }}</q-tooltip>
        </button>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { CHRISTIAN_GLYPHS } from 'src/utils/christianGlyphs'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select', 'select-glyph'])

// Built from the same registry GlyphReferenceNodeView.vue renders from —
// the preview grid can never show something different than what actually
// gets inserted.
const SVG_ITEMS = Object.entries(CHRISTIAN_GLYPHS).map(([glyphId, glyph]) => ({
  type: 'svg', glyphId, label: glyph.label, svg: glyph.svg,
}))

const TEXT_ITEMS = [
  { type: 'text', char: '✝', label: 'Cross' },
  { type: 'text', char: '⛪', label: 'Church' },
  { type: 'text', char: '👑', label: 'Crown' },
  { type: 'text', char: '🐑', label: 'Lamb' },
  { type: 'text', char: '🕯', label: 'Candle' },
  { type: 'text', char: '⚓', label: 'Anchor' },
  { type: 'text', char: '🌿', label: 'Olive branch' },
]

const GRID_ITEMS = [TEXT_ITEMS[0], ...SVG_ITEMS, ...TEXT_ITEMS.slice(1)]

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const select = (item) => {
  if (item.type === 'svg') {
    emit('select-glyph', item.glyphId)
  } else {
    emit('select', item.char)
  }
  show.value = false
}
</script>

<style scoped>
.glyph-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding-top: 12px;
}

.glyph-btn {
  width: 100%;
  aspect-ratio: 1;
  min-height: 44px;
  font-size: 22px;
  line-height: 1;
  border-radius: 8px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glyph-btn:active {
  transform: scale(0.92);
}

.glyph-svg {
  display: inline-flex;
}

.glyph-svg :deep(svg) {
  width: 24px;
  height: 24px;
}
</style>
