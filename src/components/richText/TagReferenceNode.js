import Mention from '@tiptap/extension-mention'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { useTagsStore } from 'stores/tags'
import { buildSuggestionRenderer } from 'src/composables/useMentionSuggestion'
import MentionSuggestionList from './MentionSuggestionList.vue'
import ReferenceNodeView from './ReferenceNodeView.vue'

// Real type-ahead (unlike verseReference) — tags are a flat, cheaply
// filterable in-memory list, the same shape problem @tiptap/extension-mention
// is built for. Factory function (not a plain exported extension) so
// onClick/onResolved are captured via closure per editor instance,
// avoiding any reliance on Mention's `this` context inside command/items.
export const createTagReferenceNode = ({ onClick, onResolved } = {}) => {
  // Nothing else guarantees tags are loaded before the popup can show
  // real data — same ensureTagsLoaded guard useInlineReferenceResolver.js
  // already has for the pause-triggered verse/tag path.
  let tagsLoaded = false
  const ensureTagsLoaded = async () => {
    if (tagsLoaded) return
    await useTagsStore().fetchTags()
    tagsLoaded = true
  }

  return Mention.extend({
    name: 'tagReference',

    addOptions() {
      return { ...this.parent?.(), onClick }
    },

    addAttributes() {
      return {
        tagId: { default: null },
        tagName: { default: null },
      }
    },

    renderHTML({ node }) {
      return ['span', { 'data-tag-reference': '', class: 'inline-ref-link' }, `#${node.attrs.tagName}`]
    },

    addNodeView() {
      return VueNodeViewRenderer(ReferenceNodeView)
    },
  }).configure({
    suggestion: {
      char: '#',
      items: async ({ query }) => {
        await ensureTagsLoaded()
        const tagsStore = useTagsStore()
        const needle = query.toLowerCase()
        const matches = tagsStore.tags
          .filter((t) => t.name.toLowerCase().includes(needle))
          .slice(0, 8)
          .map((t) => ({ label: t.name, id: t.id, name: t.name }))

        // Mirrors useInlineReferenceResolver.js's existing auto-create-on-miss
        // behavior — a synthetic list item, resolved into a real tag only
        // if picked.
        const exact = tagsStore.tags.some((t) => t.name.toLowerCase() === needle)
        if (query && !exact) {
          matches.push({ label: `Create tag "${query}"`, isCreate: true, name: query })
        }
        return matches
      },
      render: buildSuggestionRenderer(MentionSuggestionList),
      command: async ({ editor, range, props }) => {
        let tag = props
        if (props.isCreate) {
          try {
            tag = await useTagsStore().createTag(props.name)
          } catch {
            editor.chain().focus().deleteRange(range).run()
            return
          }
        }
        editor.chain().focus().insertContentAt(range, [
          { type: 'tagReference', attrs: { tagId: tag.id, tagName: tag.name } },
          { type: 'text', text: ' ' },
        ]).run()
        onResolved?.(tag)
      },
    },
  })
}
