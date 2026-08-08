import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { useBibleDataStore } from 'stores/bibleData'
import { buildSuggestionRenderer } from 'src/composables/useMentionSuggestion'
import MentionSuggestionList from './MentionSuggestionList.vue'

// Live type-ahead for the BOOK NAME portion only of a `::verse` (link) or
// `@verse` (quote the full verse text) reference — books are a small,
// flat, cheaply filterable list (~66 rows, bibleData.books), the same
// shape problem #tag/$strongs solve via Mention. The chapter:verse
// portion that follows stays exactly as today's pause-triggered flow (a
// compound structured input, not a flat list — see the plan). Picking a
// book here just inserts its name as PLAIN TEXT with a trailing space,
// not an atomic node, so the user keeps typing "6:40" normally and
// RichTextEditor.vue's existing scanEditorForTriggers + resolveVerseMatch
// / resolveVerseQuoteMatch picks up the finished reference on the next
// debounce tick exactly as if it had been typed by hand. Deliberately a
// plain Extension + raw Suggestion plugin, NOT Mention.extend() — Mention
// always inserts an atomic node on pick, which is the opposite of what's
// needed here.
//
// Two Suggestion plugins (one per trigger char) living in one extension —
// each needs its own explicit pluginKey; @tiptap/suggestion doesn't
// disambiguate same-named Suggestion instances for you the way two
// separately-named Mention.extend() extensions (tagReference/
// strongsReference) do automatically.
const buildBookSuggestion = ({ pluginKeyName, char, insertPrefix }) => ({
  pluginKey: new PluginKey(pluginKeyName),
  char,
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
    editor.chain().focus().insertContentAt(range, `${insertPrefix}${props.book} `).run()
  },
})

export const createVerseBookSuggestion = () => Extension.create({
  name: 'verseBookSuggestion',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...buildBookSuggestion({ pluginKeyName: 'verseBookSuggestionLink', char: '::', insertPrefix: '::' }),
      }),
      Suggestion({
        editor: this.editor,
        ...buildBookSuggestion({ pluginKeyName: 'verseBookSuggestionQuote', char: '@', insertPrefix: '@' }),
      }),
    ]
  },
})
