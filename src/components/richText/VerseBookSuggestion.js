import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { useBibleDataStore } from 'stores/bibleData'
import { buildSuggestionRenderer } from 'src/composables/useMentionSuggestion'
import { BIBLE_BOOKS } from 'src/constants/bibleBooks'
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
const normalizeBookSuggestionText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(first|i)\s+/, '1 ')
    .replace(/^(second|ii)\s+/, '2 ')
    .replace(/^(third|iii)\s+/, '3 ')

const staticBookNames = BIBLE_BOOKS.map((book) => book.name)

const queryHasMovedPastBookName = (query) => {
  const normalizedQuery = normalizeBookSuggestionText(query)
  if (!normalizedQuery) return false

  return staticBookNames.some((bookName) => {
    const normalizedBook = normalizeBookSuggestionText(bookName)
    if (!normalizedQuery.startsWith(`${normalizedBook} `)) return false
    return /^\d/.test(normalizedQuery.slice(normalizedBook.length + 1))
  })
}

const findBookSuggestionMatch = ({ char, allowedPrefixes, $position }) => {
  const text = $position.nodeBefore?.isText ? $position.nodeBefore.text : ''
  if (!text) return null

  const triggerIndex = text.lastIndexOf(char)
  if (triggerIndex < 0) return null

  const prefix = text.slice(Math.max(0, triggerIndex - 1), triggerIndex)
  const prefixIsAllowed = allowedPrefixes === null || new RegExp(`^[${allowedPrefixes?.join('')}\\0]?$`).test(prefix)
  if (!prefixIsAllowed) return null

  const textFrom = $position.pos - text.length
  const matchText = text.slice(triggerIndex)
  const query = matchText.slice(char.length)

  // Once a typed reference has a complete book plus a chapter number, the
  // type-ahead should get out of the way so Enter inserts a normal newline
  // and the debounced scanner can turn the finished reference into a link.
  if (queryHasMovedPastBookName(query)) return null

  return {
    range: {
      from: textFrom + triggerIndex,
      to: $position.pos,
    },
    query,
    text: matchText,
  }
}

const buildBookSuggestion = ({ pluginKeyName, char, insertPrefix }) => ({
  pluginKey: new PluginKey(pluginKeyName),
  char,
  allowSpaces: true,
  findSuggestionMatch: findBookSuggestionMatch,
  items: async ({ query }) => {
    const bibleData = useBibleDataStore()
    await bibleData.loadBooks()
    const needle = normalizeBookSuggestionText(query)
    return bibleData.books
      .filter((b) => normalizeBookSuggestionText(b.book).includes(needle))
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
