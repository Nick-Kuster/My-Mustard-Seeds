<template>
  <div class="prayer-requests">
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="2em" />
    </div>
    <template v-else>
      <div class="row q-col-gutter-sm q-mb-sm items-start">
        <div class="col-12 col-sm">
          <q-input v-model="newRequest" placeholder="What's on your heart?" outlined dense autogrow />
        </div>
        <div class="col-12 col-sm-4">
          <q-select v-model="newGroup" :options="filteredGroupOptions" outlined dense clearable use-input
            new-value-mode="add-unique" label="Group (optional)" @filter="filterGroupOptions" />
        </div>
        <div class="col-auto">
          <q-btn unelevated color="primary" icon="add" label="Add" :disable="!newRequest.trim()" :loading="adding"
            @click="submitNew" />
        </div>
      </div>

      <div class="row justify-end q-mb-lg">
        <q-btn flat dense no-caps icon="create_new_folder" label="New Group" size="sm" @click="promptNewGroupSection" />
      </div>

      <div v-if="requests.length === 0" class="text-center text-grey q-pa-lg">
        No prayer requests yet — add the first one above.
      </div>

      <template v-else>
        <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">
          Active ({{ active.length }})
        </div>
        <div v-if="active.length === 0" class="text-caption text-grey q-mb-lg">
          Nothing active right now.
        </div>

        <div v-else class="q-mb-lg">
          <draggable :list="groupSections" item-key="key" handle=".group-drag-handle" class="q-gutter-y-md"
            ghost-class="ghost-group" @end="persistOrder">
            <template #item="{ element: section }">
              <div class="group-section">
                <div class="group-header row items-center no-wrap"
                  @click="toggleGroupCollapse(section.key)">
                  <q-icon name="drag_indicator" class="group-drag-handle q-mr-xs" />
                  <q-icon :name="isGroupCollapsed(section.key) ? 'chevron_right' : 'expand_more'" size="18px"
                    class="q-mr-xs" />
                  <span class="text-caption text-weight-bold text-grey-7">
                    {{ section.label }} ({{ section.items.length }})
                  </span>
                </div>

                <draggable v-show="!isGroupCollapsed(section.key)" :list="section.items" group="prayer-requests"
                  item-key="id" handle=".drag-handle" class="q-gutter-y-xs q-mt-xs" ghost-class="ghost-request"
                  @end="persistOrder">
                  <template #item="{ element: request }">
                    <q-item class="request-item rounded-borders bg-white">
                      <q-item-section avatar class="drag-handle-section">
                        <q-icon name="drag_indicator" class="drag-handle" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-wrap">{{ request.decryptedContent }}</q-item-label>
                        <q-item-label caption>{{ formatDate(request.created_at) }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row no-wrap q-gutter-xs">
                          <q-btn flat round dense icon="check_circle" color="positive" @click="openAnswer(request)">
                            <q-tooltip>Mark answered</q-tooltip>
                          </q-btn>
                          <q-btn flat round dense icon="delete" color="negative" @click="openDelete(request)">
                            <q-tooltip>Delete</q-tooltip>
                          </q-btn>
                        </div>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template #footer>
                    <div v-if="section.items.length === 0" class="empty-group-drop text-caption text-grey text-center">
                      {{ section.key ? 'Drag prayers here' : 'Drag prayers here to remove from a group' }}
                    </div>
                  </template>
                </draggable>
              </div>
            </template>
          </draggable>
        </div>

        <q-expansion-item v-if="answered.length > 0" label="Answered" :caption="`${answered.length} answered`"
          header-class="text-weight-bold" class="rounded-borders bg-white answered-section">
          <q-list separator>
            <q-item v-for="request in answered" :key="request.id">
              <q-item-section>
                <q-item-label class="text-wrap answered-content text-grey-7">{{ request.decryptedContent }}</q-item-label>
                <q-item-label v-if="request.decryptedAnswerNote" caption class="text-wrap">
                  {{ request.decryptedAnswerNote }}
                </q-item-label>
                <q-item-label caption>Answered {{ formatDate(request.answered_at) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row no-wrap q-gutter-xs">
                  <q-btn flat round dense icon="undo" @click="reopen(request)">
                    <q-tooltip>Reopen</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="delete" color="negative" @click="openDelete(request)">
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </template>
    </template>

    <!-- Mark answered dialog -->
    <q-dialog v-model="showAnswerDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Mark as Answered</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="answerNote" type="textarea" autogrow outlined
            label="How did God answer? (optional)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="positive" label="Mark Answered" :loading="answering" @click="confirmAnswer" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete confirmation -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Delete this request?</div>
        </q-card-section>
        <q-card-section class="q-pt-none text-body2">
          This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deleting" @click="confirmDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New group prompt -->
    <q-dialog v-model="showNewGroupDialog">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">New Group</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="newGroupSectionName" label="Group name" outlined dense autofocus
            @keyup.enter="confirmNewGroupSection" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add" :disable="!newGroupSectionName.trim()" @click="confirmNewGroupSection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { usePrayerRequestsStore } from 'stores/prayerRequests'

const $q = useQuasar()
const store = usePrayerRequestsStore()

const loading = ref(true)
const adding = ref(false)
const newRequest = ref('')
const newGroup = ref(null)

const requests = computed(() => store.requests)
const active = computed(() => requests.value.filter((r) => r.status !== 'answered'))
const answered = computed(() => requests.value.filter((r) => r.status === 'answered'))

// Local, draggable view of the active list grouped by group_name. Synced
// from the store after every mutation (fetch/add/answer/reopen/delete) —
// dragging only ever mutates this local structure, then persistOrder
// flattens it back into the store. Ungrouped is always shown, even empty,
// so there's somewhere to drop an item to take it out of a group.
const groupSections = ref([])
const UNGROUPED = ''

// Groups collapsed by the user — keyed the same as section.key ('' for
// Ungrouped). Nothing collapsed by default.
const collapsedGroups = reactive(new Set())
const isGroupCollapsed = (key) => collapsedGroups.has(key)
const toggleGroupCollapse = (key) => {
  if (collapsedGroups.has(key)) collapsedGroups.delete(key)
  else collapsedGroups.add(key)
}

const syncGroups = () => {
  const sorted = [...active.value].sort((a, b) => a.position - b.position)
  const map = new Map()
  const order = []
  for (const request of sorted) {
    const key = request.group_name || UNGROUPED
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key).push(request)
  }

  // Groups with items are ordered by where their members fall in the
  // persisted order — including Ungrouped, once it actually has members.
  // Groups with no items yet (an unused Ungrouped bucket, or a freshly
  // created empty group) have no data to derive a position from, so they
  // keep whatever relative order the user last left them in, appended
  // after everything with real content.
  if (!map.has(UNGROUPED)) {
    map.set(UNGROUPED, [])
    order.push(UNGROUPED)
  }
  groupSections.value
    .filter((s) => !map.has(s.key))
    .forEach((s) => {
      map.set(s.key, [])
      order.push(s.key)
    })

  groupSections.value = order.map((key) => ({
    key,
    label: key || 'Ungrouped',
    items: map.get(key) || [],
  }))
}

const groupNames = computed(() => groupSections.value.map((s) => s.key).filter(Boolean))
const filteredGroupOptions = ref([])

const filterGroupOptions = (val, update) => {
  update(() => {
    if (!val) {
      filteredGroupOptions.value = groupNames.value
      return
    }
    const needle = val.toLowerCase()
    filteredGroupOptions.value = groupNames.value.filter((name) => name.toLowerCase().includes(needle))
  })
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const submitNew = async () => {
  const text = newRequest.value.trim()
  if (!text) return
  adding.value = true
  try {
    await store.addRequest(text, newGroup.value)
    newRequest.value = ''
    newGroup.value = null
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to add prayer request' })
  } finally {
    adding.value = false
  }
}

const showNewGroupDialog = ref(false)
const newGroupSectionName = ref('')

const promptNewGroupSection = () => {
  newGroupSectionName.value = ''
  showNewGroupDialog.value = true
}

const confirmNewGroupSection = () => {
  const name = newGroupSectionName.value.trim()
  if (!name) return
  if (!groupSections.value.some((s) => s.key === name)) {
    groupSections.value.splice(groupSections.value.length - 1, 0, { key: name, label: name, items: [] })
  }
  showNewGroupDialog.value = false
}

// Flattens the current on-screen grouping/order and persists it in one go
const persistOrder = async () => {
  const items = groupSections.value.flatMap((section) =>
    section.items.map((request) => ({ id: request.id, group_name: section.key || null })),
  )
  try {
    await store.reorder(items)
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save order' })
    syncGroups()
  }
}

const showAnswerDialog = ref(false)
const answering = ref(false)
const answerNote = ref('')
const answeringRequest = ref(null)

const openAnswer = (request) => {
  answeringRequest.value = request
  answerNote.value = ''
  showAnswerDialog.value = true
}

const confirmAnswer = async () => {
  answering.value = true
  try {
    await store.markAnswered(answeringRequest.value.id, answerNote.value.trim())
    showAnswerDialog.value = false
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to mark as answered' })
  } finally {
    answering.value = false
  }
}

const reopen = async (request) => {
  try {
    await store.reopenRequest(request.id)
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to reopen request' })
  }
}

const showDeleteDialog = ref(false)
const deleting = ref(false)
const deletingRequest = ref(null)

const openDelete = (request) => {
  deletingRequest.value = request
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await store.deleteRequest(deletingRequest.value.id)
    showDeleteDialog.value = false
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to delete request' })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    await store.fetchRequests()
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load prayer requests' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.answered-section :deep(.q-item__label) {
  white-space: normal;
}

.answered-content {
  text-decoration: line-through;
}

.request-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
  min-height: 56px;
}

.drag-handle-section {
  min-width: 0;
  padding-right: 4px;
}

.drag-handle {
  cursor: grab;
  color: rgba(0, 0, 0, 0.35);
}

.ghost-request {
  opacity: 0.4;
}

.ghost-group {
  opacity: 0.4;
}

.empty-group-drop {
  padding: 10px;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.group-header {
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 4px;
}

.group-header:hover {
  background: rgba(0, 0, 0, 0.04);
}

.group-drag-handle {
  cursor: grab;
  color: rgba(0, 0, 0, 0.35);
}
</style>
