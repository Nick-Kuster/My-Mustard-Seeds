<template>
  <div class="rich-text-toolbar-wrap" :style="toolbarSurfaceStyle">
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
      <q-btn flat dense round size="sm" :ripple="false" icon="format_list_bulleted"
        :color="isActive('bulletList') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleBulletList().run()">
        <q-tooltip>Bullet list</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_list_numbered"
        :color="isActive('orderedList') ? 'primary' : undefined"
        @mousedown.prevent @click="editor.chain().focus().toggleOrderedList().run()">
        <q-tooltip>Numbered list</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_indent_increase"
        :disable="!canSinkListItem()"
        @mousedown.prevent @click="editor.chain().focus().sinkListItem('listItem').run()">
        <q-tooltip>Indent list item</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_indent_decrease"
        :disable="!canLiftListItem()"
        @mousedown.prevent @click="editor.chain().focus().liftListItem('listItem').run()">
        <q-tooltip>Outdent list item</q-tooltip>
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

    <GlyphPickerDialog v-model="showGlyphDialog" @select="onGlyphSelect" @select-glyph="onGlyphNodeSelect" />
    <TextStyleDialog v-model="showTextStyleDialog" :editor="editor" />
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
import { Notify } from 'quasar'
import GlyphPickerDialog from './GlyphPickerDialog.vue'
import TextStyleDialog from './TextStyleDialog.vue'
import { useImageUpload } from 'src/composables/useImageUpload'
import { getSectionStyle } from 'src/utils/sectionColors'

const props = defineProps({
  editor: { type: Object, required: true },
  sectionColor: { type: String, default: '' },
  sectionTextColor: { type: String, default: '' },
})

const toolbarSurfaceStyle = computed(() => {
  const style = getSectionStyle({ color: props.sectionColor, textColor: props.sectionTextColor })
  return {
    backgroundColor: style.backgroundColor || 'var(--color-surface-alt)',
    color: style.color || 'var(--color-text)',
    ...(style['--section-text-color'] ? { '--section-text-color': style['--section-text-color'] } : {}),
  }
})

const showGlyphDialog = ref(false)
const showTextStyleDialog = ref(false)

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

const canSinkListItem = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().sinkListItem('listItem')
}

const canLiftListItem = () => {
  void revision.value // establish reactive dependency
  return props.editor.can().liftListItem('listItem')
}
</script>

<style scoped>
.rich-text-toolbar-wrap {
  position: sticky;
  top: 107px;
  z-index: 20;
  margin-bottom: 8px;
  padding: 0 0 2px;
  border-bottom: 1px solid var(--color-border);
}

.rich-text-toolbar {
  padding: 4px 0;
}

.rich-text-file-input {
  display: none;
}
</style>
