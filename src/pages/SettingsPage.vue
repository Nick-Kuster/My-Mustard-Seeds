<template>
  <q-page class="q-pa-md q-mt-lg">
    <div class="row q-col-gutter-md justify-center">
      <!-- Preferences -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment">
          <div class="text-h6 q-mb-lg">Preferences</div>

          <q-expansion-item label="Home Screen Order" header-class="text-subtitle1 text-weight-medium"
            class="rounded-borders order-section">
            <q-card-section>
              <div class="text-body2 text-grey-8 q-mb-md">
                Drag to change the order journal types appear in on the home screen, then save.
              </div>

              <draggable v-model="orderedTypes" item-key="id" handle=".drag-handle" tag="div" class="q-gutter-y-sm"
                ghost-class="ghost-type-row" @change="markOrderDirty">
                <template #item="{ element }">
                  <div class="type-order-row row items-center no-wrap">
                    <q-icon name="drag_indicator" class="drag-handle q-mr-sm" />
                    <q-icon :name="element.icon" size="20px" :style="{ color: typeColorsStore.getColor(element.id) }"
                      class="q-mr-sm" />
                    <span>{{ element.label }}</span>
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

      <!-- Tags -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment">
          <div class="text-h6 q-mb-lg">Tags</div>

          <q-expansion-item label="Manage Tags" header-class="text-subtitle1 text-weight-medium"
            class="rounded-borders order-section" @show="tagsStore.fetchTags">
            <q-card-section>
              <div v-if="tagsStore.loading" class="text-center q-pa-md">
                <q-spinner color="primary" size="2em" />
              </div>
              <div v-else-if="tagsStore.tags.length === 0" class="text-body2 text-grey-8">
                No tags yet.
              </div>
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
        <q-card class="settings-card q-pa-lg parchment">
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

          <q-input v-model="importText" type="textarea" outlined autogrow
            placeholder="Paste output here" :input-style="{ minHeight: '160px' }" class="q-mb-md" />

          <q-btn unelevated color="primary" label="Import" :loading="importing" :disable="!importText.trim()"
            @click="runImport" />

          <div v-if="results" class="q-mt-lg">
            <q-banner :class="results.failed.length ? 'bg-orange-1' : 'bg-green-1'" rounded>
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
            Take a guided tour of the app anytime — pick a quick overview or a deeper look at search and filters.
          </div>
          <q-btn outline color="primary" icon="school" label="Replay Tour" data-tour="replay-tour-btn"
            @click="showTutorialDialog = true" />
        </q-card>
      </div>
    </div>

    <TutorialStartDialog v-model="showTutorialDialog" />

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
import { useUserPreferencesStore } from 'stores/userPreferences'
import { useTagsStore } from 'stores/tags'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { buildImportTemplateText, importEntries } from 'src/utils/journalImport'
import TutorialStartDialog from 'components/TutorialStartDialog.vue'

const $q = useQuasar()
const journalStore = useJournalStore()
const typeColorsStore = useJournalTypeColorsStore()
const userPreferencesStore = useUserPreferencesStore()
const tagsStore = useTagsStore()

const showTutorialDialog = ref(false)
const selectedTagIds = ref([])
const showDeleteTagsDialog = ref(false)
const deletingTags = ref(false)

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
const results = ref(null)

// Local editable copy of the user's journal-type order, seeded from the
// store and only persisted when the user hits Save — dragging just
// reorders this local copy. isOrderDirty is set explicitly from the
// draggable's own "change" event rather than derived by diffing arrays —
// that comparison depends on vuedraggable's internal update propagating
// through the store's computed, which isn't reliable enough for something
// this simple to hinge Save's enabled state on.
const orderedTypes = ref([])
const savingOrder = ref(false)
const isOrderDirty = ref(false)
const typesById = new Map(JOURNAL_TYPES.map((t) => [t.id, t]))

const syncOrderedTypes = () => {
  orderedTypes.value = userPreferencesStore.journalOrder
    .map((id) => typesById.get(id))
    .filter(Boolean)
  isOrderDirty.value = false
}

const markOrderDirty = () => {
  isOrderDirty.value = true
}

const saveOrder = async () => {
  savingOrder.value = true
  try {
    await userPreferencesStore.setJournalOrder(orderedTypes.value.map((t) => t.id))
    isOrderDirty.value = false
    $q.notify({ type: 'positive', message: 'Order saved' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save order' })
  } finally {
    savingOrder.value = false
  }
}

onMounted(async () => {
  await userPreferencesStore.load()
  syncOrderedTypes()
})

const copyTemplate = async () => {
  try {
    await navigator.clipboard.writeText(buildImportTemplateText())
    $q.notify({ type: 'positive', message: 'Template copied to clipboard' })
  } catch {
    $q.notify({ type: 'negative', message: 'Could not access the clipboard' })
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
    }
    await journalStore.fetchEntries()
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Import failed' })
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.settings-card {
  border-radius: 12px;
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

.drag-handle {
  cursor: grab;
  color: var(--color-text-muted);
}

.ghost-type-row {
  opacity: 0.4;
}
</style>
