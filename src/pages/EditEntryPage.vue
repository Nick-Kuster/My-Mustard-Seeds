<template>
  <q-page class="q-pa-md">
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-else class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6 q-ma-lg  q-pa-lg parchment">
        <div class="row items-center q-mb-md">
          <div class="col-auto">
            <q-btn flat round icon="arrow_back" color="primary" @click="router.go(-1)" />
          </div>
          <div class="col">
            <div class="text-h6">Edit Seed</div>
          </div>
        </div>

        <div class="q-gutter-md">
          <!-- Entry Type Display (readonly since we shouldn't change type) -->
          <q-input v-model="entryType" label="Type" readonly dense />

          <!-- Resource Selection Section -->
          <!-- Bible Verse Selector -->
          <div v-if="entryType === 'Bible'" class="q-mb-lg">
            <div v-if="mainVerse.display" class="q-mb-md">
              <div class="row items-center q-mb-sm">
                <div class="col">
                  <a href="#" class="verse-link text-h5 text-primary text-weight-medium"
                    style="text-decoration: none; line-height: 1.5" @click.prevent="showVerseDisplayModal = true">
                    {{ mainVerse.display }}
                  </a>
                </div>
                <div class="col-auto q-ml-sm">
                  <q-btn flat round dense color="primary" icon="close" @click="clearMainVerse" />
                </div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showVerseModal = true" />

              <VerseDisplayModal v-model="showVerseDisplayModal" :reference="mainVerse.display"
                :startVerse="mainVerse.startVerse" :endVerse="mainVerse.endVerse" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Verse" @click="showVerseModal = true" />
            </div>

            <VerseSelectionModal v-model="showVerseModal" @select="onVerseSelect" />
          </div>
          <!-- Sermon Specific Select -->
          <div v-else-if="entryType === 'Sermon'" class="q-mb-lg">
            <div v-if="selectedPastor">
              <div class="q-mb-md">
                <div class="text-body1"><strong>Sermon:</strong> {{ selectedSermon.metadata.title }}</div>
                <div class="text-body1"><strong>Series:</strong> {{ selectedSeries.metadata.title }}</div>
                <div class="text-caption text-grey-8">By {{ selectedPastor.metadata.name }} From {{
                  selectedPastor.metadata.church }}</div>
                <div class="text-caption text-grey-8">On {{ selectedSermon.metadata.date }}</div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showPastorModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Sermon" @click="showPastorModal = true" />
            </div>

            <ResourceSelectionModal v-model="showPastorModal" :resource-type="RESOURCE_TYPES.PASTOR"
              @select="onPastorSelect" />
          </div>
          <!-- Book Specific Select -->
          <div v-else-if="entryType === 'Book'" class="q-mb-lg">
            <div v-if="selectedBook">
              <div class="q-mb-md">
                <div class="text-body1">Chapter: {{ selectedChapter.metadata.number }} {{ selectedChapter.metadata.title
                  }}</div>
                <div class="text-caption text-grey-8">From {{ selectedBook.metadata.title }}</div>
                <div class="text-caption text-grey-8">by {{ selectedAuthor.metadata.name }}</div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showBookModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Book" @click="showBookModal = true" />
            </div>

            <ResourceSelectionModal v-model="showBookModal" :resource-type="RESOURCE_TYPES.AUTHOR"
              @select="onBookSelect" />
          </div>

          <!-- Podcast Specific Select -->
          <div v-else-if="entryType === 'Podcast'" class="q-mb-lg">
            <div v-if="selectedPodcast">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedPodcast.metadata.title }}</div>
                <div class="text-caption text-grey-8">by {{ selectedPodcast.metadata.host }}</div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showPodcastModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Podcast" @click="showPodcastModal = true" />
            </div>

            <ResourceSelectionModal v-model="showPodcastModal" :resource-type="RESOURCE_TYPES.PODCAST"
              @select="onPodcastSelect" />
          </div>

          <!-- Song Specific Select -->
          <div v-else-if="entryType === 'Song'" class="q-mb-lg">
            <div v-if="selectedArtist">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedArtist.metadata.name }}</div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showArtistModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Artist" @click="showArtistModal = true" />
            </div>

            <ResourceSelectionModal v-model="showArtistModal" :resource-type="RESOURCE_TYPES.SONG_ARTIST"
              @select="onArtistSelect" />
          </div>

          <!-- Ministry Specific Select -->
          <div v-else-if="entryType === 'Devotional'" class="q-mb-lg">
            <div v-if="selectedMinistry">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedDevotionalSeries.metadata.name }}</div>
                <div class="text-caption text-grey-8">by {{ selectedMinistry.metadata.name }}</div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showMinistryModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Ministry" @click="showMinistryModal = true" />
            </div>

            <ResourceSelectionModal v-model="showMinistryModal" :resource-type="RESOURCE_TYPES.MINISTRY"
              @select="onMinistrySelect" />
          </div>

          <!-- Group Specific Select -->
          <div v-else-if="entryType === 'Group'" class="q-mb-lg">
            <div v-if="selectedGroup">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedGroup.metadata.name }}</div>
                <div class="text-caption text-grey-8">
                  <span v-if="selectedGroup.metadata.leader">Led by {{ selectedGroup.metadata.leader }}</span>
                  <span v-if="selectedGroup.metadata.church"> at {{ selectedGroup.metadata.church }}</span>
                </div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showGroupModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Group" @click="showGroupModal = true" />
            </div>

            <ResourceSelectionModal v-model="showGroupModal" :resource-type="RESOURCE_TYPES.GROUP"
              @select="onGroupSelect" />
          </div>

          <!-- Show Specific Select -->
          <div v-else-if="entryType === 'Show'" class="q-mb-lg">
            <div v-if="selectedShow">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedShow.metadata.name }}</div>
                <div class="text-caption text-grey-8">
                  <span v-if="selectedSeason.metadata.seasonNumber">S{{ selectedSeason.metadata.seasonNumber }}</span>
                  <span v-if="selectedEpisode.metadata.episodeNumber"> E{{ selectedEpisode.metadata.episodeNumber }}
                    {{ selectedEpisode.metadata.name }}</span>
                </div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showShowModal = true" />
            </div>
            <div v-else>
              <q-btn unelevated color="primary" label="Select Show" @click="showShowModal = true" />
            </div>

            <ResourceSelectionModal v-model="showShowModal" :resource-type="RESOURCE_TYPES.SHOW"
              @select="onShowSelect" />
          </div>

          <!-- Header Sections -->
          <div v-for="(section, index) in headerSections" :key="'header-' + index" class="q-mb-md">
            <template v-if="section.fieldType === 'date'">
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input v-model="section.content" :label="section.title" mask="##-##-####" fill-mask
                    placeholder="MM-DD-YYYY" :id="section.id">
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="section.content" mask="MM-DD-YYYY">
                            <div class="row items-center justify-end q-pa-sm">
                              <q-btn v-close-popup label="Close" color="primary" flat />
                            </div>
                          </q-date>
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                </div>
              </div>
            </template>
            <template v-else-if="section.fieldType === 'link'">
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input v-model="section.content" :label="section.title" type="url" :rules="[
                    val => !val || /^https?:\/\//.test(val) || 'Must start with http:// or https://'
                  ]" class="q-mb-sm">
                    <template v-slot:append>
                      <q-btn v-if="section.content" flat round dense icon="open_in_new"
                        @click="window.open(section.content, '_blank')" />
                    </template>
                  </q-input>
                </div>
              </div>
            </template>
            <template v-else>
              <q-input v-model="section.content" :label="section.title"
                :type="section.fieldType === 'longText' ? 'textarea' : 'text'" />
            </template>
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
            <q-tab-panel name="main" class="q-pa-none">
              <!-- Dynamic Sections -->
              <draggable :list="contentSections.filter(section => !section.headerProperty)" @update="handleDragUpdate"
                item-key="id" handle=".drag-handle" class="q-gutter-y-md" :animation="200" ghost-class="ghost-section"
                drag-class="drag-section">
                <template #item="{ element: section, index }">
                  <div class="section-container q-mb-md">
                    <div class="row items-center q-mb-sm section-header">
                      <div class="col">
                        <q-input v-model="section.title" label="Section Title" dense />
                      </div>
                      <div class="col-auto">
                        <div class="row items-center no-wrap">
                          <!-- Delete button -->
                          <q-btn v-if="contentSections.length > 1" round flat color="negative" icon="delete" size="sm"
                            @click="removeSection(index)" :disable="dragging" />
                          <!-- Drag handle -->
                          <div class="drag-handle-wrapper q-ml-sm">
                            <q-btn flat round dense class="drag-handle" unelevated>
                              <div class="handle-dots">
                                <div class="dots-row">
                                  <div class="dot"></div>
                                  <div class="dot"></div>
                                </div>
                                <div class="dots-row">
                                  <div class="dot"></div>
                                  <div class="dot"></div>
                                </div>
                                <div class="dots-row">
                                  <div class="dot"></div>
                                  <div class="dot"></div>
                                </div>
                              </div>
                            </q-btn>
                          </div>
                        </div>
                      </div>
                    </div>
                    <q-input v-model="section.content" type="textarea" :label="section.title || 'Your thoughts...'"
                      autogrow class="custom-textarea" :disable="dragging" />
                  </div>
                </template>
              </draggable>

              <div class="q-mt-md">
                <q-btn rounded unelevated color="info" class="full-width" style="height: 40px" @click="addSection">
                  <q-icon name="add" class="q-mr-sm" />
                  Add Section
                </q-btn>
              </div>
            </q-tab-panel>

            <!-- Additional Content Tab -->
            <q-tab-panel name="additional" class="q-pt-md q-pl-md">
              <div class="fit">
                <!-- Linked Verses -->
                <div class="q-mb-lg">
                  <LinkedVerses v-model="linkedVerses" />
                </div>

                <!-- Tags -->
                <div class="q-mb-lg">
                  <TagSelector v-model="selectedTags" />
                </div>

                <!-- Quotes -->
                <div class="q-mb-lg">
                  <QuoteSelector v-model="selectedQuotes" />
                </div>

                <!-- Links -->
                <div class="q-mb-lg">
                  <LinkSelector v-model="selectedLinks" />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>

          <!-- Action Buttons -->
          <div class="row q-col-gutter-x-sm q-mt-lg">
            <div class="col-6">
              <q-btn rounded unelevated color="negative" class="full-width" @click="router.push('/entry/' + entryId)"
                style="height: 40px">
                <q-icon name="cancel" class="q-mr-sm" /> Cancel
              </q-btn>
            </div>
            <div class="col-6">
              <q-btn rounded unelevated color="primary" @click="updateEntry" class="full-width" :loading="saving"
                style="height: 40px">
                <span v-if="!saving">
                  <q-icon name="save" class="q-mr-sm" /> Save
                </span>
                <span v-else>Saving...</span>
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData, decryptData } from 'src/utils/encryption'
import { RESOURCE_TYPES } from 'stores/resources'
import VerseSelectionModal from 'components/VerseSelectionModal.vue'
import ResourceSelectionModal from 'components/ResourceSelectionModal.vue'
import { useJournalStore } from 'stores/journalData'
import draggable from 'vuedraggable'
import LinkedVerses from 'components/LinkedVerses.vue'
import TagSelector from 'src/components/TagSelector.vue'
import QuoteSelector from 'src/components/QuoteSelector.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import LinkSelector from 'src/components/LinkSelector.vue'

const dragging = ref(false)
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const journalStore = useJournalStore()
const activeTab = ref('main')
const loading = ref(true)
const saving = ref(false)
const entryId = route.params.id

// Modals
const showVerseDisplayModal = ref(false)
const showVerseModal = ref(false)
const showBookModal = ref(false)
const showPastorModal = ref(false)
const showPodcastModal = ref(false)
const showArtistModal = ref(false)
const showMinistryModal = ref(false)
const showGroupModal = ref(false)
const showShowModal = ref(false)

// Form Data
const entryType = ref('')
const title = ref('')
const contentSections = ref([])
const mainVerse = ref({})
const linkedVerses = ref([])
const selectedTags = ref([])
const selectedQuotes = ref([])
const selectedLinks = ref([])

// Selected Resources
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

// Section Templates
const createSection = (title = '', content = '', fieldType = 'longText', headerProperty = false, id = '') => ({
  id: id ?? 'section-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
  title,
  content: fieldType === 'date' ? getTodayDate() : content,
  fieldType,
  headerProperty
})

const getTodayDate = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  return `${month}-${day}-${year}`
}

// Computed property to filter header sections
const headerSections = computed(() => {
  return contentSections.value.filter(section => section.headerProperty)
})

// Load entry data
const loadEntry = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    // Get entry data
    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (entryError) throw entryError
    if (!entry) throw new Error('Entry not found')

    if (entry.user_id !== session.user.id) {
      throw new Error('Unauthorized')
    }

    // Decrypt content
    const encryptionKey = await getEncryptionKey(session.user.id)
    const decryptedContent = await decryptData(entry.content, encryptionKey)
    if (!decryptedContent) throw new Error('Failed to decrypt entry content')

    // Set basic entry data
    entryType.value = entry.type
    title.value = entry.title
    contentSections.value = decryptedContent.sections

    // Load main verse if Bible entry
    if (entry.type === 'Bible') {
      const { data: mainVerseData, error: mainVerseError } = await supabase
        .from('journal_verses')
        .select('start_verse_id, end_verse_id')
        .eq('journal_id', entry.id)
        .eq('main_verse', true)
        .single()

      if (!mainVerseError && mainVerseData) {
        // Fetch verse details
        const { data: verseDetails } = await supabase
          .from('bible_verses')
          .select('book, chapter, verse')
          .or(`id.eq.${mainVerseData.start_verse_id},id.eq.${mainVerseData.end_verse_id}`)
          .order('id')

        if (verseDetails && verseDetails.length > 0) {
          const startVerse = verseDetails[0]
          const endVerse = verseDetails.length > 1 ? verseDetails[1] : verseDetails[0]

          let displayText = ''
          if (startVerse.chapter === endVerse.chapter && startVerse.verse === endVerse.verse) {
            displayText = `${startVerse.book} ${startVerse.chapter}:${startVerse.verse}`
          } else if (startVerse.chapter === endVerse.chapter) {
            displayText = `${startVerse.book} ${startVerse.chapter}:${startVerse.verse}-${endVerse.verse}`
          } else {
            displayText = `${startVerse.book} ${startVerse.chapter}:${startVerse.verse}-${endVerse.chapter}:${endVerse.verse}`
          }

          mainVerse.value = {
            startVerseId: mainVerseData.start_verse_id,
            endVerseId: mainVerseData.end_verse_id,
            display: displayText
          }
        }
      }
    }

    // Load linked verses
    const { data: linkedVerseData, error: linkedVerseError } = await supabase
      .from('journal_verses')
      .select('start_verse_id, end_verse_id')
      .eq('journal_id', entry.id)
      .eq('main_verse', false)

    if (!linkedVerseError && linkedVerseData) {
      const versePromises = linkedVerseData.map(async (verse) => {
        const { data: verseDetails } = await supabase
          .from('bible_verses')
          .select('book, chapter, verse')
          .or(`id.eq.${verse.start_verse_id},id.eq.${verse.end_verse_id}`)
          .order('id')

        if (verseDetails && verseDetails.length > 0) {
          const startVerse = verseDetails[0]
          const endVerse = verseDetails.length > 1 ? verseDetails[1] : verseDetails[0]

          let displayText = ''
          if (startVerse.chapter === endVerse.chapter && startVerse.verse === endVerse.verse) {
            displayText = `${startVerse.book} ${startVerse.chapter}:${startVerse.verse}`
          } else if (startVerse.chapter === endVerse.chapter) {
            displayText = `${startVerse.book} ${startVerse.chapter}:${startVerse.verse}-${endVerse.verse}`
          } else {
            displayText = `${startVerse.book} ${startVerse.chapter}:${startVerse.verse}-${endVerse.chapter}:${endVerse.verse}`
          }

          return {
            startVerseId: verse.start_verse_id,
            endVerseId: verse.end_verse_id,
            display: displayText
          }
        }
      })

      linkedVerses.value = await Promise.all(versePromises)
    }

    // Load tags
    const { data: tagData } = await supabase
      .from('journal_tags')
      .select('tags(*)')
      .eq('journal_id', entry.id)

    if (tagData) {
      selectedTags.value = tagData.map(t => t.tags)
    }

    // Load quotes
    const { data: quoteData } = await supabase
      .from('journal_quotes')
      .select('*')
      .eq('journal_id', entry.id)

    if (quoteData) {
      const decryptedQuotes = await Promise.all(quoteData.map(async (quote) => ({
        ...quote,
        decryptedQuote: await decryptData(quote.quote, encryptionKey)
      })))
      selectedQuotes.value = decryptedQuotes
    }

    // Load links
    const { data: linkData } = await supabase
      .from('related_links')
      .select('*')
      .eq('journal_id', entry.id)

    if (linkData) {
      selectedLinks.value = linkData
    }

    // Load resources based on entry type
    const { data: resourceData } = await supabase
      .from('journal_resources')
      .select('resource_id, primary_resource, resources(*)')
      .eq('journal_id', entry.id)
      .order('primary_resource', { ascending: false })

    if (resourceData) {
      switch (entry.type) {
        case 'Book':
          if (resourceData.length >= 3) {
            selectedAuthor.value = resourceData[0].resources
            selectedBook.value = resourceData[1].resources
            selectedChapter.value = resourceData[2].resources
          }
          break
        case 'Sermon':
          if (resourceData.length >= 3) {
            selectedPastor.value = resourceData[0].resources
            selectedSeries.value = resourceData[1].resources
            selectedSermon.value = resourceData[2].resources
          }
          break
        case 'Podcast':
          if (resourceData.length > 0) {
            selectedPodcast.value = resourceData[0].resources
          }
          break
        case 'Song':
          if (resourceData.length > 0) {
            selectedArtist.value = resourceData[0].resources
          }
          break
        case 'Devotional':
          if (resourceData.length >= 2) {
            selectedMinistry.value = resourceData[0].resources
            selectedDevotionalSeries.value = resourceData[1].resources
          }
          break
        case 'Group':
          if (resourceData.length > 0) {
            selectedGroup.value = resourceData[0].resources
          }
          break
        case 'Show':
          if (resourceData.length >= 3) {
            selectedShow.value = resourceData[0].resources
            selectedSeason.value = resourceData[1].resources
            selectedEpisode.value = resourceData[2].resources
          }
          break
      }
    }

  } catch (error) {
    console.error('Error loading entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to load entry'
    })
    router.push('/')
  } finally {
    loading.value = false
  }
}

// Event Handlers
const handleDragUpdate = (event) => {
  const allSections = [...contentSections.value]
  const headerSections = allSections.filter(section => section.headerProperty)
  const regularSections = allSections.filter(section => !section.headerProperty)
  const movedItem = regularSections.splice(event.oldIndex, 1)[0]
  regularSections.splice(event.newIndex, 0, movedItem)
  contentSections.value = [...headerSections, ...regularSections]
}

const onVerseSelect = (verseData) => {
  mainVerse.value = verseData
  title.value = verseData.display
}

const clearMainVerse = () => {
  mainVerse.value = {}
}

const addSection = () => {
  contentSections.value.push(createSection())
}

const removeSection = (index) => {
  contentSections.value.splice(index, 1)
}

const handleResourceSelection = (selections) => {
  if (!Array.isArray(selections) || selections.length === 0) return

  const finalSelection = selections[selections.length - 1]

  switch (entryType.value) {
    case 'Sermon':
      if (selections.length >= 3) {
        selectedPastor.value = selections[0]
        selectedSeries.value = selections[1]
        selectedSermon.value = selections[2]
        title.value = `${selectedPastor.value.metadata.name} - ${selectedSeries.value.metadata.title}: ${selectedSermon.value.metadata.title}`
      }
      break

    case 'Book':
      if (selections.length === 3) {
        selectedAuthor.value = selections[0]
        selectedBook.value = selections[1]
        selectedChapter.value = selections[2]
        title.value = `${selectedBook.value.metadata.title} - Chapter ${selectedChapter.value.metadata.number}: ${selectedChapter.value.metadata.title}`
      }
      break

    case 'Podcast':
      selectedPodcast.value = finalSelection
      break

    case 'Song':
      selectedArtist.value = finalSelection
      break

    case 'Devotional':
      if (selections.length >= 2) {
        selectedMinistry.value = selections[0]
        selectedDevotionalSeries.value = selections[1]
      }
      break

    case 'Show':
      if (selections.length >= 3) {
        selectedShow.value = selections[0]
        selectedSeason.value = selections[1]
        selectedEpisode.value = selections[2]
        title.value = `${selectedShow.value.metadata.name} Season ${selectedSeason.value.metadata.seasonNumber} Episode ${selectedEpisode.value.metadata.episodeNumber}`
      }
      break

    case 'Group':
      selectedGroup.value = finalSelection
      break
  }
}

const onBookSelect = handleResourceSelection
const onPastorSelect = handleResourceSelection
const onPodcastSelect = handleResourceSelection
const onArtistSelect = handleResourceSelection
const onMinistrySelect = handleResourceSelection
const onGroupSelect = handleResourceSelection
const onShowSelect = handleResourceSelection

const generateTitle = () => {
  const headerSections = contentSections.value.filter(section => section.headerProperty)

  switch (entryType.value) {
    case 'Podcast':
      {
        const episodeTitle = headerSections.find(s => s.id === 'podcast-title')?.content
        return `${episodeTitle || ''}`
      }

    case 'Song':
      {
        const songTitle = headerSections.find(s => s.id === 'song-title')?.content
        return `${songTitle || ''}`
      }

    case 'Video':
      {
        const videoTitle = headerSections.find(s => s.id === 'video-title')?.content
        return videoTitle || ''
      }

    case 'Article':
      {
        const articleTitle = headerSections.find(s => s.id === 'article-title')?.content
        return articleTitle || ''
      }

    case 'Group':
      {
        const groupTitle = headerSections.find(s => s.id === 'group-title')?.content
        const groupDate = headerSections.find(s => s.fieldType === 'date')?.content
        return `${groupTitle || ''} (${groupDate || ''})`
      }

    case 'Devotional':
      {
        const devotionalTitle = headerSections.find(s => s.id === 'devotional-title')?.content
        return `${devotionalTitle || ''}`
      }

    case 'Answered Prayer / Miracle':
      {
        const miracleTitle = headerSections.find(s => s.id === 'miracle-title')?.content
        const miracleDate = headerSections.find(s => s.fieldType === 'date')?.content
        return `${miracleTitle || ''} (${miracleDate || ''})`
      }
    case 'Other':
      {
        let otherTitle = headerSections.find(s => s.id === 'other-title')?.content
        const otherDate = headerSections.find(s => s.fieldType === 'date')?.content
        return `${otherTitle || ''} (${otherDate || ''})`
      }

    default:
      return title.value
  }
}

const updateEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    // Generate title if needed
    title.value = generateTitle()

    const encryptionKey = await getEncryptionKey(session.user.id)
    const contentObject = {
      sections: contentSections.value
    }

    const encryptedContent = await encryptData(contentObject, encryptionKey)

    // Update main entry
    const { error: entryError } = await supabase
      .from('journal_entries')
      .update({
        title: title.value,
        content: encryptedContent
      })
      .eq('id', entryId)

    if (entryError) throw entryError

    // Update Bible verses if type is Bible
    if (entryType.value === 'Bible') {
      // Delete existing main verse
      await supabase
        .from('journal_verses')
        .delete()
        .eq('journal_id', entryId)
        .eq('main_verse', true)

      // Insert new main verse if exists
      if (mainVerse.value.startVerseId) {
        const { error: mainVerseError } = await supabase
          .from('journal_verses')
          .insert({
            journal_id: entryId,
            start_verse_id: mainVerse.value.startVerseId,
            end_verse_id: mainVerse.value.endVerseId,
            main_verse: true
          })

        if (mainVerseError) throw mainVerseError
      }
    }

    // Update linked verses
    await supabase
      .from('journal_verses')
      .delete()
      .eq('journal_id', entryId)
      .eq('main_verse', false)

    if (linkedVerses.value.length > 0) {
      const verseInserts = linkedVerses.value.map(verse => ({
        journal_id: entryId,
        start_verse_id: verse.startVerseId,
        end_verse_id: verse.endVerseId,
        main_verse: false
      }))

      const { error: linkedVersesError } = await supabase
        .from('journal_verses')
        .insert(verseInserts)

      if (linkedVersesError) throw linkedVersesError
    }

    // Update resources
    await supabase
      .from('journal_resources')
      .delete()
      .eq('journal_id', entryId)

    let resources = []
    switch (entryType.value) {
      case 'Book':
        if (selectedAuthor.value && selectedBook.value && selectedChapter.value) {
          resources.push({ resourceId: selectedAuthor.value.id, primary: true })
          resources.push({ resourceId: selectedBook.value.id, primary: false })
          resources.push({ resourceId: selectedChapter.value.id, primary: false })
        }
        break
      case 'Sermon':
        if (selectedPastor.value && selectedSeries.value && selectedSermon.value) {
          resources.push({ resourceId: selectedPastor.value.id, primary: true })
          resources.push({ resourceId: selectedSeries.value.id, primary: false })
          resources.push({ resourceId: selectedSermon.value.id, primary: false })
        }
        break
      case 'Podcast':
        if (selectedPodcast.value) {
          resources.push({ resourceId: selectedPodcast.value.id, primary: true })
        }
        break
      case 'Song':
        if (selectedArtist.value) {
          resources.push({ resourceId: selectedArtist.value.id, primary: true })
        }
        break
      case 'Devotional':
        if (selectedMinistry.value && selectedDevotionalSeries.value) {
          resources.push({ resourceId: selectedMinistry.value.id, primary: true })
          resources.push({ resourceId: selectedDevotionalSeries.value.id, primary: false })
        }
        break
      case 'Show':
        if (selectedShow.value && selectedSeason.value && selectedEpisode.value) {
          resources.push({ resourceId: selectedShow.value.id, primary: true })
          resources.push({ resourceId: selectedSeason.value.id, primary: false })
          resources.push({ resourceId: selectedEpisode.value.id, primary: false })
        }
        break
      case 'Group':
        if (selectedGroup.value) {
          resources.push({ resourceId: selectedGroup.value.id, primary: true })
        }
        break
    }

    if (resources.length > 0) {
      const resourceInserts = resources.map(resource => ({
        journal_id: entryId,
        resource_id: resource.resourceId,
        primary_resource: resource.primary,
        user_id: session.user.id
      }))

      const { error: resourceError } = await supabase
        .from('journal_resources')
        .insert(resourceInserts)

      if (resourceError) throw resourceError
    }

    // Update tags
    await supabase
      .from('journal_tags')
      .delete()
      .eq('journal_id', entryId)

    if (selectedTags.value.length > 0) {
      const tagInserts = selectedTags.value.map(tag => ({
        journal_id: entryId,
        tag_id: tag.id,
        user_id: session.user.id
      }))

      const { error: tagError } = await supabase
        .from('journal_tags')
        .insert(tagInserts)

      if (tagError) throw tagError
    }

    // Update quotes
    await supabase
      .from('journal_quotes')
      .delete()
      .eq('journal_id', entryId)

    if (selectedQuotes.value.length > 0) {
      const quotePromises = selectedQuotes.value.map(async quoteData => {
        const encryptedQuote = await encryptData(quoteData.decryptedQuote, encryptionKey)
        return supabase
          .from('journal_quotes')
          .insert({
            journal_id: entryId,
            quote: encryptedQuote,
            source: quoteData.source,
            page_number: quoteData.page_number
          })
      })

      try {
        await Promise.all(quotePromises)
      } catch (error) {
        throw new Error('Failed to save quotes: ' + error.message)
      }
    }

    // Update links
    await supabase
      .from('related_links')
      .delete()
      .eq('journal_id', entryId)

    const linkSections = contentSections.value.filter(s => s.fieldType === 'link' && s.content)
    const allLinks = [
      ...linkSections.map(section => ({
        journal_id: entryId,
        name: section.title,
        url: section.content
      })),
      ...selectedLinks.value.map(link => ({
        journal_id: entryId,
        name: link.name,
        url: link.url
      }))
    ]

    if (allLinks.length > 0) {
      const { error: linkError } = await supabase
        .from('related_links')
        .insert(allLinks)

      if (linkError) throw linkError
    }

    // Update store
    const updatedEntry = await journalStore.getEntry(entryId)
    await journalStore.updateEntry(updatedEntry)

    $q.notify({
      type: 'positive',
      message: 'Changes saved successfully!'
    })

    router.push(`/entry/${entryId}`)
  } catch (error) {
    console.error('Error updating entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save changes. Please try again.'
    })
  } finally {
    saving.value = false
  }
}

// Touch handlers for tab swiping
const touchStart = ref({ x: 0, y: 0 })
const touchEnd = ref({ x: 0, y: 0 })
const minSwipeDistance = 50

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

  if (Math.abs(distanceX) > minSwipeDistance && distanceY < 100) {
    const tabs = ['main', 'additional']
    const currentIndex = tabs.indexOf(activeTab.value)

    if (distanceX > 0 && currentIndex > 0) {
      activeTab.value = tabs[currentIndex - 1]
    } else if (distanceX < 0 && currentIndex < tabs.length - 1) {
      activeTab.value = tabs[currentIndex + 1]
    }
  }

  touchStart.value = { x: 0, y: 0 }
  touchEnd.value = { x: 0, y: 0 }
}

onMounted(() => {
  loadEntry()
})
</script>
<style scoped>
/* Keep all your existing styles */
.section-container {
  padding: 12px;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.dragging-section {
  background: #ffffff !important;
  border: 1px solid var(--q-primary) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  transform: scale(1.02) !important;
  opacity: 0.9 !important;
}

.ghost-section {
  background: #f0f0f0 !important;
  border: 2px dashed var(--q-primary) !important;
  opacity: 0.5 !important;
}

.chosen-section {
  background: #f7f7f7 !important;
  border: 1px solid var(--q-primary) !important;
}

.drag-handle-wrapper {
  padding: 4px;
  margin: -4px;
}

.drag-handle {
  width: 44px !important;
  height: 44px !important;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.handle-dots {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
}

.dots-row {
  display: flex;
  gap: 3px;
}

.dot {
  width: 4px;
  height: 4px;
  background-color: currentColor;
  border-radius: 50%;
  opacity: 0.5;
}

@media (hover: none) and (pointer: coarse) {
  .drag-handle {
    width: 48px !important;
    height: 48px !important;
  }

  .handle-dots {
    gap: 4px;
  }

  .dots-row {
    gap: 4px;
  }

  .dot {
    width: 5px;
    height: 5px;
  }

  .drag-handle:active {
    background: rgba(0, 0, 0, 0.1);
  }

  .drag-handle:active .dot {
    opacity: 1;
  }

  .dragging-section {
    transform: scale(1.03) !important;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3) !important;
    background: #f8f8f8 !important;
  }

  .ghost-section {
    background: #e0e0e0 !important;
    border: 2px dashed var(--q-primary) !important;
    opacity: 0.7 !important;
  }

  .chosen-section {
    background: #eef5ff !important;
  }
}

.sortable-drag {
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.sortable-drag * {
  user-select: none !important;
}

.sortable-drag input,
.sortable-drag textarea {
  pointer-events: none !important;
}

.custom-textarea :deep(.q-field__native),
.custom-textarea :deep(.q-field__control) {
  min-height: 60px;
}

.custom-textarea :deep(.q-field__native) {
  padding-top: 8px;
  line-height: 1.5;
}

.verse-link {
  display: block;
  padding: 8px 0;
}

.verse-link:hover {
  opacity: 0.8;
}
</style>
