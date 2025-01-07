<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <template v-else>
          <!-- Header Section -->
          <div class="q-mb-lg">
            <div class="text-h5">{{ entry?.title }}</div>
            <div class="text-caption text-grey q-mt-sm">
              {{ formatDate(entry?.created_at) }} • {{ entry?.type }}
            </div>
          </div>

          <!-- Main Verse Section (for Bible entries) -->
          <template v-if="entry?.type === 'Bible' && mainVerse">
            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">Main Verse</div>
              <VerseChip :verse="{
                display: mainVerse.display,
                startVerse: mainVerse.startVerse,
                endVerse: mainVerse.endVerse
              }" color="primary" :removable="false" />
            </div>
          </template>

          <!-- Resource Section -->
          <template v-if="resources.length > 0">
            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">Resource</div>
              <div v-for="resource in resources" :key="resource.id" class="q-mb-sm">
                <q-chip :color="resource.primary_resource ? 'primary' : 'secondary'" text-color="white">
                  {{ getResourceDisplay(resource) }}
                </q-chip>
              </div>
            </div>
          </template>

          <!-- Linked Verses for all types -->
          <div class="q-mb-lg">
            <LinkedVerses v-model="linkedVerses" :displayOnly="true" />
          </div>

          <!-- Tags Section -->
          <template v-if="tags.length > 0">
            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">Tags</div>
              <div class="row q-gutter-sm">
                <q-chip v-for="tag in tags" :key="tag.id" color="info" text-color="white">
                  {{ tag.name }}
                </q-chip>
              </div>
            </div>
          </template>

          <!-- Content Sections -->
          <template v-if="decryptedContent">
            <!-- Header Sections -->
            <template v-for="section in decryptedContent.sections.filter(s => s.headerProperty)" :key="section.title">
              <div class="q-mb-md">
                <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ section.title }}</div>
                <div class="text-body1">{{ section.content }}</div>
              </div>
            </template>

            <!-- Regular Sections -->
            <template v-for="section in decryptedContent.sections.filter(s => !s.headerProperty)" :key="section.title">
              <div class="q-mb-lg">
                <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ section.title }}</div>
                <div class="text-body1" style="white-space: pre-wrap">{{ section.content }}</div>
              </div>
            </template>
          </template>

          <div v-else class="text-center text-grey q-pa-lg">
            Unable to decrypt entry content
          </div>
        </template>

        <div class="q-mt-xl">
          <q-btn rounded unelevated color="info" class="full-width" style="height: 40px"
            @click="router.push(`/entry/${entry?.id}/edit`)">
            <q-icon name="edit" class="q-mr-sm" />
            Edit
          </q-btn>
        </div>

        <div class="q-mt-lg">
          <div class="row q-col-gutter-x-sm">
            <div class="col-6">
              <q-btn rounded unelevated color="grey" class="full-width" @click="goBack" style="height: 40px"><q-icon
                  name="arrow_back" class="q-mr-sm" /> Back</q-btn>
            </div>
            <div class="col-6">
              <q-btn rounded unelevated color="negative" @click="confirmDelete" class="full-width" style="height: 40px">
                <q-icon name="delete" class="q-mr-sm" />Delete
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Delete Confirmation Dialog -->
        <q-dialog v-model="showDeleteDialog" persistent>
          <q-card style="min-width: 300px">
            <q-card-section>
              <div class="text-h6">Delete Entry</div>
            </q-card-section>

            <q-card-section>
              Are you sure you want to delete this entry? This action cannot be undone.
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Back" color="primary" v-close-popup />
              <q-btn flat label="Delete" color="negative" :loading="deleting" @click="deleteEntry" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import VerseChip from 'components/VerseChip.vue'
import LinkedVerses from 'components/LinkedVerses.vue'
import { useJournalStore } from 'stores/journalData'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const journalStore = useJournalStore()

const entry = ref(null)
const decryptedContent = ref(null)
const showDeleteDialog = ref(false)
const deleting = ref(false)
const verses = ref([])
const tags = ref([])
const mainVerse = ref({})
const linkedVerses = ref([])
const resources = ref([])
const loading = computed(() => journalStore.loading)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => {
  router.push('/')
}

const formatVerseReference = (verseData) => {
  if (!verseData) return ''
  const { book, start_chapter, start_verse, end_chapter, end_verse } = verseData
  if (start_chapter === end_chapter && start_verse === end_verse) {
    return `${book} ${start_chapter}:${start_verse}`
  } else if (start_chapter === end_chapter) {
    return `${book} ${start_chapter}:${start_verse}-${end_verse}`
  } else {
    return `${book} ${start_chapter}:${start_verse}-${end_chapter}:${end_verse}`
  }
}

const getResourceDisplay = (resource) => {
  if (!resource) return ''
  switch (entry.value?.type) {
    case 'Book':
      return `${resource.metadata.title} by ${resource.metadata.author}`
    case 'Sermon':
      return `${resource.metadata.name} from ${resource.metadata.church}`
    case 'Podcast':
      return `${resource.metadata.title} with ${resource.metadata.host}`
    case 'Song':
      return resource.metadata.name
    case 'Devotional':
      return resource.metadata.name
    default:
      return ''
  }
}

const fetchEntry = async () => {
  try {
    const entryData = await journalStore.getEntry(route.params.id)
    console.log(entryData)
    if (!entryData) {
      throw new Error('Entry not found')
    }

    entry.value = entryData
    verses.value = entryData.verses || []
    tags.value = entryData.tags || []
    resources.value = entryData.resources || []
    decryptedContent.value = entryData.decryptedContent

    // Handle verses
    if (verses.value && verses.value.length) {
      const mainVerseData = verses.value.find(v => v.main_verse)
      const linkedVersesData = verses.value.filter(v => !v.main_verse)

      if (mainVerseData) {
        mainVerse.value = {
          startVerseId: mainVerseData.start_verse_id,
          endVerseId: mainVerseData.end_verse_id,
          startVerse: mainVerseData.start_verse_number,
          endVerse: mainVerseData.end_verse_number,
          display: formatVerseReference(mainVerseData)
        }
      }

      linkedVerses.value = linkedVersesData.map(verse => ({
        startVerseId: verse.start_verse_id,
        endVerseId: verse.end_verse_id,
        startVerse: verse.start_verse_number,
        endVerse: verse.end_verse_number,
        display: formatVerseReference({
          book: verse.book,
          start_chapter: verse.start_chapter,
          start_verse: verse.start_verse,
          end_chapter: verse.end_chapter,
          end_verse: verse.end_verse
        })
      }))
    }

    if (!entryData.decryptedContent) {
      $q.notify({
        type: 'negative',
        message: 'Unable to decrypt entry content'
      })
    }
  } catch (error) {
    console.error('Error fetching entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Error loading entry'
    })
    router.push('/')
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteEntry = async () => {
  deleting.value = true
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', route.params.id)

    if (error) throw error

    // Remove from store
    await journalStore.removeEntry(route.params.id)

    showDeleteDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Entry deleted successfully'
    })
    goBack()
  } catch (error) {
    console.error('Error deleting entry:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to delete entry'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchEntry()
})
</script>
