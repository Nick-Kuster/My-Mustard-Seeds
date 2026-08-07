import Mention from '@tiptap/extension-mention'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { useStrongsDataStore } from 'stores/strongsData'
import { buildSuggestionRenderer } from 'src/composables/useMentionSuggestion'
import MentionSuggestionList from './MentionSuggestionList.vue'
import ReferenceNodeView from './ReferenceNodeView.vue'

const DEBOUNCE_MS = 250

// Unlike tag's in-memory filter, this hits Supabase per query — items()
// isn't debounced by the Suggestion plugin itself, so debounce here.
// Checks `query !== latestQuery` both before and after the async call so
// a slower earlier response can never clobber a faster later one.
const debouncedStrongsSearch = () => {
  let latestQuery = null
  return (query) =>
    new Promise((resolve) => {
      latestQuery = query
      setTimeout(async () => {
        if (query !== latestQuery || !query) {
          resolve([])
          return
        }
        const results = await useStrongsDataStore().search(query)
        if (query !== latestQuery) {
          resolve([])
          return
        }
        resolve(results)
      }, DEBOUNCE_MS)
    })
}

export const createStrongsReferenceNode = ({ onClick, onResolved } = {}) => {
  const search = debouncedStrongsSearch()

  return Mention.extend({
    name: 'strongsReference',

    addOptions() {
      return { ...this.parent?.(), onClick }
    },

    // Carries the full strongs_entries row (not just the number) so a
    // click can open StrongsDisplayModal.vue immediately with real
    // content — same shape ContentSectionView.vue's existing
    // onStrongsClick already expects, no extra fetch needed at click
    // time (matches how the entry is already fully in hand from either
    // the search popup or the pause-triggered resolver).
    addAttributes() {
      return {
        strongs_number: { default: null },
        display: { default: '' },
        lemma: { default: null },
        transliteration: { default: null },
        pronunciation: { default: null },
        derivation: { default: null },
        strongs_def: { default: null },
        kjv_def: { default: null },
      }
    },

    renderHTML({ node }) {
      return ['span', { 'data-strongs-reference': '', class: 'inline-ref-link' }, node.attrs.display]
    },

    addNodeView() {
      return VueNodeViewRenderer(ReferenceNodeView)
    },
  }).configure({
    suggestion: {
      char: '$',
      items: async ({ query }) => {
        const results = await search(query)
        return results.map((entry) => ({
          label: `${entry.lemma}${entry.transliteration ? ` (${entry.transliteration})` : ''} — ${entry.strongs_number}`,
          sublabel: entry.kjv_def || entry.strongs_def,
          entry,
        }))
      },
      render: buildSuggestionRenderer(MentionSuggestionList),
      command: ({ editor, range, props }) => {
        const entry = props.entry
        const display = entry.transliteration && entry.lemma
          ? `${entry.transliteration}/${entry.lemma}`
          : entry.lemma || entry.strongs_number
        editor.chain().focus().insertContentAt(range, [
          { type: 'strongsReference', attrs: { ...entry, display } },
          { type: 'text', text: ' ' },
        ]).run()
        onResolved?.(entry)
      },
    },
  })
}
