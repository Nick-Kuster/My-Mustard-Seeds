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

            <q-btn unelevated color="primary" :label="mainVerse.display ? 'Change Verse' : 'Select Verse'"
              @click="showVerseModal = true" />

            <VerseSelectionModal v-model="showVerseModal" @select="onVerseSelect" />
          </div>
          <div v-else-if="entryType === 'Book'" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Book</div>

            <div v-if="selectedBook" class="q-mb-sm">
              <div v-if="selectedBook" class="q-mb-md">
                <div class="text-body1">{{ selectedBook.metadata.title }}</div>
                <div class="text-caption text-grey-8">by {{ selectedBook.metadata.author }}</div>
              </div>
            </div>

            <q-btn unelevated color="primary" :label="selectedBook ? 'Change Book' : 'Select Book'"
              @click="showBookModal = true" />

            <BookSelectionModal v-model="showBookModal" @select="onBookSelect" />

            <q-input v-model="title" label="Chapter" class="q-mb-md" />
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
                <q-btn round flat color="grey" icon="delete" size="sm" @click="removeSection(index)"
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
                  style="height: 40px">Cancel</q-btn>
              </div>
              <div class="col-6">
                <q-btn rounded unelevated color="primary" @click="saveEntry" class="full-width" :loading="saving"
                  style="height: 40px">
                  <span v-if="!saving">Plant Seed</span>
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
import VerseSelectionModal from 'components/VerseSelectionModal.vue'
import LinkedVerses from 'components/LinkedVerses.vue'
import VerseChip from 'components/VerseChip.vue'
import BookSelectionModal from 'components/BookSelectionModal.vue'

const router = useRouter()
const $q = useQuasar()

const showVerseModal = ref(false)
const showBookModal = ref(false)
const selectedBook = ref(null)
const mainVerse = ref({})
const title = ref('')
const contentSections = ref([])
const saving = ref(false)
const linkedVerses = ref([])

const entryTypes = ['Bible', 'Sermon', 'Book', 'Song', 'Podcast', 'Other']
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
  createSection('Author', '', 'shortText', true),
  createSection('Date', '', 'date', true),
  createSection('Observations', '', 'longText'),
  createSection('Application', '', 'longText')
]

const songSections = [
  createSection('Songwriter', '', 'shortText', true),
  createSection('Date First Heard', '', 'date', true),
  createSection('Lyrics', '', 'longText')
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

const saveEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    const encryptionKey = await getEncryptionKey(session.user.id)

    const contentObject = {
      ...contentSections.value.reduce((acc, section, index) => {
        acc[`section${index + 1}`] = {
          title: section.title,
          content: section.content,
          fieldType: section.fieldType,
          headerProperty: section.headerProperty
        }
        return acc
      }, {}),
      book: selectedBook.value ? {
        id: selectedBook.value.id,
        title: selectedBook.value.metadata.title,
        author: selectedBook.value.metadata.author
      } : null
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
