<template>
  <node-view-wrapper as="span" class="inline-ref-link" contenteditable="false" @click="onClick">{{ label
    }}</node-view-wrapper>
</template>

<script setup>
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

// Shared by all three reference node types (verse/tag/strongs) — they only
// differ in how their attrs format into a display label.
const props = defineProps(nodeViewProps)

const label = computed(() => {
  const attrs = props.node.attrs
  if (props.node.type.name === 'tagReference') return `#${attrs.tagName}`
  return attrs.display
})

// NodeViews live outside the host component's own emit tree, so the click
// reaches ContentSectionView.vue's @verse-click/@tag-click/@strongs-click
// handlers by being threaded through extension.options — see each
// *ReferenceNode.js's addOptions() and useReferenceExtensions.js's
// .configure({ onClick }).
const onClick = () => {
  props.extension.options.onClick?.(props.node.attrs)
}
</script>

<style scoped>
.inline-ref-link {
  display: inline;
  color: var(--q-secondary);
  text-decoration: underline;
  text-decoration-style: dotted;
  cursor: pointer;
}

.inline-ref-link:hover {
  opacity: 0.8;
}
</style>
