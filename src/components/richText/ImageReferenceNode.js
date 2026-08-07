import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageReferenceNodeView from './ImageReferenceNodeView.vue'

// Block-level (unlike verseReference/tagReference/glyphReference, which are
// inline tokens) — a photo attachment reads as its own block, not an
// inline annotation. imagePath points at an encrypted Storage object, not
// a usable URL; ImageReferenceNodeView fetches + decrypts it for display.
export const ImageReferenceNode = Node.create({
  name: 'imageReference',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      imagePath: { default: null },
      mimeType: { default: 'image/jpeg' },
      alt: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-image-reference]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-image-reference': '' })]
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageReferenceNodeView)
  },
})

export default ImageReferenceNode
