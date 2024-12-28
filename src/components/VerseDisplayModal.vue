<template>
  <q-dialog v-model="isOpen">
    <q-card style="min-width: 350px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ reference }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
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
import { ref, onMounted, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

const props = defineProps({
  modelValue: Boolean,
  reference: {
    type: String,
    default: ''
  },
  startVerseId: String,
  endVerseId: String
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(true)
const verses = ref([])

const fetchVerses = async () => {
  if (!props.startVerseId || !props.endVerseId) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('verse, content')
      .or(`and(id.gte.${props.startVerseId},id.lte.${props.endVerseId})`)
      .order('verse')

    if (error) throw error
    verses.value = data || []
  } catch (error) {
    console.error('Error fetching verses:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchVerses()
})
</script>

<style scoped>
.verse-number {
  margin-right: 0.5rem;
  color: #666;
}

.verse-content {
  line-height: 1.6;
}
</style>
