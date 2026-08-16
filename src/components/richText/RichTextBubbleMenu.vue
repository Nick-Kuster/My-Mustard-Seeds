<template>
  <BubbleMenu
    :editor="editor"
    :update-delay="0"
    :options="{ placement: 'top', offset: 8, flip: true, shift: true }"
    class="rich-text-bubble-menu"
  >
    <div class="bubble-menu-row" :style="menuSurfaceStyle" @mousedown.prevent>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_bold"
        :color="isActive('bold') ? 'primary' : undefined"
        @click="runTrimmedCommand(() => editor.chain().focus().toggleBold().run())">
        <q-tooltip>Bold</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_italic"
        :color="isActive('italic') ? 'primary' : undefined"
        @click="runTrimmedCommand(() => editor.chain().focus().toggleItalic().run())">
        <q-tooltip>Italic</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="format_underlined"
        :color="isActive('underline') ? 'primary' : undefined"
        @click="runTrimmedCommand(() => editor.chain().focus().toggleUnderline().run())">
        <q-tooltip>Underline</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="strikethrough_s"
        :color="isActive('strike') ? 'primary' : undefined"
        @click="runTrimmedCommand(() => editor.chain().focus().toggleStrike().run())">
        <q-tooltip>Strike</q-tooltip>
      </q-btn>

      <q-separator vertical inset />

      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('highlight') ? 'primary' : undefined">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l4 4" />
          <path d="M4 20l3-1 9-9a1.9 1.9 0 0 0-3-3l-9 9-1 3z" />
        </svg>
        <q-tooltip>Highlight</q-tooltip>
        <q-menu class="bubble-swatch-menu" anchor="top middle" self="bottom middle"
          :content-style="menuSurfaceStyle">
          <div class="bubble-swatch-grid" :style="menuSurfaceStyle" @mousedown.prevent>
            <button v-for="swatch in HIGHLIGHT_SWATCHES" :key="swatch.color" type="button"
              class="bubble-swatch-btn" :style="{ backgroundColor: swatch.color }"
              :aria-label="swatch.label" @click="setHighlight(swatch.color)">
              <q-tooltip>{{ swatch.label }}</q-tooltip>
            </button>
            <q-btn flat dense no-caps color="negative" label="Remove" class="bubble-swatch-clear"
              @click="runTrimmedCommand(() => editor.chain().focus().unsetHighlight().run())" />
          </div>
        </q-menu>
      </q-btn>

      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('textStyle') ? 'primary' : undefined">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <text x="12" y="16" font-size="14" text-anchor="middle" fill="currentColor" font-family="sans-serif">A</text>
          <rect x="4" y="19" width="16" height="3" fill="currentColor" />
        </svg>
        <q-tooltip>Text color</q-tooltip>
        <q-menu class="bubble-swatch-menu" anchor="top middle" self="bottom middle"
          :content-style="menuSurfaceStyle">
          <div class="bubble-swatch-grid" :style="menuSurfaceStyle" @mousedown.prevent>
            <button v-for="swatch in TEXT_COLOR_SWATCHES" :key="swatch.color" type="button"
              class="bubble-swatch-btn" :style="{ backgroundColor: swatch.color }"
              :aria-label="swatch.label" @click="setTextColor(swatch.color)">
              <q-tooltip>{{ swatch.label }}</q-tooltip>
            </button>
            <q-btn flat dense no-caps color="negative" label="Remove" class="bubble-swatch-clear"
              @click="runTrimmedCommand(() => editor.chain().focus().unsetColor().run())" />
          </div>
        </q-menu>
      </q-btn>

      <q-separator vertical inset />

      <q-btn flat dense round size="sm" :ripple="false" :color="isActive('shapeOverlay') ? 'primary' : undefined">
        <span :class="['shape-icon', `shape-icon--${activeShape}`]" aria-hidden="true"></span>
        <q-tooltip>Shape overlay</q-tooltip>
        <q-menu class="bubble-shape-menu" anchor="top middle" self="bottom middle" :content-style="menuSurfaceStyle">
          <q-list dense class="bubble-shape-list" :style="menuSurfaceStyle" @mousedown.prevent>
            <q-item v-for="shape in SHAPE_OPTIONS" :key="shape.name" clickable v-close-popup
              :active="isShapeActive(shape.name)" active-class="shape-menu-active"
              @click="setShape(shape.name)">
              <q-item-section avatar>
                <span :class="['shape-icon', `shape-icon--${shape.name}`]" aria-hidden="true"></span>
              </q-item-section>
              <q-item-section>{{ shape.label }}</q-item-section>
            </q-item>
            <q-separator />
            <q-expansion-item dense dense-toggle expand-separator icon="palette" label="Overlay color"
              class="bubble-shape-color-expansion">
              <div class="bubble-shape-color-group">
                <div class="bubble-shape-color-grid">
                  <button type="button" class="bubble-swatch-btn bubble-swatch-btn--default"
                    :class="{ 'bubble-swatch-btn--active': activeShapeColor === '' }"
                    aria-label="Use text color" @click="setShapeColor('')">
                    <span>A</span>
                    <q-tooltip>Use text color</q-tooltip>
                  </button>
                  <button v-for="swatch in OVERLAY_COLOR_SWATCHES" :key="swatch.color" type="button"
                    class="bubble-swatch-btn" :class="{ 'bubble-swatch-btn--active': activeShapeColor === swatch.color }"
                    :style="{ backgroundColor: swatch.color }"
                    :aria-label="swatch.label" @click="setShapeColor(swatch.color)">
                    <q-tooltip>{{ swatch.label }}</q-tooltip>
                  </button>
                </div>
              </div>
            </q-expansion-item>
            <q-separator />
            <q-item clickable v-close-popup :disable="!isActive('shapeOverlay')"
              @click="runTrimmedCommand(() => editor.chain().focus().unsetShapeOverlay().run())">
              <q-item-section avatar>
                <q-icon name="format_clear" />
              </q-item-section>
              <q-item-section>Remove shape</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-separator vertical inset />

      <q-btn flat dense round size="sm" :ripple="false" icon="link"
        :loading="linkingVerse" @click="makeVerseReference">
        <q-tooltip>Tag selected text as verse</q-tooltip>
      </q-btn>
      <q-btn flat dense round size="sm" :ripple="false" icon="tag"
        :loading="linkingTag" @click="makeTagReference">
        <q-tooltip>Make selected text a hashtag</q-tooltip>
      </q-btn>
    </div>
  </BubbleMenu>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Notify } from 'quasar'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { useBibleDataStore } from 'stores/bibleData'
import { useTagsStore } from 'stores/tags'
import { parseFullVerseReference } from 'src/utils/verseUtils'
import { resolveVerseMatch } from 'src/composables/useInlineReferenceResolver'
import { getSectionStyle } from 'src/utils/sectionColors'

const props = defineProps({
  editor: { type: Object, required: true },
  onVerseResolved: { type: Function, required: true },
  onTagResolved: { type: Function, required: true },
  sectionColor: { type: String, default: '' },
  sectionTextColor: { type: String, default: '' },
})

const menuSurfaceStyle = computed(() => {
  const style = getSectionStyle({ color: props.sectionColor, textColor: props.sectionTextColor })
  return {
    backgroundColor: style.backgroundColor || 'var(--color-surface)',
    color: style.color || 'var(--color-text)',
    ...(style['--section-text-color'] ? { '--section-text-color': style['--section-text-color'] } : {}),
  }
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

const SHAPE_OPTIONS = [
  { name: 'triangle', label: 'Triangle' },
  { name: 'circle', label: 'Circle' },
  { name: 'box', label: 'Box' },
  { name: 'x-overlay', label: 'X overlay' },
  { name: 'cross-underline', label: 'Cross overlay' },
  { name: 'swoop-underline', label: 'Swoop underline' },
  { name: 'dash-underline', label: 'Dash underline' },
  { name: 'wavy-underline', label: 'Wavy underline' },
]

const OVERLAY_COLOR_SWATCHES = [
  { color: '#dc2626', label: 'Red' },
  { color: '#ea580c', label: 'Orange' },
  { color: '#ca8a04', label: 'Yellow' },
  { color: '#16a34a', label: 'Green' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#9333ea', label: 'Purple' },
  { color: '#6b7280', label: 'Gray' },
  { color: '#111827', label: 'Black' },
]

const bibleData = useBibleDataStore()
const tagsStore = useTagsStore()
const linkingVerse = ref(false)
const linkingTag = ref(false)

const isActive = (name, attrs) => props.editor.isActive(name, attrs)
const isShapeActive = (shape) => props.editor.isActive('shapeOverlay', { shape })
const activeShape = computed(() => SHAPE_OPTIONS.find((shape) => isShapeActive(shape.name))?.name || 'triangle')
const activeShapeColor = computed(() => props.editor.getAttributes('shapeOverlay')?.color || '')

const setShape = (shape) => {
  runTrimmedCommand(() => props.editor.chain().focus().setShapeOverlay({ shape, color: activeShapeColor.value }).run())
}

const getTrimmedSelection = () => {
  const { from, to } = props.editor.state.selection
  const rawText = props.editor.state.doc.textBetween(from, to, '', '')
  const leadingWhitespace = rawText.match(/^\s*/)?.[0].length || 0
  const trailingWhitespace = rawText.match(/\s*$/)?.[0].length || 0
  const trimmedFrom = from + leadingWhitespace
  const trimmedTo = to - trailingWhitespace

  if (trimmedFrom >= trimmedTo) return null

  return {
    from: trimmedFrom,
    to: trimmedTo,
    text: props.editor.state.doc.textBetween(trimmedFrom, trimmedTo, ' ').trim(),
  }
}

const runTrimmedCommand = (callback) => {
  const selection = getTrimmedSelection()
  if (!selection) return false

  props.editor.chain().focus().setTextSelection({ from: selection.from, to: selection.to }).run()
  callback(selection)
  return true
}

const setShapeColor = (color) => {
  runTrimmedCommand(() => {
    props.editor.chain().focus().setShapeOverlay({ shape: activeShape.value, color }).run()
  })
}

const replaceSelection = (content, selection) => {
  props.editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, content).run()
}

const setHighlight = (color) => {
  runTrimmedCommand(() => props.editor.chain().focus().setHighlight({ color }).run())
}

const setTextColor = (color) => {
  runTrimmedCommand(() => props.editor.chain().focus().setColor(color).run())
}

const makeVerseReference = async () => {
  const selection = getTrimmedSelection()
  const text = selection?.text || ''
  const verseRange = parseFullVerseReference(text)
  if (!verseRange) {
    Notify.create({ type: 'warning', message: 'Select a full verse reference first.' })
    return
  }

  linkingVerse.value = true
  try {
    await bibleData.loadBooks()
    const resolved = await resolveVerseMatch({ raw: text, verseRange }, bibleData)
    if (!resolved) {
      Notify.create({ type: 'warning', message: 'That verse reference was not found.' })
      return
    }
    replaceSelection({ type: 'verseReference', attrs: resolved }, selection)
    props.onVerseResolved(resolved)
  } catch (error) {
    console.error('Failed to link selected verse:', error)
    Notify.create({ type: 'negative', message: 'Could not link that verse.' })
  } finally {
    linkingVerse.value = false
  }
}

const normalizeTagName = (value) =>
  String(value || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')

const makeTagReference = async () => {
  const selection = getTrimmedSelection()
  const tagName = normalizeTagName(selection?.text)
  if (!tagName) {
    Notify.create({ type: 'warning', message: 'Select text to tag first.' })
    return
  }

  linkingTag.value = true
  try {
    await tagsStore.fetchTags()
    const existing = tagsStore.tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase())
    const tag = existing || await tagsStore.createTag(tagName)
    replaceSelection({ type: 'tagReference', attrs: { tagId: tag.id, tagName: tag.name } }, selection)
    props.onTagResolved(tag)
  } catch (error) {
    console.error('Failed to tag selected text:', error)
    Notify.create({ type: 'negative', message: 'Could not create that tag.' })
  } finally {
    linkingTag.value = false
  }
}
</script>

<style scoped>
.rich-text-bubble-menu {
  z-index: 7000;
}

.bubble-menu-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.14));
  border-radius: 8px;
  box-shadow: 0 10px 30px var(--color-shadow-strong);
}

.bubble-swatch-grid {
  display: grid;
  grid-template-columns: repeat(4, 32px);
  gap: 8px;
  padding: 10px;
}

.bubble-swatch-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.16));
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
}

.bubble-swatch-btn--active {
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 4px currentColor;
}

.bubble-swatch-btn--default {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(135deg, transparent 46%, var(--color-border) 47%, var(--color-border) 53%, transparent 54%),
    var(--color-surface);
  color: currentColor;
  font-size: 13px;
  font-weight: 700;
}

.bubble-swatch-clear {
  grid-column: 1 / -1;
}

.shape-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  color: currentColor;
}

.shape-icon--triangle {
  position: relative;
}

.shape-icon--triangle::before {
  content: "△";
  position: absolute;
  inset: 0;
  font-size: 20px;
  line-height: 18px;
  text-align: center;
}

.shape-icon--circle {
  border: 2px solid currentColor;
  border-radius: 50%;
}

.shape-icon--box {
  border: 2px solid currentColor;
  border-radius: 3px;
}

.shape-icon--x-overlay {
  position: relative;
}

.shape-icon--x-overlay::before {
  content: "X";
  position: absolute;
  inset: 0;
  font-size: 18px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
}

.shape-icon--cross-underline,
.shape-icon--swoop-underline,
.shape-icon--dash-underline,
.shape-icon--wavy-underline {
  position: relative;
}

.shape-icon--cross-underline::before,
.shape-icon--swoop-underline::before,
.shape-icon--dash-underline::before,
.shape-icon--wavy-underline::before {
  content: "A";
  position: absolute;
  left: 3px;
  top: -1px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.shape-icon--cross-underline::after {
  content: "✚";
  position: absolute;
  left: 2px;
  right: 2px;
  bottom: -2px;
  font-size: 11px;
  letter-spacing: -2px;
  line-height: 1;
}

.shape-icon--swoop-underline::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 0;
  height: 9px;
  border-bottom: 2px solid currentColor;
  border-radius: 0 0 70% 70%;
  transform: rotate(-8deg);
}

.shape-icon--dash-underline::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 2px;
  background: repeating-linear-gradient(
    to right,
    currentColor 0 4px,
    transparent 4px 6px
  );
}

.shape-icon--wavy-underline::after {
  content: "∿";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: -4px;
  font-size: 22px;
  line-height: 1;
}

.shape-icon--cross-underline::after {
  content: "+";
  left: 0;
  right: 0;
  top: 0;
  bottom: auto;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 18px;
  text-align: center;
}

:global(.bubble-swatch-menu) {
  border: 1px solid var(--color-border);
}

:global(.bubble-shape-menu) {
  border: 1px solid var(--color-border);
}

.bubble-shape-list {
  min-width: 160px;
}

.bubble-shape-color-group {
  padding: 8px 12px 10px;
}

.bubble-shape-color-grid {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  gap: 8px;
}

.bubble-shape-color-expansion {
  color: inherit;
}

.shape-menu-active {
  background: var(--color-hover);
  color: var(--q-primary);
}
</style>
