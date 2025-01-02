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
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Main Verse</div>

            <div v-if="mainVerse.display" class="q-mb-sm">
              <VerseChip :verse="mainVerse" color="primary" @remove="clearMainVerse" />
            </div>

            <q-btn icon="fa fa-book-bible" unelevated color="primary"
              :label="mainVerse.display ? 'Change Verse' : 'Select Verse'" @click="showVerseModal = true" />

            <VerseSelectionModal v-model="showVerseModal" @select="onVerseSelect" />
          </div>

          <!-- Book Specific Select -->
          <div v-else-if="entryType === 'Book'" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Book</div>

            <div v-if="selectedBook" class="q-mb-sm">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedBook.metadata.title }}</div>
                <div class="text-caption text-grey-8">by {{ selectedBook.metadata.author }}</div>
              </div>
            </div>

            <q-btn unelevated color="primary" :label="selectedBook ? 'Change Book' : 'Select Book'"
              @click="showBookModal = true" />

            <ResourceSelectionModal v-model="showBookModal" :resource-type="RESOURCE_TYPES.BOOK"
              @select="onBookSelect" />
            <q-input v-model="title" label="Chapter" class="q-mb-md" />
          </div>

          <!-- Sermon Specific Select -->
          <div v-else-if="entryType === 'Sermon'" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Pastor</div>
            <div v-if="selectedPastor" class="q-mb-sm">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedPastor.metadata.name }}</div>
                <div class="text-caption text-grey-8">{{ selectedPastor.metadata.church }}</div>
              </div>
            </div>

            <q-btn unelevated color="primary" :label="selectedPastor ? 'Change Pastor' : 'Select Pastor'"
              @click="showPastorModal = true" />

            <ResourceSelectionModal v-model="showPastorModal" :resource-type="RESOURCE_TYPES.PASTOR"
              @select="onPastorSelect" />
          </div>

          <!-- Devotional Specific Select -->
          <div v-else-if="entryType === 'Devotional'" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Ministry</div>
            <div v-if="selectedMinistry" class="q-mb-sm">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedMinistry.metadata.name }}</div>
              </div>
            </div>

            <q-btn unelevated color="primary" :label="selectedMinistry ? 'Change Ministry' : 'Select Ministry'"
              @click="showMinistryModal = true" />

            <ResourceSelectionModal v-model="showMinistryModal" :resource-type="RESOURCE_TYPES.MINISTRY"
              @select="onMinistrySelect" />
          </div>

          <!-- Song Specific Select -->
          <div v-else-if="entryType === 'Song'" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Artist</div>
            <div v-if="selectedArtist" class="q-mb-sm">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedArtist.metadata.name }}</div>
              </div>
            </div>

            <q-btn unelevated color="primary" :label="selectedArtist ? 'Change Artist' : 'Select Artist'"
              @click="showArtistModal = true" />

            <ResourceSelectionModal v-model="showArtistModal" :resource-type="RESOURCE_TYPES.SONG_ARTIST"
              @select="onArtistSelect" />
          </div>

          <!-- Podcast Specific Select -->
          <div v-else-if="entryType === 'Podcast'" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Name and Host</div>
            <div v-if="selectedPodcast" class="q-mb-sm">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedPodcast.metadata.title }}</div>
                <div class="text-caption text-grey-8">by {{ selectedPodcast.metadata.host }}</div>
              </div>
            </div>

            <q-btn unelevated color="primary" :label="selectedPodcast ? 'Change Podcast' : 'Select Podcast'"
              @click="showPodcastModal = true" />

            <ResourceSelectionModal v-model="showPodcastModal" :resource-type="RESOURCE_TYPES.PODCAST"
              @select="onPodcastSelect" />
          </div>

          <q-input v-else v-model="title" label="Title" class="q-mb-md" />

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

const router = useRouter()
const $q = useQuasar()


// Modals
const showVerseModal = ref(false)
const showBookModal = ref(false)
const showPastorModal = ref(false)
const showPodcastModal = ref(false)
const showArtistModal = ref(false)
const showMinistryModal = ref(false)
const selectedPastor = ref(null)
const selectedPodcast = ref(null)
const selectedArtist = ref(null)
const selectedMinistry = ref(null)

const selectedBook = ref(null)
const mainVerse = ref({})
const title = ref('')
const contentSections = ref([])
const saving = ref(false)
const linkedVerses = ref([])
const selectedTags = ref([])

const entryTypes = ['Bible', 'Sermon', 'Devotional', 'Book', 'Song', 'Podcast', 'Other']
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
  createSection('Date', '', 'date', true),
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
]

const songSections = [
  createSection('Lyrics', '', 'longText')
]

const devotionSections = [
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
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

const onBookSelect = (book) => {
  selectedBook.value = book
  // Optional: Automatically set the title if it's not set
  if (!title.value) {
    title.value = ''
  }
}

const onPastorSelect = (pastor) => {
  selectedPastor.value = pastor
  if (!title.value) {
    title.value = `Notes on ${pastor.metadata.name}`
  }
}

const onPodcastSelect = (podcast) => {
  selectedPodcast.value = podcast
  if (!title.value) {
    title.value = `Notes on ${podcast.metadata.title}`
  }
}

const onArtistSelect = (artist) => {
  selectedArtist.value = artist
  if (!title.value) {
    title.value = `Notes on ${artist.metadata.name}`
  }
}

const onMinistrySelect = (ministry) => {
  selectedMinistry.value = ministry
  if (!title.value) {
    title.value = `Notes on ${ministry.metadata.name}`
  }
}

const saveEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    const encryptionKey = await getEncryptionKey(session.user.id)
    const contentObject = {
      sections: contentSections.value,
      // book: selectedBook.value ? {
      //   id: selectedBook.value.id,
      //   title: selectedBook.value.metadata.title,
      //   author: selectedBook.value.metadata.author
      // } : null,
      // pastor: selectedPastor.value ? {
      //   id: selectedPastor.value.id,
      //   name: selectedPastor.value.metadata.name,
      //   church: selectedPastor.value.metadata.church
      // } : null,
      // podcast: selectedPodcast.value ? {
      //   id: selectedPodcast.value.id,
      //   title: selectedPodcast.value.metadata.title,
      //   host: selectedPodcast.value.metadata.host,
      // } : null,
      // songArtist: selectedArtist.value ? {
      //   id: selectedArtist.value.id,
      //   name: selectedArtist.value.metadata.name
      // } : null,
      // ministry: selectedMinistry.value ? {
      //   id: selectedMinistry.value.id,
      //   name: selectedMinistry.value.metadata.name
      // } : null
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
