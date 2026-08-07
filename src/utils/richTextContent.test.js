import { describe, expect, it } from 'vitest'
import {
  EMPTY_RICH_DOC,
  formatRichTextAsMarkdown,
  getSectionPlainText,
  getSectionSearchText,
  legacyStringToDoc,
} from './richTextContent'

describe('rich text content helpers', () => {
  it('converts legacy strings into paragraph docs', () => {
    expect(legacyStringToDoc('Line one\n\nLine three')).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Line one' }] },
        { type: 'paragraph', content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Line three' }] },
      ],
    })
  })

  it('extracts searchable text from rich reference nodes', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Read ' },
            { type: 'verseReference', attrs: { display: 'John 3:16' } },
            { type: 'tagReference', attrs: { tagName: 'hope' } },
            {
              type: 'strongsReference',
              attrs: { strongs_number: 'G26', display: 'agape' },
            },
            { type: 'imageReference', attrs: { alt: 'mustard seed photo' } },
          ],
        },
      ],
    }

    expect(getSectionSearchText(doc)).toBe('Read  John 3:16 #hope $G26 agape mustard seed photo')
    expect(getSectionPlainText(doc)).toBe(getSectionSearchText(doc))
  })

  it('handles empty and legacy content', () => {
    expect(EMPTY_RICH_DOC).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] })
    expect(getSectionSearchText(null)).toBe('')
    expect(getSectionSearchText('plain text')).toBe('plain text')
  })

  it('formats rich content as markdown for export', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Love', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' ' },
            { type: 'verseReference', attrs: { display: 'John 3:16' } },
            { type: 'text', text: ' ' },
            { type: 'tagReference', attrs: { tagName: 'hope' } },
            { type: 'text', text: ' ' },
            { type: 'strongsReference', attrs: { strongs_number: 'G25', display: 'agapao' } },
            { type: 'text', text: ' ' },
            { type: 'imageReference', attrs: { alt: 'mustard seed photo' } },
          ],
        },
      ],
    }

    expect(formatRichTextAsMarkdown(doc)).toBe('**Love** John 3:16 #hope agapao ($G25) [Image attachment: mustard seed photo]')
  })
})
