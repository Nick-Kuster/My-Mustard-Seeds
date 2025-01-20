<template>
  <q-page class="q-pa-md">
    <div class="row justify-center q-col-gutter-md">
      <div class="col-12 col-sm-8 col-md-6 col-lg-4">
        <!-- Using two separate cards for better visual hierarchy -->

        <!-- Plant a Seed Card -->
        <q-card class="q-mb-md garden-card">
          <div class="parchment q-pa-md">
            <div class="text-h5 text-center q-mb-md">My Garden</div>
            <q-btn rounded unelevated color="primary" class="full-width custom-button"
              @click="router.push('/entry/new')">
              <div class="row full-width items-center">
                <div class="col-auto" style="width: 40px">
                  <q-icon name="agriculture" />
                </div>
                <div class="col text-left">Plant a New Seed</div>
              </div>
            </q-btn>
          </div>
        </q-card>

        <!-- Content Card -->
        <q-card class="garden-card">
          <q-tabs v-model="tab" class="text-primary" active-color="primary" indicator-color="primary" align="justify"
            narrow-indicator>
            <q-tab name="recent" label="My Seeds" />
            <q-tab name="browse" label="Harvest Seeds" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated swipeable transition-prev="slide-right" transition-next="slide-left">
            <q-tab-panel name="recent" class="q-pa-md">
              <RecentEntries />
            </q-tab-panel>
            <q-tab-panel name="browse" class="q-pa-md">
              <BrowseContent />
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RecentEntries from 'src/components/RecentEntries.vue'
import BrowseContent from 'src/components/BrowseContent.vue'

const router = useRouter()
const tab = ref('recent')
</script>

<style scoped>
.custom-button {
  height: 40px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.1);
}

.garden-card {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.9) !important;
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
