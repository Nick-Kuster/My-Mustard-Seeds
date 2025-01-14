<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <div class="text-h6 q-mb-md">Plant a New Seed</div>

        <div class="q-gutter-md">
          <q-select v-model="entryType" :options="entryTypes" label="Type" class="q-mb-md"
            @update:model-value="handleTypeChange" />

          <!-- Main Verse Selector for Bible type -->
          <div v-if="entryType === 'Bible'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showVerseModal = true">
              <div class="text-subtitle1 text-weight-medium">Main Verse</div>
              <q-btn flat round dense color="primary" icon="fa fa-book-bible" class="q-ml-xs" />
            </div>

            <div v-if="mainVerse.display" class="row q-gutter-sm">
              <VerseChip :verse="mainVerse" color="primary" @remove="clearMainVerse" />
            </div>

            <VerseSelectionModal v-model="showVerseModal" @select="onVerseSelect" />
          </div>

          <!-- Book Specific Select -->
          <div v-else-if="entryType === 'Book'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showBookModal = true">
              <div class="text-subtitle1 text-weight-medium">Book</div>
              <q-btn flat round dense color="primary" icon="menu_book" class="q-ml-xs" />
            </div>

            <div v-if="selectedBook" class="q-mb-md">
              <div class="text-body1">Chapter: {{ selectedChapter.metadata.number }} {{ selectedChapter.metadata.title
                }}</div>
              <div class="text-caption text-grey-8">From {{ selectedBook.metadata.title }} </div>
              <div class="text-caption text-grey-8">by {{ selectedAuthor.metadata.name }}</div>
            </div>

            <ResourceSelectionModal v-model="showBookModal" :resource-type="RESOURCE_TYPES.AUTHOR"
              @select="onBookSelect" />
          </div>

          <!-- Group Specific Select -->
          <div v-else-if="entryType === 'Group'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showGroupModal = true">
              <div class="text-subtitle1 text-weight-medium">Group</div>
              <q-btn flat round dense color="primary" icon="group" class="q-ml-xs" />
            </div>

            <div v-if="selectedGroup" class="q-mb-md">
              <div class="text-body1">{{ selectedGroup.metadata.name }}</div>
              <div class="text-caption text-grey-8">
                <span v-if="selectedGroup.metadata.leader">Led by {{ selectedGroup.metadata.leader }}</span>
                <span v-if="selectedGroup.metadata.church"> at {{ selectedGroup.metadata.church }}</span>
              </div>
            </div>

            <ResourceSelectionModal v-model="showGroupModal" :resource-type="RESOURCE_TYPES.GROUP"
              @select="onGroupSelect" />
          </div>

          <!-- Show Specific Select -->
          <div v-else-if="entryType === 'Show'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showShowModal = true">
              <div class="text-subtitle1 text-weight-medium">Show</div>
              <q-btn flat round dense color="primary" icon="tv" class="q-ml-xs" />
            </div>

            <div v-if="selectedShow" class="q-mb-md">
              <div class="text-body1">{{ selectedShow.metadata.name }}</div>
              <div class="text-caption text-grey-8">
                <span v-if="selectedSeason.metadata.seasonNumber">S{{ selectedSeason.metadata.seasonNumber }}</span>
                <span v-if="selectedEpisode.metadata.episodeNumber"> E{{ selectedEpisode.metadata.episodeNumber }}
                  {{ selectedEpisode.metadata.name }}</span>
              </div>
            </div>

            <ResourceSelectionModal v-model="showShowModal" :resource-type="RESOURCE_TYPES.SHOW"
              @select="onShowSelect" />
          </div>

          <!-- Sermon Specific Select -->
          <div v-else-if="entryType === 'Sermon'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showPastorModal = true">
              <div class="text-subtitle1 text-weight-medium">Sermon</div>
              <q-btn flat round dense color="primary" icon="church" class="q-ml-xs" />
            </div>

            <div v-if="selectedPastor" class="q-mb-md">
              <div class="text-body1"><strong>Sermon:</strong> {{ selectedSermon.metadata.title }}</div>
              <div class="text-body1"><strong>Series:</strong> {{ selectedSeries.metadata.title }}</div>
              <div class="text-caption text-grey-8">By {{ selectedPastor.metadata.name }} From {{
                selectedPastor.metadata.church }}</div>
              <div class="text-caption text-grey-8">On {{ selectedSermon.metadata.date }}</div>
            </div>

            <ResourceSelectionModal v-model="showPastorModal" :resource-type="RESOURCE_TYPES.PASTOR"
              @select="onPastorSelect" />
          </div>

          <!-- Devotional Specific Select -->
          <div v-else-if="entryType === 'Devotional'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button"
              @click="showMinistryModal = true">
              <div class="text-subtitle1 text-weight-medium">Ministry</div>
              <q-btn flat round dense color="primary" icon="menu_book" class="q-ml-xs" />
            </div>

            <div v-if="selectedMinistry" class="q-mb-md">
              <div class="text-body1">{{ selectedMinistry.metadata.name }}</div>
            </div>

            <ResourceSelectionModal v-model="showMinistryModal" :resource-type="RESOURCE_TYPES.MINISTRY"
              @select="onMinistrySelect" />
          </div>

          <!-- Song Specific Select -->
          <div v-else-if="entryType === 'Song'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showArtistModal = true">
              <div class="text-subtitle1 text-weight-medium">Artist</div>
              <q-btn flat round dense color="primary" icon="music_note" class="q-ml-xs" />
            </div>

            <div v-if="selectedArtist" class="q-mb-md">
              <div class="text-body1">{{ selectedArtist.metadata.name }}</div>
            </div>

            <ResourceSelectionModal v-model="showArtistModal" :resource-type="RESOURCE_TYPES.SONG_ARTIST"
              @select="onArtistSelect" />
          </div>

          <!-- Podcast Specific Select -->
          <div v-else-if="entryType === 'Podcast'" class="q-mb-lg">
            <div class="row items-center no-wrap q-mb-sm section-header" role="button" @click="showPodcastModal = true">
              <div class="text-subtitle1 text-weight-medium">Podcast</div>
              <q-btn flat round dense color="primary" icon="podcasts" class="q-ml-xs" />
            </div>

            <div v-if="selectedPodcast" class="q-mb-md">
              <div class="text-body1">{{ selectedPodcast.metadata.title }}</div>
              <div class="text-caption text-grey-8">by {{ selectedPodcast.metadata.host }}</div>
            </div>

            <ResourceSelectionModal v-model="showPodcastModal" :resource-type="RESOURCE_TYPES.PODCAST"
              @select="onPodcastSelect" />
          </div>

          <!-- Header Sections -->
          <div v-for="(section, index) in headerSections" :key="'header-' + index" class="q-mb-md">
            <template v-if="section.fieldType === 'date'">
              <q-input v-model="section.content" :label="section.title" mask="##-##-####"
                :model-value="section.content || getTodayDate()">
                <template v-slot:prepend>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="section.content" mask="MM-DD-YYYY" minimal>
                        <div class="row items-center justify-end q-pa-sm">
                          <q-btn v-close-popup label="Close" color="primary" flat size="sm" />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </template>
            <template v-else>
              <q-input v-model="section.content" :label="section.title"
                :type="section.fieldType === 'longText' ? 'textarea' : 'text'" />
            </template>
          </div>


          <!-- Linked Verses for all types -->
          <div class="q-mb-lg">
            <LinkedVerses v-model="linkedVerses" />
          </div>


          <!-- Tags -->
          <div class="q-mb-lg">
            <TagSelector v-model="selectedTags" />
          </div>
          <!-- Dynamic Sections -->
          <div v-for="(section, index) in regularSections" :key="index" class="q-mb-md">
            <div class="row items-center q-mb-sm">
              <div class="col">
                <q-input v-model="section.title" label="Section Title" dense />
              </div>
              <div class="col-auto q-ml-sm">
                <q-btn-toggle v-model="section.fieldType" :options="[
                  { icon: 'short_text', value: 'shortText' },
                  { icon: 'notes', value: 'longText' }
                ]" spread rounded dense unelevated toggle-color="primary" color="grey-3" text-color="grey-8"
                  style="height: 32px" class="q-px-xs" />
              </div>
              <div class="col-auto q-ml-sm">
                <q-btn round flat color="negative" icon="delete" size="sm" @click="removeSection(index)"
                  v-if="contentSections.length > 1" />
              </div>
            </div>

            <!-- Dynamic Field Based on Type -->
            <template v-if="section.fieldType === 'shortText'">
              <q-input v-model="section.content" :label="section.title || 'Short text...'" />
            </template>

            <template v-else-if="section.fieldType === 'longText'">
              <q-input v-model="section.content" type="textarea" :label="section.title || 'Your thoughts...'"
                rows="6" />
            </template>
          </div>

          <div class="q-mt-md">
            <q-btn rounded unelevated color="info" class="full-width" style="height: 40px" @click="addSection">
              <q-icon name="add" class="q-mr-sm" />
              Add Section
            </q-btn>
          </div>

          <div class="q-mt-lg">
            <div class="row q-col-gutter-x-sm">
              <div class="col-6">
                <q-btn rounded unelevated color="negative" class="full-width" @click="router.push('/')"
                  style="height: 40px"><q-icon name="cancel" class="q-mr-sm" /> Cancel</q-btn>
              </div>
              <div class="col-6">
                <q-btn rounded unelevated color="primary" @click="saveEntry" class="full-width" :loading="saving"
                  style="height: 40px">
                  <span v-if="!saving"><q-icon name="fa fa-cross" class="q-mr-sm" /> Plant Seed</span>
                  <span v-else>Planting...</span>
                </q-btn>
              </div>
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
import LinkedVerses from 'components/LinkedVerses.vue'
import VerseChip from 'components/VerseChip.vue'
import ResourceSelectionModal from 'components/ResourceSelectionModal.vue'
import TagSelector from 'components/TagSelector.vue'
import { useJournalStore } from 'stores/journalData'

const router = useRouter()
const $q = useQuasar()
const journalStore = useJournalStore()

// Modals
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
const selectedBook = ref(null)
const selectedAuthor = ref(null)
const selectedChapter = ref(null)
const selectedGroup = ref(null)
const selectedShow = ref(null)
const selectedSeason = ref(null)
const selectedEpisode = ref(null)

const mainVerse = ref({})
const title = ref('')
const contentSections = ref([])
const saving = ref(false)
const linkedVerses = ref([])
const selectedTags = ref([])

const entryTypes = ['Bible', 'Sermon', 'Answered Prayer / Miracle', 'Devotional', 'Group', 'Book', 'Article', 'Song', 'Podcast', 'Show', 'Other']
const entryType = ref('Bible')

const getTodayDate = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  return `${month}-${day}-${year}`
}

const createSection = (title = '', content = '', fieldType = 'longText', headerProperty = false) => ({
  title,
  content: fieldType === 'date' ? getTodayDate() : content,
  fieldType,
  headerProperty
})

const bibleSections = [
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
]

const sermonSections = [
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
]

const songSections = [
  createSection('Song Title', '', 'shortText', true),
  createSection('Lyrics', '', 'longText')
]

const devotionSections = [
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
]

const miracleSections = [
  createSection('Date', '', 'date', true)
]

const prayerSection = createSection('Prayer', '', 'longText')

// Computed property to filter header sections
const headerSections = computed(() => {
  return contentSections.value.filter(section => section.headerProperty)
})

// Computed property to filter non-header sections
const regularSections = computed(() => {
  return contentSections.value.filter(section => !section.headerProperty)
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
    default:
      newSections = [createSection()]
  }
  contentSections.value = [...newSections, { ...prayerSection }]
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
        title.value = selectedSermon.value.metadata.title
      } else if (selections.length === 2) {
        selectedPastor.value = selections[0]
        selectedSeries.value = selections[1]
        selectedSermon.value = null
        title.value = `${selectedPastor.value.metadata.name} - ${selectedSeries.value.metadata.title}`
      } else {
        selectedPastor.value = selections[0]
        selectedSeries.value = null
        selectedSermon.value = null
        title.value = `Notes from ${selectedPastor.value.metadata.name}`
      }
      break

    case 'Book':
      if (selections.length === 3) {
        selectedAuthor.value = selections[0]
        selectedBook.value = selections[1]
        selectedChapter.value = selections[2]
        title.value = `${selectedBook.value.metadata.title} - ${selectedChapter.value.metadata.title}`
      } else {
        selectedBook.value = selections[0]
        selectedChapter.value = null
        title.value = selectedBook.value.metadata.title
      }
      break

    case 'Podcast':
      selectedPodcast.value = finalSelection
      title.value = `Notes on ${selectedPodcast.value.metadata.title}`
      break

    case 'Song':
      selectedArtist.value = finalSelection
      title.value = `Notes on ${selectedArtist.value.metadata.name}`
      break

    case 'Devotional':
      selectedMinistry.value = finalSelection
      title.value = `Notes on ${selectedMinistry.value.metadata.name}`
      break

    case 'Group':
      selectedGroup.value = finalSelection
      title.value = `Notes on ${selectedGroup.value.metadata.name}`
      break

    case 'Show':
      selectedShow.value = selections[0]
      selectedSeason.value = selections[1]
      selectedEpisode.value = selections[2]
      title.value = `${selectedShow.value.metadata.name} Season ${selectedSeason.value.seasonNumber} Episode ${selectedEpisode.value.episodeNumber}`
  }
}


const onBookSelect = handleResourceSelection
const onPastorSelect = handleResourceSelection
const onPodcastSelect = handleResourceSelection
const onArtistSelect = handleResourceSelection
const onMinistrySelect = handleResourceSelection
const onGroupSelect = handleResourceSelection
const onShowSelect = handleResourceSelection

const saveEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

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

    let resourceId = null
    switch (entryType.value) {
      case 'Book':
        resourceId = selectedBook.value.id;
        break;
      case 'Sermon':
        resourceId = selectedPastor.value.id;
        break;
      case 'Podcast':
        resourceId = selectedPodcast.value.id;
        break;
      case 'Song':
        resourceId = selectedArtist.value.id;
        break;
      case 'Devotional':
        resourceId = selectedMinistry.value.id;
        break;
      default:
        break;
    }

    if (resourceId) {
      const { error: journalResourceError } = await supabase
        .from('journal_resources')
        .insert({
          journal_id: entry.id,
          resource_id: resourceId,
          primary_resource: true,
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

onMounted(() => {
  contentSections.value = [...bibleSections, { ...prayerSection }]
})
</script>

<style scoped>
.section-header {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background: rgba(0, 0, 0, 0.05);
}

.section-header .q-btn {
  pointer-events: none;
}
</style>
