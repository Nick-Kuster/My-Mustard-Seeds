<template>
  <div class="prayer-requests">
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="2em" />
    </div>

    <!-- viewMode takes priority over the empty-state check below — otherwise
         switching to manage mode to add the first prayer would be a no-op,
         since requests.length is still 0 until you actually add one. -->
    <AppEmptyState
      v-else-if="viewMode !== 'manage' && requests.length === 0"
      icon="front_hand"
      title="Start a prayer list"
      message="Keep the people and needs you are praying over in one place, then mark answers as they come."
      primary-label="Add Prayer"
      primary-icon="add"
      @primary="viewMode = 'manage'"
    />

    <!-- List view: a plain, quick-to-scan read of what's currently active —
         no drag handles, no group management, nothing interactive besides
         Edit. This is the default view. -->
    <template v-else-if="viewMode === 'list'">
      <div class="row justify-between items-center q-mb-md">
        <div class="text-subtitle2 text-weight-bold text-grey-8">
          Active ({{ active.length }})
        </div>
        <q-btn flat dense no-caps icon="edit" label="Edit" data-tour="prayers-manage-btn" @click="viewMode = 'manage'" />
      </div>

      <AppEmptyState
        v-if="active.length === 0"
        compact
        icon="check_circle"
        title="No active prayers right now"
        message="Answered prayers stay below. Switch to edit mode when you are ready to add more."
        primary-label="Edit Prayer List"
        primary-icon="edit"
        @primary="viewMode = 'manage'"
      />
      <div v-else>
        <template v-for="section in allSectionsForDisplay" :key="section.key ?? 'misc'">
          <template v-if="section.items.length > 0">
            <div class="list-group-label row items-center no-wrap"
              @click="toggleGroupCollapse(section.key)">
              <q-icon :name="isGroupCollapsed(section.key) ? 'chevron_right' : 'expand_more'" size="16px"
                class="q-mr-xs" />
              <span class="text-caption text-weight-bold text-grey-6">{{ section.label }}</span>
            </div>
            <template v-if="!isGroupCollapsed(section.key)">
              <div v-for="request in section.items" :key="request.id" class="prayer-list-item">
                {{ request.decryptedContent }}
              </div>
            </template>
          </template>
        </template>
      </div>
    </template>

    <!-- Manage view: groups come first — add a group, then add prayers
         directly under it (or under Miscellaneous, always available for
         anything that doesn't need its own group). Reorder/collapse/answer/
         delete from here too. -->
    <template v-else>
      <div class="row justify-end q-mb-sm">
        <q-btn flat dense no-caps icon="visibility" label="View As List" @click="viewMode = 'list'" />
      </div>

      <div class="text-body2 text-grey-7 q-mb-md">
        Add a group, then add prayers under it — or use Miscellaneous below for anything
        that doesn't need one.
      </div>

      <div class="row justify-end items-center q-gutter-sm q-mb-lg" data-tour="prayer-groups-area">
        <q-btn v-if="!addingGroup" outline dense no-caps color="primary" icon="create_new_folder" label="New Group"
          size="sm" @click="startAddGroup" />
        <template v-else>
          <q-input ref="newGroupInputRef" v-model="newGroupSectionName" dense outlined placeholder="Group name"
            style="min-width: 180px" @keyup.enter="confirmNewGroupSection" />
          <q-btn flat round dense icon="check" color="primary" :loading="savingNewGroup"
            :disable="!newGroupSectionName.trim()" @click="confirmNewGroupSection" />
          <q-btn flat round dense icon="close" @click="cancelAddGroup" />
        </template>
      </div>

      <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">
        Active ({{ active.length }})
      </div>

      <div class="q-mb-lg">
        <draggable :list="groupSections" item-key="key" handle=".group-drag-handle" class="q-gutter-y-md"
          ghost-class="ghost-group" @end="persistGroupOrder">
          <template #item="{ element: section }">
            <div class="group-section">
              <div class="group-header row items-center no-wrap"
                @click="toggleGroupCollapse(section.key)">
                <q-icon name="drag_indicator" class="group-drag-handle q-mr-xs" />
                <q-icon :name="isGroupCollapsed(section.key) ? 'chevron_right' : 'expand_more'" size="18px"
                  class="q-mr-xs" />
                <template v-if="editingGroupKey === section.key">
                  <q-input :ref="(el) => setEditGroupInputRef(section, el)" v-model="editGroupName" dense outlined
                    class="col" style="max-width: 220px" @click.stop @keyup.enter="confirmEditGroup(section)"
                    @keyup.esc="cancelEditGroup" />
                  <q-btn flat round dense icon="check" color="primary" size="sm" :loading="savingGroupEdit"
                    :disable="!editGroupName.trim()" @click.stop="confirmEditGroup(section)" />
                  <q-btn flat round dense icon="close" size="sm" @click.stop="cancelEditGroup" />
                </template>
                <template v-else>
                  <span class="text-caption text-weight-bold text-grey-7 col">
                    {{ section.label }} ({{ section.items.length }})
                  </span>
                  <q-btn flat round dense icon="edit" size="sm" @click.stop="startEditGroup(section)">
                    <q-tooltip>Rename group</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="delete" size="sm" color="negative"
                    @click.stop="openDeleteGroup(section)">
                    <q-tooltip>Delete group</q-tooltip>
                  </q-btn>
                </template>
              </div>

              <div v-show="!isGroupCollapsed(section.key)">
                <draggable :list="section.items" group="prayer-requests"
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
                      Drag prayers here, or add one below
                    </div>
                  </template>
                </draggable>

                <div class="quick-add-row row items-center no-wrap q-mt-xs">
                  <q-input v-model="quickAddText[section.key]" dense borderless
                    :placeholder="`Add to ${section.label}...`" class="col"
                    @keyup.enter="quickAdd(section)" />
                  <q-btn flat round dense icon="add" color="primary"
                    :disable="!(quickAddText[section.key] || '').trim()"
                    @click="quickAdd(section)" />
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <!-- Miscellaneous: always present (even empty), but not itself a
             persisted group row — it's just "no group_id" — so it isn't
             draggable/deletable, only a valid cross-group drop target. -->
        <div class="group-section q-mt-md">
          <div class="group-header row items-center no-wrap" @click="toggleGroupCollapse(null)">
            <q-icon :name="isGroupCollapsed(null) ? 'chevron_right' : 'expand_more'" size="18px"
              class="q-mr-xs" />
            <span class="text-caption text-weight-bold text-grey-7 col">
              Miscellaneous ({{ miscItems.length }})
            </span>
          </div>

          <div v-show="!isGroupCollapsed(null)">
            <draggable :list="miscItems" group="prayer-requests"
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
                      <q-btn flat round dense icon="check_circle" color="positive" data-tour="prayer-mark-answered"
                        @click="openAnswer(request)">
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
                <div v-if="miscItems.length === 0" class="empty-group-drop text-caption text-grey text-center">
                  Drag prayers here to remove them from a group, or add one below
                </div>
              </template>
            </draggable>

            <div class="quick-add-row row items-center no-wrap q-mt-xs" data-tour="prayer-quick-add">
              <q-input v-model="quickAddText[MISC_KEY]" dense borderless placeholder="Add to Miscellaneous..."
                class="col" @keyup.enter="quickAdd(miscSection)" />
              <q-btn flat round dense icon="add" color="primary"
                :disable="!(quickAddText[MISC_KEY] || '').trim()" @click="quickAdd(miscSection)" />
            </div>
          </div>
        </div>
      </div>

      <q-expansion-item v-if="answered.length > 0" label="Answered" :caption="`${answered.length} answered`"
        header-class="text-weight-bold" class="rounded-borders bg-white answered-section"
        data-tour="prayer-answered-section">
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
      <q-card style="width: 90vw; max-width: 320px">
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

    <!-- Delete group confirmation -->
    <q-dialog v-model="showDeleteGroupDialog">
      <q-card style="width: 90vw; max-width: 340px">
        <q-card-section>
          <div class="text-h6">Delete "{{ deletingGroupSection?.label }}"?</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <template v-if="deletingGroupSection?.items.length">
            <div class="text-body2 q-mb-sm">
              This group has {{ deletingGroupSection.items.length }}
              prayer{{ deletingGroupSection.items.length === 1 ? '' : 's' }}.
            </div>
            <q-option-group v-model="deleteGroupMode" dense class="delete-group-options" :options="[
              { label: 'Delete this group only — prayers move to Miscellaneous', value: 'orphan' },
              { label: `Delete this group and all ${deletingGroupSection.items.length} prayers`, value: 'cascade' }
            ]" />
          </template>
          <div v-else class="text-body2 text-grey-8">This group is empty.</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deletingGroup" @click="confirmDeleteGroup" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { usePrayerRequestsStore } from 'stores/prayerRequests'
import { usePrayerRequestGroupsStore } from 'stores/prayerRequestGroups'
import { useTutorialStore } from 'src/stores/tutorial'
import AppEmptyState from './AppEmptyState.vue'

const $q = useQuasar()
const store = usePrayerRequestsStore()
const groupsStore = usePrayerRequestGroupsStore()
const tutorialStore = useTutorialStore()

const loading = ref(true)

// List (default, read-only quick glance) or manage (add/group/reorder/etc.)
const viewMode = ref('list')

const requests = computed(() => store.requests)
const active = computed(() => requests.value.filter((r) => r.status !== 'answered'))
const answered = computed(() => requests.value.filter((r) => r.status === 'answered'))

// Local, draggable view of the active list, one entry per real persisted
// group (groupsStore.groups), synced after every mutation (fetch/add/
// answer/reopen/delete/group change). Dragging only ever mutates this
// local structure (plus miscItems below), then persistOrder/
// persistGroupOrder flush it back to the stores. Miscellaneous
// (group_id null) isn't a persisted row, so it's tracked separately.
const groupSections = ref([])
const miscItems = ref([])
const miscSection = computed(() => ({ key: null, label: 'Miscellaneous', items: miscItems.value }))
const allSectionsForDisplay = computed(() => [...groupSections.value, miscSection.value])

// Object-key namespace for per-group UI state (quick-add text). Real
// groups key by their uuid; Miscellaneous has no id, so it gets a
// dedicated key that can't collide with one.
const MISC_KEY = '__misc__'

// Groups collapsed by the user — keyed the same as section.key (null for
// Miscellaneous). Nothing collapsed by default.
const collapsedGroups = reactive(new Set())
const isGroupCollapsed = (key) => collapsedGroups.has(key)
const toggleGroupCollapse = (key) => {
  if (collapsedGroups.has(key)) collapsedGroups.delete(key)
  else collapsedGroups.add(key)
}

const syncGroups = () => {
  const byGroupId = new Map()
  const misc = []
  for (const request of active.value) {
    if (request.group_id) {
      if (!byGroupId.has(request.group_id)) byGroupId.set(request.group_id, [])
      byGroupId.get(request.group_id).push(request)
    } else {
      misc.push(request)
    }
  }
  byGroupId.forEach((list) => list.sort((a, b) => a.position - b.position))
  misc.sort((a, b) => a.position - b.position)

  groupSections.value = [...groupsStore.groups]
    .sort((a, b) => a.position - b.position)
    .map((g) => ({ key: g.id, label: g.name, items: byGroupId.get(g.id) || [] }))

  miscItems.value = misc
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Quick-add: a per-group inline input, right under that group's list, for
// adding straight into it — the primary way to add a prayer now that
// groups come first. Keyed by section so each group's row keeps its own
// in-progress text.
const quickAddText = reactive({})

const quickAdd = async (section) => {
  const mapKey = section.key ?? MISC_KEY
  const text = (quickAddText[mapKey] || '').trim()
  if (!text) return
  try {
    await store.addRequest(text, section.key)
    quickAddText[mapKey] = ''
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to add prayer request' })
  }
}

// New group: an inline "New Group" button that swaps for a name input —
// Enter (or the check button) creates it immediately, no dialog.
const addingGroup = ref(false)
const newGroupInputRef = ref(null)
const newGroupSectionName = ref('')
const savingNewGroup = ref(false)

const startAddGroup = async () => {
  newGroupSectionName.value = ''
  addingGroup.value = true
  await nextTick()
  newGroupInputRef.value?.focus()
}

const cancelAddGroup = () => {
  addingGroup.value = false
  newGroupSectionName.value = ''
}

const confirmNewGroupSection = async () => {
  const name = newGroupSectionName.value.trim()
  if (!name) return
  savingNewGroup.value = true
  try {
    await groupsStore.addGroup(name)
    syncGroups()
    cancelAddGroup()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.code === '23505' ? 'A group with that name already exists' : 'Failed to create group',
    })
  } finally {
    savingNewGroup.value = false
  }
}

// Rename: an inline pencil-to-input swap on the group header, same
// interaction shape as the "New Group" flow. editGroupInputEl is set via a
// function ref rather than a template ref name, since a plain named ref
// would collect one entry per rendered group section (only one of which is
// ever actually the input being edited).
const editingGroupKey = ref(null)
const editGroupName = ref('')
const editGroupInputEl = ref(null)
const savingGroupEdit = ref(false)

const setEditGroupInputRef = (section, el) => {
  if (editingGroupKey.value === section.key) editGroupInputEl.value = el
}

const startEditGroup = async (section) => {
  editingGroupKey.value = section.key
  editGroupName.value = section.label
  await nextTick()
  editGroupInputEl.value?.focus()
}

const cancelEditGroup = () => {
  editingGroupKey.value = null
  editGroupName.value = ''
}

const confirmEditGroup = async (section) => {
  const name = editGroupName.value.trim()
  if (!name || name === section.label) {
    cancelEditGroup()
    return
  }
  savingGroupEdit.value = true
  try {
    await groupsStore.renameGroup(section.key, name)
    syncGroups()
    cancelEditGroup()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error?.code === '23505' ? 'A group with that name already exists' : 'Failed to rename group',
    })
  } finally {
    savingGroupEdit.value = false
  }
}

// Flattens the current on-screen item order/grouping and persists it in
// one go (used for both within-group reorders and cross-group moves,
// including into/out of Miscellaneous).
const persistOrder = async () => {
  const items = [
    ...groupSections.value.flatMap((section) =>
      section.items.map((request) => ({ id: request.id, group_id: section.key })),
    ),
    ...miscItems.value.map((request) => ({ id: request.id, group_id: null })),
  ]
  try {
    await store.reorder(items)
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save order' })
    syncGroups()
  }
}

// Persists the groups' own order (dragging group sections themselves).
// Separate from persistOrder since it never touches any prayer's row.
const persistGroupOrder = async () => {
  const orderedIds = groupSections.value.map((section) => section.key)
  try {
    await groupsStore.reorderGroups(orderedIds)
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save group order' })
    syncGroups()
  }
}

// Deleting a group: 'orphan' (default) deletes just the group row — the
// group_id FK's ON DELETE SET NULL clears it on member prayers server-side,
// so they land back in Miscellaneous; 'cascade' deletes the prayers too.
// Miscellaneous itself has no delete button — it isn't a persisted row.
const showDeleteGroupDialog = ref(false)
const deletingGroupSection = ref(null)
const deleteGroupMode = ref('orphan')
const deletingGroup = ref(false)

const openDeleteGroup = (section) => {
  deletingGroupSection.value = section
  deleteGroupMode.value = 'orphan'
  showDeleteGroupDialog.value = true
}

const confirmDeleteGroup = async () => {
  const section = deletingGroupSection.value
  deletingGroup.value = true
  try {
    if (deleteGroupMode.value === 'cascade') {
      await Promise.all(section.items.map((request) => store.deleteRequest(request.id)))
      await groupsStore.deleteGroup(section.key)
    } else {
      await groupsStore.deleteGroup(section.key)
      // The FK already cleared group_id server-side; mirror that in the
      // local cache so the UI reflects it without a re-fetch.
      section.items.forEach((request) => {
        const cached = store.requests.find((r) => r.id === request.id)
        if (cached) cached.group_id = null
      })
    }
    showDeleteGroupDialog.value = false
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to delete group' })
  } finally {
    deletingGroup.value = false
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
    await Promise.all([store.fetchRequests(), groupsStore.fetchGroups()])
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load prayer requests' })
  } finally {
    loading.value = false
  }
})

// Lets a mid-tour step (see src/constants/tutorialSteps.js) switch into
// Manage mode without this component needing to know the tour exists —
// same pattern as SearchPage.vue's Filter modal watcher.
watch(
  () => tutorialStore.pendingAction,
  (action) => {
    if (action === 'open-prayers-manage') {
      viewMode.value = 'manage'
      tutorialStore.clearAction()
    }
  },
)
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
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  min-height: 56px;
}

.drag-handle-section {
  min-width: 0;
  padding-right: 4px;
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-muted);
}

.ghost-request {
  opacity: 0.4;
}

.ghost-group {
  opacity: 0.4;
}

.empty-group-drop {
  padding: 10px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
}

/* Each radio is wrapped in its own single-child <div> by QOptionGroup, so
   :last-child on .q-radio itself would match every option (each is the
   lone child of its own wrapper) — target the wrapper divs instead. */
.delete-group-options > :deep(div) {
  margin-bottom: 14px;
}

.delete-group-options > :deep(div:last-child) {
  margin-bottom: 0;
}

.quick-add-row {
  padding: 4px 4px 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.group-header {
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 4px;
}

.group-header:hover {
  background: var(--color-hover);
}

.group-drag-handle {
  cursor: grab;
  color: var(--color-text-muted);
}

.list-group-label {
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 20px;
  margin-bottom: 6px;
  padding: 2px;
  border-radius: 4px;
}

.list-group-label:hover {
  background: var(--color-hover);
}

.list-group-label:first-child {
  margin-top: 0;
}

.prayer-list-item {
  padding: 10px 2px;
  border-bottom: 1px solid var(--color-border-light);
  line-height: 1.6;
  font-size: 1rem;
}

.prayer-list-item:last-child {
  border-bottom: none;
}
</style>
