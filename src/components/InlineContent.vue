<template>
  <span class="inline-content">
    <template v-for="(segment, i) in segments" :key="i">
      <a v-if="segment.type === 'verse'" href="#" class="inline-ref-link"
        @click.prevent="$emit('verse-click', segment.verse)">{{ segment.text }}</a>
      <a v-else-if="segment.type === 'tag'" href="#" class="inline-ref-link"
        @click.prevent="$emit('tag-click', segment.tag)">{{ segment.text }}</a>
      <a v-else-if="segment.type === 'strongs'" href="#" class="inline-ref-link"
        @click.prevent="$emit('strongs-click', segment.strongsEntry)">{{ segment.text }}</a>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { findInlineTriggers } from 'src/utils/inlineReferenceUtils'
import { verseMatchesRange, createDisplayVerse } from 'src/utils/verseUtils'

// Turns the same `::verse`/`#tag` occurrences useInlineReferenceResolver.js
// resolves while editing into clickable segments when viewing — correlated
// against the entry's already-fetched verses/tags (no Supabase calls here),
// so a reference that never resolved (or an old entry with no matching
// data) just falls back to plain text.
const props = defineProps({
  text: { type: String, default: '' },
  verses: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  strongs: { type: Array, default: () => [] },
})

defineEmits(['verse-click', 'tag-click', 'strongs-click'])

// verseMatchesRange does a strict `===` book check internally — pre-filter
// case-insensitively, then pass it a range using the verse's own canonical
// casing so that check passes, and it can do the real chapter/verse work.
const findMatchingVerse = (verses, verseRange) =>
  verses.find((v) => {
    if (!v.book || v.book.toLowerCase() !== verseRange.book.toLowerCase()) return false
    return verseMatchesRange(v, { ...verseRange, book: v.book })
  })

const segments = computed(() => {
  const text = props.text || ''
  const matches = findInlineTriggers(text)
  if (matches.length === 0) return [{ type: 'text', text }]

  const result = []
  let cursor = 0

  for (const match of matches) {
    if (match.start > cursor) {
      result.push({ type: 'text', text: text.slice(cursor, match.start) })
    }

    if (match.type === 'verse') {
      const verse = findMatchingVerse(props.verses, match.verseRange)
      // Pre-transform into the { display, startVerse, endVerse } shape
      // VerseDisplayModal.vue actually wants — RichTextViewer.vue's
      // verseReference nodes emit that same shape directly (it's already
      // resolveVerseMatch's return shape), so ContentSectionView.vue's
      // single onVerseClick handler can stay format-agnostic.
      result.push(verse ? { type: 'verse', text: match.raw, verse: createDisplayVerse(verse) } : { type: 'text', text: match.raw })
    } else if (match.type === 'tag') {
      const tag = props.tags.find((t) => t.name?.toLowerCase() === match.tagName.toLowerCase())
      result.push(tag ? { type: 'tag', text: match.raw, tag } : { type: 'text', text: match.raw })
    } else {
      const strongsEntry = props.strongs.find((s) => s.strongs_number === match.strongsNumber)
      result.push(strongsEntry ? { type: 'strongs', text: match.raw, strongsEntry } : { type: 'text', text: match.raw })
    }

    cursor = match.end
  }

  if (cursor < text.length) {
    result.push({ type: 'text', text: text.slice(cursor) })
  }

  return result
})
</script>

<style scoped>
/* Single root element is the whole point of the fix — when this component
   is placed inside a flex container (e.g. Quasar's q-item-section, which
   defaults to flex-direction: column for stacking title/caption lines),
   having one wrapping element means the WHOLE component is a single flex
   item, not one flex item per text/link segment (which flex-column would
   otherwise stack each onto its own line). */
.inline-content {
  display: inline;
  white-space: inherit;
}

.inline-ref-link {
  display: inline;
  color: var(--q-secondary);
  text-decoration: underline;
  text-decoration-style: dotted;
  cursor: pointer;
}

.inline-ref-link:hover {
  opacity: 0.8;
}
</style>
