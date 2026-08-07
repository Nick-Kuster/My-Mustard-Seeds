<template>
  <node-view-wrapper as="span" class="glyph-ref" contenteditable="false" :aria-label="glyph?.label">
    <span v-html="glyph?.svg" />
  </node-view-wrapper>
</template>

<script setup>
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { CHRISTIAN_GLYPHS } from 'src/utils/christianGlyphs'

const props = defineProps(nodeViewProps)

const glyph = computed(() => CHRISTIAN_GLYPHS[props.node.attrs.glyphId])
</script>

<style scoped>
.glyph-ref {
  display: inline-flex;
  vertical-align: middle;
  color: inherit;
}

.glyph-ref :deep(svg) {
  height: 1em;
  width: 1em;
}
</style>
