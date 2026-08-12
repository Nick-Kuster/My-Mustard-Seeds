import { createClient } from 'npm:@supabase/supabase-js@2'

const API_BIBLE_BASE_URL = 'https://api.scripture.api.bible/v1'
const API_BIBLE_CONTENT_TYPES = ['text', 'html', 'json']
const MAX_CACHE_ENTRIES = 200
const CACHE_TTL_MS = {
  metadata: 24 * 60 * 60 * 1000,
  passage: 60 * 60 * 1000,
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const cache = new Map<string, { expiresAt: number; body: unknown; status: number }>()

type ApiBibleRequest =
  | { action: 'listBibles' }
  | { action: 'getBooks'; bibleId: string }
  | { action: 'getChapters'; bibleId: string; bookId: string }
  | {
      action: 'getPassage'
      bibleId: string
      passageId: string
      contentType?: 'text' | 'html' | 'json'
      includeNotes?: boolean
      includeTitles?: boolean
      includeChapterNumbers?: boolean
      includeVerseNumbers?: boolean
      includeVerseSpans?: boolean
    }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const requireValue = (value: unknown, name: string) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required`)
  }
  return value.trim()
}

const isChapterScopedPassage = (passageId: string) => {
  const firstRangePart = passageId.split('-')[0]
  const parts = firstRangePart.split('.')
  return parts.length >= 2 && /^\d+$/.test(parts[1])
}

const asRecord = (body: unknown) => body && typeof body === 'object' ? body as Record<string, unknown> : {}

const remember = (url: string, body: unknown, status: number, ttlMs: number) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(url, { body, status, expiresAt: Date.now() + ttlMs })
}

const apiBibleUrlFor = (body: ApiBibleRequest) => {
  switch (body.action) {
    case 'listBibles':
      return { url: `${API_BIBLE_BASE_URL}/bibles`, ttlMs: CACHE_TTL_MS.metadata }

    case 'getBooks': {
      const bibleId = encodeURIComponent(requireValue(body.bibleId, 'bibleId'))
      return { url: `${API_BIBLE_BASE_URL}/bibles/${bibleId}/books`, ttlMs: CACHE_TTL_MS.metadata }
    }

    case 'getChapters': {
      const bibleId = encodeURIComponent(requireValue(body.bibleId, 'bibleId'))
      const bookId = encodeURIComponent(requireValue(body.bookId, 'bookId'))
      return {
        url: `${API_BIBLE_BASE_URL}/bibles/${bibleId}/books/${bookId}/chapters`,
        ttlMs: CACHE_TTL_MS.metadata,
      }
    }

    case 'getPassage': {
      const bibleId = encodeURIComponent(requireValue(body.bibleId, 'bibleId'))
      const passageIdValue = requireValue(body.passageId, 'passageId')
      const contentType = body.contentType || 'text'
      if (!API_BIBLE_CONTENT_TYPES.includes(contentType)) {
        throw new Error(`contentType must be one of: ${API_BIBLE_CONTENT_TYPES.join(', ')}`)
      }
      if (!isChapterScopedPassage(passageIdValue)) {
        throw new Error('passageId must include at least a chapter, such as JHN.3 or JHN.3.16')
      }

      const passageId = encodeURIComponent(passageIdValue)
      const params = new URLSearchParams({
        'content-type': contentType,
        'include-notes': String(body.includeNotes ?? false),
        'include-titles': String(body.includeTitles ?? true),
        'include-chapter-numbers': String(body.includeChapterNumbers ?? false),
        'include-verse-numbers': String(body.includeVerseNumbers ?? true),
        'include-verse-spans': String(body.includeVerseSpans ?? false),
      })

      return {
        url: `${API_BIBLE_BASE_URL}/bibles/${bibleId}/passages/${passageId}?${params}`,
        ttlMs: CACHE_TTL_MS.passage,
      }
    }

    default:
      throw new Error('Unsupported API.Bible action')
  }
}

const fetchApiBible = async (url: string, apiKey: string, ttlMs: number) => {
  const cached = cache.get(url)
  if (cached && cached.expiresAt > Date.now()) {
    return json({ cached: true, ...asRecord(cached.body) }, cached.status)
  }

  const response = await fetch(url, {
    headers: {
      'api-key': apiKey,
      Accept: 'application/json',
    },
  })

  const body = await response.json().catch(() => ({ error: 'API.Bible returned a non-JSON response' }))
  const normalizedBody = response.ok
    ? { cached: false, ...asRecord(body) }
    : { error: body?.message || body?.error || 'API.Bible request failed', details: body }

  if (response.ok) {
    remember(url, body, response.status, ttlMs)
  }

  return json(normalizedBody, response.status)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return json({ error: 'Unauthorized' }, 401)

  const apiKey = Deno.env.get('API_BIBLE_KEY')
  if (!apiKey) return json({ error: 'Missing API_BIBLE_KEY secret' }, 500)

  try {
    const body = await req.json() as ApiBibleRequest
    const { url, ttlMs } = apiBibleUrlFor(body)
    return await fetchApiBible(url, apiKey, ttlMs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid API.Bible request'
    return json({ error: message }, 400)
  }
})
