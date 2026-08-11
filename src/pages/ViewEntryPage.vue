<template>
  <q-page class="entry-view-page q-pa-md">
    <div class="row justify-center">
      <div class="col-12 content-card q-pa-lg parchment app-page-card entry-view-card">
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
                  <div v-if="verseEntryTypes.includes(entry?.type)" class="q-mb-lg">
                    <div v-if="mainVerse" class="q-mb-md">
                      <div class="row items-center q-mb-sm">
                        <div class="col">
                          <a href="#" class="verse-link text-h5 text-primary text-weight-medium entry-view-title"
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
                  <div v-else class="text-h5 entry-view-title">{{ entry?.title }}</div>
                </div>
              </div>
              <div v-if="entryMetadataItems.length" class="entry-metadata-strip q-mb-lg">
                <div v-for="item in entryMetadataItems" :key="item.label" class="entry-metadata-item">
                  <q-icon :name="item.icon" size="16px" />
                  <span>{{ item.label }}</span>
                </div>
              </div>
              <div v-if="entry?.resources?.length > 0" class="q-mb-lg entry-resource-summary">

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
                        selectedChurch?.metadata?.name || selectedPastor.metadata.church }}</div>
                      <div class="text-caption text-grey-8">On {{ selectedSermon.metadata.date }}</div>
                    </div>
                  </div>
                </div>

                <!-- Devotional -->
                <div v-if="entry?.type === 'Devotional'" class="q-mb-lg">
                  <div v-if="selectedDevotional">
                    <div class="q-mb-md">
                      <div class="text-body1">{{ selectedDevotional.metadata.name }}</div>
                      <div v-if="selectedDevotional.metadata.author" class="text-caption text-grey-8">
                        by {{ selectedDevotional.metadata.author }}
                      </div>
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
                      <div class="text-caption text-grey-8">
                        <span v-if="selectedPodcastEpisode?.metadata.episodeNumber">Episode {{
                          selectedPodcastEpisode.metadata.episodeNumber }}: </span>
                        <span v-if="selectedPodcastEpisode">{{ selectedPodcastEpisode.metadata.title }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row q-gutter-sm q-mt-sm">
                  <q-chip v-for="resource in entry.resources" :key="resource.id" clickable color="primary"
                    text-color="white" @click="openResourceSearch(resource)">
                    {{ getResourceTitle(resource) }}
                  </q-chip>
                </div>

              </div>
            </div>
          </div>
          <div v-if="$q.screen.gt.sm" class="row q-col-gutter-sm justify-end q-mb-xl">
            <div class="col-auto">
              <q-btn rounded unelevated color="secondary" icon="arrow_back" style="height: 40px" @click="goBack" />
            </div>
            <div class="col-auto">
              <FavoriteButton :entry="entry" @updated="entry.is_favorite = $event" />
            </div>
            <div class="col-auto">
              <q-btn rounded unelevated color="primary" icon="edit" style="height: 40px"
                @click="router.push(`/entry/${entry.id}/edit`)" />
            </div>
            <div class="col-auto">
              <q-btn rounded unelevated color="negative" icon="delete" style="height: 40px" @click="confirmDelete" />
            </div>
          </div>
          <!-- Tabs Section -->
          <q-tabs v-model="activeTab" dense class="text-grey q-mb-md" active-color="primary" indicator-color="primary"
            align="justify" narrow-indicator data-tour="view-tabs">
            <q-tab name="main" label="Main Content" />
            <q-tab name="additional" label="Additional Content" data-tour="view-additional-tab" />
          </q-tabs>


          <q-tab-panels v-model="activeTab" animated class="bg-transparent" @touchstart="handleTouchStart"
            @touchmove="handleTouchMove" @touchend="handleTouchEnd">
            <!-- Main Content Tab -->
            <q-tab-panel name="main" class="q-pa-none">
              <div class="q-mb-xl">
                <template v-if="entry?.decryptedContent?.sections">
                  <ContentSectionView v-for="(section, index) in entry.decryptedContent.sections"
                    :key="section.id || index" :section="section" :verses="entry.verses" :tags="entry.tags"
                    :strongs="entry.strongs" />
                </template>
              </div>
            </q-tab-panel>
            <!-- Additional Content Tab -->
            <q-tab-panel name="additional" class="q-pa-none">
              <div class="entry-view-additional-panel" data-tour="view-additional-content">
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

                <!-- Strong's Words -->
                <div class="q-mb-lg">
                  <StrongsSelector v-model="entry.strongs" :display-only="true" />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card style="width: 90vw; max-width: 300px">
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
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { useJournalStore, getResourceTitle } from 'src/stores/journalData'
import { usePageActionsStore } from 'stores/pageActions'
import { useTutorialStore } from 'src/stores/tutorial'
import LinkedVerses from 'components/LinkedVerses.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import ContentSectionView from 'components/ContentSectionView.vue'
import FavoriteButton from 'components/FavoriteButton.vue'
import { createDisplayVerse } from 'src/utils/verseUtils'
import { useResourcesStore } from 'src/stores/resources'
import { searchRouteForFacet } from 'src/utils/searchRoute'

const TagSelector = defineAsyncComponent(() => import('components/TagSelector.vue'))
const QuoteSelector = defineAsyncComponent(() => import('components/QuoteSelector.vue'))
const LinkSelector = defineAsyncComponent(() => import('components/LinkSelector.vue'))
const StrongsSelector = defineAsyncComponent(() => import('components/StrongsSelector.vue'))

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

// Types that use the main-verse (passage) selector; 'Bible' kept for
// entries created before the type rename migration
const verseEntryTypes = ['Daily Bible Reading', 'Bible']

// Resources
const selectedChurch = ref(null)
const selectedPastor = ref(null)
const selectedSeries = ref(null)
const selectedSermon = ref(null)
const selectedPodcast = ref(null)
const selectedPodcastEpisode = ref(null)
const selectedArtist = ref(null)
const selectedDevotional = ref(null)
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
    .map(v => ({ ...v, ...createDisplayVerse(v) }))
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const entryMetadataItems = computed(() => {
  if (!entry.value) return []
  return [
    { icon: 'category', label: entry.value.type },
    { icon: 'event', label: formatDate(entry.value.created_at) },
    entry.value.is_favorite ? { icon: 'star', label: 'Favorite' } : null,
    entry.value.resources?.length ? { icon: 'library_books', label: `${entry.value.resources.length} resource${entry.value.resources.length === 1 ? '' : 's'}` } : null,
    entry.value.tags?.length ? { icon: 'sell', label: `${entry.value.tags.length} tag${entry.value.tags.length === 1 ? '' : 's'}` } : null,
  ].filter(Boolean)
})

const openResourceSearch = (resource) => {
  const title = getResourceTitle(resource)
  if (!title || !resource?.type) return

  router.push(searchRouteForFacet('resources', { type: resource.type, title, label: title }))
}

const resetEntryState = () => {
  entry.value = null
  mainVerse.value = {}
  selectedChurch.value = null
  selectedPastor.value = null
  selectedSeries.value = null
  selectedSermon.value = null
  selectedPodcast.value = null
  selectedPodcastEpisode.value = null
  selectedArtist.value = null
  selectedDevotional.value = null
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

    if (verseEntryTypes.includes(entryData.type)) {
      mainVerse.value = entryData.verses
        .filter(v => v.main_verse)
        .map(createDisplayVerse)[0] || {};
    }

    for (let i = 0; i < entryData.resources.length; i++) {
      const resource = entryData.resources[i];
      switch (resource.type) {
        case 'Church':
          selectedChurch.value = resource;
          break;
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
        case 'PodcastEpisode':
          selectedPodcastEpisode.value = resource;
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
        case 'Devotional':
          selectedDevotional.value = resource;
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

// Entries are now reachable from Home, Search, and other entries' links,
// so a plain Home button no longer reflects "where I came from". Falls
// back to Home when there's no in-app history to go back to (a direct/
// shared link, or a fresh reload) — history.state.back is set by Vue
// Router's own history implementation to the previous route's path, or
// null if this navigation had none.
const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const toggleFavorite = async () => {
  if (!entry.value?.id) return

  try {
    const nextValue = !entry.value.is_favorite
    await journalStore.setEntryFavorite(entry.value.id, nextValue)
    entry.value.is_favorite = nextValue
    $q.notify({
      type: 'positive',
      message: nextValue ? 'Added to favorites' : 'Removed from favorites',
    })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update favorite' })
  }
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

const pageActionsStore = usePageActionsStore()

const updateFooterActions = () => {
  pageActionsStore.setFooterActions([
    {
      key: 'back',
      label: 'Back',
      icon: 'arrow_back',
      color: 'secondary',
      handler: goBack,
    },
    {
      key: 'favorite',
      label: entry.value?.is_favorite ? 'Unfavorite' : 'Favorite',
      icon: entry.value?.is_favorite ? 'star' : 'star_border',
      color: 'warning',
      handler: toggleFavorite,
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: 'edit',
      color: 'primary',
      handler: () => router.push(`/entry/${entry.value.id}/edit`),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: 'delete',
      color: 'negative',
      handler: confirmDelete,
    },
  ])
}

onMounted(() => {
  updateFooterActions()
})

watch(() => entry.value?.is_favorite, updateFooterActions)

onUnmounted(() => {
  pageActionsStore.clearFooterActions()
})

// Vue Router reuses this component when only the :id param changes
// (e.g. jumping between entries from the sidebar), so refetch on change
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchEntry()
  }
})

// Lets a mid-tour step (see src/constants/tutorialSteps.js) switch into the
// Additional Content tab without this component needing to know the tour
// exists — same pattern as SearchPage.vue's Filter modal watcher.
const tutorialStore = useTutorialStore()
watch(
  () => tutorialStore.pendingAction,
  (action) => {
    if (action === 'open-view-additional-tab') {
      activeTab.value = 'additional'
      tutorialStore.clearAction()
    }
  },
)
</script>

<style scoped>
.entry-view-card {
  min-height: calc(100vh - 180px);
}

.entry-view-additional-panel>div {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-alt);
  box-shadow: 0 1px 3px var(--color-shadow-light);
}

.entry-view-title {
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.25;
}

.entry-resource-summary {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-alt);
  box-shadow: 0 1px 3px var(--color-shadow-light);
}

.entry-resource-summary .text-body1 {
  color: var(--color-text);
  font-weight: 650;
}

.entry-resource-summary .text-caption {
  color: var(--color-text-secondary) !important;
  font-size: 0.86rem;
  font-weight: 550;
  line-height: 1.45;
}

.entry-metadata-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.entry-metadata-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-alt);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 650;
}

@media (max-width: 599px) {
  .entry-view-page {
    padding: 4px 2px !important;
  }

  .entry-view-card {
    padding: 8px 6px !important;
  }

  .entry-view-title {
    font-size: 1.35rem;
  }
}

.verse-link {
  display: block;
  padding: 8px 0;
}

.verse-link:hover {
  opacity: 0.8;
}
</style>
