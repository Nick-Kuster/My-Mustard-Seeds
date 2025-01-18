<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <template v-else>
          <!-- Header -->
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h5">{{ entry?.title }}</div>
              <div class="text-caption text-grey">
                {{ formatDate(entry?.created_at) }} • {{ entry?.type }}
              </div>
            </div>
            <div class="col-auto">
              <div class="row q-gutter-sm">
                <q-btn rounded unelevated color="negative" icon="delete" style="height: 40px" @click="confirmDelete" />
                <q-btn rounded unelevated color="grey" label="Back" @click="router.push('/')" style="height: 40px" />
              </div>
            </div>
          </div>

          <!-- Bible Verse Display -->
          <div v-if="entry?.type === 'Bible' && mainVerses.length" class="q-mb-lg">
            <div v-for="verse in mainVerses" :key="verse.startVerseId" class="q-mb-sm">
              <a href="#" class="verse-link text-h5 text-primary text-weight-medium"
                style="text-decoration: none; line-height: 1.5" @click.prevent="() => showVerseModal(verse)">
                {{ verse.display }}
              </a>
            </div>
          </div>

          <!-- Content Tabs -->
          <q-tabs v-model="activeTab" dense class="text-grey q-mb-md" active-color="primary" indicator-color="primary"
            align="justify" narrow-indicator>
            <q-tab name="main" label="Main Content" />
            <q-tab name="additional" label="Additional Content" />
          </q-tabs>

          <q-tab-panels v-model="activeTab" animated class="bg-transparent">
            <!-- Main Content Tab -->
            <q-tab-panel name="main" class="q-pa-none">
              <template v-if="entry?.decryptedContent?.sections">
                <div v-for="(section, index) in entry.decryptedContent.sections" :key="index" class="q-mb-lg">
                  <div class="text-subtitle1 text-weight-medium q-mb-sm">
                    {{ section.title || 'Untitled Section' }}
                  </div>
                  <div class="text-body1" style="white-space: pre-wrap">{{ section.content }}</div>
                </div>
              </template>
            </q-tab-panel>

            <!-- Additional Content Tab -->
            <q-tab-panel name="additional" class="q-pa-none">
              <!-- Linked Verses -->
              <div v-if="linkedVerses.length" class="q-mb-lg">
                <div class="q-mb-lg">
                  <LinkedVerses v-model="linkedVerses" />
                </div>
              </div>

              <!-- Tags -->
              <div v-if="entry?.tags?.length" class="q-mb-lg">
                <div class="q-mb-lg">
                  <TagSelector v-model="entry.tags" />
                </div>
              </div>

              <!-- Quotes -->
              <div v-if="entry?.quotes?.length" class="q-mb-lg">

                <div class="q-mb-lg">
                  <QuoteSelector v-model="entry.quotes" />
                </div>

              </div>

              <!-- Links -->
              <div v-if="entry?.links?.length" class="q-mb-lg">
                <div class="q-mb-lg">
                  <LinkSelector v-model="entry.links" />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </template>
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
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="negative" :loading="deleting" @click="deleteEntry" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Verse Display Modal -->
    <VerseDisplayModal v-if="selectedVerse" v-model="showVerseDisplayModal" :reference="selectedVerse.display"
      :start-verse="selectedVerse.startVerse" :end-verse="selectedVerse.endVerse" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useJournalStore } from 'src/stores/journalData'
import LinkedVerses from 'components/LinkedVerses.vue'
import TagSelector from 'components/TagSelector.vue'
import QuoteSelector from 'components/QuoteSelector.vue'
import LinkSelector from 'components/LinkSelector.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import { createDisplayVerse } from 'src/utils/verseUtils'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const journalStore = useJournalStore()

// State
const activeTab = ref('main')
const loading = ref(true)
const entry = ref(null)
const showDeleteDialog = ref(false)
const deleting = ref(false)
const showVerseDisplayModal = ref(false)
const selectedVerse = ref(null)

// Computed properties
const mainVerses = computed(() => {
  if (!entry.value?.verses) return []
  return entry.value.verses
    .filter(v => v.main_verse)
    .map(createDisplayVerse)
})

const linkedVerses = computed(() => {
  if (!entry.value?.verses) return []
  return entry.value.verses
    .filter(v => !v.main_verse)
    .map(createDisplayVerse)
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const showVerseModal = (verse) => {
  selectedVerse.value = verse
  showVerseDisplayModal.value = true
}

const fetchEntry = async () => {
  try {
    loading.value = true
    const entryData = await journalStore.getEntry(route.params.id)
    if (!entryData) throw new Error('Entry not found')
    entry.value = entryData
    console.log(entry)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error loading entry'
    })
    router.push('/')
  } finally {
    loading.value = false
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteEntry = async () => {
  try {
    deleting.value = true
    await journalStore.removeEntry(entry.value.id)
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entry.value.id)

    if (error) throw error

    showDeleteDialog.value = false
    $q.notify({
      type: 'positive',
      message: 'Entry deleted successfully'
    })
    router.push('/')
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

// Lifecycle hooks
onMounted(() => {
  fetchEntry()
})
</script>

<style scoped>
.verse-link {
  display: block;
  padding: 8px 0;
}

.verse-link:hover {
  opacity: 0.8;
}
</style>
