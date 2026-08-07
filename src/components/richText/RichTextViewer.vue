<template>
  <editor-content :editor="editor" class="rich-text-viewer" />
</template>

<script setup>
import { watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { useReferenceExtensions } from 'src/composables/useReferenceExtensions'
import { legacyStringToDoc } from 'src/utils/richTextContent'

// Read-only. Accepts EITHER a rich-doc JSON object or a legacy plain
// string (an entry saved before this migration) — normalized the same
// way RichTextEditor.vue does, but with no resolver ever run on the
// result: literal `::`/`#`/`$` text in an old entry just renders as
// inert plain text, unstyled and unclickable, by construction rather
// than via a separate legacy-rendering code path. It upgrades the moment
// the entry is reopened and resaved through RichTextEditor.vue.
const props = defineProps({
  content: { type: [String, Object], default: null },
})

const emit = defineEmits(['verse-click', 'tag-click', 'strongs-click'])

const normalize = (value) => (typeof value === 'string' ? legacyStringToDoc(value) : value)

const editor = useEditor({
  content: normalize(props.content),
  editable: false,
  extensions: useReferenceExtensions({
    onVerseClick: (attrs) => emit('verse-click', attrs),
    onTagClick: (attrs) => emit('tag-click', { name: attrs.tagName, id: attrs.tagId }),
    onStrongsClick: (attrs) => emit('strongs-click', attrs),
  }),
})

// ContentSectionView.vue reuses this component instance across different
// sections/entries — content is only read at construction otherwise.
watch(() => props.content, (value) => {
  editor.value?.commands.setContent(normalize(value), false)
})
</script>

<style scoped>
.rich-text-viewer :deep(.ProseMirror) {
  outline: none;
  white-space: pre-wrap;
}

.rich-text-viewer :deep(p) {
  margin: 0 0 4px;
}

.rich-text-viewer :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-text-viewer :deep(ul),
.rich-text-viewer :deep(ol) {
  margin: 0 0 4px;
  padding-left: 1.25em;
}

.rich-text-viewer :deep(li p) {
  margin: 0;
}

.rich-text-viewer :deep(h1),
.rich-text-viewer :deep(h2),
.rich-text-viewer :deep(h3) {
  margin: 0 0 4px;
  line-height: 1.3;
}

.rich-text-viewer :deep(h1) {
  font-size: 1.5em;
}

.rich-text-viewer :deep(h2) {
  font-size: 1.25em;
}

.rich-text-viewer :deep(h3) {
  font-size: 1.1em;
}

.rich-text-viewer :deep(blockquote) {
  margin: 0 0 4px;
  padding-left: 12px;
  border-left: 3px solid var(--color-border, #ccc);
  color: var(--color-text-secondary, inherit);
  font-style: italic;
}

.rich-text-viewer :deep(blockquote p) {
  margin: 0;
}
</style>
