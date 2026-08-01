<template>
  <q-page class="q-pa-md">
    <div class="row justify-center q-col-gutter-md">
      <div class="col-12 content-card">
        <q-card class="garden-card">
          <q-tabs v-model="activeTab" dense class="text-grey" active-color="primary" indicator-color="primary"
            align="justify" narrow-indicator>
            <q-tab name="seeds" label="My Seeds" icon="eco" />
            <q-tab name="prayers" label="Prayers" icon="front_hand" />
            <q-tab name="testimony" label="My Testimony" icon="auto_stories" />
          </q-tabs>
          <q-separator />

          <q-tab-panels v-model="activeTab" animated class="bg-transparent">
            <q-tab-panel name="seeds" class="q-pa-none">
              <RecentEntries />
            </q-tab-panel>
            <q-tab-panel name="prayers">
              <PrayerRequests />
            </q-tab-panel>
            <q-tab-panel name="testimony">
              <TestimonyEditor />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecentEntries from 'src/components/RecentEntries.vue'
import PrayerRequests from 'src/components/PrayerRequests.vue'
import TestimonyEditor from 'src/components/TestimonyEditor.vue'

const route = useRoute()
const router = useRouter()

// Mirrored in the ?tab= query param so a refresh (or back/forward) lands
// back on the same tab instead of always resetting to My Seeds. 'seeds' is
// the default and left out of the URL to keep the plain homepage link tidy.
const VALID_TABS = ['seeds', 'prayers', 'testimony']

const activeTab = ref(VALID_TABS.includes(route.query.tab) ? route.query.tab : 'seeds')

watch(
  () => route.query.tab,
  (tab) => {
    const next = VALID_TABS.includes(tab) ? tab : 'seeds'
    if (next !== activeTab.value) activeTab.value = next
  },
)

watch(activeTab, (tab) => {
  if ((route.query.tab || 'seeds') === tab) return
  const query = { ...route.query }
  if (tab === 'seeds') delete query.tab
  else query.tab = tab
  router.replace({ query })
})
</script>

<style scoped>
.garden-card {
  backdrop-filter: blur(10px);
  background-color: var(--color-surface-translucent) !important;
  border-radius: 12px;
  overflow: hidden;
}

/* Make cards more compact on mobile */
@media (max-width: 599px) {
  .q-page {
    padding: 8px !important;
  }

  .garden-card {
    border-radius: 8px;
  }
}
</style>
