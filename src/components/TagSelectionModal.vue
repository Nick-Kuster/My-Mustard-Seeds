<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="width: 700px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">Select Tags</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-sm">
          <!-- Search input -->
          <div class="col-12">
            <q-input v-model="searchQuery" dense outlined placeholder="Search or create new tag"
              @keyup.enter="handleEnter">
              <template v-slot:append>
                <q-btn v-if="searchQuery" round dense flat icon="add" @click="createNewTag"
                  :disable="existingTagNames.includes(searchQuery.toLowerCase())" />
              </template>
            </q-input>
          </div>

          <!-- Selected tags -->
          <div class="col-12" v-if="selectedTags.length > 0">
            <div class="text-subtitle2 q-mb-sm">Selected Tags</div>
            <div class="row q-gutter-sm">
              <q-chip v-for="tag in selectedTags" :key="tag.id" removable @remove="toggleTag(tag)" color="primary"
                text-color="white">
                {{ tag.name }}
              </q-chip>
            </div>
          </div>

          <!-- Available tags -->
          <div class="col-12">
            <div class="text-subtitle2 q-mb-sm">Available Tags</div>
            <div class="row q-gutter-sm">
              <q-chip v-for="tag in filteredTags" :key="tag.id" :color="isSelected(tag) ? 'primary' : 'grey-3'"
                :text-color="isSelected(tag) ? 'white' : 'black'" clickable @click="toggleTag(tag)">
                {{ tag.name }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Done" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: Boolean,
  selectedTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedTags'])

const $q = useQuasar()
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const allTags = ref([])
const searchQuery = ref('')
const selectedTags = ref(props.selectedTags || [])

// Watch for external changes to selectedTags
watch(() => props.selectedTags, (newVal) => {
  selectedTags.value = newVal
}, { deep: true })

// Watch selected tags and emit changes
watch(selectedTags, (newVal) => {
  emit('update:selectedTags', newVal)
}, { deep: true })

const existingTagNames = computed(() => {
  return allTags.value.map(tag => tag.name.toLowerCase())
})

const filteredTags = computed(() => {
  if (!searchQuery.value) return allTags.value
  const query = searchQuery.value.toLowerCase()
  return allTags.value.filter(tag =>
    tag.name.toLowerCase().includes(query)
  )
})

const fetchTags = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', session.user.id)
    .order('name')

  if (error) {
    console.error('Error fetching tags:', error)
    return
  }

  if (data) {
    allTags.value = data
  }
}

const handleEnter = () => {
  if (searchQuery.value && !existingTagNames.value.includes(searchQuery.value.toLowerCase())) {
    createNewTag()
  }
}

const createNewTag = async () => {
  if (!searchQuery.value.trim()) return

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: session.user.id,
        name: searchQuery.value.trim()
      })
      .select()
      .single()

    if (error) throw error

    allTags.value.push(data)
    toggleTag(data)
    searchQuery.value = ''

    $q.notify({
      type: 'positive',
      message: 'Tag created successfully'
    })
  } catch (error) {
    console.error('Error creating tag:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to create tag'
    })
  }
}

const isSelected = (tag) => {
  return selectedTags.value.some(t => t.id === tag.id)
}

const toggleTag = (tag) => {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// Fetch tags when the modal opens
watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    await fetchTags()
  }
})
</script>
