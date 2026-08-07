import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import GlyphReferenceNode from 'src/components/richText/GlyphReferenceNode'
import VerseReferenceNode from 'src/components/richText/VerseReferenceNode'
import { createTagReferenceNode } from 'src/components/richText/TagReferenceNode'
import { createStrongsReferenceNode } from 'src/components/richText/StrongsReferenceNode'
import { createVerseBookSuggestion } from 'src/components/richText/VerseBookSuggestion'

// A function, not a shared constant array — each reference node's
// .configure({ onClick, onResolved }) closures are bound to one editor
// instance's handlers. A module-level shared array would leak state
// across every editor on the page (multiple longText sections = multiple
// editor instances on NewEntryPage.vue/EditEntryPage.vue).
//
// Called identically by RichTextEditor.vue (editable) and
// RichTextViewer.vue (read-only, passing no click/resolve handlers where
// it doesn't need them) — one schema, edit and view can't drift apart.
export function useReferenceExtensions({
  onVerseClick, onTagClick, onStrongsClick, onTagResolved, onStrongsResolved,
} = {}) {
  return [
    // StarterKit v3 already bundles `underline` by default — do NOT also
    // add @tiptap/extension-underline separately, that would register the
    // same extension name twice. Bullet/ordered lists, headings (capped at
    // H1-3 — this is a journal entry field, not a full document, so deeper
    // levels aren't exposed in the toolbar), and blockquote are all
    // enabled — these are TipTap's own nodes living inside longText prose
    // content, a completely different thing from this app's separate
    // 'list' *section type* (see sectionListUtils.js, a flat newline-
    // delimited field with its own add/remove UI) — no actual naming/data
    // collision between the two. codeBlock/horizontalRule stay disabled
    // (not part of the formatting toolbar this app exposes).
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
      horizontalRule: false,
    }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    GlyphReferenceNode,
    VerseReferenceNode.configure({ onClick: onVerseClick }),
    createTagReferenceNode({ onClick: onTagClick, onResolved: onTagResolved }),
    createStrongsReferenceNode({ onClick: onStrongsClick, onResolved: onStrongsResolved }),
    createVerseBookSuggestion(),
  ]
}
