import { describe, expect, it } from 'vitest'
import { EditorState } from '@tiptap/pm/state'
import { Schema } from '@tiptap/pm/model'
import { scanEditorForTriggers } from './richTextInlineScan'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: {
      content: 'text*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM: () => ['p', 0],
    },
    text: { group: 'inline' },
    bulletList: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', 0],
    },
    listItem: {
      content: 'paragraph block*',
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0],
    },
  },
})

const stateFromDoc = (doc) => EditorState.create({ schema, doc: schema.nodeFromJSON(doc) })

describe('rich text inline scanner', () => {
  it('finds verse references inside list items', () => {
    const state = stateFromDoc({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Remember ::John 3:16' }],
                },
              ],
            },
          ],
        },
      ],
    })

    const matches = scanEditorForTriggers(state)

    expect(matches).toHaveLength(1)
    expect(matches[0]).toMatchObject({
      type: 'verse',
      raw: '::John 3:16',
      verseRange: {
        book: 'John',
        startChapter: 3,
        startVerse: 16,
        endChapter: 3,
        endVerse: 16,
      },
    })
  })
})
