// Shared helpers for the rich-text migration's dual content shape: a
// `longText` section's `content` is either a legacy plain string (every
// entry saved before this migration — content is encrypted client-side
// per-user, so there is no way to bulk-migrate existing entries) or a
// TipTap/ProseMirror JSON doc (everything from here on). No TipTap import
// here on purpose — this file is also used by journalData.js (the search
// store) and PrintPage.vue, neither of which need a live editor instance.

// A brand-new `longText` section has no legacy data to preserve, so it
// starts in the new shape immediately.
export const EMPTY_RICH_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

// One paragraph per line, matching the visual behavior of the old
// `white-space: pre-wrap` plain-text rendering. Only used to make an old
// entry safely *editable* (TipTap's useEditor expects a doc object, not a
// bare string, and would error otherwise) — the result is plain text with
// no reference nodes; literal `::`/`#`/`$` syntax in old content is left
// as inert text, not re-resolved into links (see RichTextViewer.vue).
export const legacyStringToDoc = (text) => ({
  type: 'doc',
  content: (text || '').split('\n').map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  })),
})

// Plain-text extraction for both shapes, used by search matching and
// print export — neither needs a live editor, just the words. Each
// reference node type contributes its own searchable text so, e.g.,
// searching a Strong's word's gloss still finds the entry.
export const getSectionSearchText = (content) => {
  if (content == null) return ''
  if (typeof content === 'string') return content

  const parts = []
  const walk = (node) => {
    if (!node) return
    if (node.type === 'text') {
      if (node.text) parts.push(node.text)
      return
    }
    if (node.type === 'verseReference') {
      if (node.attrs?.display) parts.push(node.attrs.display)
      return
    }
    if (node.type === 'tagReference') {
      if (node.attrs?.tagName) parts.push(`#${node.attrs.tagName}`)
      return
    }
    if (node.type === 'strongsReference') {
      const strongsNumber = node.attrs?.strongs_number || node.attrs?.strongsNumber || ''
      parts.push(`$${strongsNumber} ${node.attrs?.display || ''}`.trim())
      return
    }
    if (node.type === 'imageReference') {
      if (node.attrs?.alt) parts.push(node.attrs.alt)
      return
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(content)
  return parts.join(' ')
}

// Same extraction, different name at the call site (PrintPage.vue) for
// readability — print wants "the plain text", search wants "the
// searchable text"; they're the same string.
export const getSectionPlainText = getSectionSearchText

const escapeMarkdownPipes = (value) => String(value || '').replace(/\|/g, '\\|')

const applyMarks = (text, marks = []) => {
  if (!text) return ''
  return marks.reduce((current, mark) => {
    if (mark.type === 'bold') return `**${current}**`
    if (mark.type === 'italic') return `*${current}*`
    if (mark.type === 'strike') return `~~${current}~~`
    if (mark.type === 'code') return `\`${current.replace(/`/g, '\\`')}\``
    if (mark.type === 'link' && mark.attrs?.href) return `[${current}](${mark.attrs.href})`
    return current
  }, text)
}

const renderInlineMarkdown = (node) => {
  if (!node) return ''
  if (node.type === 'text') return applyMarks(node.text || '', node.marks || [])

  if (node.type === 'verseReference') return node.attrs?.display || ''
  if (node.type === 'tagReference') return node.attrs?.tagName ? `#${node.attrs.tagName}` : ''
  if (node.type === 'strongsReference') {
    const strongsNumber = node.attrs?.strongs_number || node.attrs?.strongsNumber || ''
    const display = node.attrs?.display || ''
    return [display, strongsNumber ? `($${strongsNumber})` : ''].filter(Boolean).join(' ')
  }
  if (node.type === 'imageReference') {
    const alt = node.attrs?.alt || node.attrs?.imagePath || ''
    return `[Image attachment${alt ? `: ${escapeMarkdownPipes(alt)}` : ''}]`
  }
  if (node.type === 'glyphReference') {
    return node.attrs?.glyphId ? `[Symbol: ${node.attrs.glyphId}]` : ''
  }

  if (Array.isArray(node.content)) return node.content.map(renderInlineMarkdown).join('')
  return ''
}

const renderBlockMarkdown = (node, orderedIndex = 1) => {
  if (!node) return ''
  if (node.type === 'doc') {
    return (node.content || []).map((child) => renderBlockMarkdown(child)).filter(Boolean).join('\n\n')
  }
  if (node.type === 'paragraph') return (node.content || []).map(renderInlineMarkdown).join('')
  if (node.type === 'heading') {
    const level = Math.min(Math.max(Number(node.attrs?.level) || 3, 1), 6)
    return `${'#'.repeat(level)} ${(node.content || []).map(renderInlineMarkdown).join('')}`.trim()
  }
  if (node.type === 'blockquote') {
    return (node.content || []).map((child) => renderBlockMarkdown(child)).filter(Boolean)
      .join('\n')
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
  }
  if (node.type === 'bulletList') {
    return (node.content || []).map((child) => `- ${renderBlockMarkdown(child).replace(/\n/g, '\n  ')}`).join('\n')
  }
  if (node.type === 'orderedList') {
    return (node.content || []).map((child, index) => `${orderedIndex + index}. ${renderBlockMarkdown(child).replace(/\n/g, '\n   ')}`).join('\n')
  }
  if (node.type === 'listItem') return (node.content || []).map((child) => renderBlockMarkdown(child)).filter(Boolean).join('\n')
  if (node.type === 'hardBreak') return '\n'
  if (Array.isArray(node.content)) return node.content.map(renderInlineMarkdown).join('')
  return renderInlineMarkdown(node)
}

export const formatRichTextAsMarkdown = (content) => {
  if (content == null) return ''
  if (typeof content === 'string') return content
  return renderBlockMarkdown(content).trim()
}
