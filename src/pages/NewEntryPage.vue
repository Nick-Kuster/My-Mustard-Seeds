<template>
  <q-page class="entry-editor-page q-pa-md q-mt-lg q-ml-sm">
    <div class="row justify-center">
      <div class="col-12 content-card entry-editor-card entry-card q-pa-lg parchment">
        <div class="row items-center q-mb-md">
          <div class="col">
            <div class="text-h6">Plant a New Seed</div>
          </div>
        </div>

        <div class="q-gutter-md">
          <!-- Entry Type Selector -->
          <TypeSelector v-model="entryType" data-tour="entry-type-picker" @update:modelValue="handleTypeChange" />

          <!-- Resource Selection Section -->
          <!-- Bible Verse Selector (daily reading types) -->
          <div v-if="verseEntryTypes.includes(entryType)" class="q-mb-lg">
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
              <q-btn rounded unelevated color="primary" label="Select Passage" @click="showVerseModal = true" />
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
              <q-btn rounded unelevated color="primary" label="Select Book" @click="showBookModal = true" />
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
              <q-btn rounded unelevated color="primary" label="Select Group" @click="showGroupModal = true" />
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
              <q-btn rounded unelevated color="primary" label="Select Show" @click="showShowModal = true" />
            </div>

            <ResourceSelectionModal v-model="showShowModal" :resource-type="RESOURCE_TYPES.SHOW"
              @select="onShowSelect" />
          </div>

          <!-- Sermon Specific Select -->
          <div v-else-if="entryType === 'Sermon'" class="q-mb-lg" data-tour="entry-resource-fields">
            <div v-if="selectedPastor">
              <div class="q-mb-md">
                <div class="text-body1"><strong>Sermon:</strong> {{ selectedSermon.metadata.title }}</div>
                <div v-if="selectedSeries" class="text-body1"><strong>Series:</strong> {{ selectedSeries.metadata.title
                }}</div>
                <div class="text-caption text-grey-8">By {{ selectedPastor.metadata.name }}<template
                    v-if="selectedChurch"> From {{ selectedChurch.metadata.name }}</template>
                </div>
                <div class="text-caption text-grey-8">On {{ selectedSermon.metadata.date }}</div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showPastorModal = true" />
            </div>
            <div v-else>
              <q-btn rounded unelevated color="primary" label="Select Sermon" @click="showPastorModal = true" />
            </div>

            <ResourceSelectionModal v-model="showPastorModal" :resource-type="RESOURCE_TYPES.CHURCH"
              @select="onChurchSelect" />
          </div>

          <!-- Devotional Specific Select -->
          <div v-else-if="entryType === 'Devotional'" class="q-mb-lg">
            <div v-if="selectedDevotional">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedDevotional.metadata.name }}</div>
                <div v-if="selectedDevotional.metadata.author" class="text-caption text-grey-8">
                  by {{ selectedDevotional.metadata.author }}
                </div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showDevotionalModal = true" />
            </div>
            <div v-else>
              <q-btn rounded unelevated color="primary" label="Select Devotional" @click="showDevotionalModal = true" />
            </div>

            <ResourceSelectionModal v-model="showDevotionalModal" :resource-type="RESOURCE_TYPES.DEVOTIONAL"
              @select="onDevotionalSelect" />
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
              <q-btn rounded unelevated color="primary" label="Select Artist" @click="showArtistModal = true" />
            </div>

            <ResourceSelectionModal v-model="showArtistModal" :resource-type="RESOURCE_TYPES.SONG_ARTIST"
              @select="onArtistSelect" />
          </div>

          <!-- Podcast Specific Select -->
          <div v-else-if="entryType === 'Podcast'" class="q-mb-lg">
            <div v-if="selectedPodcast">
              <div class="q-mb-md">
                <div class="text-body1">{{ selectedPodcast.metadata.title }}</div>
                <div class="text-caption text-grey-8">
                  <span v-if="selectedPodcastEpisode?.metadata.episodeNumber">Episode {{
                    selectedPodcastEpisode.metadata.episodeNumber }}: </span>
                  <span v-if="selectedPodcastEpisode">{{ selectedPodcastEpisode.metadata.title }}</span>
                </div>
              </div>
              <q-btn flat dense color="primary" class="q-px-none" label="Change" @click="showPodcastModal = true" />
            </div>
            <div v-else>
              <q-btn rounded unelevated color="primary" label="Select Podcast" @click="showPodcastModal = true" />
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
                        @click="openSectionLink(section.content)" />
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
            <q-tab name="additional" label="Additional Content" data-tour="entry-additional-tab" />
          </q-tabs>

          <q-tab-panels v-model="activeTab" animated class="bg-transparent" @touchstart="handleTouchStart"
            @touchmove="handleTouchMove" @touchend="handleTouchEnd">
            <!-- Main Content Tab -->
            <q-tab-panel name="main" class="q-pa-none">
              <!-- Dynamic Sections -->
              <ReferenceShortcutsHint />
              <div class="q-gutter-y-md" data-tour="entry-content">
                <template v-for="section in regularContentSections" :key="section.id">
                  <div class="section-container q-mb-md">
                    <div class="row items-center q-mb-sm section-header">
                      <q-btn flat round dense size="sm"
                        :icon="isCollapsed(section.id) ? 'chevron_right' : 'expand_more'"
                        @click="toggleCollapse(section.id)" class="q-mr-xs" />
                      <div class="col">
                        <q-input v-model="section.title" label="Section Title" dense />
                      </div>
                      <div class="col-auto">
                        <div class="row items-center no-wrap">
                          <!-- Delete button -->
                          <q-btn v-if="regularContentSections.length > 1" round flat color="negative" icon="delete"
                            size="sm" @click="removeSection(section)" />
                        </div>
                      </div>
                    </div>
                    <div v-show="!isCollapsed(section.id)">
                      <RichTextEditor v-if="section.fieldType !== 'list'" v-model="section.content"
                        :ref="(el) => setRichTextEditorRef(section.id, el)"
                        :on-verse-resolved="inlineResolver.pushResolvedVerse"
                        :on-tag-resolved="inlineResolver.pushResolvedTag"
                        :on-strongs-resolved="inlineResolver.pushResolvedStrongs" />

                      <div v-else class="list-editor q-mb-sm">
                        <div v-for="(item, i) in getListItems(section.content)" :key="i"
                          class="row items-start no-wrap q-mb-xs list-item-row">
                          <q-input :ref="(el) => setListItemRef(section.id, i, el)" :model-value="item"
                            @update:model-value="section.content = setListItem(section.content, i, $event)" dense
                            borderless type="textarea" autogrow placeholder="List item" class="col list-item-input"
                            @keydown.enter.prevent="handleListItemEnter(section, i)">
                            <template #prepend>
                              <span class="list-bullet" aria-hidden="true"></span>
                            </template>
                          </q-input>
                          <q-btn flat round dense icon="close" size="sm"
                            @click="section.content = removeListItem(section.content, i)" />
                        </div>
                        <q-btn flat dense no-caps icon="add" label="Add Item" color="primary" size="sm"
                          @click="section.content = addListItem(section.content)" />
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </q-tab-panel>

            <!-- Additional Content Tab -->
            <q-tab-panel name="additional" class="q-pt-md q-pl-md">
              <div class="fit">
                <!-- Linked Verses -->
                <div class="q-mb-lg" data-tour="entry-linked-verses">
                  <LinkedVerses v-model="linkedVerses" />
                </div>

                <!-- Tags -->
                <div class="q-mb-lg" data-tour="entry-tags">
                  <TagSelector v-model="selectedTags" />
                </div>

                <!-- Quotes -->
                <div class="q-mb-lg" data-tour="entry-quotes">
                  <QuoteSelector v-model="selectedQuotes" />
                </div>

                <!-- Links -->
                <div class="q-mb-lg" data-tour="entry-links">
                  <LinkSelector v-model="selectedLinks" />
                </div>

                <!-- Strong's Words -->
                <div class="q-mb-lg" data-tour="entry-strongs">
                  <StrongsSelector v-model="selectedStrongs" />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>

          <!-- Action Buttons (mobile: these live in the bottom nav bar instead, see pageActions store) -->
          <div v-if="$q.screen.gt.sm" class="row q-col-gutter-x-sm q-mt-lg">
            <div class="col-3">
              <q-btn-dropdown rounded unelevated color="info" no-caps class="full-width" style="height: 40px"
                icon="add" label="Add Section" content-style="min-width: 160px">
                <q-list>
                  <q-item clickable v-close-popup @click="addSectionAndFocus('longText')">
                    <q-item-section avatar>
                      <q-icon name="notes" />
                    </q-item-section>
                    <q-item-section>Text</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="addSectionAndFocus('list')">
                    <q-item-section avatar>
                      <q-icon name="checklist" />
                    </q-item-section>
                    <q-item-section>List</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
            <div class="col-3">
              <q-btn rounded unelevated outline color="info" class="full-width" icon="swap_vert" label="Reorder"
                style="height: 40px" :disable="regularContentSections.length < 2" @click="openReorderSections" />
            </div>
            <div class="col-3">
              <q-btn rounded unelevated color="negative" class="full-width" @click="router.push('/')"
                style="height: 40px">
                <q-icon name="cancel" class="q-mr-sm" /> Cancel
              </q-btn>
            </div>
            <div class="col-3">
              <q-btn rounded unelevated color="primary" @click="saveEntry" class="full-width" data-tour="entry-save"
                :loading="saving" style="height: 40px">
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

  <q-dialog v-model="showDraftRestoreDialog" persistent>
    <q-card class="draft-restore-card">
      <q-card-section>
        <div class="text-h6">Restore Unsaved Draft?</div>
        <div class="text-body2 text-grey-8 q-mt-sm">
          A previous new entry draft was found. Restore it into this blank form or discard it.
        </div>
      </q-card-section>

      <q-card-section v-if="draftSummary" class="q-pt-none">
        <q-list bordered separator class="rounded-borders bg-white">
          <q-item>
            <q-item-section avatar>
              <q-icon name="category" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ draftSummary.type }}</q-item-label>
              <q-item-label caption>Journal type</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="title" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ draftSummary.title }}</q-item-label>
              <q-item-label caption>Draft title</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="notes" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ draftSummary.sections }}</q-item-label>
              <q-item-label caption>Content sections</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="sell" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ draftSummary.references }}</q-item-label>
              <q-item-label caption>Linked items</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="schedule" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ draftSummary.updated }}</q-item-label>
              <q-item-label caption>Last autosaved</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat color="negative" label="Discard" @click="discardAvailableDraft" />
        <q-btn color="primary" label="Restore Draft" @click="restoreAvailableDraft" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showReorderSectionsDialog">
    <q-card style="width: 90vw; max-width: 440px">
      <q-card-section>
        <div class="text-h6">Reorder Sections</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <draggable
          v-model="reorderSections"
          item-key="id"
          handle=".section-reorder-handle"
          ghost-class="ghost-section"
          @end="persistSectionOrder"
        >
          <template #item="{ element: section }">
            <div class="reorder-section-row row items-center no-wrap">
              <q-icon name="drag_indicator" class="section-reorder-handle q-mr-sm" />
              <q-icon :name="section.fieldType === 'list' ? 'checklist' : 'notes'" class="q-mr-sm text-grey-7" />
              <span class="text-body2 text-weight-medium ellipsis">
                {{ section.title || (section.fieldType === 'list' ? 'List Section' : 'Text Section') }}
              </span>
            </div>
          </template>
        </draggable>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Done" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import { getEncryptionKey, encryptData } from 'src/utils/encryption'
import { RESOURCE_TYPES } from 'stores/resources'
import { usePageActionsStore } from 'stores/pageActions'
import { useTutorialStore } from 'src/stores/tutorial'
import VerseSelectionModal from 'components/VerseSelectionModal.vue'
import ResourceSelectionModal from 'components/ResourceSelectionModal.vue'
import { useJournalStore } from 'stores/journalData'
import draggable from 'vuedraggable'
import { getListItems, setListItem, addListItem, removeListItem, insertListItemAfter } from 'src/utils/sectionListUtils'
import LinkedVerses from 'components/LinkedVerses.vue'
import RichTextEditor from 'src/components/richText/RichTextEditor.vue'
import ReferenceShortcutsHint from 'components/ReferenceShortcutsHint.vue'
import TypeSelector from 'components/TypeSelector.vue'
import VerseDisplayModal from 'components/VerseDisplayModal.vue'
import { openSafeExternalUrl } from 'src/utils/urlUtils'
import { useInlineReferenceResolver } from 'src/composables/useInlineReferenceResolver'
import { EMPTY_RICH_DOC } from 'src/utils/richTextContent'
import { deleteEntryDraft, entryDraftHasContent, getEntryDraft, saveEntryDraft } from 'src/utils/entryDrafts'

const TagSelector = defineAsyncComponent(() => import('src/components/TagSelector.vue'))
const QuoteSelector = defineAsyncComponent(() => import('src/components/QuoteSelector.vue'))
const LinkSelector = defineAsyncComponent(() => import('src/components/LinkSelector.vue'))
const StrongsSelector = defineAsyncComponent(() => import('src/components/StrongsSelector.vue'))

const router = useRouter()
const $q = useQuasar()
const journalStore = useJournalStore()
const activeTab = ref('main')
const draftId = 'new-entry'
let autosaveTimer = null
const autosaveReady = ref(false)
const draftToRestore = ref(null)
const showDraftRestoreDialog = ref(false)

// Modals
const showVerseDisplayModal = ref(false)
const showVerseModal = ref(false)
const showBookModal = ref(false)
const showPastorModal = ref(false)
const showPodcastModal = ref(false)
const showArtistModal = ref(false)
const showDevotionalModal = ref(false)
const showGroupModal = ref(false)
const showShowModal = ref(false)


// Selected Resources
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
const selectedLinks = ref([])

const mainVerse = ref({})
const title = ref('')
const contentSections = ref([])
const regularContentSections = computed(() => contentSections.value.filter(section => !section.headerProperty))
const showReorderSectionsDialog = ref(false)
const reorderSections = ref([])
const saving = ref(false)
const linkedVerses = ref([])
const selectedTags = ref([])
const selectedQuotes = ref([])
const selectedStrongs = ref([])

const inlineResolver = useInlineReferenceResolver({ linkedVerses, selectedTags, selectedStrongs, mainVerse })

const entryType = ref('Daily Bible Reading')

// Types that use the main-verse (passage) selector
const verseEntryTypes = ['Daily Bible Reading']

const getTodayDate = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  return `${month}-${day}-${year}`
}

// A brand-new longText section has no legacy data to preserve, so it
// starts in the new rich-doc shape immediately rather than as ''.
const createSection = (title = '', content = '', fieldType = 'longText', headerProperty = false, id = null) => ({
  id: id ?? 'section-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
  title,
  content: fieldType === 'date' ? getTodayDate()
    : fieldType === 'longText' && !content ? EMPTY_RICH_DOC
      : content,
  fieldType,
  headerProperty,
})

// Computed property to filter header sections
const headerSections = computed(() => {
  return contentSections.value.filter(section => section.headerProperty)
})

// Only the header-property fields a type structurally needs (used for the
// entry title and other fixed metadata) are pre-filled — everything else
// starts as a single blank section rather than a scroll of unused presets.
const handleTypeChange = (newType) => {
  title.value = ''
  switch (newType) {
    case 'Daily Bible Reading':
      contentSections.value = [createSection()]
      break
    case 'Song':
      contentSections.value = [
        createSection('Song Title', '', 'shortText', true, 'song-title'),
        createSection('Song Link', '', 'link', true),
        createSection(),
      ]
      break
    case 'Answered Prayer / Miracle':
      contentSections.value = [
        createSection('Title', '', 'shortText', true, 'miracle-title'),
        createSection('Date', '', 'date', true),
        createSection(),
      ]
      break
    case 'Video':
      contentSections.value = [
        createSection('Video Title', '', 'shortText', true, 'video-title'),
        createSection('Video URL', '', 'link', true),
        createSection(),
      ]
      break
    case 'Article':
      contentSections.value = [
        createSection('Article Title', '', 'shortText', true, 'article-title'),
        createSection('Article URL', '', 'link', true),
        createSection(),
      ]
      break
    case 'Devotional':
      contentSections.value = [
        createSection('Devotional Title', '', 'shortText', true, 'devotional-title'),
        createSection(),
      ]
      break
    case 'Group':
      contentSections.value = [
        createSection('Title', '', 'shortText', true, 'group-title'),
        createSection('Date', '', 'date', true),
        createSection(),
      ]
      break
    case 'Other':
      contentSections.value = [
        createSection('Title', '', 'shortText', true, 'other-title'),
        createSection('Date', '', 'date', true),
        createSection(),
      ]
      break
    default:
      contentSections.value = [createSection()]
  }
}

const openReorderSections = () => {
  if (regularContentSections.value.length < 2) return
  reorderSections.value = [...regularContentSections.value]
  showReorderSectionsDialog.value = true
}

const persistSectionOrder = () => {
  const headerSections = contentSections.value.filter(section => section.headerProperty)
  contentSections.value = [
    ...headerSections,
    ...reorderSections.value,
  ]
}

const onVerseSelect = (verseData) => {
  mainVerse.value = verseData
  title.value = verseData.display
}

const clearMainVerse = () => {
  mainVerse.value = {}
}

const addSection = (fieldType = 'longText') => {
  contentSections.value.push(createSection('', '', fieldType))
}

// Adding a section is available regardless of which tab is active, so jump
// to Main Content afterward — otherwise the new section is invisible
const addSectionAndFocus = (fieldType) => {
  addSection(fieldType)
  activeTab.value = 'main'
}

// List-item inputs, keyed by `${sectionId}-${index}`, so pressing Enter in
// one can insert a new item right after it and focus that new input —
// without this, every list item beyond the first needs a click on "Add
// Item" plus a click into the new field.
const listItemRefs = {}
const setListItemRef = (sectionId, index, el) => {
  if (el) listItemRefs[`${sectionId}-${index}`] = el
}

// RichTextEditor instances, keyed by section id — flushed at save time so
// a pause-worthy verse reference typed right before Save isn't lost (see
// saveEntry() below).
const richTextEditorRefs = {}
const setRichTextEditorRef = (sectionId, el) => {
  if (el) richTextEditorRefs[sectionId] = el
}

const handleListItemEnter = async (section, index) => {
  section.content = insertListItemAfter(section.content, index)
  await nextTick()
  listItemRefs[`${section.id}-${index + 1}`]?.focus()
}

const openSectionLink = (url) => {
  if (!openSafeExternalUrl(url)) {
    $q.notify({ type: 'negative', message: 'This link is not a valid http(s) URL and was not opened' })
  }
}

// Collapse state is purely an editing convenience, not saved with the entry
const collapsedIds = ref(new Set())
const isCollapsed = (id) => collapsedIds.value.has(id)
const toggleCollapse = (id) => {
  if (collapsedIds.value.has(id)) collapsedIds.value.delete(id)
  else collapsedIds.value.add(id)
}

const removeSection = (section) => {
  const index = contentSections.value.findIndex(item => item.id === section.id)
  if (index !== -1) contentSections.value.splice(index, 1)
}

const captureDraft = () => ({
  entryType: entryType.value,
  title: title.value,
  activeTab: activeTab.value,
  contentSections: contentSections.value,
  mainVerse: mainVerse.value,
  linkedVerses: linkedVerses.value,
  selectedTags: selectedTags.value,
  selectedQuotes: selectedQuotes.value,
  selectedLinks: selectedLinks.value,
  selectedStrongs: selectedStrongs.value,
  resources: {
    selectedChurch: selectedChurch.value,
    selectedPastor: selectedPastor.value,
    selectedSeries: selectedSeries.value,
    selectedSermon: selectedSermon.value,
    selectedPodcast: selectedPodcast.value,
    selectedPodcastEpisode: selectedPodcastEpisode.value,
    selectedArtist: selectedArtist.value,
    selectedDevotional: selectedDevotional.value,
    selectedBook: selectedBook.value,
    selectedAuthor: selectedAuthor.value,
    selectedChapter: selectedChapter.value,
    selectedGroup: selectedGroup.value,
    selectedShow: selectedShow.value,
    selectedSeason: selectedSeason.value,
    selectedEpisode: selectedEpisode.value,
  },
})

const restoreDraft = (data) => {
  entryType.value = data.entryType || 'Daily Bible Reading'
  title.value = data.title || ''
  activeTab.value = data.activeTab || 'main'
  contentSections.value = data.contentSections?.length ? data.contentSections : [createSection()]
  mainVerse.value = data.mainVerse || {}
  linkedVerses.value = data.linkedVerses || []
  selectedTags.value = data.selectedTags || []
  selectedQuotes.value = data.selectedQuotes || []
  selectedLinks.value = data.selectedLinks || []
  selectedStrongs.value = data.selectedStrongs || []

  const resources = data.resources || {}
  selectedChurch.value = resources.selectedChurch || null
  selectedPastor.value = resources.selectedPastor || null
  selectedSeries.value = resources.selectedSeries || null
  selectedSermon.value = resources.selectedSermon || null
  selectedPodcast.value = resources.selectedPodcast || null
  selectedPodcastEpisode.value = resources.selectedPodcastEpisode || null
  selectedArtist.value = resources.selectedArtist || null
  selectedDevotional.value = resources.selectedDevotional || null
  selectedBook.value = resources.selectedBook || null
  selectedAuthor.value = resources.selectedAuthor || null
  selectedChapter.value = resources.selectedChapter || null
  selectedGroup.value = resources.selectedGroup || null
  selectedShow.value = resources.selectedShow || null
  selectedSeason.value = resources.selectedSeason || null
  selectedEpisode.value = resources.selectedEpisode || null
}

const resetDraftForm = () => {
  entryType.value = 'Daily Bible Reading'
  title.value = ''
  activeTab.value = 'main'
  contentSections.value = [createSection()]
  mainVerse.value = {}
  linkedVerses.value = []
  selectedTags.value = []
  selectedQuotes.value = []
  selectedLinks.value = []
  selectedStrongs.value = []
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

const scheduleDraftSave = () => {
  if (!autosaveReady.value || saving.value) return
  clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    const draft = captureDraft()
    if (entryDraftHasContent(draft)) saveEntryDraft(draftId, draft)
    else deleteEntryDraft(draftId)
  }, 800)
}

const richTextHasText = (content) => JSON.stringify(content || '').includes('"text"')

const draftSummary = computed(() => {
  const draft = draftToRestore.value
  if (!draft?.data) return null
  const data = draft.data
  const sections = (data.contentSections || []).filter((section) => {
    if (section.headerProperty) return false
    if (section.fieldType === 'list') return String(section.content || '').trim()
    return richTextHasText(section.content)
  }).length
  const linkedCount =
    (data.linkedVerses?.length || 0) +
    (data.selectedTags?.length || 0) +
    (data.selectedQuotes?.length || 0) +
    (data.selectedLinks?.length || 0) +
    (data.selectedStrongs?.length || 0) +
    (data.mainVerse?.display ? 1 : 0)

  return {
    type: data.entryType || 'Daily Bible Reading',
    title: data.title?.trim() || data.mainVerse?.display || 'Untitled draft',
    sections: `${sections} content section${sections === 1 ? '' : 's'}`,
    references: `${linkedCount} linked item${linkedCount === 1 ? '' : 's'}`,
    updated: draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'Unknown',
  }
})

const restoreAvailableDraft = () => {
  if (!draftToRestore.value?.data) return
  autosaveReady.value = false
  restoreDraft(draftToRestore.value.data)
  showDraftRestoreDialog.value = false
  nextTick(() => { autosaveReady.value = true })
}

const discardAvailableDraft = () => {
  deleteEntryDraft(draftId)
  draftToRestore.value = null
  showDraftRestoreDialog.value = false
  resetDraftForm()
}

const handleResourceSelection = (selections) => {
  // selections is now an array of resources in order of selection
  if (!Array.isArray(selections) || selections.length === 0) return

  // Last item in array is always the final selection
  const finalSelection = selections[selections.length - 1]

  switch (entryType.value) {
    case 'Sermon': {
      // Drill-down starts at Church, but a Sermon can attach either under
      // a Series (Church, Pastor, Series, Sermon) or directly under a
      // Pastor as a one-off (Church, Pastor, Sermon) — match by type
      // rather than position so either path resolves correctly
      selectedChurch.value = selections.find((r) => r.type === RESOURCE_TYPES.CHURCH) || null
      selectedPastor.value = selections.find((r) => r.type === RESOURCE_TYPES.PASTOR) || null
      selectedSeries.value = selections.find((r) => r.type === RESOURCE_TYPES.SERMON_SERIES) || null
      selectedSermon.value = selections.find((r) => r.type === RESOURCE_TYPES.SERMON) || null

      if (selectedSermon.value && selectedSeries.value) {
        title.value = `${selectedPastor.value.metadata.name} - ${selectedSeries.value.metadata.title}: ${selectedSermon.value.metadata.title}`
      } else if (selectedSermon.value) {
        title.value = `${selectedPastor.value.metadata.name}: ${selectedSermon.value.metadata.title}`
      } else if (selectedPastor.value) {
        title.value = selectedPastor.value.metadata.name
      } else if (selectedChurch.value) {
        title.value = selectedChurch.value.metadata.name
      }
      break
    }

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
      if (selections.length >= 2) {
        selectedPodcast.value = selections[0]
        selectedPodcastEpisode.value = selections[1]
        title.value = `${selectedPodcast.value.metadata.title}${selectedPodcastEpisode.value.metadata.episodeNumber ? ` - Episode ${selectedPodcastEpisode.value.metadata.episodeNumber}` : ''}: ${selectedPodcastEpisode.value.metadata.title}`
      } else {
        selectedPodcast.value = finalSelection
        selectedPodcastEpisode.value = null
      }
      break

    case 'Song':
      selectedArtist.value = finalSelection
      break

    case 'Devotional':
      selectedDevotional.value = finalSelection
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
const onChurchSelect = handleResourceSelection
const onPodcastSelect = handleResourceSelection
const onArtistSelect = handleResourceSelection
const onDevotionalSelect = handleResourceSelection
const onGroupSelect = handleResourceSelection
const onShowSelect = handleResourceSelection

const generateTitle = () => {
  const headerSections = contentSections.value.filter(section => section.headerProperty)

  switch (entryType.value) {
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

    // Flush each rich-text section's own pending verse resolution first
    // (a debounce tick that hasn't fired yet), then the safety net below
    // for pasted text or anything a debounce tick didn't catch in time —
    // see RichTextEditor.vue and src/composables/useInlineReferenceResolver.js
    await Promise.all(
      Object.values(richTextEditorRefs).map((el) => el.flushPendingReferences())
    )
    await inlineResolver.resolveAllInlineReferences(contentSections.value)

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

    if (verseEntryTypes.includes(entryType.value) && mainVerse.value.startVerseId) {
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
        if (selectedPastor.value) {
          resources.push({ resourceId: selectedPastor.value.id, primary: true });
          if (selectedSeries.value) {
            resources.push({ resourceId: selectedSeries.value.id, primary: false });
          }
          if (selectedSermon.value) {
            resources.push({ resourceId: selectedSermon.value.id, primary: false });
          }
          if (selectedChurch.value) {
            resources.push({ resourceId: selectedChurch.value.id, primary: false });
          }
        }
        break;
      case 'Podcast':
        resources.push({ resourceId: selectedPodcast.value.id, primary: true });
        resources.push({ resourceId: selectedPodcastEpisode.value.id, primary: false });
        break;
      case 'Song':
        resources.push({ resourceId: selectedArtist.value.id, primary: true });
        break;
      case 'Devotional':
        resources.push({ resourceId: selectedDevotional.value.id, primary: true });
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
          user_id: session.user.id
        })

      if (journalResourceError) throw journalResourceError
    }

    // Handle tags
    if (selectedTags.value.length > 0) {
      const tagInserts = selectedTags.value.map(tag => ({
        journal_id: entry.id,
        tag_id: tag.id,
        user_id: session.user.id
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

    // Handle Strong's words
    if (selectedStrongs.value.length > 0) {
      const strongsInserts = selectedStrongs.value.map(item => ({
        journal_id: entry.id,
        strongs_number: item.strongs_number,
        user_id: session.user.id
      }))

      const { error: strongsError } = await supabase
        .from('journal_strongs')
        .insert(strongsInserts)

      if (strongsError) throw new Error('Failed to save Strong\'s words: ' + strongsError.message)
    }

    $q.notify({
      type: 'positive',
      message: 'Your seed has been planted!'
    })

    const newEntry = await journalStore.getEntry(entry.id);
    await journalStore.addEntry(newEntry)
    deleteEntryDraft(draftId)

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
  const draft = getEntryDraft(draftId)
  resetDraftForm()
  if (draft?.data && entryDraftHasContent(draft.data)) {
    draftToRestore.value = draft
    showDraftRestoreDialog.value = true
  }
  nextTick(() => { autosaveReady.value = true })
})

watch(
  [
    entryType,
    title,
    contentSections,
    mainVerse,
    linkedVerses,
    selectedTags,
    selectedQuotes,
    selectedLinks,
    selectedStrongs,
    selectedChurch,
    selectedPastor,
    selectedSeries,
    selectedSermon,
    selectedPodcast,
    selectedPodcastEpisode,
    selectedArtist,
    selectedDevotional,
    selectedBook,
    selectedAuthor,
    selectedChapter,
    selectedGroup,
    selectedShow,
    selectedSeason,
    selectedEpisode,
  ],
  scheduleDraftSave,
  { deep: true },
)

// Lets a mid-tour step (see src/constants/tutorialSteps.js) switch into the
// Additional Content tab without this component needing to know the tour
// exists — same pattern as SearchPage.vue's Filter modal watcher.
const tutorialStore = useTutorialStore()
watch(
  () => tutorialStore.pendingAction,
  (action) => {
    if (action === 'open-entry-additional-tab') {
      activeTab.value = 'additional'
      tutorialStore.clearAction()
    }
  },
)

const pageActionsStore = usePageActionsStore()

onMounted(() => {
  pageActionsStore.setFooterActions([
    {
      key: 'add-text-section',
      label: 'Section',
      icon: 'notes',
      color: 'info',
      handler: () => addSectionAndFocus('longText'),
    },
    {
      key: 'add-list-section',
      label: 'List',
      icon: 'checklist',
      color: 'info',
      handler: () => addSectionAndFocus('list'),
    },
    {
      key: 'reorder-sections',
      label: 'Reorder',
      icon: 'swap_vert',
      color: 'info',
      handler: openReorderSections,
    },
    {
      key: 'cancel',
      label: 'Cancel',
      icon: 'cancel',
      color: 'negative',
      handler: () => router.push('/'),
    },
    {
      key: 'save',
      label: 'Save',
      icon: 'save',
      color: 'primary',
      loading: computed(() => saving.value),
      handler: saveEntry,
      tourKey: 'entry-save',
    },
  ])
})

onUnmounted(() => {
  clearTimeout(autosaveTimer)
  pageActionsStore.clearFooterActions()
})
</script>


<style scoped>
/* Fills the visible page instead of shrinking to content and leaving the
   background image exposed below — a plain min-height, not a flex-stretch
   layout, since making q-page/its row a flex-grow container caused real
   regressions (page-level overflow, clicks not reaching the rich-text
   editor, likely from interacting with QTabPanels' own transition layer).
   180px is header + mobile bottom-nav + this page's own margins/padding,
   roughly — being off by a bit just means a small gap or a touch of
   scroll, not a broken page. */
.entry-card {
  min-height: calc(100vh - 180px);
}

@media (max-width: 599px) {
  .entry-editor-page {
    padding-left: 0;
    padding-right: 0;
    margin-left: 0;
  }

  .entry-card {
    padding: 8px !important;
  }

  .section-container {
    padding: 4px 0;
    background: transparent;
  }
}

.draft-restore-card {
  width: 92vw;
  max-width: 440px;
}

.section-container {
  padding: 12px;
  border-radius: 8px;
  background: var(--color-surface);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

/* Style for the section being dragged */
.dragging-section {
  background: var(--color-surface) !important;
  border: 1px solid var(--q-primary) !important;
  box-shadow: 0 8px 16px var(--color-shadow-strong) !important;
  transform: scale(1.02) !important;
  opacity: 0.9 !important;
}

/* Style for the ghost placeholder */
.ghost-section {
  background: var(--color-surface-muted) !important;
  border: 2px dashed var(--q-primary) !important;
  opacity: 0.5 !important;
}

.reorder-section-row {
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  margin-bottom: 8px;
}

.section-reorder-handle {
  cursor: grab;
  color: var(--color-text-muted);
}

/* Style for the chosen section (initial selection) */
.chosen-section {
  background: var(--color-surface-alt) !important;
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
    background: var(--color-hover);
  }

  .drag-handle:active .dot {
    opacity: 1;
  }

  /* Enhanced dragging feedback for mobile */
  .dragging-section {
    transform: scale(1.03) !important;
    box-shadow: 0 12px 24px var(--color-shadow-strong) !important;
    background: var(--color-surface-alt) !important;
  }

  .ghost-section {
    background: var(--color-surface-muted) !important;
    border: 2px dashed var(--q-primary) !important;
    opacity: 0.7 !important;
  }

  .chosen-section {
    background: var(--color-surface-alt) !important;
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

.list-bullet {
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-text-muted);
  opacity: 0.8;
}

/* items-start (needed so a wrapped multi-line item's icon/close button sit
   at the top instead of centering across the whole grown height) leaves
   the bullet flush with the row's top edge — nudge it down to the text
   baseline of the first line instead. */
.list-item-row {
  padding-top: 0;
}

.list-item-input :deep(.q-field__prepend) {
  align-items: flex-start;
  height: auto;
  min-height: 0;
  padding-right: 8px;
  padding-top: 18px;
}

.list-item-row .q-btn {
  margin-top: 2px;
}
</style>
