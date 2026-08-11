<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <!-- Preferences -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment">
          <div class="text-h6 q-mb-lg">Preferences</div>

          <q-expansion-item label="Home Screen Order" header-class="text-subtitle1 text-weight-medium"
            class="rounded-borders order-section">
            <q-card-section>
              <div class="text-body2 text-grey-8 q-mb-md">
                Drag to change the order home screen sections appear. Use the eye button to hide or show a section.
              </div>

              <div v-if="hiddenSectionIds.length > 0" class="row justify-end q-mb-sm">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="visibility"
                  label="Unhide All"
                  :disable="orderedSections.length === 0"
                  @click="unhideAllSections"
                />
              </div>

              <draggable v-model="orderedSections" item-key="id" handle=".drag-handle" tag="div" class="q-gutter-y-sm"
                ghost-class="ghost-type-row" @change="markOrderDirty">
                <template #item="{ element }">
                  <div class="type-order-row row items-center no-wrap" :class="{ 'type-order-row--hidden': isSectionHidden(element.id) }">
                    <q-icon name="drag_indicator" class="drag-handle q-mr-sm" />
                    <q-icon :name="element.icon" size="20px" :style="{ color: sectionColor(element) }" class="q-mr-sm" />
                    <span class="type-order-label">{{ element.label }}</span>
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      color="primary"
                      :icon="isSectionHidden(element.id) ? 'visibility_off' : 'visibility'"
                      :aria-label="isSectionHidden(element.id) ? `Show ${element.label}` : `Hide ${element.label}`"
                      @click="toggleSectionVisibility(element.id)"
                    >
                      <q-tooltip>{{ isSectionHidden(element.id) ? 'Hidden from Home' : 'Shown on Home' }}</q-tooltip>
                    </q-btn>
                  </div>
                </template>
              </draggable>

              <div class="row justify-end q-mt-md">
                <q-btn unelevated color="primary" label="Save" :loading="savingOrder" :disable="!isOrderDirty"
                  @click="saveOrder" />
              </div>
            </q-card-section>
          </q-expansion-item>
        </q-card>
      </div>

      <!-- Prayer Reminders -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment" data-tour="settings-prayer-reminders">
          <div class="text-h6 q-mb-lg">Prayer Reminders</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Get a daily phone reminder when prayer follow-ups are due or overdue.
          </div>

          <q-banner v-if="!pushStatus.supported" rounded class="reminder-banner q-mb-md">
            {{ pushStatus.reason }}
          </q-banner>

          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-sm-auto">
              <q-btn
                v-if="!remindersEnabled"
                unelevated
                color="primary"
                icon="notifications"
                label="Enable Reminders"
                :loading="savingReminderOptions"
                :disable="!pushStatus.supported"
                @click="enablePrayerReminders"
              />
              <q-btn
                v-else
                outline
                color="negative"
                icon="notifications_off"
                label="Disable Reminders"
                :loading="savingReminderOptions"
                @click="disablePrayerReminders"
              />
            </div>
          </div>

          <div v-if="remindersEnabled" class="text-caption text-grey-7 q-mt-sm">
            Reminders are enabled. Each prayer uses its own follow-up time.
          </div>
        </q-card>
      </div>

      <!-- Tags -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment" data-tour="settings-tags">
          <div class="text-h6 q-mb-lg">Tags</div>

          <q-expansion-item label="Manage Tags" header-class="text-subtitle1 text-weight-medium"
            class="rounded-borders order-section" @show="tagsStore.fetchTags">
            <q-card-section>
              <div v-if="tagsStore.loading" class="text-center q-pa-md">
                <q-spinner color="primary" size="2em" />
              </div>
              <AppEmptyState
                v-else-if="tagsStore.tags.length === 0"
                compact
                icon="sell"
                title="No tags yet"
                message="Tags appear here after you add them to entries."
                primary-label="New Entry"
                primary-icon="add"
                primary-to="/entry/new"
              />
              <template v-else>
                <div class="row items-center q-mb-sm">
                  <q-checkbox :model-value="allTagsSelected" @update:model-value="toggleSelectAllTags"
                    label="Select all" dense />
                  <q-space />
                  <div class="text-caption text-grey-7">{{ selectedTagIds.length }} selected</div>
                </div>

                <q-list separator bordered class="rounded-borders q-mb-md">
                  <q-item v-for="tag in tagsStore.tags" :key="tag.id" tag="label" clickable dense>
                    <q-item-section avatar>
                      <q-checkbox v-model="selectedTagIds" :val="tag.id" dense />
                    </q-item-section>
                    <q-item-section>{{ tag.name }}</q-item-section>
                  </q-item>
                </q-list>

                <div class="row justify-end">
                  <q-btn color="negative" outline label="Delete Selected" icon="delete"
                    :disable="selectedTagIds.length === 0" @click="showDeleteTagsDialog = true" />
                </div>
              </template>
            </q-card-section>
          </q-expansion-item>
        </q-card>
      </div>

      <!-- Import -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment" data-tour="settings-import">
          <div class="text-h6 q-mb-lg">Import</div>

          <div class="text-subtitle1 text-weight-medium q-mb-sm">Import from ChatGPT</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Copy the template below and give it to ChatGPT (or any AI assistant) along with
            the notes you want to bring in — old journals, scattered documents, even photos
            of handwritten pages. Ask it to fill out the schema for each note. Paste what it
            gives back into the box below and import.
          </div>

          <q-btn outline color="primary" icon="content_copy" label="Copy Template" class="q-mb-lg"
            @click="copyTemplate" />

          <q-input v-model="importText" type="textarea" outlined
            placeholder="Paste output here" :input-style="{ height: '180px', resize: 'none', overflowY: 'auto' }"
            class="q-mb-md import-json-input" />

          <q-btn unelevated color="primary" label="Preview Import" :loading="previewingImport"
            :disable="!importText.trim()" @click="previewImport" />

          <div v-if="results" class="q-mt-lg">
            <q-banner :class="results.failed.length ? 'import-result-banner--warning' : 'import-result-banner--success'"
              class="import-result-banner" rounded>
              <div class="text-weight-medium">
                Imported {{ results.succeeded.length }} of {{ results.succeeded.length + results.failed.length }}
                {{ (results.succeeded.length + results.failed.length) === 1 ? 'entry' : 'entries' }}.
              </div>

              <div v-if="results.failed.length" class="q-mt-sm">
                <div class="text-weight-medium text-negative">Skipped:</div>
                <ul class="q-mb-none">
                  <li v-for="item in results.failed" :key="item.index">
                    {{ item.title }} — {{ item.reason }}
                  </li>
                </ul>
              </div>

              <div v-if="results.warnings.length" class="q-mt-sm">
                <div class="text-weight-medium text-warning">Warnings:</div>
                <ul class="q-mb-none">
                  <li v-for="(item, i) in results.warnings" :key="i">
                    {{ item.title }} — {{ item.message }}
                  </li>
                </ul>
              </div>
            </q-banner>
          </div>
        </q-card>
      </div>

      <!-- Tutorial -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment">
          <div class="text-h6 q-mb-lg">Tutorial</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Take a guided tour of the app anytime.
          </div>
          <q-btn outline color="primary" icon="school" label="Replay Tour" data-tour="replay-tour-btn"
            @click="showTutorialDialog = true" />
        </q-card>
      </div>

      <!-- Data Export -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment" data-tour="settings-data-export">
          <div class="text-h6 q-mb-lg">Data Export</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Download everything you've saved — journal entries, prayer requests, testimony, tags,
            resources, and saved filters — as a JSON file and a readable markdown document.
          </div>
          <q-btn outline color="primary" icon="download" label="Export My Data"
            :loading="accountExport.exporting.value" @click="handleExportData" />
        </q-card>
      </div>

      <!-- Danger Zone -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment" data-tour="settings-danger-zone">
          <div class="text-h6 text-negative q-mb-lg">Danger Zone</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Permanently delete your account and all of your data. This cannot be undone.
          </div>
          <q-btn outline color="negative" icon="delete_forever" label="Delete Account"
            @click="showDeleteAccountDialog = true" />
        </q-card>
      </div>
    </div>

    <TutorialStartDialog v-model="showTutorialDialog" />
    <DeleteAccountDialog v-model="showDeleteAccountDialog" />

    <q-dialog v-model="showImportPreviewDialog">
      <q-card class="import-preview-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Review Import</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section v-if="importPreview" class="scroll import-preview-body">
          <div class="text-body2 q-mb-md">
            {{ importPreview.validCount }} of {{ importPreview.total }}
            {{ importPreview.total === 1 ? 'entry is' : 'entries are' }} ready to import.
          </div>

          <div class="text-subtitle2 text-weight-bold q-mb-sm">Entries to import</div>
          <q-list bordered separator class="rounded-borders bg-white q-mb-md">
            <q-item v-for="entry in importPreview.entries" :key="entry.index" dense>
              <q-item-section>
                <q-item-label>
                  {{ entry.title }}
                </q-item-label>
                <q-item-label caption>
                  {{ entry.valid ? entry.type : `Skipped — ${entry.reason}` }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon :name="entry.valid ? 'check_circle' : 'error'" :color="entry.valid ? 'positive' : 'negative'" />
              </q-item-section>
            </q-item>
          </q-list>

          <q-banner v-if="importPreview.failed.length" rounded class="import-result-banner import-result-banner--warning q-mb-md">
            <div class="text-weight-medium">Skipped entries</div>
            <ul class="q-mb-none">
              <li v-for="item in importPreview.failed" :key="item.index">
                {{ item.title }} — {{ item.reason }}
              </li>
            </ul>
          </q-banner>

          <q-banner v-if="importPreview.warnings.length" rounded class="import-result-banner import-result-banner--warning q-mb-md">
            <div class="text-weight-medium">Warnings</div>
            <ul class="q-mb-none">
              <li v-for="(item, i) in importPreview.warnings" :key="i">
                {{ item.title }} — {{ item.message }}
              </li>
            </ul>
          </q-banner>

          <div class="text-subtitle2 text-weight-bold q-mb-sm">Resources</div>
          <div class="resource-preview-grid q-mb-md">
            <div class="resource-preview-box">
              <div class="text-caption text-grey-7 q-mb-xs">Will reuse</div>
              <div class="text-h6">{{ importPreview.resources.reuse.length }}</div>
              <div v-if="!importPreview.resources.reuse.length" class="text-caption text-grey-7">None</div>
              <q-list v-else dense>
                <q-item v-for="resource in importPreview.resources.reuse" :key="resource.key" dense>
                  <q-item-section>
                    <q-item-label>{{ resource.title }}</q-item-label>
                    <q-item-label caption>{{ resource.type }} · {{ resource.count }} reference{{ resource.count === 1 ? '' : 's' }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div class="resource-preview-box">
              <div class="text-caption text-grey-7 q-mb-xs">Will create</div>
              <div class="text-h6">{{ importPreview.resources.create.length }}</div>
              <div v-if="!importPreview.resources.create.length" class="text-caption text-grey-7">None</div>
              <q-list v-else dense>
                <q-item v-for="resource in importPreview.resources.create" :key="resource.key" dense>
                  <q-item-section>
                    <q-item-label>{{ resource.title }}</q-item-label>
                    <q-item-label caption>{{ resource.type }} · {{ resource.count }} reference{{ resource.count === 1 ? '' : 's' }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <q-banner v-if="importPreview.resources.skipped.length" rounded class="import-result-banner import-result-banner--warning">
            <div class="text-weight-medium">Skipped resources</div>
            <ul class="q-mb-none">
              <li v-for="item in importPreview.resources.skipped" :key="`${item.index}-${item.resourceIndex}`">
                {{ item.title }} — {{ item.reason }}
              </li>
            </ul>
          </q-banner>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Import Now" :loading="importing"
            :disable="!importPreview || importPreview.validCount === 0" @click="runImport" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete tags confirmation -->
    <q-dialog v-model="showDeleteTagsDialog">
      <q-card style="width: 90vw; max-width: 320px">
        <q-card-section>
          <div class="text-h6">
            Delete {{ selectedTagIds.length }} tag{{ selectedTagIds.length === 1 ? '' : 's' }}?
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none text-body2">
          This removes {{ selectedTagIds.length === 1 ? 'it' : 'them' }} from every entry. This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deletingTags" @click="confirmDeleteTags" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { useJournalStore } from 'stores/journalData'
import { useJournalTypeColorsStore } from 'stores/journalTypeColors'
import {
  HOME_SECTION_IDS,
  savedFilterIdFromSectionId,
  savedFilterSectionId,
  useUserPreferencesStore,
} from 'stores/userPreferences'
import { useTagsStore } from 'stores/tags'
import { useResourcesStore } from 'stores/resources'
import { useSavedFiltersStore } from 'stores/savedFilters'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { buildImportTemplateText, importEntries, previewImportEntries } from 'src/utils/journalImport'
import { useAccountExport } from 'src/composables/useAccountExport'
import {
  disablePushNotifications,
  enablePushNotifications,
  pushSupportStatus,
} from 'src/utils/pushNotifications'
import TutorialStartDialog from 'components/TutorialStartDialog.vue'
import DeleteAccountDialog from 'components/DeleteAccountDialog.vue'
import AppEmptyState from 'components/AppEmptyState.vue'

const $q = useQuasar()
const journalStore = useJournalStore()
const typeColorsStore = useJournalTypeColorsStore()
const userPreferencesStore = useUserPreferencesStore()
const tagsStore = useTagsStore()
const resourcesStore = useResourcesStore()
const savedFiltersStore = useSavedFiltersStore()
const accountExport = useAccountExport()

const showTutorialDialog = ref(false)
const showDeleteAccountDialog = ref(false)
const selectedTagIds = ref([])
const showDeleteTagsDialog = ref(false)
const deletingTags = ref(false)
const savingReminderOptions = ref(false)
const remindersEnabled = ref(false)
const pushStatus = ref({ supported: false, reason: 'Checking notification support...' })

const allTagsSelected = computed(() =>
  tagsStore.tags.length > 0 && selectedTagIds.value.length === tagsStore.tags.length,
)

const toggleSelectAllTags = (value) => {
  selectedTagIds.value = value ? tagsStore.tags.map((t) => t.id) : []
}

const confirmDeleteTags = async () => {
  deletingTags.value = true
  try {
    await tagsStore.deleteTags(selectedTagIds.value)
    selectedTagIds.value = []
    showDeleteTagsDialog.value = false
    $q.notify({ type: 'positive', message: 'Tags deleted' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to delete tags' })
  } finally {
    deletingTags.value = false
  }
}

const importText = ref('')
const importing = ref(false)
const previewingImport = ref(false)
const importPreview = ref(null)
const showImportPreviewDialog = ref(false)
const results = ref(null)

// Local editable copy of the user's journal-type order, seeded from the
// store and only persisted when the user hits Save — dragging just
// reorders this local copy. isOrderDirty is set explicitly from the
// draggable's own "change" event rather than derived by diffing arrays —
// that comparison depends on vuedraggable's internal update propagating
// through the store's computed, which isn't reliable enough for something
// this simple to hinge Save's enabled state on.
const orderedSections = ref([])
const hiddenSectionIds = ref([])
const savingOrder = ref(false)
const isOrderDirty = ref(false)
const typesById = new Map(JOURNAL_TYPES.map((t) => [t.id, t]))
const specialHomeSections = new Map([
  [HOME_SECTION_IDS.FAVORITES, { id: HOME_SECTION_IDS.FAVORITES, label: 'Favorites', icon: 'star', color: '#d4a94c' }],
  [HOME_SECTION_IDS.RECENT, { id: HOME_SECTION_IDS.RECENT, label: 'Recent', icon: 'schedule', color: '#7c9082' }],
])

const homeSectionById = (id) => {
  const special = specialHomeSections.get(id)
  if (special) return special

  const savedFilterId = savedFilterIdFromSectionId(id)
  if (savedFilterId) {
    const savedFilter = savedFiltersStore.filters.find((filter) => filter.id === savedFilterId)
    return savedFilter
      ? { id, label: `Saved Filter: ${savedFilter.name}`, icon: 'bookmark', color: '#8f6f4e' }
      : null
  }

  return typesById.get(id)
}
const sectionColor = (section) => section.color || typeColorsStore.getColor(section.id)

const syncOrderedTypes = () => {
  const savedFilterSections = savedFiltersStore.filters.map((filter) => savedFilterSectionId(filter.id))
  orderedSections.value = [
    ...userPreferencesStore.homeSectionOrder,
    ...savedFilterSections.filter((id) => !userPreferencesStore.homeSectionOrder.includes(id)),
  ]
    .map((id) => homeSectionById(id))
    .filter(Boolean)
  const knownSectionIds = new Set(orderedSections.value.map((section) => section.id))
  hiddenSectionIds.value = userPreferencesStore.hiddenHomeSectionIds.filter((id) => knownSectionIds.has(id))
  isOrderDirty.value = false
}

const markOrderDirty = () => {
  isOrderDirty.value = true
}

const isSectionHidden = (id) => hiddenSectionIds.value.includes(id)
const toggleSectionVisibility = (id) => {
  hiddenSectionIds.value = isSectionHidden(id)
    ? hiddenSectionIds.value.filter((sectionId) => sectionId !== id)
    : [...hiddenSectionIds.value, id]
  markOrderDirty()
}

const unhideAllSections = () => {
  hiddenSectionIds.value = []
  markOrderDirty()
}

const saveOrder = async () => {
  savingOrder.value = true
  try {
    await userPreferencesStore.setHomeSections(
      orderedSections.value.map((section) => section.id),
      hiddenSectionIds.value,
    )
    isOrderDirty.value = false
    $q.notify({ type: 'positive', message: 'Home screen saved' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save order' })
  } finally {
    savingOrder.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    userPreferencesStore.load(),
    savedFiltersStore.filters.length ? Promise.resolve() : savedFiltersStore.fetchFilters(),
  ])
  syncOrderedTypes()
  pushStatus.value = pushSupportStatus()
  remindersEnabled.value = userPreferencesStore.prayerReminderOptions.enabled
})

const saveReminderPreferences = async (enabled) => {
  await userPreferencesStore.setPrayerReminderOptions({
    enabled,
    hour: userPreferencesStore.prayerReminderOptions.hour ?? 8,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  remindersEnabled.value = enabled
}

const enablePrayerReminders = async () => {
  savingReminderOptions.value = true
  try {
    await enablePushNotifications()
    await saveReminderPreferences(true)
    $q.notify({ type: 'positive', message: 'Prayer reminders enabled' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Could not enable reminders' })
  } finally {
    savingReminderOptions.value = false
  }
}

const disablePrayerReminders = async () => {
  savingReminderOptions.value = true
  try {
    await disablePushNotifications()
    await saveReminderPreferences(false)
    $q.notify({ type: 'positive', message: 'Prayer reminders disabled' })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Could not disable reminders' })
  } finally {
    savingReminderOptions.value = false
  }
}

const copyTemplate = async () => {
  try {
    await resourcesStore.loadResources(true)
    const resourceRelationships = await resourcesStore.getAllRelationships()
    await navigator.clipboard.writeText(buildImportTemplateText({
      resources: resourcesStore.resources,
      resourceRelationships,
    }))
    $q.notify({ type: 'positive', message: 'Template copied to clipboard' })
  } catch {
    $q.notify({ type: 'negative', message: 'Could not access the clipboard' })
  }
}

const handleExportData = async () => {
  try {
    await accountExport.exportAllData()
    $q.notify({ type: 'positive', message: 'Export downloaded' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to export your data' })
  }
}

const previewImport = async () => {
  previewingImport.value = true
  results.value = null
  try {
    importPreview.value = await previewImportEntries(importText.value)
    showImportPreviewDialog.value = true
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Import preview failed' })
  } finally {
    previewingImport.value = false
  }
}

const runImport = async () => {
  importing.value = true
  results.value = null
  try {
    const summary = await importEntries(importText.value)
    results.value = summary
    if (summary.failed.length === 0) {
      importText.value = ''
      importPreview.value = null
      showImportPreviewDialog.value = false
    }
    await journalStore.fetchEntries()
    await resourcesStore.loadResources(true)
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Import failed' })
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.settings-card {
  background-color: var(--color-parchment) !important;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 599px) {
  .settings-card {
    border-radius: 8px;
  }
}

.order-section {
  border: 1px solid var(--color-border);
}

.type-order-row {
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-alt);
}

.type-order-row--hidden {
  opacity: 0.62;
}

.type-order-label {
  flex: 1;
  min-width: 0;
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-muted);
}

.ghost-type-row {
  opacity: 0.4;
}

.import-json-input :deep(textarea) {
  resize: none;
}

.import-preview-card {
  width: 760px;
  max-width: 95vw;
}

.import-preview-body {
  max-height: 70vh;
}

.resource-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.resource-preview-box {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-alt);
  padding: 12px;
  min-width: 0;
}

.import-result-banner {
  color: #243228;
}

.import-result-banner--success {
  background: #dce9dd;
  border: 1px solid rgba(76, 111, 82, 0.26);
}

.import-result-banner--warning {
  background: #f5e3c4;
  border: 1px solid rgba(153, 104, 36, 0.24);
}

.reminder-banner {
  background: #f5e3c4;
  border: 1px solid rgba(153, 104, 36, 0.24);
  color: #3d2d18;
}

body.body--dark .import-result-banner {
  color: #f3f7f1;
}

body.body--dark .import-result-banner--success {
  background: #385a40;
  border-color: rgba(178, 216, 181, 0.22);
}

body.body--dark .import-result-banner--warning {
  background: #684b22;
  border-color: rgba(245, 210, 151, 0.24);
}

body.body--dark .reminder-banner {
  background: #684b22;
  border-color: rgba(245, 210, 151, 0.24);
  color: #f7ead2;
}

@media (max-width: 599px) {
  .resource-preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
