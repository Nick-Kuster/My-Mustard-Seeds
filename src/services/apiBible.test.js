import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getApiBibleBooks,
  getApiBibleChapters,
  getApiBiblePassage,
  listApiBibleTranslations,
} from './apiBible'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}))

vi.mock('src/boot/supabase', () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}))

describe('apiBible service', () => {
  beforeEach(() => {
    mocks.invoke.mockResolvedValue({ data: { data: [] }, error: null })
    mocks.invoke.mockClear()
  })

  it('lists available translations through the edge function', async () => {
    await listApiBibleTranslations()

    expect(mocks.invoke).toHaveBeenCalledWith('api-bible', {
      body: { action: 'listBibles' },
    })
  })

  it('requests books and chapters for a selected Bible', async () => {
    await getApiBibleBooks('de4e12af7f28f599-02')
    await getApiBibleChapters('de4e12af7f28f599-02', 'JHN')

    expect(mocks.invoke).toHaveBeenNthCalledWith(1, 'api-bible', {
      body: { action: 'getBooks', bibleId: 'de4e12af7f28f599-02' },
    })
    expect(mocks.invoke).toHaveBeenNthCalledWith(2, 'api-bible', {
      body: { action: 'getChapters', bibleId: 'de4e12af7f28f599-02', bookId: 'JHN' },
    })
  })

  it('requests a passage with conservative display defaults', async () => {
    await getApiBiblePassage({
      bibleId: 'de4e12af7f28f599-02',
      passageId: 'JHN.3.16',
    })

    expect(mocks.invoke).toHaveBeenCalledWith('api-bible', {
      body: {
        action: 'getPassage',
        bibleId: 'de4e12af7f28f599-02',
        passageId: 'JHN.3.16',
        contentType: 'text',
        includeNotes: false,
        includeTitles: true,
        includeChapterNumbers: false,
        includeVerseNumbers: true,
        includeVerseSpans: false,
      },
    })
  })

  it('rejects unsupported content types before invoking the function', async () => {
    expect(() =>
      getApiBiblePassage({
        bibleId: 'de4e12af7f28f599-02',
        passageId: 'JHN.3.16',
        contentType: 'xml',
      }),
    ).toThrow('contentType must be one of')

    expect(mocks.invoke).not.toHaveBeenCalled()
  })

  it('surfaces function errors as regular errors', async () => {
    mocks.invoke.mockResolvedValue({ data: { error: 'Unauthorized' }, error: null })

    await expect(listApiBibleTranslations()).rejects.toThrow('Unauthorized')
  })
})
