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
          :class="{ active: isExactActive }"
          @click="navigate"
        >
          <q-icon name="home" size="22px" />
          <span>Home</span>
        </button>
      </router-link>

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

      <div class="bottom-nav-fab-slot" aria-hidden="true" />

      <router-link to="/resources" custom v-slot="{ navigate, isActive }">
        <button
          type="button"
          class="bottom-nav-item"
          data-tour="nav-resources"
          :class="{ active: isActive }"
          @click="navigate"
        >
          <q-icon name="inventory_2" size="22px" />
          <span>Resources</span>
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
      aria-label="Plant a New Seed"
      @click="router.push('/entry/new')"
    />
  </q-footer>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { usePageActionsStore } from 'stores/pageActions'

const router = useRouter()
const { footerActions: contextualActions } = storeToRefs(usePageActionsStore())
</script>

<style lang="scss" scoped>
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
