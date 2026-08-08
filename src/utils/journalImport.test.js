import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const inserted = {
    journal_entries: [],
    journal_verses: [],
    journal_tags: [],
    journal_resources: [],
    journal_quotes: [],
    related_links: [],
    journal_strongs: [],
    resources: [],
    resource_resources: [],
    tags: [],
  }

  const existingTags = [{ id: 'tag-existing', name: 'trust' }]
  const existingResources = []

  const makeBuilder = (table) => {
    const filters = {}
    const builder = {
      select: vi.fn(() => builder),
      order: vi.fn(() => builder),
      eq: vi.fn((column, value) => {
        filters[column] = value
        return builder
      }),
      insert: vi.fn((payload) => {
        inserted[table]?.push(payload)
        builder.payload = payload
        return builder
      }),
      single: vi.fn(async () => {
        if (table === 'journal_entries') {
          return { data: { id: 'entry-1', ...builder.payload }, error: null }
        }
        if (table === 'resources') {
          return { data: { id: `resource-${inserted.resources.length}`, ...builder.payload }, error: null }
        }
        if (table === 'tags') {
          const tag = { id: `tag-${builder.payload.name}`, ...builder.payload }
          return { data: tag, error: null }
        }
        if (table === 'bible_verses') {
          const verseKey = `${filters.book}-${filters.chapter}-${filters.verse}`
          const ids = {
            'John-3-16': 'verse-start',
            'John-3-17': 'verse-end',
          }
          return { data: ids[verseKey] ? { id: ids[verseKey] } : null, error: null }
        }
        if (table === 'strongs_entries') {
          return {
            data: filters.strongs_number === 'G25' ? { strongs_number: 'G25' } : null,
            error: null,
          }
        }
        return { data: builder.payload, error: null }
      }),
      then: undefined,
    }
    return builder
  }

  const from = vi.fn((table) => {
    if (table === 'tags') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: existingTags, error: null })),
        })),
        insert: vi.fn((payload) => {
          inserted.tags.push(payload)
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { id: `tag-${payload.name}`, ...payload }, error: null })),
            })),
          }
        }),
      }
    }

    if (table === 'resources') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: existingResources, error: null })),
        })),
        insert: vi.fn((payload) => {
          inserted.resources.push(payload)
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: { id: `resource-${inserted.resources.length}`, ...payload }, error: null })),
            })),
          }
        }),
      }
    }

    if (table === 'resource_resources') {
      const builder = makeBuilder(table)
      builder.select = vi.fn(() => ({
        eq: vi.fn(async () => ({ data: [], error: null })),
      }))
      return builder
    }

    if (['journal_verses', 'journal_tags', 'journal_quotes', 'related_links', 'journal_strongs'].includes(table)) {
      return {
        insert: vi.fn(async (payload) => {
          inserted[table].push(payload)
          return { data: payload, error: null }
        }),
      }
    }

    return makeBuilder(table)
  })

  return {
    inserted,
    existingResources,
    from,
    getSession: vi.fn(async () => ({ data: { session: { user: { id: 'user-1' } } } })),
    loadBooks: vi.fn(async () => {}),
    getVerses: vi.fn(async () => [1, 2, 3]),
    getEncryptionKey: vi.fn(async () => ({ dek: 'test-key' })),
    encryptData: vi.fn(async (data) => ({ encrypted: data })),
  }
})

vi.mock('src/boot/supabase', () => ({
  supabase: {
    auth: { getSession: mocks.getSession },
    from: mocks.from,
  },
}))

vi.mock('src/utils/encryption', () => ({
  getEncryptionKey: mocks.getEncryptionKey,
  encryptData: mocks.encryptData,
}))

vi.mock('stores/bibleData', () => ({
  useBibleDataStore: () => ({
    books: [{ book: 'John' }],
    loadBooks: mocks.loadBooks,
    getVerses: mocks.getVerses,
  }),
}))

describe('importEntries', () => {
  beforeEach(() => {
    mocks.from.mockClear()
    mocks.getSession.mockClear()
    mocks.loadBooks.mockClear()
    mocks.getVerses.mockClear()
    mocks.getEncryptionKey.mockClear()
    mocks.encryptData.mockClear()
    mocks.existingResources.splice(0)
    Object.values(mocks.inserted).forEach((items) => items.splice(0))
  })

  it('imports current entry features and warns for unsupported or unsafe items', async () => {
    const { importEntries } = await import('./journalImport')
    const input = JSON.stringify([{
      type: 'Devotional',
      title: '  Imported note  ',
      date: '2024-03-12',
      sections: [
        { title: 'Summary', content: 'Remember ::John 3:16 and $G25', fieldType: 'longText' },
        { title: 'Unsafe section', content: 'javascript:alert(1)', fieldType: 'link' },
        { title: 'List', content: 'First\nSecond', fieldType: 'list' },
      ],
      verses: [{ reference: 'John 3:16-17', main: true }],
      tags: ['trust', 'hope'],
      quotes: [{ quote: 'A quote', source: 'Book', page: 12 }],
      strongs: ['G25', { strongsNumber: 'invalid' }],
      links: [
        { name: 'Safe', url: 'https://example.com' },
        { name: 'Unsafe', url: 'javascript:alert(1)' },
      ],
      images: [{ alt: 'photo of handwritten notes' }],
      resources: [
        { type: 'Church', metadata: { name: 'Mosaic' }, primary: false },
        { type: 'Pastor', metadata: { name: 'Adam Barton' }, primary: true },
        { type: 'SermonSeries', metadata: { title: 'Heaven Invades Earth', year: '2026' }, primary: false },
        { type: 'Sermon', metadata: { title: 'Heaven Invades Your Identity', date: '2026-07-30' }, primary: false },
      ],
    }])

    const summary = await importEntries(input)

    expect(summary.succeeded).toEqual([{ title: 'Imported note' }])
    expect(summary.failed).toEqual([])
    expect(summary.warnings).toHaveLength(3)
    expect(summary.warnings.map((warning) => warning.message)).toEqual(expect.arrayContaining([
      expect.stringContaining('one or more links were skipped'),
      expect.stringContaining('Strong\'s items were skipped'),
      expect.stringContaining('image notes were not imported'),
    ]))

    expect(mocks.inserted.journal_entries).toHaveLength(1)
    expect(mocks.inserted.journal_entries[0]).toMatchObject({
      user_id: 'user-1',
      title: 'Imported note',
      type: 'Devotional',
      created_at: '2024-03-12T00:00:00.000Z',
    })
    expect(mocks.inserted.journal_entries[0].content.encrypted.sections[0]).toMatchObject({
      title: 'Summary',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Remember ::John 3:16 and $G25' }] }],
      },
      fieldType: 'longText',
    })
    expect(mocks.inserted.journal_entries[0].content.encrypted.sections[1]).toMatchObject({
      title: 'Unsafe section',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'javascript:alert(1)' }] }],
      },
      fieldType: 'longText',
    })
    expect(mocks.inserted.journal_entries[0].content.encrypted.sections[2]).toMatchObject({
      title: 'List',
      content: 'First\nSecond',
      fieldType: 'list',
    })

    expect(mocks.inserted.journal_verses[0]).toEqual([{
      journal_id: 'entry-1',
      start_verse_id: 'verse-start',
      end_verse_id: 'verse-end',
      main_verse: true,
    }])
    expect(mocks.inserted.tags).toEqual([{ user_id: 'user-1', name: 'hope' }])
    expect(mocks.inserted.journal_tags[0]).toEqual([
      { journal_id: 'entry-1', tag_id: 'tag-existing', user_id: 'user-1' },
      { journal_id: 'entry-1', tag_id: 'tag-hope', user_id: 'user-1' },
    ])
    expect(mocks.inserted.journal_quotes[0]).toMatchObject({
      journal_id: 'entry-1',
      quote: { encrypted: 'A quote' },
      source: 'Book',
      page_number: 12,
    })
    expect(mocks.inserted.related_links[0]).toEqual([
      { journal_id: 'entry-1', name: 'Safe', url: 'https://example.com' },
    ])
    expect(mocks.inserted.journal_strongs[0]).toEqual([
      { journal_id: 'entry-1', user_id: 'user-1', strongs_number: 'G25' },
    ])
    expect(mocks.inserted.resources).toEqual([
      { user_id: 'user-1', type: 'Church', metadata: { name: 'Mosaic' } },
      { user_id: 'user-1', type: 'Pastor', metadata: { name: 'Adam Barton' } },
      { user_id: 'user-1', type: 'SermonSeries', metadata: { title: 'Heaven Invades Earth', year: '2026' } },
      { user_id: 'user-1', type: 'Sermon', metadata: { title: 'Heaven Invades Your Identity', date: '2026-07-30' } },
    ])
    expect(mocks.inserted.resource_resources).toEqual([
      { parent_resource_id: 'resource-1', child_resource_id: 'resource-2', user_id: 'user-1', relationship_type: 'pastor' },
      { parent_resource_id: 'resource-2', child_resource_id: 'resource-3', user_id: 'user-1', relationship_type: 'sermonseries' },
      { parent_resource_id: 'resource-3', child_resource_id: 'resource-4', user_id: 'user-1', relationship_type: 'sermon' },
    ])
    expect(mocks.inserted.journal_resources[0]).toEqual([
      { journal_id: 'entry-1', resource_id: 'resource-1', primary_resource: false, user_id: 'user-1' },
      { journal_id: 'entry-1', resource_id: 'resource-2', primary_resource: true, user_id: 'user-1' },
      { journal_id: 'entry-1', resource_id: 'resource-3', primary_resource: false, user_id: 'user-1' },
      { journal_id: 'entry-1', resource_id: 'resource-4', primary_resource: false, user_id: 'user-1' },
    ])
  })

  it('includes existing resources in the LLM template', async () => {
    const { buildImportTemplateText } = await import('./journalImport')
    const template = buildImportTemplateText({
      resources: [
        { id: 'church-1', type: 'Church', metadata: { name: 'Mosaic', location: 'Evansville' } },
        { id: 'pastor-1', type: 'Pastor', metadata: { name: 'Adam Barton' } },
      ],
      resourceRelationships: [
        { parent_resource_id: 'church-1', child_resource_id: 'pastor-1' },
      ],
    })

    expect(template).toContain('Existing resources already in the app')
    expect(template).toContain('"type": "Church"')
    expect(template).toContain('"name": "Mosaic"')
    expect(template).toContain('"parent": "Mosaic"')
    expect(template).toContain('"child": "Adam Barton"')
  })

  it('reuses existing resources when optional metadata differs', async () => {
    mocks.existingResources.push(
      { id: 'existing-church', user_id: 'user-1', type: 'Church', metadata: { name: 'Mosaic', location: 'Evansville' } },
      { id: 'existing-pastor', user_id: 'user-1', type: 'Pastor', metadata: { name: 'Adam Barton' } },
    )

    const { importEntries } = await import('./journalImport')
    const input = JSON.stringify([{
      type: 'Sermon',
      title: 'Existing resource sermon',
      sections: [],
      resources: [
        { type: 'Church', metadata: { name: 'Mosaic' }, primary: false },
        { type: 'Pastor', metadata: { name: 'Adam Barton' }, primary: true },
      ],
    }])

    const summary = await importEntries(input)

    expect(summary.failed).toEqual([])
    expect(mocks.inserted.resources).toEqual([])
    expect(mocks.inserted.resource_resources).toEqual([
      { parent_resource_id: 'existing-church', child_resource_id: 'existing-pastor', user_id: 'user-1', relationship_type: 'pastor' },
    ])
    expect(mocks.inserted.journal_resources[0]).toEqual([
      { journal_id: 'entry-1', resource_id: 'existing-church', primary_resource: false, user_id: 'user-1' },
      { journal_id: 'entry-1', resource_id: 'existing-pastor', primary_resource: true, user_id: 'user-1' },
    ])
  })
})
