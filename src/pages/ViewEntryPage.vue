<template>
  <q-page class="q-pt-xl q-px-md q-pb-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6 q-pa-lg parchment">
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <template v-else>
          <!-- Header -->
          <div class="row items-start q-mb-sm">
            <div class="col">
              <div class="row items-center q-mb-lg">
                <div class="col">
                  <!-- Bible -->
                  <div v-if="entry?.type === 'Bible'" class="q-mb-lg">
                    <div v-if="mainVerse" class="q-mb-md">
                      <div class="row items-center q-mb-sm">
                        <div class="col">
                          <a href="#" class="verse-link text-h5 text-primary text-weight-medium"
                            style="text-decoration: none; line-height: 1.5"
                            @click.prevent="showVerseDisplayModal = true">
                            {{ mainVerse.display }}
                          </a>
                        </div>
                      </div>
                      <VerseDisplayModal v-model="showVerseDisplayModal" :reference="mainVerse.display"
                        :startVerse="mainVerse.startVerse" :endVerse="mainVerse.endVerse" />
                    </div>
                  </div>
                  <div v-else class="text-h5">{{ entry?.title }}</div>
                </div>
              </div>
              <div v-if="entry?.resources?.length > 0" class="q-mb-lg">

                <!-- Book -->
                <div v-if="entry?.type === 'Book'" class="q-mb-lg">
                  <div v-if="selectedBook">
                    <div class="q-mb-md">
                      <div class="text-body1">Chapter: {{ selectedChapter.metadata.number }} {{
                        selectedChapter.metadata.title
                      }}</div>
                      <div class="text-caption text-grey-8">From {{ selectedBook.metadata.title }}</div>
                      <div class="text-caption text-grey-8">by {{ selectedAuthor.metadata.name }}</div>
                    </div>
                  </div>
                </div>

                <!-- Group -->
                <div v-if="entry?.type === 'Group'" class="q-mb-lg">
                  <div v-if="selectedGroup">
                    <div class="q-mb-md">
                      <div class="text-body1">{{ selectedGroup.metadata.name }}</div>
                      <div class="text-caption text-grey-8">
                        <span v-if="selectedGroup.metadata.leader">Led by {{ selectedGroup.metadata.leader }}</span>
                        <span v-if="selectedGroup.metadata.church"> at {{ selectedGroup.metadata.church }}</span>
                      </div>
                    </div>
                  </div>
                </div>


                <!-- Show -->
                <div v-if="entry?.type === 'Show'" class="q-mb-lg">
                  <div v-if="selectedShow">
                    <div class="q-mb-md">
                      <div class="text-body1">{{ selectedShow.metadata.name }}</div>
                      <div class="text-caption text-grey-8">
                        <span v-if="selectedSeason.metadata.seasonNumber">S{{ selectedSeason.metadata.seasonNumber
                          }}</span>
                        <span v-if="selectedEpisode.metadata.episodeNumber"> E{{ selectedEpisode.metadata.episodeNumber
                          }}
                          {{ selectedEpisode.metadata.name }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Sermon -->
                <div v-if="entry?.type === 'Sermon'">
                  <div v-if="selectedPastor">
                    <div class="q-mb-md">
                      <div class="text-body1"><strong>Sermon:</strong> {{ selectedSermon.metadata.title }}</div>
                      <div class="text-body1"><strong>Series:</strong> {{ selectedSeries.metadata.title }}</div>
                      <div class="text-caption text-grey-8">By {{ selectedPastor.metadata.name }} From {{
                        selectedPastor.metadata.church }}</div>
                      <div class="text-caption text-grey-8">On {{ selectedSermon.metadata.date }}</div>
                    </div>
                  </div>
                </div>

                <!-- Devotional -->
                <div v-if="entry?.type === 'Devotional'" class="q-mb-lg">
                  <div v-if="selectedMinistry">
                    <div class="q-mb-md">
                      <div class="text-body1">{{ selectedDevotionalSeries.metadata.name }}</div>
                      <div class="text-caption text-grey-8">by {{ selectedMinistry.metadata.name }}</div>
                    </div>
                  </div>
                </div>

                <!-- Song -->
                <div v-if="entry?.type === 'Song'" class="q-mb-lg">
                  <div v-if="selectedArtist">
                    <div class="q-mb-md">
                      <div class="text-body1">{{ selectedArtist.metadata.name }}</div>
                    </div>
                  </div>
                </div>

                <!-- Podcast -->
                <div v-if="entry?.type === 'Podcast'" class="q-mb-lg">
                  <div v-if="selectedPodcast">
                    <div class="q-mb-md">
                      <div class="text-body1">{{ selectedPodcast.metadata.title }}</div>
                      <div class="text-caption text-grey-8">by {{ selectedPodcast.metadata.host }}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div class="row q-col-gutter-sm justify-end q-mb-xl">
            <div class="col-auto">
              <q-btn rounded unelevated color="primary" icon="edit" style="height: 40px"
                @click="router.push(`/entry/${entry.id}/edit`)" />
            </div>
            <div class="col-auto">
              <q-btn rounded unelevated color="negative" icon="delete" style="height: 40px" @click="confirmDelete" />
            </div>
            <div class="col-auto">
              <q-btn rounded unelevated color="grey" label="Back" @click="router.go(-1)" style="height: 40px" />
            </div>
          </div>
          <!-- Tabs Section -->
          <q-tabs v-model="activeTab" dense class="text-grey q-mb-md" active-color="primary" indicator-color="primary"
            align="justify" narrow-indicator>
            <q-tab name="main" label="Main Content" />
            <q-tab name="additional" label="Additional Content" />
          </q-tabs>


          <q-tab-panels v-model="activeTab" animated class="bg-transparent" @touchstart="handleTouchStart"
            @touchmove="handleTouchMove" @touchend="handleTouchEnd">
            <!-- Main Content Tab -->
            <q-tab-panel name="main" class="q-pa-md">
              <div class="q-mb-xl">
                <template v-if="entry?.decryptedContent?.sections">
                  <div v-for="(section, index) in entry.decryptedContent.sections" :key="index" class="q-mb-lg">
                    <div class="text-subtitle1 text-weight-medium q-mb-sm">
                      {{ section.title || 'Untitled Section' }}
                    </div>
                    <div class="text-body1" style="white-space: pre-wrap">{{ section.content }}</div>
                  </div>
                </template>
              </div>
            </q-tab-panel>
            <!-- Additional Content Tab -->
            <q-tab-panel name="additional" class="q-pa-md">
              <div>
                <!-- Linked Verses -->
                <div class="q-mb-lg">
                  <LinkedVerses v-model="linkedVerses" :display-only="true" />
                </div>

                <!-- Tags -->
                <div class="q-mb-lg">
                  <TagSelector v-model="entry.tags" :display-only="true" />
                </div>

                <!-- Quotes -->
                <div class="q-mb-lg">
                  <QuoteSelector v-model="entry.quotes" :display-only="true" />
                </div>

                <!-- Links -->
                <div class="q-mb-lg">
                  <LinkSelector v-model="entry.links" :display-only="true" />
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
import { ref, computed, onMounted, watch } from 'vue'
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
import { useResourcesStore } from 'src/stores/resources'


const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const journalStore = useJournalStore()
const resourcesStore = useResourcesStore()

// State
const loading = ref(true)
const entry = ref(null)
const showDeleteDialog = ref(false)
const deleting = ref(false)
const showVerseDisplayModal = ref(false)
const selectedVerse = ref(null)
const activeTab = ref('main')
const mainVerse = ref({})

// Resources
const selectedPastor = ref(null)
const selectedSeries = ref(null)
const selectedSermon = ref(null)
const selectedPodcast = ref(null)
const selectedArtist = ref(null)
const selectedMinistry = ref(null)
const selectedDevotionalSeries = ref(null)
const selectedBook = ref(null)
const selectedAuthor = ref(null)
const selectedChapter = ref(null)
const selectedGroup = ref(null)
const selectedShow = ref(null)
const selectedSeason = ref(null)
const selectedEpisode = ref(null)

const linkedVerses = computed(() => {
  if (!entry.value?.verses) return []
  return entry.value.verses
    .filter(v => !v.main_verse)
    .map(createDisplayVerse)
})

const resetEntryState = () => {
  entry.value = null
  mainVerse.value = {}
  selectedPastor.value = null
  selectedSeries.value = null
  selectedSermon.value = null
  selectedPodcast.value = null
  selectedArtist.value = null
  selectedMinistry.value = null
  selectedDevotionalSeries.value = null
  selectedBook.value = null
  selectedAuthor.value = null
  selectedChapter.value = null
  selectedGroup.value = null
  selectedShow.value = null
  selectedSeason.value = null
  selectedEpisode.value = null
}

const fetchEntry = async () => {
  try {
    loading.value = true
    resetEntryState()
    const entryData = await journalStore.getEntry(route.params.id)
    if (!entryData) throw new Error('Entry not found')

    // If the entry has a resource, get it from the resources store
    if (entryData.resources.length > 0) {
      // Make sure resources are loaded
      await resourcesStore.loadResources()
      // Get the resource from the store
      const resource = resourcesStore.getResourceById(entryData.resource_id)
      if (resource) {
        entryData.resource = resource
      }
    }

    if (entryData.type === 'Bible') {
      mainVerse.value = entryData.verses
        .filter(v => v.main_verse)
        .map(createDisplayVerse)[0];
    }

    for (let i = 0; i < entryData.resources.length; i++) {
      const resource = entryData.resources[i];
      switch (resource.type) {
        case 'Pastor':
          selectedPastor.value = resource;
          break;
        case 'Show':
          selectedShow.value = resource;
          break;
        case 'Season':
          selectedSeason.value = resource;
          break;
        case 'Podcast':
          selectedPodcast.value = resource;
          break;
        case 'Chapter':
          selectedChapter.value = resource;
          break;
        case 'Episode':
          selectedEpisode.value = resource;
          break;
        case 'Sermon':
          selectedSermon.value = resource;
          break;
        case 'SongArtist':
          selectedArtist.value = resource;
          break;
        case 'Group':
          selectedGroup.value = resource;
          break;
        case 'Author':
          selectedAuthor.value = resource;
          break;
        case 'SermonSeries':
          selectedSeries.value = resource;
          break;
        case 'Book':
          selectedBook.value = resource;
          break;
        case 'Ministry':
          selectedMinistry.value = resource;
          break;
        case 'DevotionalSeries':
          selectedDevotionalSeries.value = resource;
          break;
        default:
          break;
      }
    }

    entry.value = entryData
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

const touchStart = ref({ x: 0, y: 0 })
const touchEnd = ref({ x: 0, y: 0 })
const minSwipeDistance = 50 // minimum distance in pixels to trigger swipe

const handleTouchStart = (event) => {
  touchStart.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  }
  touchEnd.value = { x: 0, y: 0 }
}

const handleTouchMove = (event) => {
  touchEnd.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  }
}

const handleTouchEnd = () => {
  if (!touchStart.value.x || !touchEnd.value.x) return

  const distanceX = touchEnd.value.x - touchStart.value.x
  const distanceY = Math.abs(touchEnd.value.y - touchStart.value.y)

  // Only handle horizontal swipes (ignore if vertical movement is too large)
  if (Math.abs(distanceX) > minSwipeDistance && distanceY < 100) {
    const tabs = ['main', 'additional']
    const currentIndex = tabs.indexOf(activeTab.value)

    if (distanceX > 0 && currentIndex > 0) {
      // Swipe right
      activeTab.value = tabs[currentIndex - 1]
    } else if (distanceX < 0 && currentIndex < tabs.length - 1) {
      // Swipe left
      activeTab.value = tabs[currentIndex + 1]
    }
  }

  // Reset values
  touchStart.value = { x: 0, y: 0 }
  touchEnd.value = { x: 0, y: 0 }
}

// Lifecycle hooks
onMounted(() => {
  fetchEntry()
})

// Vue Router reuses this component when only the :id param changes
// (e.g. jumping between entries from the sidebar), so refetch on change
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchEntry()
  }
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
