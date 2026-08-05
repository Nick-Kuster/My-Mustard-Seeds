// One-time import of the OpenScriptures Strong's Hebrew/Greek
// dictionaries (https://github.com/openscriptures/strongs, CC-BY-SA)
// into public.strongs_entries. Run this locally once, after running
// "sql/Strongs Dictionary Table.sql" in the Supabase SQL editor:
//
//   node --env-file=.env.strongs scripts/import-strongs.mjs
//
// (--env-file requires Node 20.6+; on an older Node, export the two
// vars below in your shell instead of using --env-file.)
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment — the service role key bypasses RLS and is found under
// Project Settings > API in the Supabase dashboard. This is NOT the
// anon key the app itself uses (VITE_SUPABASE_ANON_KEY) — keep it out
// of any committed file. Idempotent: upserts on strongs_number, so
// it's safe to re-run (e.g. if OpenScriptures fixes a typo upstream).

import { createClient } from '@supabase/supabase-js'

const SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js',
    language: 'hebrew',
  },
  {
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js',
    language: 'greek',
  },
]

const BATCH_SIZE = 500

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, serviceRoleKey)

// The source file is `var strongsXxxDictionary = { ... };` — slice from
// the first "{" to the last "}" rather than depending on the exact
// variable name/prefix text, so this survives upstream formatting
// changes, then evaluate it as an object literal. This runs arbitrary
// code fetched from a remote URL — acceptable only because this is a
// one-time, human-run local script against a known, versioned GitHub
// repo the user explicitly chose, and it never runs inside the app.
async function fetchDictionary(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed for ${url}: ${res.status}`)
  const text = await res.text()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`Could not locate object literal in ${url}`)
  const objectLiteral = text.slice(start, end + 1)
  return new Function('return (' + objectLiteral + ')')()
}

function toRow(strongsNumber, entry, language) {
  return {
    strongs_number: strongsNumber,
    language,
    lemma: entry.lemma ?? null,
    transliteration: entry.xlit ?? entry.translit ?? null,
    pronunciation: entry.pron ?? null,
    derivation: entry.derivation ?? null,
    strongs_def: entry.strongs_def ?? null,
    kjv_def: entry.kjv_def ?? null,
  }
}

async function importDictionary({ url, language }) {
  console.log(`Fetching ${language} dictionary...`)
  const dict = await fetchDictionary(url)
  const rows = Object.entries(dict).map(([key, entry]) => toRow(key, entry, language))
  console.log(`Parsed ${rows.length} ${language} entries. Upserting in batches of ${BATCH_SIZE}...`)

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('strongs_entries').upsert(batch, { onConflict: 'strongs_number' })
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error)
      throw error
    }
    console.log(`  upserted ${i + batch.length}/${rows.length}`)
  }
}

for (const source of SOURCES) {
  await importDictionary(source)
}

const { count, error: countError } = await supabase
  .from('strongs_entries')
  .select('*', { count: 'exact', head: true })
if (!countError) console.log(`Done. strongs_entries now has ${count} rows.`)
