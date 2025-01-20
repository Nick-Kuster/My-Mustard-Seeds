<template>
  <div class="drawer-container">
    <!-- Backdrop overlay -->
    <div v-if="modelValue && !$q.platform.is.mobile" class="fullscreen backdrop"
      @click="$emit('update:modelValue', false)" />
    <!-- Floating close button -->
    <q-btn v-if="modelValue" round color="white" text-color="black" icon="close" size="md"
      :class="['floating-close', { 'mobile-close': $q.platform.is.mobile }]"
      @click="$emit('update:modelValue', false)" />
    <q-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" overlay elevated
      :width="325" class="bg-white drawer-content" :behavior="$q.platform.is.mobile ? 'mobile' : 'desktop'">
      <q-scroll-area class="fit">
        <div class="drawer-inner-content">
          <!-- Main Navigation Items -->
          <q-list>
            <q-item clickable v-ripple to="/" exact>
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>Home</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/entry/new">
              <q-item-section avatar>
                <q-icon name="agriculture" />
              </q-item-section>
              <q-item-section>Plant a Seed</q-item-section>
            </q-item>
            <q-separator spaced />
          </q-list>
          <BrowseContent />
        </div>
      </q-scroll-area>
    </q-drawer>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import BrowseContent from './BrowseContent.vue'
const $q = useQuasar()
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})
</script>

<style>
.backdrop {
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  pointer-events: auto;
}

.floating-close {
  position: fixed;
  left: 350px !important;
  /* drawer width (250px) + 16px margin */
  top: 16px;
  z-index: 3000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  pointer-events: all;
}

.mobile-close {
  left: initial;
  right: 16px;
  background-color: white !important;
  opacity: 1 !important;
}

.drawer-content {
  z-index: 2001;
}

.drawer-inner-content {
  padding: 16px;
}

/* Apply consistent left padding to all q-items in the drawer */
.drawer-inner-content .q-item {
  padding-left: 16px;
  padding-right: 16px;
}

/* Ensure separators align with content */
.drawer-inner-content .q-separator {
  margin-left: 16px;
  margin-right: 16px;
}
</style>
