<template>
  <q-page class="q-pa-md q-mt-lg q-ml-sm">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6 q-pa-xl" style="
  background-color: #FAF6E9;">
        <div class="text-h6 q-mb-md">Plant a New Seed</div>

        <div class="q-gutter-md">
          <!-- Entry Type Selector -->
          <TypeSelector v-model="entryType" @update:modelValue="handleTypeChange" />

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

          <!-- Devotional Specific Select -->
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
          <!-- Header Sections -->
          <!-- In your template, update the header sections rendering -->
          <div v-for="(section, index) in headerSections" :key="'header-' + index" class="q-mb-md">
            <template v-if="section.fieldType === 'date'">
              <div class="row q-col-gutter-sm">
                <div class="col-12">
                  <q-input v-model="section.content" :label="section.title" mask="##-##-####" fill-mask
                    placeholder="MM-DD-YYYY" :id="section.id">
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-date v-model="section.content" mask="MM-DD-YYYY" default-year-month="2025/01">
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
              <q-btn rounded unelevated color="negative" class="full-width" @click="router.push('/')"
                style="height: 40px">
                <q-icon name="cancel" class="q-mr-sm" /> Cancel
              </q-btn>
            </div>
            <div class="col-6">
              <q-btn rounded unelevated color="primary" @click="saveEntry" class="full-width" :loading="saving"
                style="height: 40px">
                <span v-if="!saving">
                  <q-icon name="fa fa-cross" class="q-mr-sm" /> Plant
                </span>
                <span v-else>Planting...</span>
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData } from 'src/utils/encryption'
import { RESOURCE_TYPES } from 'stores/resources'
import VerseSelectionModal from 'components/VerseSelectionModal.vue'
import ResourceSelectionModal from 'components/ResourceSelectionModal.vue'
import { useJournalStore } from 'stores/journalData'
import draggable from 'vuedraggable'
import LinkedVerses from 'components/LinkedVerses.vue'
import TagSelector from 'src/components/TagSelector.vue'
import QuoteSelector from 'src/components/QuoteSelector.vue'
import TypeSelector from 'components/TypeSelector.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import LinkSelector from 'src/components/LinkSelector.vue'


const dragging = ref(false)
const router = useRouter()
const $q = useQuasar()
const journalStore = useJournalStore()
const activeTab = ref('main')

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
const selectedLinks = ref([])

const mainVerse = ref({})
const title = ref('')
const contentSections = ref([])
const saving = ref(false)
const linkedVerses = ref([])
const selectedTags = ref([])
const selectedQuotes = ref([])

const entryType = ref('Bible')

const getTodayDate = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  return `${month}-${day}-${year}`
}

const createSection = (title = '', content = '', fieldType = 'longText', headerProperty = false, id = '') => ({
  id: id ?? 'section-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
  title,
  content: fieldType === 'date' ? getTodayDate() : content,
  fieldType,
  headerProperty
})

const bibleSections = [
  createSection('Observations', '', 'longText'),
]

const sermonSections = [
  createSection('Observations', '', 'longText'),
]

const songSections = [
  createSection('Song Title', '', 'shortText', true, 'song-title'),
  createSection('Song Link', '', 'link', true),
  createSection('Lyrics', '', 'longText')
]

const devotionSections = [
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
]

const miracleSections = [
  createSection('Title', '', 'shortText', true, 'miracle-title'),
  createSection('Date', '', 'date', true)
]

const videoSections = [
  createSection('Video Title', '', 'shortText', true, 'video-title'),
  createSection('Video URL', '', 'link', true),
  createSection('Notes', '', 'longText')
]

const articleSections = [
  createSection('Article Title', '', 'shortText', true, 'article-title'),
  createSection('Article URL', '', 'link', true),
  createSection('Notes', '', 'longText')
]

const devotionalSections = [
  createSection('Devotional Title', '', 'shortText', true, 'devotional-title'),
]

const groupSections = [
  createSection('Title', '', 'shortText', true, 'group-title'),
  createSection('Date', '', 'date', true)
]

const podcastSections = [
  createSection('Episode Title', '', 'shortText', true, 'podcast-title')
]

const otherSections = [
  createSection('Title', '', 'shortText', true, 'other-title'),
  createSection('Date', '', 'date', true)
]

const prayerSection = createSection('Prayer', '', 'longText')

// Computed property to filter header sections
const headerSections = computed(() => {
  return contentSections.value.filter(section => section.headerProperty)
})

const handleTypeChange = (newType) => {
  const today = getTodayDate()
  let newSections = []
  title.value = '';
  switch (newType) {
    case 'Bible':
      newSections = bibleSections.map(s => ({ ...s }))
      break
    case 'Sermon':
      newSections = sermonSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Devotion':
      newSections = devotionSections.map(s => ({ ...s }))
      break
    case 'Song':
      newSections = songSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Answered Prayer / Miracle':
      newSections = miracleSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break;
    case 'Video':
      newSections = videoSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Article':
      newSections = articleSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Devotional':
      newSections = devotionalSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Group':
      newSections = groupSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Podcast':
      newSections = podcastSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    case 'Other':
      newSections = otherSections.map(s => ({
        ...s,
        content: s.fieldType === 'date' ? today : s.content
      }))
      break
    default:
      newSections = [createSection()]
  }
  contentSections.value = [...newSections, { ...prayerSection }]
}

const handleDragUpdate = (event) => {
  // Get all sections
  const allSections = [...contentSections.value]

  // Split into header and regular sections
  const headerSections = allSections.filter(section => section.headerProperty)
  const regularSections = allSections.filter(section => !section.headerProperty)

  // Perform the move operation on regular sections
  const movedItem = regularSections.splice(event.oldIndex, 1)[0]
  regularSections.splice(event.newIndex, 0, movedItem)

  // Recombine sections
  contentSections.value = [
    ...headerSections,
    ...regularSections
  ]
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
  // selections is now an array of resources in order of selection
  if (!Array.isArray(selections) || selections.length === 0) return

  // Last item in array is always the final selection
  const finalSelection = selections[selections.length - 1]

  switch (entryType.value) {
    case 'Sermon':
      if (selections.length >= 3) {
        selectedPastor.value = selections[0]
        selectedSeries.value = selections[1]
        selectedSermon.value = selections[2]
        title.value = `${selectedPastor.value.metadata.name} - ${selectedSeries.value.metadata.title}: ${selectedSermon.value.metadata.title}`
      } else if (selections.length === 2) {
        selectedPastor.value = selections[0]
        selectedSeries.value = selections[1]
        selectedSermon.value = null
        title.value = `${selectedPastor.value.metadata.name} - ${selectedSeries.value.metadata.title}`
      } else {
        selectedPastor.value = selections[0]
        selectedSeries.value = null
        selectedSermon.value = null
        title.value = `${selectedPastor.value.metadata.name}`
      }
      break

    case 'Book':
      if (selections.length === 3) {
        selectedAuthor.value = selections[0]
        selectedBook.value = selections[1]
        selectedChapter.value = selections[2]
        title.value = `${selectedBook.value.metadata.title} - Chapter ${selectedChapter.value.metadata.number}: ${selectedChapter.value.metadata.title}`
      }
      else {
        selectedBook.value = selections[0]
        selectedChapter.value = null
        title.value = selectedBook.value.metadata.title
      }
      break

    case 'Podcast':
      selectedPodcast.value = finalSelection
      break

    case 'Song':
      selectedArtist.value = finalSelection
      break

    case 'Devotional':
      selectedMinistry.value = selections[0]
      selectedDevotionalSeries.value = finalSelection
      break

    case 'Group':
      selectedGroup.value = finalSelection
      break

    case 'Show':
      selectedShow.value = selections[0]
      selectedSeason.value = selections[1]
      selectedEpisode.value = selections[2]
      title.value = `${selectedShow.value.metadata.name} Season ${selectedSeason.value.metadata.seasonNumber} Episode ${selectedEpisode.value.metadata.episodeNumber}`
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

const saveEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    // This will generate the title if there is a special type, otherwise it remains the same.
    title.value = generateTitle();

    const encryptionKey = await getEncryptionKey(session.user.id)
    const contentObject = {
      sections: contentSections.value
    }

    const encryptedContent = await encryptData(contentObject, encryptionKey)

    const { data: entry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: session.user.id,
        title: title.value,
        type: entryType.value,
        content: encryptedContent
      })
      .select()
      .single()

    if (entryError) throw entryError

    if (entryType.value === 'Bible' && mainVerse.value.startVerseId) {
      const { error: mainVerseError } = await supabase
        .from('journal_verses')
        .insert({
          journal_id: entry.id,
          start_verse_id: mainVerse.value.startVerseId,
          end_verse_id: mainVerse.value.endVerseId,
          main_verse: true
        })

      if (mainVerseError) throw mainVerseError
    }

    if (linkedVerses.value.length > 0) {
      const verseInserts = linkedVerses.value.map(verse => ({
        journal_id: entry.id,
        start_verse_id: verse.startVerseId,
        end_verse_id: verse.endVerseId,
        main_verse: false
      }))

      const { error: linkedVersesError } = await supabase
        .from('journal_verses')
        .insert(verseInserts)

      if (linkedVersesError) throw linkedVersesError
    }

    let resources = []
    switch (entryType.value) {
      case 'Book':
        resources.push({ resourceId: selectedAuthor.value.id, primary: true });
        resources.push({ resourceId: selectedBook.value.id, primary: false });
        resources.push({ resourceId: selectedChapter.value.id, primary: false });
        break;
      case 'Sermon':
        resources.push({ resourceId: selectedPastor.value.id, primary: true });
        resources.push({ resourceId: selectedSeries.value.id, primary: false });
        resources.push({ resourceId: selectedSermon.value.id, primary: false });
        break;
      case 'Podcast':
        resources.push({ resourceId: selectedPodcast.value.id, primary: true });
        break;
      case 'Song':
        resources.push({ resourceId: selectedArtist.value.id, primary: true });
        break;
      case 'Devotional':
        resources.push({ resourceId: selectedMinistry.value.id, primary: true });
        resources.push({ resourceId: selectedDevotionalSeries.value.id, primary: false });
        break;
      case 'Show':
        resources.push({ resourceId: selectedShow.value.id, primary: true });
        resources.push({ resourceId: selectedSeason.value.id, primary: false });
        resources.push({ resourceId: selectedEpisode.value.id, primary: false });
        break;
      case 'Group':
        resources.push({ resourceId: selectedGroup.value.id, primary: true });
        break;
      default:
        break;
    }

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i]
      const { error: journalResourceError } = await supabase
        .from('journal_resources')
        .insert({
          journal_id: entry.id,
          resource_id: resource.resourceId,
          primary_resource: resource.primary,
          user_id: session.user_id
        })

      if (journalResourceError) throw journalResourceError
    }

    // Handle tags
    if (selectedTags.value.length > 0) {
      const tagInserts = selectedTags.value.map(tag => ({
        journal_id: entry.id,
        tag_id: tag.id,
        user_id: session.user_id
      }))

      const { error: tagError } = await supabase
        .from('journal_tags')
        .insert(tagInserts)

      if (tagError) throw tagError
    }

    // Handle quotes
    if (selectedQuotes.value.length > 0) {
      const quotePromises = selectedQuotes.value.map(async quoteData => {
        const encryptedQuote = await encryptData(quoteData.decryptedQuote, encryptionKey)
        return supabase
          .from('journal_quotes')
          .insert({
            journal_id: entry.id,
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

    // Handle Links
    // Handle Links - combine both selectedLinks and linkSections
    const linkSections = contentSections.value.filter(s => s.fieldType === 'link' && s.content)
    const allLinks = [
      // Links from sections
      ...linkSections.map(section => ({
        journal_id: entry.id,
        name: section.title,
        url: section.content
      })),
      // Links from selectedLinks
      ...selectedLinks.value.map(link => ({
        journal_id: entry.id,
        name: link.name,
        url: link.url
      }))
    ]

    if (allLinks.length > 0) {
      const { error: linkError } = await supabase
        .from('related_links')
        .insert(allLinks)
        .select()

      if (linkError) {
        console.error('Link insertion error:', linkError)
        throw new Error('Failed to save links: ' + linkError.message)
      }
    }

    $q.notify({
      type: 'positive',
      message: 'Your seed has been planted!'
    })

    const newEntry = await journalStore.getEntry(entry.id);
    await journalStore.addEntry(newEntry)

    router.push('/')
  } catch (error) {
    console.error('Error saving entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to save your entry. Please try again.'
    })
  } finally {
    saving.value = false
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
onMounted(() => {
  contentSections.value = [...bibleSections, { ...prayerSection }]
})
</script>


<style scoped>
.section-container {
  padding: 12px;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

/* Style for the section being dragged */
.dragging-section {
  background: #ffffff !important;
  border: 1px solid var(--q-primary) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  transform: scale(1.02) !important;
  opacity: 0.9 !important;
}

/* Style for the ghost placeholder */
.ghost-section {
  background: #f0f0f0 !important;
  border: 2px dashed var(--q-primary) !important;
  opacity: 0.5 !important;
}

/* Style for the chosen section (initial selection) */
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

/* Mobile-specific enhancements */
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

  /* Enhanced touch feedback */
  .drag-handle:active {
    background: rgba(0, 0, 0, 0.1);
  }

  .drag-handle:active .dot {
    opacity: 1;
  }

  /* Enhanced dragging feedback for mobile */
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

/* Additional animation for smooth transitions */
.sortable-drag {
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

/* Disable text selection during drag */
.sortable-drag * {
  user-select: none !important;
}

/* Prevent scrolling issues on iOS */
.sortable-drag input,
.sortable-drag textarea {
  pointer-events: none !important;
}

.custom-textarea :deep(.q-field__native),
.custom-textarea :deep(.q-field__control) {
  min-height: 60px;
  /* Adjust this value to your needs */
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
