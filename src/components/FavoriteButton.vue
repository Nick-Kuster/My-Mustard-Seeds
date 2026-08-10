<template>
  <q-btn
    flat round dense
    :color="entry?.is_favorite ? 'warning' : 'grey-6'"
    :icon="entry?.is_favorite ? 'star' : 'star_border'"
    :loading="saving"
    :aria-label="entry?.is_favorite ? 'Remove from favorites' : 'Add to favorites'"
    @click.stop.prevent="toggleFavorite"
  >
    <q-tooltip>{{ entry?.is_favorite ? 'Remove from favorites' : 'Add to favorites' }}</q-tooltip>
  </q-btn>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useJournalStore } from 'stores/journalData'

const props = defineProps({
  entry: {
    type: Object,
    required: true,
  },
})

const $q = useQuasar()
const journalStore = useJournalStore()
const saving = ref(false)
const emit = defineEmits(['updated'])

const toggleFavorite = async () => {
  if (!props.entry?.id || saving.value) return

  saving.value = true
  try {
    const nextValue = !props.entry.is_favorite
    await journalStore.setEntryFavorite(props.entry.id, nextValue)
    emit('updated', nextValue)
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to update favorite' })
  } finally {
    saving.value = false
  }
}
</script>
