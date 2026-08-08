// One-time import of the Berean Standard Bible (public domain,
// https://github.com/BSB-publishing/bsb2usfm, UNLICENSE) with
// per-word Strong's tagging into public.bible_verse_words.
//
// Setup (manual — the source is a ~4MB zip, not worth scripting the
// download/unzip for a one-time import):
//   1. Download BSB_strongs_usj.zip from the latest release:
//      https://github.com/BSB-publishing/bsb2usfm/releases
//   2. Unzip it into ./bsb-usj/ at the project root (66 *.usj files,
//      one per book) — or point USJ_DIR below at wherever you put it.
//
// Then, after running "sql/Bible Verse Words Table.sql" in the
// Supabase SQL editor:
//
//   node --env-file=.env.strongs scripts/import-bsb-verses.mjs
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (same .env.strongs as scripts/import-strongs.mjs — see
// that file's header for where to find the service role key). Safe
// to re-run: upserts on (book, chapter, verse, position).

import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const USJ_DIR = process.env.BSB_USJ_DIR || './bsb-usj'
const BATCH_SIZE = 2000

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, serviceRoleKey)

// Standard USFM 3-letter book codes (as used in the BSB filenames and
// each file's own `{"type":"book","code":"..."}` entry) mapped to the
// full English names bible_verses.book already uses — see
// src/constants/bibleBooks.js.
// Order matches canonical reading order (Genesis=1 ... Revelation=66) —
// used to compute verse_number the same way bible_verses.verse_number
// already does: book*1e6 + chapter*1e3 + verse.
const BOOK_ORDER = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV',
]
const BOOK_CODE_TO_ORDER = Object.fromEntries(BOOK_ORDER.map((code, i) => [code, i + 1]))

const BOOK_CODE_TO_NAME = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
  JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra',
  NEH: 'Nehemiah', EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah', LAM: 'Lamentations',
  EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea', JOL: 'Joel', AMO: 'Amos',
  OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah', NAM: 'Nahum', HAB: 'Habakkuk',
  ZEP: 'Zephaniah', HAG: 'Haggai', ZEC: 'Zechariah', MAL: 'Malachi',
  MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke', JHN: 'John', ACT: 'Acts',
  ROM: 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians',
  PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy',
  '2TI': '2 Timothy', TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James',
  '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John',
  JUD: 'Jude', REV: 'Revelation',
}

// Paragraph styles that carry section headings, cross-reference
// lists, titles, and other non-verse material — never descended into,
// so their text never gets glued onto whatever verse happened to be
// open before them.
//
// 'd' (descriptive Psalm title, e.g. "A Psalm of David.") is
// deliberately NOT here — checked every 'd' paragraph across all 66
// books that contains a nested verse marker, and it's always verse 1
// of a Psalm (this data's versification counts the superscription as
// part of verse 1); skipping it would silently drop that content.
const SKIP_PARA_MARKERS = new Set([
  'h', 'toc1', 'toc2', 'toc3', 'mt1', 'mt2', 'mt3',
  's1', 's2', 's3', 'r', 'sp', 'ms1', 'ms2', 'rem',
])

// Opening quotes/brackets hug the word that follows — no synthesized
// space after one.
const OPENING_CHARS = new Set(['(', '[', '{', '"', "'", '“', '‘'])

function extractBook(fileContent, rows) {
  const state = { book: null, bookOrder: null, chapter: null, verse: null, position: 0, lastChar: null }

  const bookNode = fileContent.find((n) => n?.type === 'book')
  state.book = BOOK_CODE_TO_NAME[bookNode?.code] || null
  state.bookOrder = BOOK_CODE_TO_ORDER[bookNode?.code] || null
  if (!state.book || !state.bookOrder) throw new Error(`Unrecognized book code: ${bookNode?.code}`)

  // Plain-text nodes (punctuation, connecting whitespace) already carry
  // correct spacing verbatim from the source and are emitted untouched.
  // Tagged `w` words are stripped of the whitespace that separated them
  // in the original USFM, so two adjacent w-tagged words with nothing
  // between them need a synthesized space (isWordTag) — unless what's
  // already been emitted ends in whitespace or opening punctuation (an
  // opening quote/bracket hugs the word after it). Separately, any join
  // where BOTH sides already carry whitespace (e.g. a verse-ending ". "
  // immediately followed by a wrapper's own leading " ") collapses to
  // the single space already emitted, whichever supplied it.
  const emit = (text, strongsNumber, isWordTag) => {
    if (state.verse == null || !text) return
    let out = text
    if (isWordTag && state.lastChar && !/\s/.test(state.lastChar) && !OPENING_CHARS.has(state.lastChar)) {
      out = ' ' + out
    }
    if (state.lastChar && /\s/.test(state.lastChar)) {
      out = out.replace(/^\s+/, '')
      if (!out) return
    }
    state.position += 1
    rows.push({
      book: state.book,
      chapter: state.chapter,
      verse: state.verse,
      verse_number: state.bookOrder * 1_000_000 + state.chapter * 1_000 + state.verse,
      position: state.position,
      word_text: out,
      strongs_number: strongsNumber ?? null,
    })
    state.lastChar = out[out.length - 1]
  }

  const walk = (nodes) => {
    for (const node of nodes) {
      if (typeof node === 'string') {
        emit(node, null, false)
        continue
      }
      if (!node || typeof node !== 'object') continue

      switch (node.type) {
        case 'book':
          break
        case 'chapter':
          state.chapter = parseInt(node.number, 10)
          state.verse = null
          break
        case 'verse': {
          const n = parseInt(node.number, 10)
          if (Number.isFinite(n)) {
            state.verse = n
            state.position = 0
            state.lastChar = null
          } else {
            // Bridged verse number ("3-4") or similar — skip rather
            // than guess; the plain-text bible_verses row for this
            // reference is untouched, only the tap-a-word view loses
            // coverage for this one verse.
            state.verse = null
          }
          break
        }
        case 'para':
          if (!SKIP_PARA_MARKERS.has(node.marker) && Array.isArray(node.content)) {
            // A verse that continues across a paragraph break (poetry
            // lines, a new quotation paragraph, ...) needs a boundary
            // space in flattened inline text even when neither side's
            // source markup happens to supply one; emit()'s own
            // whitespace collapse absorbs this when one already did.
            emit(' ', null, false)
            walk(node.content)
          }
          break
        case 'char':
          if (node.marker === 'w') {
            const text = Array.isArray(node.content) ? node.content.join('') : ''
            emit(text, node.strong || null, true)
          } else if (Array.isArray(node.content)) {
            // Wrapper styles (wj = words of Jesus, nd = name of deity,
            // add = translator-added words, ...) — no strong of their
            // own, but may nest tagged `w` words and plain text.
            walk(node.content)
          }
          break
        case 'note':
        case 'ref':
          // Footnotes and cross-reference lists are not verse text.
          break
        default:
          break
      }
    }
  }

  walk(fileContent)
}

async function loadAllRows() {
  const files = (await readdir(USJ_DIR)).filter((f) => f.endsWith('.usj')).sort()
  if (files.length === 0) {
    throw new Error(`No .usj files found in ${USJ_DIR} — see this script's header comment for setup.`)
  }
  console.log(`Found ${files.length} book files in ${USJ_DIR}.`)

  const rows = []
  for (const file of files) {
    const raw = await readFile(path.join(USJ_DIR, file), 'utf-8')
    const data = JSON.parse(raw)
    extractBook(data.content, rows)
  }
  return rows
}

async function upsertRows(rows) {
  console.log(`Upserting ${rows.length} rows in batches of ${BATCH_SIZE}...`)
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('bible_verse_words')
      .upsert(batch, { onConflict: 'book,chapter,verse,position' })
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error)
      throw error
    }
    console.log(`  upserted ${i + batch.length}/${rows.length}`)
  }
}

const rows = await loadAllRows()
await upsertRows(rows)

const { count, error: countError } = await supabase
  .from('bible_verse_words')
  .select('*', { count: 'exact', head: true })
if (!countError) console.log(`Done. bible_verse_words now has ${count} rows.`)
