<template>
  <q-dialog v-model="isOpen">
    <q-card class="verse-modal">
      <q-card-section class="verse-modal-header row items-center no-wrap">
        <div class="verse-modal-title">
          <div class="text-subtitle1 text-weight-medium ellipsis">{{ reference }}</div>
          <div class="text-caption text-grey-7 ellipsis">{{ activeTranslationLabel }}</div>
        </div>
        <q-space />
        <div class="external-study-links verse-modal-header-links">
          <a
            class="external-study-link external-study-link--logo"
            :href="passageStudyLinks.logos"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Logos"
            title="Open in Logos"
          >
            <span class="study-link-glyph study-link-glyph--logos">L</span>
            <q-icon name="open_in_new" class="study-link-external" />
          </a>
          <a
            class="external-study-link external-study-link--logo"
            :href="passageStudyLinks.blueLetterBible"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Blue Letter Bible"
            title="Open in Blue Letter Bible"
          >
            <span class="study-link-glyph study-link-glyph--blb">BLB</span>
            <q-icon name="open_in_new" class="study-link-external" />
          </a>
        </div>
        <q-btn v-if="searchFacet" class="verse-modal-header-action" icon="library_books" flat round dense
          color="primary" aria-label="Browse entries" @click="openVerseSearch">
          <q-tooltip>Browse entries with this passage</q-tooltip>
        </q-btn>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="verse-modal-body">
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="2em" />
        </div>
        <div v-else>
          <q-tabs
            v-model="activeTab"
            dense
            class="text-grey q-mb-md verse-tabs"
            active-color="primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab name="passage" icon="menu_book" aria-label="Passage">
              <q-tooltip>Passage</q-tooltip>
            </q-tab>
            <q-tab name="study" icon="travel_explore" aria-label="Word study">
              <q-tooltip>Word Study</q-tooltip>
            </q-tab>
          </q-tabs>

          <q-tab-panels v-model="activeTab" animated swipeable class="bg-transparent">
            <q-tab-panel name="passage" class="q-pa-none">
              <div class="verse-scroll-box">
                <q-banner v-if="apiPassageError" rounded class="verse-warning q-mb-md">
                  {{ apiPassageError }}
                </q-banner>

                <div v-if="usingApiTranslation && apiPassageContent" class="api-passage-content">
                  {{ apiPassageContent }}
                </div>

                <template v-else-if="!usingApiTranslation">
                  <div v-if="localLoading" class="text-center q-pa-md">
                    <q-spinner color="primary" size="2em" />
                  </div>
                  <WordStudyContent
                    v-else
                    :verses="verses"
                    @open-strongs="openStrongs"
                  />
                </template>
              </div>
            </q-tab-panel>

            <q-tab-panel name="study" class="q-pa-none">
              <div class="verse-scroll-box">
                <div class="text-caption text-grey-7 q-mb-sm">
                  Word links use the local BSB alignment, even when the passage tab shows another translation.
                </div>
                <div v-if="localLoading" class="text-center q-pa-md">
                  <q-spinner color="primary" size="2em" />
                </div>
                <q-banner v-else-if="localError" rounded class="verse-warning q-mb-md">
                  {{ localError }}
                </q-banner>
                <WordStudyContent
                  v-else
                  :verses="verses"
                  @open-strongs="openStrongs"
                />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>

  <StrongsDisplayModal :model-value="!!viewingEntry" :entry="viewingEntry" @update:model-value="viewingEntry = null" />
</template>

<script setup>
import { ref, watch, computed, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'
import { useUserPreferencesStore } from 'stores/userPreferences'
import { getApiBiblePassage } from 'src/services/apiBible'
import { apiBiblePassageIdFromDisplay } from 'src/utils/apiBibleReference'
import { externalBibleLinksForReference } from 'src/utils/externalBibleLinks'
import StrongsDisplayModal from './StrongsDisplayModal.vue'
import { searchRouteForFacet } from 'src/utils/searchRoute'

const props = defineProps({
  modelValue: Boolean,
  reference: {
    type: String,
    default: ''
  },
  startVerse: Number,
  endVerse: Number,
  searchFacet: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const userPreferencesStore = useUserPreferencesStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(true)
const localLoading = ref(false)
const verses = ref([])
const apiPassageContent = ref('')
const apiPassageError = ref('')
const localError = ref('')
const viewingEntry = ref(null)
const activeTab = ref('passage')
const localVersesLoaded = ref(false)

const WordStudyContent = defineComponent({
  props: {
    verses: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['openStrongs'],
  setup(componentProps, { emit: componentEmit }) {
    const renderWord = (word, index) => {
      if (!word.strongsNumber) return h('span', { key: index }, word.text)

      return h('span', {
        key: index,
        class: 'verse-word verse-word--tagged',
        role: 'button',
        tabindex: '0',
        onClick: () => componentEmit('openStrongs', word.strongsNumber),
        onKeydown: (event) => {
          if (event.key === 'Enter') componentEmit('openStrongs', word.strongsNumber)
          if (event.key === ' ') {
            event.preventDefault()
            componentEmit('openStrongs', word.strongsNumber)
          }
        },
      }, word.text)
    }

    return () => componentProps.verses.length
      ? componentProps.verses.map((verse) => h('div', { key: verse.verse, class: 'q-mb-md' }, [
          h('div', { class: 'verse-row-header' }, [
            h('span', { class: 'verse-reference-label' }, verse.reference || verse.verse),
          ]),
          h('div', { class: 'verse-content' }, [
            ...verse.words.map(renderWord),
          ]),
        ]))
      : h('div', { class: 'text-body2 text-grey-7 q-pa-sm' }, 'No word-study data available for this passage.')
  },
})

// Populated per fetchVerses() call from whatever strongs_entries this
// reference range actually needs — looked up once in bulk rather than
// per-word-click, since a verse range can repeat the same number many
// times (e.g. "the" tagged G3588 a dozen times in one chapter).
let strongsEntriesByNumber = new Map()

const openStrongs = (strongsNumber) => {
  viewingEntry.value = strongsEntriesByNumber.get(strongsNumber) || null
}

const openVerseSearch = () => {
  if (!props.searchFacet) return
  isOpen.value = false
  router.push(searchRouteForFacet('verses', props.searchFacet))
}

const bibleTranslation = computed(() => userPreferencesStore.bibleTranslation)
const usingApiTranslation = computed(() =>
  bibleTranslation.value.provider === 'apiBible' && !!bibleTranslation.value.bibleId,
)
const bibleTranslationKey = computed(() =>
  usingApiTranslation.value ? bibleTranslation.value.bibleId : 'local',
)
const activeTranslationLabel = computed(() =>
  usingApiTranslation.value
    ? bibleTranslation.value.abbreviation || bibleTranslation.value.label || 'API.Bible'
    : 'BSB with Strong\'s',
)
const activeTranslationAbbreviation = computed(() => bibleTranslation.value.abbreviation || 'BSB')
const passageStudyLinks = computed(() =>
  externalBibleLinksForReference(props.reference, activeTranslationAbbreviation.value),
)

const fetchLocalVerses = async () => {
  if (localVersesLoaded.value || localLoading.value) return
  if (!props.startVerse || !props.endVerse) {
    return
  }

  localLoading.value = true
  localError.value = ''
  try {
    const { data, error } = await supabase
      .from('bible_verse_words')
      .select('book, chapter, verse, verse_number, position, word_text, strongs_number')
      .gte('verse_number', props.startVerse)
      .lte('verse_number', props.endVerse)
      .order('verse_number')
      .order('position')

    if (error) throw error

    const byVerse = new Map()
    for (const row of data || []) {
      const key = row.verse_number || `${row.chapter}:${row.verse}`
      if (!byVerse.has(key)) {
        byVerse.set(key, {
          book: row.book,
          chapter: row.chapter,
          verse: row.verse,
          verseNumber: row.verse_number,
          words: [],
        })
      }
      byVerse.get(key).words.push({ text: row.word_text, strongsNumber: row.strongs_number })
    }
    verses.value = [...byVerse.values()].map((verse) => ({
      ...verse,
      reference: verse.book && verse.chapter && verse.verse
        ? `${verse.book} ${verse.chapter}:${verse.verse}`
        : null,
    }))

    const neededNumbers = [...new Set((data || []).map((row) => row.strongs_number).filter(Boolean))]
    if (neededNumbers.length > 0) {
      const { data: entries, error: entriesError } = await supabase
        .from('strongs_entries')
        .select('*')
        .in('strongs_number', neededNumbers)
      if (entriesError) throw entriesError
      strongsEntriesByNumber = new Map((entries || []).map((entry) => [entry.strongs_number, entry]))
    } else {
      strongsEntriesByNumber = new Map()
    }
    localVersesLoaded.value = true
  } catch (error) {
    console.error('Error fetching word-study data:', error)
    localError.value = 'Could not load word-study data.'
  } finally {
    localLoading.value = false
  }
}

const fetchApiPassage = async () => {
  apiPassageContent.value = ''
  apiPassageError.value = ''
  if (!usingApiTranslation.value) return

  const passageId = apiBiblePassageIdFromDisplay(props.reference)
  if (!passageId) {
    apiPassageError.value = 'Could not map this passage to API.Bible.'
    return
  }

  try {
    const response = await getApiBiblePassage({
      bibleId: bibleTranslation.value.bibleId,
      passageId,
      contentType: 'text',
    })
    apiPassageContent.value = response?.data?.content || ''
  } catch (error) {
    apiPassageError.value = error.message || 'Could not load this API.Bible passage.'
  }
}

const fetchVerses = async () => {
  loading.value = true
  verses.value = []
  localError.value = ''
  localVersesLoaded.value = false
  activeTab.value = 'passage'
  apiPassageContent.value = ''
  apiPassageError.value = ''
  strongsEntriesByNumber = new Map()

  try {
    await userPreferencesStore.load()
    if (usingApiTranslation.value) {
      await fetchApiPassage()
    } else {
      await fetchLocalVerses()
    }
  } catch (error) {
    console.error('Error fetching verses:', error)
  } finally {
    loading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'study') fetchLocalVerses()
})

watch(bibleTranslationKey, () => {
  if (isOpen.value) fetchVerses()
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      fetchVerses()
    }
  }
)
</script>

<style scoped>
.verse-modal {
  background-color: var(--color-parchment);
  width: min(92vw, 600px);
  max-height: 82vh;
}

.verse-modal-body {
  background-color: var(--color-parchment);
  padding: 12px 16px 16px;
}

.verse-modal-header {
  background-color: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border-light);
  padding: 8px 10px 8px 14px;
}

.verse-modal-title {
  min-width: 0;
  flex: 1;
}

.verse-modal-header-action {
  width: 26px;
  height: 26px;
  min-height: 26px;
  margin-left: 2px;
}

.verse-modal-header-action :deep(.q-icon) {
  font-size: 18px;
}

.verse-number {
  margin-right: 0.5rem;
  color: var(--color-text-secondary);
}

.verse-content {
  line-height: 1.6;
}

.verse-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.verse-reference-label {
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.api-passage-content {
  color: var(--color-text);
  line-height: 1.65;
  white-space: pre-wrap;
}

.verse-scroll-box {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface-alt);
  color: var(--color-text);
  padding: 14px;
  height: min(52vh, 420px);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.verse-tabs {
  min-height: 30px;
}

.verse-tabs :deep(.q-tab) {
  min-height: 30px;
  padding: 0 10px;
}

.verse-tabs :deep(.q-tab__icon) {
  font-size: 18px;
}

.external-study-links {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.verse-modal-header-links {
  flex: none;
  margin-right: 4px;
}

.external-study-link {
  text-decoration: none;
}

.external-study-link--logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 2px;
  color: var(--color-text);
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.external-study-link--logo:hover,
.external-study-link--logo:focus {
  outline: none;
  opacity: 0.82;
  transform: translateY(-1px);
}

.study-link-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
}

.study-link-glyph--logos {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #332f84;
  color: #fff;
  font-size: 0.78rem;
  font-family: Georgia, serif;
}

.study-link-glyph--blb {
  color: #285caa;
  font-size: 0.68rem;
}

body.body--dark .study-link-glyph--blb {
  color: #9fc3ff;
}

.study-link-external {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-surface-alt);
  color: var(--color-text-secondary);
  font-size: 11px;
  box-shadow: 0 1px 2px rgba(35, 48, 38, 0.22);
}

.verse-warning {
  background: #f5e3c4;
  border: 1px solid rgba(153, 104, 36, 0.24);
  color: #3d2d18;
}

body.body--dark .verse-warning {
  background: #684b22;
  border-color: rgba(245, 210, 151, 0.24);
  color: #f7ead2;
}

.verse-word--tagged {
  cursor: pointer;
  border-bottom: 1px dotted var(--color-text-secondary);
}

.verse-word--tagged:hover,
.verse-word--tagged:focus {
  background-color: var(--color-hover);
  outline: none;
}
</style>
