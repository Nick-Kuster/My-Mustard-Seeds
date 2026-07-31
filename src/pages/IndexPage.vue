<template>
  <q-page class="q-pa-md">
    <div class="row justify-center q-col-gutter-md">
      <div class="col-12 content-card">
        <q-card class="garden-card">
          <RecentEntries />
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import RecentEntries from 'src/components/RecentEntries.vue'
</script>

<style scoped>
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
