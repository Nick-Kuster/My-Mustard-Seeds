<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <div class="text-h6 q-mb-md">Plant a New Seed</div>

        <div class="q-gutter-md">
          <q-select v-model="entryType" :options="entryTypes" label="Type" class="q-mb-md"
            @update:model-value="handleTypeChange" />

          <q-input v-model="title" label="Title" class="q-mb-md" />
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

          <!-- Linked Verses for all types -->
          <div class="q-mb-lg">
            <LinkedVerses v-model="linkedVerses" />
          </div>

          <div v-for="(section, index) in contentSections" :key="index" class="q-mb-md">
            <div class="row items-center q-mb-sm">
              <div class="col">
                <q-input v-model="section.title" label="Section Title" dense />
              </div>
              <div class="col-auto q-ml-sm">
                <q-btn round flat color="grey" icon="delete" size="sm" @click="removeSection(index)"
                  v-if="contentSections.length > 1" />
              </div>
            </div>
            <q-input v-model="section.content" type="textarea" :label="section.title || 'Your thoughts...'" rows="6" />
          </div>

          <div class="q-mt-md">
            <q-btn rounded unelevated color="grey-4" class="full-width" style="height: 40px" @click="addSection">
              <q-icon name="add" class="q-mr-sm" />
              Add Section
            </q-btn>
          </div>

          <div class="row q-col-gutter-md q-mt-lg">
            <div class="col-6">
              <q-btn rounded unelevated color="grey" class="full-width" @click="router.push('/')"
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
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData } from 'src/utils/encryption'
import VerseSelectionModal from 'components/VerseSelectionModal.vue'
import LinkedVerses from 'components/LinkedVerses.vue'
import VerseChip from 'components/VerseChip.vue'

const router = useRouter()
const $q = useQuasar()

const showVerseModal = ref(false)
const mainVerse = ref({})

const title = ref('')
const contentSections = ref([])
const saving = ref(false)

const linkedVerses = ref([])

const entryTypes = ['Bible', 'Other']
const entryType = ref('Bible')

const bibleSections = [
  { title: 'Verses', content: '' },
  { title: 'Observations', content: '' },
  { title: 'Application', content: '' },
  { title: 'Prayer', content: '' }
]

const handleTypeChange = (newType) => {
  if (newType === 'Bible') {
    contentSections.value = [...bibleSections]
  } else {
    contentSections.value = [{
      title: '',
      content: ''
    }]
  }
}

const onVerseSelect = (verseData) => {
  mainVerse.value = verseData
}

const clearMainVerse = () => {
  mainVerse.value = {}
}

const addSection = () => {
  contentSections.value.push({
    title: '',
    content: ''
  })
}

const removeSection = (index) => {
  contentSections.value.splice(index, 1)
}


const saveEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    const encryptionKey = await getEncryptionKey(session.user.id)

    const contentObject = contentSections.value.reduce((acc, section, index) => {
      acc[`section${index + 1}`] = {
        title: section.title,
        content: section.content
      }
      return acc
    }, {})

    const encryptedContent = await encryptData(contentObject, encryptionKey)

    // First insert the journal entry
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

    // Handle main verse for Bible type
    if (entryType.value === 'Bible' && mainVerse.value.startVerseId) {
      const { error: mainVerseError } = await supabase
        .from('journal_verses')
        .insert({
          journal_id: entry.id,
          start_verse_id: mainVerse.value.startVerseId,
          end_verse_id: mainVerse.value.endVerseId
        })

      if (mainVerseError) throw mainVerseError
    }

    // Handle linked verses
    if (linkedVerses.value.length > 0) {
      const verseInserts = linkedVerses.value.map(verse => ({
        journal_id: entry.id,
        start_verse_id: verse.startVerseId,
        end_verse_id: verse.endVerseId
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
// Initialize with Bible sections on component mount
onMounted(() => {
  contentSections.value = [...bibleSections]
})
</script>
