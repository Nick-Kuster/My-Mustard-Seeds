import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ReferenceNodeView from './ReferenceNodeView.vue'

// Atomic inline node (not Mention-based — see plan: a verse reference is a
// compound book+chapter:verse input, not a flat filterable list, so it
// stays pause-triggered via richTextInlineScan.js + resolveVerseMatch,
// not live type-ahead). Attrs mirror resolveVerseMatch's return shape
// exactly (useInlineReferenceResolver.js) — startVerse/endVerse here are
// bible_verses.verse_number values, already the exact shape
// VerseDisplayModal.vue's startVerse/endVerse props expect.
export const VerseReferenceNode = Node.create({
  name: 'verseReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { onClick: null }
  },

  addAttributes() {
    return {
      startVerseId: { default: null },
      endVerseId: { default: null },
      startVerse: { default: null },
      endVerse: { default: null },
      display: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-verse-reference]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-verse-reference': '' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(ReferenceNodeView)
  },
})

export default VerseReferenceNode
