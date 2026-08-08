import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

// Applied to a run of quoted-verse text (see the `@` verse-quote trigger
// in richTextInlineScan.js / useInlineReferenceResolver.js's
// resolveVerseQuoteMatch) to carry that word's Strong's tag through
// normal editing — unlike verseReference/strongsReference/tagReference,
// this ISN'T an atomic node: the quoted verse is real, editable prose
// (the user can annotate around/inside it), so the Strong's link has to
// be a mark on the text, not a node replacing it. Attrs mirror
// strongsReference's shape (the full strongs_entries row, not just the
// number) so StrongsDisplayModal.vue opens instantly on click with no
// extra fetch — same "resolved data already in hand" convention.
//
// Click handling is a ProseMirror plugin (handleClick), not a NodeView —
// a quoted verse can carry dozens of these in one blockquote, and a
// per-word Vue component instance (the NodeView pattern the other three
// reference types use) would be needless overhead for what's ultimately
// just a styled, clickable text run.
export const StrongsWordMark = Mark.create({
  name: 'strongsWord',

  addOptions() {
    return { onClick: null }
  },

  addAttributes() {
    return {
      strongs_number: { default: null },
      lemma: { default: null },
      transliteration: { default: null },
      pronunciation: { default: null },
      derivation: { default: null },
      strongs_def: { default: null },
      kjv_def: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-strongs-word]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-strongs-word': HTMLAttributes.strongs_number || '', class: 'inline-strongs-word' }), 0]
  },

  addProseMirrorPlugins() {
    const markType = this.type
    const onClick = this.options.onClick

    return [
      new Plugin({
        props: {
          handleClick(view, pos) {
            if (!onClick) return false
            const mark = view.state.doc.resolve(pos).marks().find((m) => m.type === markType)
            if (!mark) return false
            onClick(mark.attrs)
            return true
          },
        },
      }),
    ]
  },
})

export default StrongsWordMark
