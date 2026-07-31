<template>
  <q-dialog v-model="isOpen">
    <q-card class="verse-modal" style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ reference }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-lg">
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="primary" size="2em" />
        </div>
        <div v-else>
          <div v-for="(verse, index) in verses" :key="index" class="q-mb-md">
            <div class="verse-content">
              <span class="verse-number text-weight-medium">{{ verse.verse }}</span>
              {{ verse.content }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

const props = defineProps({
  modelValue: Boolean,
  reference: {
    type: String,
    default: ''
  },
  startVerse: Number,
  endVerse: Number
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(true)
const verses = ref([])

const fetchVerses = async () => {
  if (!props.startVerse || !props.endVerse) {
    console.log('Missing verse IDs:', { startVerse: props.startVerse, endVerse: props.endVerse })
    return
  }

  loading.value = true
  try {
    console.log('Fetching verses with IDs:', { startVerse: props.startVerse, endVerse: props.endVerse })

    const { data, error } = await supabase
      .from('bible_verses')
      .select('verse, content')
      .gte('verse_number', props.startVerse)
      .lte('verse_number', props.endVerse)
      .order('verse_number')

    if (error) throw error
    console.log('Fetched verse:', data)
    verses.value = data || []
  } catch (error) {
    console.error('Error fetching verses:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      fetchVerses()
    }
  }
)
</script>

<style scoped>
.verse-modal {
  background-color: var(--color-parchment);
}

.verse-modal :deep(.q-card__section) {
  background-color: var(--color-parchment);
}

/* Style the header section slightly differently */
.verse-modal :deep(.q-card__section:first-child) {
  background-color: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border-light);
}

.verse-number {
  margin-right: 0.5rem;
  color: var(--color-text-secondary);
}

.verse-content {
  line-height: 1.6;
}
</style>
