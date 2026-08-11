<template>
  <div class="rich-text-editor">
    <div class="rich-text-scroll-area">
      <RichTextToolbar v-if="editor && !disable" :editor="editor" class="rich-text-toolbar-pinned" />
      <editor-content :editor="editor" class="rich-text-body" />
    </div>

    <VerseDisplayModal v-model="showVerseDisplayModal" :reference="verseDisplay.display"
      :startVerse="verseDisplay.startVerse" :endVerse="verseDisplay.endVerse" />
    <StrongsDisplayModal v-model="showStrongsDisplayModal" :entry="strongsDisplay" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { useReferenceExtensions } from 'src/composables/useReferenceExtensions'
import { legacyStringToDoc, EMPTY_RICH_DOC } from 'src/utils/richTextContent'
import { scanEditorForTriggers } from 'src/utils/richTextInlineScan'
import { useBibleDataStore } from 'stores/bibleData'
import { resolveVerseMatch, resolveVerseQuoteMatch } from 'src/composables/useInlineReferenceResolver'
import RichTextToolbar from './RichTextToolbar.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import StrongsDisplayModal from 'components/StrongsDisplayModal.vue'

// Verse (::) stays pause-triggered rather than live type-ahead (a verse
// reference is a compound book+chapter:verse input, not a flat filterable
// list — see the plan). Tag (#) and Strong's ($) get real type-ahead via
// Mention, wired in useReferenceExtensions.js.
//
// onVerseResolved/onTagResolved/onStrongsResolved are callback props
// (deliberately NOT the linkedVerses/selectedTags/selectedStrongs refs
// themselves) — Vue auto-unwraps a top-level ref the moment a parent
// template passes it as a prop (":linked-verses="linkedVerses"" would
// hand this component the plain array, not the ref, which is an easy
// footgun for a later mutation). Passing useInlineReferenceResolver.js's
// own pushResolvedVerse/pushResolvedTag/pushResolvedStrongs instead means
// dedup-against-current-state happens inside the composable, where the
// refs are native (plain JS closures, no template boundary) — this
// component never needs direct read access to those buffers at all.
// Long enough to think about whether "Luke 6:24" should become a range
// ("...-7:26") before it's silently locked in as the shorter reference —
// 550ms (this file's original value, inherited from the old plain-text
// resolver's debounce) was tuned for that other system's much simpler
// job (just re-scanning text), not for someone pausing mid-reference to
// decide on a range.
const DEBOUNCE_MS = 2500

const props = defineProps({
  modelValue: { type: [String, Object], default: () => EMPTY_RICH_DOC },
  disable: { type: Boolean, default: false },
  onVerseResolved: { type: Function, required: true },
  onTagResolved: { type: Function, required: true },
  onStrongsResolved: { type: Function, required: true },
})

const emit = defineEmits(['update:modelValue'])

const bibleData = useBibleDataStore()

const normalizeContent = (value) => (typeof value === 'string' ? legacyStringToDoc(value) : value)

// Verse/Strong's clicks while editing open the same read-only display
// modals the viewer uses — safe mid-edit since nothing navigates away or
// touches unsaved content. Tag click is deliberately left unwired here:
// ContentSectionView.vue's tag-click navigates to /search, and doing that
// mid-edit would abandon whatever hasn't been saved yet.
const showVerseDisplayModal = ref(false)
const verseDisplay = ref({})
const showStrongsDisplayModal = ref(false)
const strongsDisplay = ref(null)

const editor = useEditor({
  content: normalizeContent(props.modelValue),
  editable: !props.disable,
  extensions: useReferenceExtensions({
    onVerseClick: (attrs) => {
      verseDisplay.value = attrs
      showVerseDisplayModal.value = true
    },
    onStrongsClick: (attrs) => {
      strongsDisplay.value = attrs
      showStrongsDisplayModal.value = true
    },
    onTagResolved: props.onTagResolved,
    onStrongsResolved: props.onStrongsResolved,
  }),
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.getJSON())
    scheduleResolve()
  },
})

watch(() => props.disable, (v) => editor.value?.setEditable(!v))

const resolvedKeys = new Set()
const failedKeys = new Set()
let debounceTimer = null

// One paragraph per quoted verse, its own text prefixed with the
// (bold) verse number — mirrors VerseDisplayModal.vue's layout. Each
// word becomes its own text node so a Strong's-tagged word can carry
// the strongsWord mark while its untagged neighbors (mostly
// punctuation) don't; ProseMirror only merges adjacent text nodes that
// share the exact same marks, so this never fuses two different words
// together.
const buildVerseQuoteContent = (resolved) => ({
  type: 'blockquote',
  content: resolved.verses.map((v) => ({
    type: 'paragraph',
    content: [
      { type: 'text', text: `${v.verse} `, marks: [{ type: 'bold' }] },
      ...v.words.map((w) => ({
        type: 'text',
        text: w.text,
        ...(w.strongsEntry ? { marks: [{ type: 'strongsWord', attrs: w.strongsEntry }] } : {}),
      })),
    ],
  })),
})

// isLive: true for the ambient pause-debounce, false for the explicit
// blur/save flush. A bare "Book Chapter" reference (no ":verse") is
// already a *complete, valid* whole-chapter match to parseFullVerseReference
// — so pausing mid-typing right after "Genesis 1", before adding ":1",
// used to resolve to and insert the entire chapter. While live, skip any
// match whose end still sits exactly at the cursor (nothing typed after
// it yet) — that's the ambiguous "still might be extending this"
// position. Once the user types past it (or blurs/saves, isLive=false)
// it resolves normally; it's never silently dropped, only deferred.
const resolveVerseMatches = async (isLive) => {
  const ed = editor.value
  if (!ed) return

  const matches = scanEditorForTriggers(ed.state).filter((m) => m.type === 'verse' || m.type === 'verseQuote')
  for (const match of matches) {
    if (resolvedKeys.has(match.raw) || failedKeys.has(match.raw)) continue

    if (isLive && ed.state.selection.empty && ed.state.selection.from === match.to) continue

    await bibleData.loadBooks()
    const resolved = match.type === 'verseQuote'
      ? await resolveVerseQuoteMatch(match, bibleData)
      : await resolveVerseMatch(match, bibleData)
    if (!resolved) {
      failedKeys.add(match.raw)
      continue
    }

    // Race guard: the async lookup may have taken long enough that the
    // user kept typing and this range no longer contains the matched
    // text — skip and let the next debounce tick retry with fresh
    // positions rather than corrupting the document.
    if (ed.state.doc.textBetween(match.from, match.to) !== match.raw) continue

    resolvedKeys.add(match.raw)
    if (match.type === 'verseQuote') {
      ed.chain().insertContentAt({ from: match.from, to: match.to }, [
        buildVerseQuoteContent(resolved),
        { type: 'paragraph' },
      ]).run()
    } else {
      ed.chain().insertContentAt({ from: match.from, to: match.to }, [
        { type: 'verseReference', attrs: resolved },
        { type: 'text', text: ' ' },
      ]).run()
    }

    props.onVerseResolved(resolved)
  }
}

const scheduleResolve = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    resolveVerseMatches(true)
  }, DEBOUNCE_MS)
}

// Called on blur and at save time — cancels any pending debounce and
// resolves immediately, so a pause-worthy verse reference typed right
// before Save isn't lost.
const flushPendingReferences = async () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  await resolveVerseMatches(false)
}

defineExpose({ flushPendingReferences })

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.rich-text-editor {
  border: 0;
  border-radius: 10px;
  padding: 4px 8px;
  background: transparent;
}

.rich-text-scroll-area {
  max-height: 1360px;
  overflow-y: auto;
}

.rich-text-toolbar-pinned {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--color-surface-alt);
  margin-bottom: 8px;
}

.rich-text-body {
  padding: 8px 0 4px;
}

/* min-height belongs on the actual contenteditable element, not this
   wrapper — putting it here left a "dead zone" below the last line that
   was visually part of the editor but wasn't real ProseMirror content, so
   clicking there didn't focus anything. On .ProseMirror itself, that same
   space IS the contenteditable box, so the browser's native click-to-
   position behavior places the cursor at the nearest text for free. */
.rich-text-body :deep(.ProseMirror) {
  min-height: 240px;
  outline: none;
}

.rich-text-body :deep(p) {
  margin: 0 0 4px;
}

.rich-text-body :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-text-body :deep(ul),
.rich-text-body :deep(ol) {
  margin: 0 0 4px;
  padding-left: 1.25em;
}

.rich-text-body :deep(li p) {
  margin: 0;
}

.rich-text-body :deep(h1),
.rich-text-body :deep(h2),
.rich-text-body :deep(h3) {
  margin: 0 0 4px;
  line-height: 1.3;
}

.rich-text-body :deep(h1) {
  font-size: 1.5em;
}

.rich-text-body :deep(h2) {
  font-size: 1.25em;
}

.rich-text-body :deep(h3) {
  font-size: 1.1em;
}

.rich-text-body :deep(blockquote) {
  margin: 0 0 4px;
  padding-left: 12px;
  border-left: 3px solid var(--color-border, #ccc);
  color: var(--color-text-secondary, inherit);
  font-style: italic;
}

.rich-text-body :deep(blockquote p) {
  margin: 0;
}

.rich-text-body :deep(.inline-strongs-word) {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
}

.rich-text-body :deep(.inline-strongs-word:hover) {
  opacity: 0.8;
}

@media (max-width: 599px) {
  .rich-text-editor {
    border-color: transparent;
    padding: 0;
  }

  .rich-text-body {
    padding: 8px 0 2px;
  }
}
</style>
