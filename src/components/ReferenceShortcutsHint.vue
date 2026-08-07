<template>
  <button type="button" class="reference-shortcuts-hint" @click="showDialog = true">
    <q-icon name="tips_and_updates" size="16px" />
    <span>Reference shortcuts</span>
  </button>

  <q-dialog v-model="showDialog">
    <q-card class="reference-shortcuts-card">
      <q-card-section class="row items-center">
        <div class="text-h6">Reference Shortcuts</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list class="reference-shortcuts-list">
          <q-item class="reference-shortcuts-item">
            <q-item-section avatar>
              <q-icon name="tag" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Tags</q-item-label>
              <q-item-label caption>Type #hope to link a tag.</q-item-label>
            </q-item-section>
          </q-item>

          <q-item class="reference-shortcuts-item">
            <q-item-section avatar>
              <q-icon name="menu_book" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Bible passages</q-item-label>
              <q-item-label caption>Type ::John 3:16 to link a passage.</q-item-label>
            </q-item-section>
          </q-item>

          <q-item class="reference-shortcuts-item">
            <q-item-section avatar>
              <q-icon name="translate" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Strong's words</q-item-label>
              <q-item-label caption>
                Type $G25, a Greek or Hebrew transliteration like $agapao, or an English word like $love.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'

const showDialog = ref(false)
</script>

<style scoped>
.reference-shortcuts-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
}

.reference-shortcuts-card {
  width: min(92vw, 420px);
}

.reference-shortcuts-list {
  display: grid;
  gap: 10px;
}

.reference-shortcuts-item {
  padding: 10px 0;
}
</style>
