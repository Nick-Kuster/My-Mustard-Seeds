<template>
  <div class="content-section q-mb-lg">
    <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ section.title || 'Untitled Section' }}</div>

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
    <div v-else-if="section.content" class="text-body1" style="white-space: pre-wrap">
      <InlineContent :text="section.content" :verses="verses" :tags="tags" :strongs="strongs"
        @verse-click="onVerseClick" @tag-click="onTagClick" @strongs-click="onStrongsClick" />
    </div>

    <VerseDisplayModal v-model="showVerseDisplayModal" :reference="verseDisplay.display"
      :startVerse="verseDisplay.startVerse" :endVerse="verseDisplay.endVerse" />

    <StrongsDisplayModal v-model="showStrongsDisplayModal" :entry="strongsDisplay" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getListItems } from 'src/utils/sectionListUtils'
import { createDisplayVerse } from 'src/utils/verseUtils'
import InlineContent from 'components/InlineContent.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import StrongsDisplayModal from 'components/StrongsDisplayModal.vue'

const props = defineProps({
  section: { type: Object, required: true },
  verses: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
  strongs: { type: Array, default: () => [] },
})

const router = useRouter()

const listItems = computed(() => getListItems(props.section.content).filter((item) => item.trim()))

const showVerseDisplayModal = ref(false)
const verseDisplay = ref({})

const showStrongsDisplayModal = ref(false)
const strongsDisplay = ref(null)

const onVerseClick = (verse) => {
  verseDisplay.value = createDisplayVerse(verse)
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

.list-bullet-col {
  min-width: 20px;
}

.list-bullet {
  color: var(--color-text-muted);
}
</style>
