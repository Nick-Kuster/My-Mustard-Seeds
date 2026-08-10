<template>
  <div class="rich-text-toolbar-wrap">
    <div class="row items-center q-gutter-xs rich-text-toolbar" data-tour="rich-text-toolbar">
      <q-btn flat dense round size="sm" :ripple="false" icon="undo" :disable="!canUndo()"
        @mousedown.prevent @click="editor.chain().focus().undo().run()">
        <q-tooltip>Undo</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="redo" :disable="!canRedo()"
        @mousedown.prevent @click="editor.chain().focus().redo().run()">
        <q-tooltip>Redo</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="title"
        :color="isActive('heading') ? 'primary' : undefined"
        @mousedown.prevent @click="showTextStyleDialog = true" />
      <q-btn flat dense round size="sm" :ripple="false"
        :color="isActive('blockquote') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleBlockquote().run()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="4" x2="4" y2="20" />
          <line x1="9" y1="7" x2="20" y2="7" />
          <line x1="9" y1="12" x2="16" y2="12" />
          <line x1="9" y1="17" x2="19" y2="17" />
        </svg>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_bold" :color="isActive('bold') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleBold().run()" />
      <q-btn flat dense round size="sm" :ripple="false" icon="format_italic" :color="isActive('italic') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleItalic().run()" />
      <q-btn flat dense round size="sm" :ripple="false" icon="format_underlined" :color="isActive('underline') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleUnderline().run()" />
      <q-btn flat dense round size="sm" :ripple="false" icon="strikethrough_s" :color="isActive('strike') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleStrike().run()" />
      <q-btn flat dense round size="sm" :ripple="false" icon="format_list_bulleted"
        :color="isActive('bulletList') || isActive('orderedList') ? 'primary' : undefined"
        @mousedown.prevent @click="showListDialog = true" />

      <!-- Reunited into the main row after confirming the SVG-icon fix
           (below) also resolves click-routing here, not just the glyph
           painting in the separated row2 layout — if this regresses
           (Bold/Italic/Underline/Strike misrouting to Highlight again),
           the fix is to split these back into their own row/container,
           which is the one thing that's reliably worked before. -->
      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('highlight') ? 'primary' : undefined"
        @mousedown.prevent @click="showHighlightDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l4 4" />
          <path d="M4 20l3-1 9-9a1.9 1.9 0 0 0-3-3l-9 9-1 3z" />
        </svg>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('textStyle') ? 'primary' : undefined"
        @mousedown.prevent @click="showTextColorDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <text x="12" y="16" font-size="14" text-anchor="middle" fill="currentColor" font-family="sans-serif">A</text>
          <rect x="4" y="19" width="16" height="3" fill="currentColor" />
        </svg>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" data-tour="rich-text-glyph-btn"
        @mousedown.prevent @click="showGlyphDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18" />
          <path d="M7 8h10" />
        </svg>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" :loading="uploading" data-tour="rich-text-image-btn"
        @mousedown.prevent @click="fileInputRef?.click()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L5 19" />
        </svg>
      </q-btn>
      <input ref="fileInputRef" type="file" accept="image/*" class="rich-text-file-input" @change="onFileSelected" />
    </div>

    <ColorPickerDialog v-model="showHighlightDialog" title="Highlight color" :swatches="HIGHLIGHT_SWATCHES"
      @select="onHighlightSelect" @clear="editor.chain().focus().unsetHighlight().run()" />
    <ColorPickerDialog v-model="showTextColorDialog" title="Text color" :swatches="TEXT_COLOR_SWATCHES"
      @select="onTextColorSelect" @clear="editor.chain().focus().unsetColor().run()" />
    <GlyphPickerDialog v-model="showGlyphDialog" @select="onGlyphSelect" @select-glyph="onGlyphNodeSelect" />
    <TextStyleDialog v-model="showTextStyleDialog" :editor="editor" />
    <ListOptionsDialog v-model="showListDialog" :editor="editor" />
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { Notify } from 'quasar'
import ColorPickerDialog from './ColorPickerDialog.vue'
import GlyphPickerDialog from './GlyphPickerDialog.vue'
import TextStyleDialog from './TextStyleDialog.vue'
import ListOptionsDialog from './ListOptionsDialog.vue'
import { useImageUpload } from 'src/composables/useImageUpload'

const props = defineProps({
  editor: { type: Object, required: true },
})

const HIGHLIGHT_SWATCHES = [
  { color: '#fef08a', label: 'Yellow' },
  { color: '#bbf7d0', label: 'Green' },
  { color: '#bfdbfe', label: 'Blue' },
  { color: '#fbcfe8', label: 'Pink' },
  { color: '#fed7aa', label: 'Orange' },
  { color: '#e9d5ff', label: 'Purple' },
  { color: '#fecaca', label: 'Red' },
  { color: '#e5e7eb', label: 'Gray' },
]

const TEXT_COLOR_SWATCHES = [
  { color: '#000000', label: 'Black' },
  { color: '#ffffff', label: 'White' },
  { color: '#dc2626', label: 'Red' },
  { color: '#ea580c', label: 'Orange' },
  { color: '#ca8a04', label: 'Yellow' },
  { color: '#16a34a', label: 'Green' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#6b7280', label: 'Gray' },
]

const showHighlightDialog = ref(false)
const showTextColorDialog = ref(false)
const showGlyphDialog = ref(false)
const showTextStyleDialog = ref(false)
const showListDialog = ref(false)

const fileInputRef = ref(null)
const { uploading, uploadImage } = useImageUpload()

const onFileSelected = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  try {
    const { imagePath, mimeType } = await uploadImage(file)
    props.editor
      .chain()
      .focus()
      .insertContent({ type: 'imageReference', attrs: { imagePath, mimeType, alt: '' } })
      .run()
  } catch (err) {
    Notify.create({ type: 'negative', message: err.message || 'Failed to upload image' })
  }
}

const onHighlightSelect = (color) => {
  props.editor.chain().focus().setHighlight({ color }).run()
}

const onTextColorSelect = (color) => {
  props.editor.chain().focus().setColor(color).run()
}

const onGlyphSelect = (char) => {
  props.editor.chain().focus().insertContent(char).run()
}

const onGlyphNodeSelect = (glyphId) => {
  props.editor.chain().focus().insertContent({ type: 'glyphReference', attrs: { glyphId } }).run()
}

// editor.isActive(...) isn't itself reactive — @tiptap/vue-3's
// useEditorState() composable (built for exactly this) isn't available
// in the installed version, so fall back to bumping a ref on every
// transaction to force the toolbar to re-evaluate active states.
const revision = ref(0)
const onTransaction = () => {
  revision.value++
}

onMounted(() => {
  props.editor.on('transaction', onTransaction)
})

onBeforeUnmount(() => {
  props.editor.off('transaction', onTransaction)
})

const isActive = (name, attrs) => {
  void revision.value // establish reactive dependency
  return props.editor.isActive(name, attrs)
}

const canUndo = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().undo()
}

const canRedo = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().redo()
}
</script>

<style scoped>
/* position deliberately left unset on .rich-text-toolbar-wrap here — see
   RichTextEditor.vue's .rich-text-toolbar-pinned, which sets
   position: sticky via class passthrough onto this component's root. */
.rich-text-toolbar {
  padding: 4px 0;
}

.rich-text-file-input {
  display: none;
}
</style>
