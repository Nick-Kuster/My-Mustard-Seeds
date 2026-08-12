<template>
  <q-footer v-if="$q.screen.lt.md" bordered class="bottom-nav-bar">
    <!-- Contextual mode: a page (e.g. the entry editor) has taken over the bar -->
    <div
      v-if="contextualActions"
      class="bottom-nav-actions"
      :style="{ gridTemplateColumns: `repeat(${contextualActions.length}, 1fr)` }"
    >
      <template v-for="action in contextualActions" :key="action.key">
        <button
          type="button"
          :class="['bottom-nav-action-btn', `text-${action.color}`]"
          :disabled="action.disabled?.value ?? false"
          :data-tour="action.tourKey"
          @click="action.handler()"
        >
          <q-spinner v-if="action.loading?.value ?? false" size="22px" />
          <q-icon v-else :name="action.icon" size="22px" />
          <span>{{ action.label }}</span>
        </button>
      </template>
    </div>

    <!-- Default mode: primary app navigation -->
    <div v-else class="bottom-nav-row">
      <router-link to="/" custom v-slot="{ navigate, isExactActive }">
        <button
          type="button"
          class="bottom-nav-item"
          data-tour="nav-home"
          :class="{ active: isExactActive && !route.query.tab }"
          @click="navigate"
        >
          <q-icon name="home" size="22px" />
          <span>Home</span>
        </button>
      </router-link>

      <router-link :to="{ path: '/', query: { tab: 'prayers' } }" custom v-slot="{ navigate }">
        <button
          type="button"
          class="bottom-nav-item"
          data-tour="nav-prayers"
          :class="{ active: route.path === '/' && route.query.tab === 'prayers' }"
          @click="navigate"
        >
          <q-icon name="front_hand" size="22px" />
          <span>Prayers</span>
        </button>
      </router-link>

      <div class="bottom-nav-fab-slot" aria-hidden="true" />

      <router-link to="/search" custom v-slot="{ navigate, isActive }">
        <button
          type="button"
          class="bottom-nav-item"
          data-tour="nav-search"
          :class="{ active: isActive }"
          @click="navigate"
        >
          <q-icon name="search" size="22px" />
          <span>Search</span>
        </button>
      </router-link>

      <router-link to="/settings" custom v-slot="{ navigate, isActive }">
        <button
          type="button"
          class="bottom-nav-item"
          data-tour="nav-settings"
          :class="{ active: isActive }"
          @click="navigate"
        >
          <q-icon name="settings" size="22px" />
          <span>Settings</span>
        </button>
      </router-link>
    </div>

    <q-btn
      v-if="!contextualActions"
      round
      unelevated
      color="primary"
      icon="agriculture"
      class="bottom-nav-fab"
      data-tour="nav-plant"
      aria-label="Quick add"
    >
      <q-menu anchor="top middle" self="bottom middle">
        <q-list style="min-width: 180px">
          <q-item clickable v-close-popup @click="router.push('/entry/new')">
            <q-item-section avatar>
              <q-icon name="eco" color="primary" />
            </q-item-section>
            <q-item-section>Plant Seed</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="openQuickPrayer">
            <q-item-section avatar>
              <q-icon name="front_hand" color="primary" />
            </q-item-section>
            <q-item-section>Add Prayer</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-dialog v-model="showQuickPrayerDialog">
      <q-card style="width: 92vw; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Add Prayer</div>
        </q-card-section>
        <q-card-section class="q-pt-none q-gutter-md">
          <q-input
            ref="quickPrayerInputRef"
            v-model="quickPrayerText"
            outlined
            autogrow
            type="textarea"
            label="Prayer"
            @keydown.ctrl.enter.prevent="saveQuickPrayer"
          />
          <q-select
            v-model="quickPrayerGroupValue"
            outlined
            clearable
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            behavior="menu"
            label="Group"
            :options="groupOptions"
            @input-value="quickPrayerGroupInput = $event"
            @new-value="createQuickPrayerGroupOption"
          />
          <q-checkbox v-model="quickPrayerReminderEnabled" label="Add reminder" />
          <div v-if="quickPrayerReminderEnabled" class="quick-prayer-reminder-grid">
            <q-input v-model="quickPrayerReminderDate" outlined dense type="date" label="Reminder date" />
            <q-select
              v-model="quickPrayerReminderHour"
              outlined
              dense
              emit-value
              map-options
              label="Hour"
              :options="reminderHourOptions"
              behavior="menu"
            />
            <q-select
              v-model="quickPrayerReminderMinute"
              outlined
              dense
              emit-value
              map-options
              label="Min"
              :options="reminderMinuteOptions"
              behavior="menu"
            />
            <q-select
              v-model="quickPrayerReminderPeriod"
              outlined
              dense
              emit-value
              map-options
              label="AM/PM"
              :options="reminderPeriodOptions"
              behavior="menu"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" icon="save" :loading="savingQuickPrayer"
            :disable="!quickPrayerText.trim()" @click="saveQuickPrayer" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-footer>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePageActionsStore } from 'stores/pageActions'
import { usePrayerRequestsStore } from 'stores/prayerRequests'
import { usePrayerRequestGroupsStore } from 'stores/prayerRequestGroups'
import { useSharedPrayerContextsStore } from 'stores/sharedPrayerContexts'
import { useSharedPrayerRequestsStore } from 'stores/sharedPrayerRequests'
import { useSharedPrayerRequestGroupsStore } from 'stores/sharedPrayerRequestGroups'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { footerActions: contextualActions } = storeToRefs(usePageActionsStore())
const prayerRequestsStore = usePrayerRequestsStore()
const prayerGroupsStore = usePrayerRequestGroupsStore()
const sharedPrayerContextsStore = useSharedPrayerContextsStore()
const sharedPrayerRequestsStore = useSharedPrayerRequestsStore()
const sharedPrayerGroupsStore = useSharedPrayerRequestGroupsStore()

const showQuickPrayerDialog = ref(false)
const quickPrayerInputRef = ref(null)
const quickPrayerText = ref('')
const quickPrayerGroupValue = ref(null)
const quickPrayerGroupInput = ref('')
const quickPrayerReminderEnabled = ref(false)
const quickPrayerReminderDate = ref('')
const quickPrayerReminderHour = ref('8')
const quickPrayerReminderMinute = ref('00')
const quickPrayerReminderPeriod = ref('AM')
const savingQuickPrayer = ref(false)
const isSharedPrayerContext = computed(() => !sharedPrayerContextsStore.isPersonalContext)
const activePrayerGroupsStore = computed(() =>
  isSharedPrayerContext.value ? sharedPrayerGroupsStore : prayerGroupsStore,
)

const dateInputValue = (date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 10)
}

const todayDate = () => dateInputValue(new Date())

const reminderHourOptions = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1)
  return { label: value, value }
})
const reminderMinuteOptions = [0, 15, 30, 45].map((minute) => {
  const value = String(minute).padStart(2, '0')
  return { label: `:${value}`, value }
})
const reminderPeriodOptions = ['AM', 'PM'].map((period) => ({ label: period, value: period }))

const combineReminderTime = (hour, minute, period) => {
  if (!hour || !minute || !period) return null
  let hourNumber = Number(hour)
  if (!Number.isFinite(hourNumber)) return null
  if (period === 'AM' && hourNumber === 12) hourNumber = 0
  if (period === 'PM' && hourNumber !== 12) hourNumber += 12
  return `${String(hourNumber).padStart(2, '0')}:${minute}`
}

const groupOptions = computed(() =>
  activePrayerGroupsStore.value.groups.map((group) => ({ label: group.name, value: group.id, group })),
)

const findGroupByName = (name) => {
  const normalizedName = name.trim().toLowerCase()
  return activePrayerGroupsStore.value.groups.find((group) => group.name.trim().toLowerCase() === normalizedName)
}

const resolveQuickPrayerGroupId = async () => {
  if (quickPrayerGroupValue.value?.value) return quickPrayerGroupValue.value.value

  const typedGroupName = quickPrayerGroupInput.value.trim()
  if (!typedGroupName) return null

  const existingGroup = findGroupByName(typedGroupName)
  if (existingGroup) return existingGroup.id

  const newGroup = await activePrayerGroupsStore.value.addGroup(typedGroupName)
  return newGroup.id
}

const openQuickPrayer = async () => {
  if (!activePrayerGroupsStore.value.groups.length) {
    try {
      await activePrayerGroupsStore.value.fetchGroups()
    } catch {
      // Group loading is optional; the prayer can still be saved to Miscellaneous.
    }
  }
  quickPrayerText.value = ''
  quickPrayerGroupValue.value = null
  quickPrayerGroupInput.value = ''
  quickPrayerReminderEnabled.value = false
  quickPrayerReminderDate.value = todayDate()
  quickPrayerReminderHour.value = '8'
  quickPrayerReminderMinute.value = '00'
  quickPrayerReminderPeriod.value = 'AM'
  showQuickPrayerDialog.value = true
  await nextTick()
  quickPrayerInputRef.value?.focus()
}

const createQuickPrayerGroupOption = async (inputValue, done) => {
  const groupName = inputValue.trim()
  if (!groupName) {
    done()
    return
  }

  const existingGroup = findGroupByName(groupName)
  if (existingGroup) {
    done({ label: existingGroup.name, value: existingGroup.id, group: existingGroup })
    return
  }

  try {
    const newGroup = await activePrayerGroupsStore.value.addGroup(groupName)
    done({ label: newGroup.name, value: newGroup.id, group: newGroup })
  } catch {
    done()
    $q.notify({ type: 'negative', message: 'Failed to add group' })
  }
}

const saveQuickPrayer = async () => {
  const text = quickPrayerText.value.trim()
  if (!text) return

  savingQuickPrayer.value = true
  try {
    const groupId = await resolveQuickPrayerGroupId()
    const targetStore = isSharedPrayerContext.value ? sharedPrayerRequestsStore : prayerRequestsStore
    await targetStore.addRequest(
      text,
      groupId,
      quickPrayerReminderEnabled.value ? quickPrayerReminderDate.value : null,
      quickPrayerReminderEnabled.value
        ? combineReminderTime(
          quickPrayerReminderHour.value,
          quickPrayerReminderMinute.value,
          quickPrayerReminderPeriod.value,
        )
        : null,
    )
    showQuickPrayerDialog.value = false
    $q.notify({ type: 'positive', message: 'Prayer added' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to add prayer' })
  } finally {
    savingQuickPrayer.value = false
  }
}
</script>

<style lang="scss" scoped>
.quick-prayer-reminder-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}

.quick-prayer-reminder-grid > :first-child {
  grid-column: 1 / -1;
}

.bottom-nav-bar {
  background: var(--color-surface);
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: stretch;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  padding: 6px 2px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.66rem;
  font-weight: 600;
  cursor: pointer;
}

.bottom-nav-item span {
  line-height: 1;
}

.bottom-nav-item.active {
  color: $primary;
}

.bottom-nav-fab-slot {
  min-height: 56px;
}

.bottom-nav-fab {
  position: absolute;
  left: 50%;
  top: -22px;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  box-shadow:
    0 2px 4px var(--color-shadow-strong),
    0 4px 10px var(--color-shadow-strong);
}

.bottom-nav-fab :deep(.q-icon) {
  font-size: 26px;
}

.bottom-nav-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
}

.bottom-nav-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: 56px;
  min-height: 56px;
  padding: 6px 2px;
  border: 0;
  background: transparent;
  font-size: 0.66rem;
  font-weight: 600;
  cursor: pointer;
}

.bottom-nav-action-btn span {
  line-height: 1;
}

.bottom-nav-action-btn:disabled {
  cursor: default;
  opacity: 0.55;
}
</style>
