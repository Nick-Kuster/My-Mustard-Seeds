import { findInlineTriggers } from 'src/utils/inlineReferenceUtils'

// Rebuilds the same flat text `findInlineTriggers` already knows how to
// scan (see inlineReferenceUtils.js) from a TipTap/ProseMirror document,
// then maps the resulting string offsets back to real document positions
// so a match can be replaced via editor.chain().insertContentAt(...).
//
// Only text nodes contribute characters — atomic reference nodes
// (verseReference/tagReference/strongsReference) have no text content of
// their own, so an already-resolved reference is automatically invisible
// to future scans; it can never be "found" a second time. Paragraph
// boundaries become '\n' in the scanned string, matching how
// findInlineTriggers already treats '\n' as a hard stop for the `::`
// verse walk and as a boundary character for `#`/`$`.
export const scanEditorForTriggers = (editorState) => {
  const runs = [] // { strStart, pmPos, length } — one per text node
  let str = ''
  let isFirstBlock = true

  editorState.doc.descendants((node, pos) => {
    if (!node.isTextblock) return true

    if (!isFirstBlock) str += '\n'
    isFirstBlock = false

    const contentStart = pos + 1
    node.forEach((child, childOffset) => {
      if (!child.isText) return
      runs.push({ strStart: str.length, pmPos: contentStart + childOffset, length: child.text.length })
      str += child.text
    })

    return false
  })

  const mapOffsetToPos = (offset) => {
    for (const run of runs) {
      if (offset >= run.strStart && offset <= run.strStart + run.length) {
        return run.pmPos + (offset - run.strStart)
      }
    }
    // Falls in a paragraph-boundary gap (the synthetic '\n', which owns no
    // real position) — clamp to the end of the nearest preceding run.
    // findInlineTriggers never actually produces a match landing here (it
    // always stops matches at-or-before a boundary), but this keeps the
    // function total instead of returning undefined on an edge case.
    let best = null
    for (const run of runs) {
      if (run.strStart <= offset && (!best || run.strStart > best.strStart)) best = run
    }
    return best ? best.pmPos + best.length : 0
  }

  return findInlineTriggers(str).map((match) => ({
    ...match,
    from: mapOffsetToPos(match.start),
    to: mapOffsetToPos(match.end),
  }))
}
