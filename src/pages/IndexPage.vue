<template>
  <q-page class="q-pa-md">
    <div class="row justify-center q-col-gutter-md">
      <div class="col-12 col-sm-8 col-md-6 col-lg-4">
        <!-- Main action buttons -->
        <div class="row q-col-gutter-y-md justify-center q-mb-lg">
          <div class="col-12">
            <q-btn rounded unelevated color="primary" class="full-width custom-button"
              @click="router.push('/entry/new')">
              <div class="row full-width items-center">
                <div class="col-auto" style="width: 40px">
                  <q-icon name="agriculture" />
                </div>
                <div class="col text-left">Plant a Seed</div>
              </div>
            </q-btn>
          </div>
        </div>

        <!-- Tabs Container -->
        <q-card flat bordered>
          <q-tabs v-model="tab" dense class="text-grey" active-color="primary" indicator-color="primary" align="justify"
            narrow-indicator>
            <q-tab name="recent" label="Recent Seeds" />
            <q-tab name="browse" label="Harvest Seeds" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated swipeable transition-prev="slide-right" transition-next="slide-left">
            <q-tab-panel name="recent">
              <RecentEntries />
            </q-tab-panel>

            <q-tab-panel name="browse">
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
</style>
