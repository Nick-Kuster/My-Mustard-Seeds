import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import GlyphReferenceNodeView from './GlyphReferenceNodeView.vue'

// Atomic inline node for the toolbar's Christian-symbol picker (cross,
// fish, etc. that need real vector art rather than a Unicode character).
// Stores only glyphId — the actual SVG markup lives in
// src/utils/christianGlyphs.js and is looked up by the NodeView at render
// time, so it always renders inline (inherits currentColor for dark/light
// theme) instead of via <img src>, which can't inherit page CSS across an
// asset-URL boundary the way an inline <svg> can.
export const GlyphReferenceNode = Node.create({
  name: 'glyphReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      glyphId: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-glyph-reference]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-glyph-reference': '' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(GlyphReferenceNodeView)
  },
})

export default GlyphReferenceNode
