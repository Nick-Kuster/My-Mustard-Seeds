import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { useBibleDataStore } from 'stores/bibleData'
import { buildSuggestionRenderer } from 'src/composables/useMentionSuggestion'
import MentionSuggestionList from './MentionSuggestionList.vue'

// Live type-ahead for the BOOK NAME portion only of a `::verse` reference
// — books are a small, flat, cheaply filterable list (~66 rows,
// bibleData.books), the same shape problem #tag/$strongs solve via
// Mention. The chapter:verse portion that follows stays exactly as
// today's pause-triggered flow (a compound structured input, not a flat
// list — see the plan) — picking a book here just inserts its name as
// PLAIN TEXT with a trailing space, not an atomic node, so the user
// keeps typing "6:40" normally and RichTextEditor.vue's existing
// scanEditorForTriggers + resolveVerseMatch picks up the finished
// reference on the next debounce tick exactly as if it had been typed
// by hand. Deliberately a plain Extension + raw Suggestion plugin, NOT
// Mention.extend() — Mention always inserts an atomic node on pick,
// which is the opposite of what's needed here.
export const createVerseBookSuggestion = () => Extension.create({
  name: 'verseBookSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '::',
        items: async ({ query }) => {
          const bibleData = useBibleDataStore()
          await bibleData.loadBooks()
          const needle = query.toLowerCase()
          return bibleData.books
            .filter((b) => b.book.toLowerCase().includes(needle))
            .slice(0, 8)
            .map((b) => ({ label: b.book, book: b.book }))
        },
        render: buildSuggestionRenderer(MentionSuggestionList),
        command: ({ editor, range, props }) => {
          editor.chain().focus().insertContentAt(range, `::${props.book} `).run()
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
