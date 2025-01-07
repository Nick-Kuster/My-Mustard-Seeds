<!-- EntryList.vue -->
<template>
  <div>
    <div v-if="loading" class="text-center">
      <q-spinner color="primary" size="2em" />
    </div>
    <div v-else-if="entries.length === 0" class="text-center text-grey">
      {{ emptyMessage }}
    </div>
    <q-list v-else bordered separator>
      <q-item v-for="entry in entries" :key="entry.id" clickable @click="viewEntry(entry.id)">
        <q-item-section>
          <q-item-label>{{ entry.title }}</q-item-label>
          <q-item-label caption>{{ formatDate(entry.created_at) }} • {{ entry.type }}</q-item-label>
          <q-item-label v-if="showPreview && entry.preview" caption class="text-body2">
            {{ entry.preview }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

defineProps({
  entries: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: 'No entries found.'
  },
  showPreview: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const viewEntry = (id) => {
  router.push(`/entry/${id}`)
}
</script>
