<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-8 col-md-6">
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <template v-else>
          <div class="text-h6 q-mb-md">Edit Entry</div>

          <div class="q-gutter-md">
            <div class="text-subtitle1 text-weight-medium q-mb-sm text-grey-8">
              {{ entryType }}
            </div>

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

            <!-- Linked Verses for all types -->
            <div class="q-mb-lg">
              <LinkedVerses v-model="linkedVerses" />
            </div>

            <!-- Tags Section -->
            <div class="q-mb-lg">
              <TagSelector v-model="selectedTags" />
            </div>

            <!-- Content Sections -->
            <template v-if="contentSections.length > 0">
              <!-- Header Sections -->
              <div v-for="(section, index) in headerSections" :key="'header-' + index" class="q-mb-md">
                <template v-if="section.fieldType === 'date'">
                  <q-input v-model="section.content" :label="section.title" mask="##-##-####">
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

              <!-- Regular Sections -->
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
            </template>

            <div class="q-mt-lg">
              <div class="row q-col-gutter-x-sm">
                <div class="col-6">
                  <q-btn rounded unelevated color="negative" class="full-width"
                    @click="router.push(`/entry/${entryId}`)" style="height: 40px">
                    <q-icon name="cancel" class="q-mr-sm" />
                    Cancel
                  </q-btn>
                </div>
                <div class="col-6">
                  <q-btn rounded unelevated color="primary" @click="saveEntry" class="full-width" :loading="saving"
                    style="height: 40px">
                    <span v-if="!saving">
                      <q-icon name="save" class="q-mr-sm" />
                      Save
                    </span>
                    <span v-else>Saving...</span>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </template>
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
import LinkedVerses from 'components/LinkedVerses.vue'
import VerseChip from 'components/VerseChip.vue'
import ResourceSelectionModal from 'components/ResourceSelectionModal.vue'
import TagSelector from 'components/TagSelector.vue'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const entryId = route.params.id

// State
const loading = ref(true)
const saving = ref(false)

// Modals
const showVerseModal = ref(false)
const showBookModal = ref(false)
const showPastorModal = ref(false)
const showPodcastModal = ref(false)
const showArtistModal = ref(false)
const showMinistryModal = ref(false)

// Form data
const title = ref('')
const entryType = ref('')
const mainVerse = ref({})
const linkedVerses = ref([])
const selectedTags = ref([])
const contentSections = ref([])

// Resource selections
const selectedBook = ref(null)
const selectedPastor = ref(null)
const selectedPodcast = ref(null)
const selectedArtist = ref(null)
const selectedMinistry = ref(null)

// Computed properties
const headerSections = computed(() => {
  return contentSections.value.filter(section => section.headerProperty)
})

const regularSections = computed(() => {
  return contentSections.value.filter(section => !section.headerProperty)
})

// Event handlers
const onVerseSelect = (verseData) => {
  mainVerse.value = verseData
  if (!title.value) {
    title.value = verseData.display
  }
}

const clearMainVerse = () => {
  mainVerse.value = {}
}

const onBookSelect = (book) => {
  selectedBook.value = book
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

const addSection = () => {
  contentSections.value.push({
    title: '',
    content: '',
    fieldType: 'longText',
    headerProperty: false
  })
}

const removeSection = (index) => {
  contentSections.value.splice(index, 1)
}

// Continue the loadEntry function:

const loadEntry = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    // Fetch entry details
    const { data, error } = await supabase
      .rpc('get_journal_entry_details', {
        p_entry_id: entryId,
        p_user_id: session.user.id
      })

    if (error) throw error
    if (!data || !data.length) throw new Error('Entry not found')

    const [entryDetails] = data
    const { entry_data, verses_data, tags_data, resources_data } = entryDetails

    // Set basic entry data
    title.value = entry_data.title
    entryType.value = entry_data.type

    // Handle verses
    if (verses_data && verses_data.length) {
      const mainVerseData = verses_data.find(v => v.main_verse)
      const linkedVersesData = verses_data.filter(v => !v.main_verse)

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
        startVerse: mainVerseData.start_verse_number,
        endVerse: mainVerseData.end_verse_number,
        display: formatVerseReference(verse)
      }))
    }

    // Handle resources
    if (resources_data && resources_data.length) {
      const primaryResource = resources_data.find(r => r.primary_resource)
      if (primaryResource) {
        switch (entry_data.type) {
          case 'Book':
            selectedBook.value = primaryResource
            break
          case 'Sermon':
            selectedPastor.value = primaryResource
            break
          case 'Podcast':
            selectedPodcast.value = primaryResource
            break
          case 'Song':
            selectedArtist.value = primaryResource
            break
          case 'Devotional':
            selectedMinistry.value = primaryResource
            break
        }
      }
    }

    // Handle tags
    if (tags_data) {
      selectedTags.value = tags_data
    }

    // Decrypt and set content
    const encryptionKey = await getEncryptionKey(session.user.id)
    const decrypted = await decryptData(entry_data.content, encryptionKey)

    if (decrypted?.sections) {
      contentSections.value = decrypted.sections
    }

  } catch (error) {
    console.error('Error loading entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Error loading entry'
    })
    router.push('/')
  } finally {
    loading.value = false
  }
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

const saveEntry = async () => {
  saving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No active session')

    const encryptionKey = await getEncryptionKey(session.user.id)
    const encryptedContent = await encryptData({
      sections: contentSections.value
    }, encryptionKey)

    // Update the main entry
    const { error: updateError } = await supabase
      .from('journal_entries')
      .update({
        title: title.value,
        content: encryptedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)

    if (updateError) throw updateError

    // Update verses if it's a Bible entry
    if (entryType.value === 'Bible') {
      // Delete existing verses
      await supabase
        .from('journal_verses')
        .delete()
        .eq('journal_id', entryId)

      // Insert main verse if exists
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

      // Insert linked verses
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
    }

    // Update resources
    await supabase
      .from('journal_resources')
      .delete()
      .eq('journal_id', entryId)

    let selectedResource = null
    switch (entryType.value) {
      case 'Book':
        selectedResource = selectedBook.value
        break
      case 'Sermon':
        selectedResource = selectedPastor.value
        break
      case 'Podcast':
        selectedResource = selectedPodcast.value
        break
      case 'Song':
        selectedResource = selectedArtist.value
        break
      case 'Devotional':
        selectedResource = selectedMinistry.value
        break
    }

    if (selectedResource) {
      const { error: resourceError } = await supabase
        .from('journal_resources')
        .insert({
          journal_id: entryId,
          resource_id: selectedResource.id,
          primary_resource: true,
          user_id: session.user.id
        })

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

    $q.notify({
      type: 'positive',
      message: 'Entry updated successfully!'
    })

    router.push(`/entry/${entryId}`)
  } catch (error) {
    console.error('Error updating entry:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update entry'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadEntry()
})
</script>
