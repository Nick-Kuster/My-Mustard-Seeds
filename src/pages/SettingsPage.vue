<template>
  <q-page class="q-pa-md q-mt-lg">
    <div class="row q-col-gutter-md justify-center">
      <!-- Preferences -->
      <div class="col-12 content-card">
        <q-card class="settings-card q-pa-lg parchment">
          <div class="text-h6 q-mb-lg">Preferences</div>

          <div class="text-subtitle1 text-weight-medium q-mb-sm">Home Screen Order</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Drag to change the order journal types appear in on the home screen, then save.
          </div>

          <draggable v-model="orderedTypes" item-key="id" handle=".drag-handle" tag="div" class="q-gutter-y-sm"
            ghost-class="ghost-type-row">
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
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { useJournalStore } from 'stores/journalData'
import { useJournalTypeColorsStore } from 'stores/journalTypeColors'
import { useUserPreferencesStore } from 'stores/userPreferences'
import { JOURNAL_TYPES } from 'src/constants/journalTypes'
import { buildImportTemplateText, importEntries } from 'src/utils/journalImport'

const $q = useQuasar()
const journalStore = useJournalStore()
const typeColorsStore = useJournalTypeColorsStore()
const userPreferencesStore = useUserPreferencesStore()

const importText = ref('')
const importing = ref(false)
const results = ref(null)

// Local editable copy of the user's journal-type order, seeded from the
// store and re-persisted (via drag) as the whole ordered list of ids
const orderedTypes = ref([])
const typesById = new Map(JOURNAL_TYPES.map((t) => [t.id, t]))

const syncOrderedTypes = () => {
  orderedTypes.value = userPreferencesStore.journalOrder
    .map((id) => typesById.get(id))
    .filter(Boolean)
}

const saveOrder = async () => {
  try {
    await userPreferencesStore.setJournalOrder(orderedTypes.value.map((t) => t.id))
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save order' })
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
.type-order-row {
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background: #fffdf8;
}

.drag-handle {
  cursor: grab;
  color: rgba(0, 0, 0, 0.4);
}

.ghost-type-row {
  opacity: 0.4;
}
</style>
