<template>
  <q-page class="print-page">
    <!-- Toolbar (hidden when printing) -->
    <div class="no-print q-pa-md">
      <div class="text-h6 text-center q-mb-sm">
        Print Preview — {{ entries.length }} {{ entries.length === 1 ? 'entry' : 'entries' }}
      </div>
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" color="primary" @click="router.go(-1)" />
        <q-space />
        <q-btn unelevated color="primary" icon="print" label="Print / Save as PDF" @click="printPage"
          :disable="loading || entries.length === 0" />
      </div>
    </div>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="2em" />
      <div class="text-grey q-mt-sm">Preparing your notes...</div>
    </div>

    <div v-else class="document">
      <header class="doc-header">
        <div class="doc-title">My Mustard Seeds</div>
        <div class="doc-meta">
          Printed {{ printedDate }} • {{ entries.length }}
          {{ entries.length === 1 ? 'entry' : 'entries' }}
        </div>
        <div v-if="filterSummary" class="doc-filters">Filtered by — {{ filterSummary }}</div>
      </header>

      <div v-if="entries.length === 0" class="text-center text-grey q-pa-xl">
        No entries match the current filters.
      </div>

      <article v-for="entry in entries" :key="entry.id" class="entry">
        <h2 class="entry-title">{{ entry.title }}</h2>
        <div class="entry-meta">{{ formatDate(entry.created_at) }} • {{ entry.type }}</div>

        <div v-if="entry.verses?.length" class="entry-line">
          <strong>Verses:</strong> {{ verseLine(entry) }}
        </div>

        <div v-if="entry.tags?.length" class="entry-line">
          <strong>Tags:</strong> {{ entry.tags.map((t) => t.name).join(', ') }}
        </div>

        <template v-for="(section, key) in entry.decryptedContent || {}" :key="key">
          <section v-if="section?.title || section?.content" class="entry-section">
            <h3 v-if="section?.title" class="section-title">{{ section.title }}</h3>
            <p v-if="section?.content" class="section-content">{{ section.content }}</p>
          </section>
        </template>

        <div v-if="entry.quotes?.length" class="entry-quotes">
          <h3 class="section-title">Quotes</h3>
          <blockquote v-for="quote in entry.quotes" :key="quote.id" class="quote-block">
            <span class="quote-text">"{{ quote.decryptedQuote }}"</span>
            <footer v-if="quote.source" class="quote-source">
              — {{ quote.source }}<span v-if="quote.page_number">, p. {{ quote.page_number }}</span>
            </footer>
          </blockquote>
        </div>

        <div v-if="entry.links?.length" class="entry-line">
          <strong>Links:</strong>
          <template v-for="(link, i) in entry.links" :key="link.id">
            {{ link.name }} ({{ link.url }})<template v-if="i < entry.links.length - 1">, </template>
          </template>
        </div>
      </article>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJournalStore, getVerseDisplay } from 'src/stores/journalData'

const router = useRouter()
const journalStore = useJournalStore()

const loading = ref(true)

const entries = computed(() => journalStore.filteredEntries)

const printedDate = new Date().toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const facetLabels = {
  types: 'Type',
  verses: 'Verse',
  resourceTypes: 'Resource Type',
  resources: 'Resource',
  tags: 'Tag',
  quotes: 'Quote',
  links: 'Link',
}

const filterSummary = computed(() => {
  const parts = Object.entries(journalStore.selectedFacets)
    .filter(([, values]) => values?.length > 0)
    .map(
      ([facetType, values]) =>
        `${facetLabels[facetType] || facetType}: ${values
          .map((value) => (typeof value === 'string' ? value : value.label))
          .join(', ')}`,
    )
  if (journalStore.searchTerm) {
    parts.push(`Search: "${journalStore.searchTerm}"`)
  }
  return parts.join(' • ')
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const verseLine = (entry) => {
  return entry.verses
    .map((verse) => {
      const display = getVerseDisplay(verse)
      if (!display) return null
      return verse.main_verse ? `${display} (main)` : display
    })
    .filter(Boolean)
    .join(', ')
}

const printPage = () => {
  window.print()
}

onMounted(async () => {
  if (!journalStore.entries.length) {
    await journalStore.fetchEntries()
  }
  loading.value = false
})
</script>

<style scoped>
.document {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  font-family: Georgia, 'Times New Roman', serif;
  color: #222;
}

.doc-header {
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.doc-title {
  font-size: 28px;
  font-weight: bold;
}

.doc-meta {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}

.doc-filters {
  font-size: 13px;
  font-style: italic;
  color: #444;
  margin-top: 8px;
}

.entry {
  border-top: 1px solid #ccc;
  padding-top: 16px;
  margin-top: 24px;
}

.entry:first-of-type {
  border-top: none;
  margin-top: 0;
}

.entry-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 2px;
  line-height: 1.3;
  break-after: avoid;
}

.entry-meta {
  color: #666;
  font-size: 13px;
  margin-bottom: 10px;
}

.entry-line {
  font-size: 14px;
  margin-bottom: 4px;
}

.entry-section {
  margin-top: 12px;
  break-inside: avoid;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  margin: 0 0 4px;
  break-after: avoid;
}

.section-content {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.entry-quotes {
  margin-top: 12px;
}

.quote-block {
  margin: 8px 0 8px 16px;
  padding-left: 12px;
  border-left: 3px solid #999;
  font-style: italic;
  font-size: 14px;
  break-inside: avoid;
}

.quote-source {
  font-style: normal;
  font-size: 13px;
  color: #555;
  margin-top: 2px;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-page {
    padding: 0 !important;
  }

  .document {
    max-width: none;
    padding: 0;
  }
}
</style>
