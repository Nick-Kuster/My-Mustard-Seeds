<template>
  <div class="content-section q-mb-lg" :style="sectionStyle">
    <div class="content-section-header row items-start no-wrap q-mb-sm">
      <div v-if="section.title?.trim()" class="content-section-title col">{{ section.title }}</div>
      <q-space v-else />
      <q-btn flat round dense icon="content_copy" size="sm" class="copy-section-btn" @click="copySection">
        <q-tooltip>Copy section as text</q-tooltip>
      </q-btn>
    </div>

    <q-list v-if="section.fieldType === 'list'" dense class="list-view">
      <q-item v-for="(item, i) in listItems" :key="i" class="q-pl-none">
        <q-item-section avatar class="list-bullet-col">
          <q-icon name="fiber_manual_record" size="6px" class="list-bullet" />
        </q-item-section>
        <q-item-section>
          <InlineContent :text="item" :verses="verses" :tags="tags" :strongs="strongs" @verse-click="onVerseClick"
            @tag-click="onTagClick" @strongs-click="onStrongsClick" />
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else-if="section.content" class="text-body1">
      <RichTextViewer :content="section.content" @verse-click="onVerseClick" @tag-click="onTagClick"
        @strongs-click="onStrongsClick" />
    </div>

    <VerseDisplayModal v-model="showVerseDisplayModal" :reference="verseDisplay.display"
      :startVerse="verseDisplay.startVerse" :endVerse="verseDisplay.endVerse" />

    <StrongsDisplayModal v-model="showStrongsDisplayModal" :entry="strongsDisplay" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { getListItems } from 'src/utils/sectionListUtils'
import { formatSectionAsText } from 'src/utils/richTextContent'
import { getSectionStyle } from 'src/utils/sectionColors'
import InlineContent from 'components/InlineContent.vue'
import RichTextViewer from 'components/richText/RichTextViewer.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import StrongsDisplayModal from 'components/StrongsDisplayModal.vue'

const props = defineProps({
  section: { type: Object, required: true },
  verses: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  strongs: { type: Array, default: () => [] },
})

const router = useRouter()
const $q = useQuasar()

const listItems = computed(() => getListItems(props.section.content).filter((item) => item.trim()))
const sectionText = computed(() => formatSectionAsText(props.section))
const sectionStyle = computed(() => getSectionStyle(props.section))

const copySection = async () => {
  try {
    await navigator.clipboard.writeText(sectionText.value)
    $q.notify({ type: 'positive', message: 'Section copied' })
  } catch {
    $q.notify({ type: 'negative', message: 'Could not copy section' })
  }
}

const showVerseDisplayModal = ref(false)
const verseDisplay = ref({})

const showStrongsDisplayModal = ref(false)
const strongsDisplay = ref(null)

// Both InlineContent.vue (list items) and RichTextViewer.vue (longText
// sections) already emit the { display, startVerse, endVerse } shape
// VerseDisplayModal.vue wants directly — no transform needed here.
const onVerseClick = (verse) => {
  verseDisplay.value = verse
  showVerseDisplayModal.value = true
}

const onStrongsClick = (entry) => {
  strongsDisplay.value = entry
  showStrongsDisplayModal.value = true
}

const onTagClick = (tag) => {
  router.push({
    path: '/search',
    query: {
      facets: JSON.stringify({
        types: [], verses: [], books: [], resourceTypes: [], resources: [], tags: [tag.name], quotes: [], links: [],
      }),
    },
  })
}
</script>

<style scoped>
.list-view :deep(.q-item) {
  padding-left: 0;
  min-height: 28px;
}

.content-section {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-alt);
  box-shadow: 0 1px 3px var(--color-shadow-light);
}

.content-section-title {
  padding-bottom: 6px;
  color: var(--section-text-color, var(--q-primary));
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.25;
}

.content-section-header {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.copy-section-btn {
  margin-top: -4px;
}

@media (max-width: 599px) {
  .content-section {
    padding: 10px 6px;
  }

  .content-section-title {
    font-size: 1rem;
  }
}

.list-bullet-col {
  min-width: 20px;
}

.list-bullet {
  color: var(--section-text-color, var(--color-text-muted));
}
</style>
