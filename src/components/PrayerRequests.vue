<template>
  <div class="prayer-requests">
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="2em" />
    </div>

    <AppEmptyState
      v-else-if="requests.length === 0 && groupsStore.groups.length === 0 && !addingGroup"
      icon="front_hand"
      title="Start a prayer list"
      message="Keep the people and needs you are praying over in one place, then mark answers as they come."
      primary-label="New Group"
      primary-icon="create_new_folder"
      @primary="startAddGroup"
    />

    <template v-else>
      <div class="prayer-section-header" data-tour="prayer-groups-area">
        <div class="text-subtitle2 text-weight-bold text-grey-8 prayer-section-title">
          Active Prayers ({{ active.length }})
        </div>
        <div class="prayer-toolbar">
          <q-btn
            dense
            unelevated
            text-color="primary"
            icon="event_note"
            :label="followUpsCountLabel"
            size="sm"
            class="prayer-toolbar-btn prayer-toolbar-btn--secondary"
            aria-label="Follow-ups"
            data-tour="prayer-followups"
            @click="showFollowUpsDialog = true"
          >
            <q-tooltip>{{ followUpsTooltip }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="!addingGroup"
            dense
            unelevated
            text-color="primary"
            icon="create_new_folder"
            size="sm"
            class="prayer-toolbar-btn prayer-toolbar-btn--secondary"
            aria-label="New group"
            @click="startAddGroup"
          >
            <q-tooltip>New group</q-tooltip>
          </q-btn>
          <q-btn
            v-if="groupSections.length > 1"
            dense
            unelevated
            text-color="primary"
            icon="swap_vert"
            size="sm"
            class="prayer-toolbar-btn prayer-toolbar-btn--secondary"
            aria-label="Reorder groups"
            @click="showReorderGroupsDialog = true"
          >
            <q-tooltip>Reorder groups</q-tooltip>
          </q-btn>
        </div>
      </div>

      <div v-if="addingGroup" class="new-group-row row items-center no-wrap q-mb-md">
        <q-input
          ref="newGroupInputRef"
          v-model="newGroupSectionName"
          dense
          outlined
          placeholder="Group name"
          class="col"
          @keyup.enter="confirmNewGroupSection"
        />
        <q-btn
          flat
          round
          dense
          icon="check"
          color="primary"
          :loading="savingNewGroup"
          :disable="!newGroupSectionName.trim()"
          @click="confirmNewGroupSection"
        />
        <q-btn flat round dense icon="close" @click="cancelAddGroup" />
      </div>

      <AppEmptyState
        v-if="active.length === 0 && groupSections.length === 0"
        compact
        icon="check_circle"
        title="No active prayers right now"
        message="Answered prayers stay below. Add a prayer under any group when you are ready."
      />

      <div v-else>
        <template v-for="section in allSectionsForDisplay" :key="section.key ?? 'misc'">
          <div class="prayer-group">
            <div
              class="list-group-label row items-center no-wrap"
              :class="{ 'list-group-label--empty': section.items.length === 0 }"
              @click="toggleGroupCollapse(section)"
            >
              <q-icon
                v-if="section.items.length > 0"
                :name="isGroupCollapsed(section.key) ? 'chevron_right' : 'expand_more'"
                size="16px"
                class="q-mr-xs"
              />
              <span v-else class="empty-group-indicator q-mr-xs" aria-hidden="true"></span>

              <template v-if="editingGroupKey === section.key">
                <q-input
                  :ref="(el) => setEditGroupInputRef(section, el)"
                  v-model="editGroupName"
                  dense
                  outlined
                  class="col"
                  style="max-width: 220px"
                  @click.stop
                  @keyup.enter="confirmEditGroup(section)"
                  @keyup.esc="cancelEditGroup"
                />
                <q-btn flat round dense icon="check" color="primary" size="sm" :loading="savingGroupEdit"
                  :disable="!editGroupName.trim()" @click.stop="confirmEditGroup(section)" />
                <q-btn flat round dense icon="close" size="sm" @click.stop="cancelEditGroup" />
              </template>

              <template v-else>
                <span class="list-group-title">{{ section.label }}</span>
                <span class="list-group-count">{{ section.items.length }}</span>
                <q-space />
                <q-btn
                  flat
                  round
                  dense
                  icon="add"
                  size="sm"
                  color="primary"
                  :data-tour="section.key ? undefined : 'prayer-quick-add'"
                  @click.stop="openAddPrayer(section)"
                >
                  <q-tooltip>Add prayer</q-tooltip>
                </q-btn>
                <template v-if="section.key">
                  <q-btn flat round dense icon="edit" size="sm" @click.stop="startEditGroup(section)">
                    <q-tooltip>Rename group</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="delete" size="sm" color="negative" @click.stop="openDeleteGroup(section)">
                    <q-tooltip>Delete group</q-tooltip>
                  </q-btn>
                </template>
              </template>
            </div>

            <template v-if="!isGroupCollapsed(section.key) || isAddingPrayerTo(section)">
              <ul class="prayer-bullet-list">
                <li v-for="request in section.items" :key="request.id" class="prayer-list-item" @click="openDetails(request)">
                  <span class="prayer-list-text">{{ request.decryptedContent }}</span>
                  <span v-if="request.follow_up_date" class="prayer-list-meta">
                    Follow up {{ formatFollowUpDateTime(request) }}
                  </span>
                </li>
                <li v-if="isAddingPrayerTo(section)" class="prayer-list-item prayer-list-item--new">
                  <q-input
                    :ref="setAddPrayerInputRef"
                    v-model="addPrayerText"
                    dense
                    borderless
                    autogrow
                    type="textarea"
                    placeholder="Add a prayer"
                    class="new-prayer-input"
                    @click.stop
                    @keydown.enter.exact.prevent="confirmAddPrayer"
                    @keyup.esc="cancelAddPrayer"
                  />
                  <div class="new-prayer-actions">
                    <q-btn
                      flat
                      round
                      dense
                      icon="check"
                      color="primary"
                      size="sm"
                      :loading="addingPrayer"
                      :disable="!addPrayerText.trim()"
                      @click.stop="confirmAddPrayer"
                    >
                      <q-tooltip>Save prayer</q-tooltip>
                    </q-btn>
                    <q-btn flat round dense icon="close" size="sm" @click.stop="cancelAddPrayer">
                      <q-tooltip>Cancel</q-tooltip>
                    </q-btn>
                  </div>
                </li>
              </ul>
            </template>
          </div>
        </template>
      </div>

      <q-expansion-item
        v-if="answered.length > 0"
        label="Answered"
        :caption="`${answered.length} answered`"
        header-class="text-weight-bold"
        class="rounded-borders bg-white answered-section q-mt-md"
        data-tour="prayer-answered-section"
      >
        <q-list separator>
          <q-item v-for="request in answered" :key="request.id" clickable dense @click="openDetails(request)">
            <q-item-section>
              <q-item-label class="text-wrap answered-content text-grey-7">{{ request.decryptedContent }}</q-item-label>
              <q-item-label v-if="request.decryptedAnswerNote" caption class="text-wrap">
                {{ request.decryptedAnswerNote }}
              </q-item-label>
              <q-item-label caption>Answered {{ formatDate(request.answered_at) }}</q-item-label>
            </q-item-section>
            <q-item-section side class="compact-actions-section">
              <div class="compact-action-row">
                <q-btn flat round dense size="sm" icon="undo" @click.stop="reopen(request)">
                  <q-tooltip>Reopen</q-tooltip>
                </q-btn>
                <q-btn flat round dense size="sm" icon="delete" color="negative" @click.stop="openDelete(request)">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-expansion-item>
    </template>

    <q-dialog v-model="showAnswerDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Mark as Answered</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="answerNote" type="textarea" autogrow outlined label="How did God answer? (optional)" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="positive" label="Mark Answered" :loading="answering" @click="confirmAnswer" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showReorderGroupsDialog">
      <q-card style="width: 90vw; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Reorder Groups</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <draggable
            v-model="groupSections"
            item-key="key"
            handle=".group-reorder-handle"
            ghost-class="ghost-group"
            @end="persistGroupOrder"
          >
            <template #item="{ element: section }">
              <div class="reorder-group-row row items-center no-wrap">
                <q-icon name="drag_indicator" class="group-reorder-handle q-mr-sm" />
                <span class="text-body2 text-weight-medium">{{ section.label }}</span>
                <q-space />
                <span class="text-caption text-grey-7">{{ section.items.length }}</span>
              </div>
            </template>
          </draggable>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Done" :loading="savingGroupOrder" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showFollowUpsDialog">
      <q-card style="width: 94vw; max-width: 520px">
        <q-card-section class="row items-center q-pb-none">
          <div>
            <div class="text-h6">Follow-Ups</div>
            <div class="text-caption text-grey-7">{{ followUps.length }} due or coming soon</div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <AppEmptyState
            v-if="followUps.length === 0"
            compact
            icon="event_available"
            title="No follow-ups due"
            message="Set a follow-up date on any prayer when you want it to come back to your attention."
          />

          <q-list v-else separator dense>
            <q-item
              v-for="request in followUps"
              :key="request.id"
              clickable
              dense
              class="follow-up-item"
              data-tour="prayer-followup-item"
              @click="openDetailsFromFollowUps(request)"
            >
              <q-item-section>
                <q-item-label class="text-wrap">{{ request.decryptedContent }}</q-item-label>
                <q-item-label caption :class="followUpStatusClass(request)">
                  {{ followUpStatusLabel(request) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side class="compact-actions-section">
                <div class="compact-action-row">
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="done"
                    color="positive"
                    :loading="followingUpId === request.id"
                    @click.stop="markPrayed(request)"
                  >
                    <q-tooltip>Prayed today</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    size="sm"
                    icon="update"
                    :loading="snoozingId === request.id"
                    @click.stop="snooze(request)"
                  >
                    <q-tooltip>Snooze one week</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense size="sm" icon="event" data-tour="prayer-followup-date" @click.stop="openFollowUpFromFollowUps(request)">
                    <q-tooltip>Reschedule follow-up</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense size="sm" icon="check_circle" color="positive" data-tour="prayer-mark-answered" @click.stop="openAnswerFromFollowUps(request)">
                    <q-tooltip>Mark answered</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showFollowUpDialog">
      <q-card style="width: 90vw; max-width: 360px">
        <q-card-section>
          <div class="text-h6">Prayer Follow-Up</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="text-body2 text-grey-8 q-mb-md text-wrap">
            {{ followUpRequest?.decryptedContent }}
          </div>
            <div class="row q-col-gutter-sm">
              <div class="col-7">
                <q-input v-model="followUpDate" outlined dense type="date" label="Follow up on" />
              </div>
              <div class="col-5">
                <q-select
                  v-model="followUpTime"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  label="Reminder"
                  :options="quarterHourOptions"
                />
              </div>
            </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-if="followUpRequest?.follow_up_date" flat label="Clear" :loading="savingFollowUp" @click="clearFollowUp" />
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="savingFollowUp" @click="saveFollowUp" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showDetailsDialog">
      <q-card class="prayer-details-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Prayer Details</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section v-if="detailsRequest" class="q-gutter-md">
          <q-input v-model="detailsContent" outlined type="textarea" autogrow label="Prayer" />

          <div class="details-grid">
            <div>
              <div class="text-caption text-grey-7">Group</div>
              <div class="text-body2">{{ groupLabel(detailsRequest) }}</div>
            </div>
            <div>
              <div class="text-caption text-grey-7">Created</div>
              <div class="text-body2">{{ formatDate(detailsRequest.created_at) }}</div>
            </div>
            <div v-if="detailsRequest.last_followed_up_at">
              <div class="text-caption text-grey-7">Last Followed Up</div>
              <div class="text-body2">{{ formatDate(detailsRequest.last_followed_up_at) }}</div>
            </div>
            <div v-if="detailsRequest.status === 'answered'">
              <div class="text-caption text-grey-7">Answered</div>
              <div class="text-body2">{{ formatDate(detailsRequest.answered_at) }}</div>
            </div>
          </div>

          <div>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Follow-Up</div>
            <div class="row q-col-gutter-sm">
              <div class="col-7">
                <q-input v-model="detailsFollowUpDate" outlined dense type="date" label="Date" />
              </div>
              <div class="col-5">
                <q-select
                  v-model="detailsFollowUpTime"
                  outlined
                  dense
                  clearable
                  emit-value
                  map-options
                  label="Reminder"
                  :options="quarterHourOptions"
                />
              </div>
            </div>
          </div>

          <q-input
            v-if="detailsRequest.status !== 'answered'"
            v-model="detailsAnswerNote"
            outlined
            type="textarea"
            autogrow
            label="How did God answer? (optional)"
          />
          <div v-else-if="detailsRequest.decryptedAnswerNote" class="answer-note">
            <div class="text-caption text-grey-7">Answer Note</div>
            <div class="text-body2 text-wrap">{{ detailsRequest.decryptedAnswerNote }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="between" class="prayer-details-actions">
          <q-btn flat color="negative" icon="delete" label="Delete" :loading="detailsSaving" @click="deleteFromDetails" />
          <div class="row q-gutter-sm">
            <q-btn
              v-if="detailsRequest?.status !== 'answered'"
              outline
              color="positive"
              icon="check_circle"
              label="Answered"
              :loading="detailsSaving"
              @click="answerFromDetails"
            />
            <q-btn color="primary" icon="save" label="Save" :loading="detailsSaving" @click="saveDetails" />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

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
            <q-option-group v-model="deleteGroupMode" dense class="delete-group-options" :options="deleteGroupOptions" />
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { usePrayerRequestsStore } from 'stores/prayerRequests'
import { usePrayerRequestGroupsStore } from 'stores/prayerRequestGroups'
import AppEmptyState from './AppEmptyState.vue'

const $q = useQuasar()
const store = usePrayerRequestsStore()
const groupsStore = usePrayerRequestGroupsStore()
const MISC_KEY = '__misc__'
const NO_EDIT_GROUP_KEY = '__none__'

const loading = ref(true)
const requests = computed(() => store.requests)
const active = computed(() => requests.value.filter((r) => r.status !== 'answered'))
const answered = computed(() => requests.value.filter((r) => r.status === 'answered'))
const groupSections = ref([])
const miscItems = ref([])
const collapsedGroups = reactive(new Set())
const collapseSeededGroups = reactive(new Set())

const allSectionsForDisplay = computed(() => {
  const sections = [...groupSections.value]
  if (miscItems.value.length > 0) {
    sections.push({ key: null, mapKey: MISC_KEY, label: 'Miscellaneous', items: miscItems.value })
  }
  return sections
})

const deleteGroupOptions = computed(() => [
  { label: 'Delete this group only - prayers move to Miscellaneous', value: 'orphan' },
  { label: `Delete this group and all ${deletingGroupSection.value?.items.length || 0} prayers`, value: 'cascade' },
])

const dateInputValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

const todayDate = () => dateInputValue(new Date())

const daysFromToday = (dateString) => {
  const today = new Date(todayDate())
  const date = new Date(dateString)
  return Math.round((date - today) / 86400000)
}

const followUps = computed(() =>
  active.value
    .filter((request) => request.follow_up_date && daysFromToday(request.follow_up_date) <= 7)
    .sort((a, b) =>
      new Date(`${a.follow_up_date}T${a.follow_up_time || '00:00'}`) -
      new Date(`${b.follow_up_date}T${b.follow_up_time || '00:00'}`),
    ),
)
const followUpsCountLabel = computed(() => (followUps.value.length > 0 ? String(followUps.value.length) : undefined))
const followUpsTooltip = computed(() =>
  followUps.value.length > 0 ? `${followUps.value.length} follow-up${followUps.value.length === 1 ? '' : 's'}` : 'Follow-ups',
)
const showFollowUpsDialog = ref(false)

const isGroupCollapsed = (key) => collapsedGroups.has(key)

const collapseNewSections = (sections, includeMisc) => {
  sections.forEach((section) => {
    if (
      section.items.length > 0 &&
      !collapseSeededGroups.has(section.key) &&
      addPrayerSection.value?.mapKey !== section.mapKey
    ) {
      collapsedGroups.add(section.key)
      collapseSeededGroups.add(section.key)
    }
  })
  if (includeMisc && !collapseSeededGroups.has(null) && addPrayerSection.value?.mapKey !== MISC_KEY) {
    collapsedGroups.add(null)
    collapseSeededGroups.add(null)
  }
}

const toggleGroupCollapse = (section) => {
  if (section.items.length === 0) return
  const key = section.key
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
    .map((group) => ({
      key: group.id,
      mapKey: group.id,
      label: group.name,
      items: byGroupId.get(group.id) || [],
    }))

  miscItems.value = misc
  collapseNewSections(groupSections.value, misc.length > 0)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatFollowUpDate = (dateString) => formatDate(`${dateString}T00:00:00`)

const formatFollowUpTime = (timeString) => {
  if (!timeString) return ''
  const [hour, minute] = timeString.split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute || 0), 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const quarterHourOptions = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return { label: formatFollowUpTime(value), value }
})

const normalizeQuarterHour = (timeString) => {
  if (!timeString) return ''
  const [rawHour, rawMinute = '0'] = timeString.split(':')
  let hour = Number(rawHour)
  const minute = Number(rawMinute)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return ''

  let roundedMinute = Math.round(minute / 15) * 15
  if (roundedMinute === 60) {
    roundedMinute = 0
    hour = (hour + 1) % 24
  }

  return `${String(hour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}`
}

const formatFollowUpDateTime = (request) => {
  const date = formatFollowUpDate(request.follow_up_date)
  const time = formatFollowUpTime(request.follow_up_time)
  return [date, time].filter(Boolean).join(' at ')
}

const groupLabel = (request) => {
  if (!request?.group_id) return 'Miscellaneous'
  return groupsStore.groups.find((group) => group.id === request.group_id)?.name || 'Unknown group'
}

const followUpStatusLabel = (request) => {
  const diff = daysFromToday(request.follow_up_date)
  const time = formatFollowUpTime(request.follow_up_time)
  const suffix = time ? ` at ${time}` : ''
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}${suffix}`
  if (diff === 0) return `Due today${suffix}`
  if (diff === 1) return `Due tomorrow${suffix}`
  return `Due in ${diff} days${suffix}`
}

const followUpStatusClass = (request) => {
  const diff = daysFromToday(request.follow_up_date)
  if (diff < 0) return 'text-negative text-weight-medium'
  if (diff === 0) return 'text-warning text-weight-medium'
  return 'text-grey-7'
}

const addPrayerInputRef = ref(null)
const addPrayerSection = ref(null)
const addPrayerText = ref('')
const addingPrayer = ref(false)
const showReorderGroupsDialog = ref(false)
const savingGroupOrder = ref(false)

const isAddingPrayerTo = (section) => addPrayerSection.value?.mapKey === section.mapKey

const setAddPrayerInputRef = (el) => {
  addPrayerInputRef.value = el
}

const openAddPrayer = async (section) => {
  addPrayerSection.value = section
  addPrayerText.value = ''
  collapsedGroups.delete(section.key)
  await nextTick()
  addPrayerInputRef.value?.focus()
}

const confirmAddPrayer = async () => {
  const text = addPrayerText.value.trim()
  const section = addPrayerSection.value
  if (!text || !section) return

  addingPrayer.value = true
  try {
    await store.addRequest(text, section.key)
    addPrayerText.value = ''
    syncGroups()
    addPrayerSection.value = allSectionsForDisplay.value.find((item) => item.mapKey === section.mapKey) || section
    await nextTick()
    addPrayerInputRef.value?.focus()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to add prayer request' })
  } finally {
    addingPrayer.value = false
  }
}

const cancelAddPrayer = () => {
  addPrayerSection.value = null
  addPrayerText.value = ''
}

const persistGroupOrder = async () => {
  savingGroupOrder.value = true
  try {
    await groupsStore.reorderGroups(groupSections.value.map((section) => section.key))
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save group order' })
    syncGroups()
  } finally {
    savingGroupOrder.value = false
  }
}

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

const editingGroupKey = ref(NO_EDIT_GROUP_KEY)
const editGroupName = ref('')
const editGroupInputEl = ref(null)
const savingGroupEdit = ref(false)

const setEditGroupInputRef = (section, el) => {
  if (editingGroupKey.value === section.key) editGroupInputEl.value = el
}

const startEditGroup = async (section) => {
  if (!section.key) return
  editingGroupKey.value = section.key
  editGroupName.value = section.label
  await nextTick()
  editGroupInputEl.value?.focus()
}

const cancelEditGroup = () => {
  editingGroupKey.value = NO_EDIT_GROUP_KEY
  editGroupName.value = ''
}

const confirmEditGroup = async (section) => {
  if (!section.key) return
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
  if (!section) return

  deletingGroup.value = true
  try {
    if (deleteGroupMode.value === 'cascade') {
      await Promise.all(section.items.map((request) => store.deleteRequest(request.id)))
      await groupsStore.deleteGroup(section.key)
    } else {
      await groupsStore.deleteGroup(section.key)
      section.items.forEach((request) => {
        const cached = store.requests.find((item) => item.id === request.id)
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

const openAnswerFromFollowUps = (request) => {
  showFollowUpsDialog.value = false
  openAnswer(request)
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

const showFollowUpDialog = ref(false)
const savingFollowUp = ref(false)
const followUpDate = ref('')
const followUpTime = ref('')
const followUpRequest = ref(null)
const followingUpId = ref(null)
const snoozingId = ref(null)

const openFollowUp = (request) => {
  followUpRequest.value = request
  followUpDate.value = request.follow_up_date || todayDate()
  followUpTime.value = normalizeQuarterHour(request.follow_up_time?.slice(0, 5))
  showFollowUpDialog.value = true
}

const openFollowUpFromFollowUps = (request) => {
  showFollowUpsDialog.value = false
  openFollowUp(request)
}

const saveFollowUp = async () => {
  savingFollowUp.value = true
  try {
    await store.updateFollowUp(followUpRequest.value.id, followUpDate.value, normalizeQuarterHour(followUpTime.value))
    showFollowUpDialog.value = false
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save follow-up date' })
  } finally {
    savingFollowUp.value = false
  }
}

const clearFollowUp = async () => {
  savingFollowUp.value = true
  try {
    await store.updateFollowUp(followUpRequest.value.id, null, null)
    showFollowUpDialog.value = false
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to clear follow-up date' })
  } finally {
    savingFollowUp.value = false
  }
}

const markPrayed = async (request) => {
  followingUpId.value = request.id
  try {
    await store.markFollowedUp(request.id)
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update follow-up' })
  } finally {
    followingUpId.value = null
  }
}

const snooze = async (request) => {
  snoozingId.value = request.id
  try {
    await store.snoozeFollowUp(request.id, 7, normalizeQuarterHour(request.follow_up_time?.slice(0, 5)) || null)
    syncGroups()
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to snooze follow-up' })
  } finally {
    snoozingId.value = null
  }
}

const showDetailsDialog = ref(false)
const detailsRequest = ref(null)
const detailsContent = ref('')
const detailsFollowUpDate = ref('')
const detailsFollowUpTime = ref('')
const detailsAnswerNote = ref('')
const detailsSaving = ref(false)

const openDetails = (request) => {
  detailsRequest.value = request
  detailsContent.value = request.decryptedContent || ''
  detailsFollowUpDate.value = request.follow_up_date || ''
  detailsFollowUpTime.value = normalizeQuarterHour(request.follow_up_time?.slice(0, 5))
  detailsAnswerNote.value = ''
  showDetailsDialog.value = true
}

const openDetailsFromFollowUps = (request) => {
  showFollowUpsDialog.value = false
  openDetails(request)
}

const refreshDetailsRequest = () => {
  if (!detailsRequest.value) return
  detailsRequest.value = store.requests.find((request) => request.id === detailsRequest.value.id) || detailsRequest.value
}

const saveDetails = async () => {
  const request = detailsRequest.value
  const content = detailsContent.value.trim()
  if (!request || !content) return

  detailsSaving.value = true
  try {
    if (content !== request.decryptedContent) {
      await store.updateContent(request.id, content)
    }
    await store.updateFollowUp(request.id, detailsFollowUpDate.value || null, normalizeQuarterHour(detailsFollowUpTime.value) || null)
    syncGroups()
    refreshDetailsRequest()
    showDetailsDialog.value = false
    $q.notify({ type: 'positive', message: 'Prayer updated' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update prayer' })
  } finally {
    detailsSaving.value = false
  }
}

const answerFromDetails = async () => {
  if (!detailsRequest.value) return

  detailsSaving.value = true
  try {
    const content = detailsContent.value.trim()
    if (content && content !== detailsRequest.value.decryptedContent) {
      await store.updateContent(detailsRequest.value.id, content)
    }
    await store.markAnswered(detailsRequest.value.id, detailsAnswerNote.value.trim())
    syncGroups()
    showDetailsDialog.value = false
    $q.notify({ type: 'positive', message: 'Prayer marked answered' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to mark as answered' })
  } finally {
    detailsSaving.value = false
  }
}

const deleteFromDetails = () => {
  deletingRequest.value = detailsRequest.value
  showDetailsDialog.value = false
  showDeleteDialog.value = true
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

.follow-up-item :deep(.q-item__label--caption) {
  font-size: 0.72rem;
  line-height: 1.2;
}

.follow-up-item {
  min-height: 42px;
  padding: 4px 8px;
}

.follow-up-item :deep(.q-item__label) {
  line-height: 1.25;
}

.compact-actions-section {
  padding-left: 4px;
}

.compact-action-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 2px;
}

.compact-action-row :deep(.q-btn) {
  min-height: 28px;
  min-width: 28px;
}

.prayer-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.prayer-section-title {
  flex: 0 0 auto;
}

.prayer-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.prayer-toolbar-btn {
  min-width: 32px;
  min-height: 32px;
  padding: 0 8px;
  font-weight: 800;
}

.prayer-toolbar-btn :deep(.q-btn__content) {
  column-gap: 5px;
  line-height: 1;
}

.prayer-toolbar-btn--secondary {
  background: transparent;
}

.prayer-toolbar-btn--secondary:hover {
  background: var(--color-surface-muted);
}

.delete-group-options > :deep(div) {
  margin-bottom: 14px;
}

.delete-group-options > :deep(div:last-child) {
  margin-bottom: 0;
}

.new-group-row {
  padding: 1px 2px 1px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.reorder-group-row {
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  margin-bottom: 8px;
}

.group-reorder-handle {
  cursor: grab;
  color: var(--color-text-muted);
}

.ghost-group {
  opacity: 0.45;
}

.prayer-group {
  margin-bottom: 10px;
}

.list-group-label {
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0;
  margin-top: 16px;
  margin-bottom: 4px;
  padding: 3px 2px;
  border-radius: 4px;
  color: var(--color-text);
}

.list-group-label:hover {
  background: var(--color-hover);
}

.list-group-label--empty {
  cursor: default;
}

.list-group-label--empty:hover {
  background: transparent;
}

.empty-group-indicator {
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.empty-group-indicator::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-text-muted);
  opacity: 0.65;
}

.prayer-group:first-child .list-group-label {
  margin-top: 0;
}

.list-group-title {
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.list-group-count {
  margin-left: 6px;
  color: var(--color-text-muted);
  font-size: 0.74rem;
  font-weight: 800;
}

.prayer-bullet-list {
  margin: 2px 0 6px 18px;
  padding-left: 24px;
  border-left: 1px solid var(--color-border-light);
}

.prayer-list-item {
  padding: 3px 2px 4px 2px;
  border-bottom: none;
  line-height: 1.4;
  font-size: 0.93rem;
  cursor: pointer;
  border-radius: 4px;
}

.prayer-list-item::marker {
  color: var(--color-text-muted);
}

.prayer-list-item:hover {
  background: var(--color-hover);
}

.prayer-list-item--new {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding-top: 0;
  padding-bottom: 0;
  cursor: default;
}

.prayer-list-item--new:hover {
  background: transparent;
}

.new-prayer-input {
  flex: 1 1 auto;
  min-width: 0;
}

.new-prayer-input :deep(.q-field__control) {
  min-height: 30px;
  padding: 0;
}

.new-prayer-input :deep(.q-field__native),
.new-prayer-input :deep(.q-field__input) {
  min-height: 30px;
  padding: 3px 0;
  line-height: 1.4;
  font-size: 0.93rem;
}

.new-prayer-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 1px;
  padding-top: 1px;
}

.prayer-list-text {
  display: inline;
}

.prayer-list-meta {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.25;
}

.prayer-details-card {
  width: 92vw;
  max-width: 520px;
}

.prayer-details-actions {
  padding: 8px 16px 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.answer-note {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-alt);
}

@media (max-width: 599px) {
  .prayer-section-header {
    gap: 6px;
  }

  .prayer-toolbar {
    justify-content: flex-end;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
