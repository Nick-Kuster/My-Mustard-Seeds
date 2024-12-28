<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-sm-6 col-md-4">
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
          <div class="col-12">
            <q-btn rounded unelevated color="secondary" class="full-width custom-button"
              @click="router.push('/search')">
              <div class="row full-width items-center">
                <div class="col-auto" style="width: 40px">
                  <q-icon name="yard" />
                </div>
                <div class="col text-left">Search My Seeds</div>
              </div>
            </q-btn>
          </div>
        </div>

        <!-- Recent entries section -->
        <RecentEntries />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import RecentEntries from 'components/RecentEntries.vue'

const router = useRouter()
</script>

<style scoped>
.custom-button {
  height: 40px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
