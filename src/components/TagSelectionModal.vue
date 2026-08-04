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
                :text-color="isSelected(tag) ? 'white' : 'black'" clickable @click="toggleTag(tag)"
                removable remove-icon="delete" @remove="openDeleteTag(tag)">
                {{ tag.name }}
                <q-tooltip>Click to {{ isSelected(tag) ? 'deselect' : 'select' }}; trash icon deletes it everywhere</q-tooltip>
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

    <!-- Delete tag confirmation -->
    <q-dialog v-model="showDeleteTagDialog">
      <q-card style="width: 90vw; max-width: 320px">
        <q-card-section>
          <div class="text-h6">Delete "{{ deletingTag?.name }}"?</div>
        </q-card-section>
        <q-card-section class="q-pt-none text-body2">
          This removes the tag from every entry it's on. This cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deletingTagBusy" @click="confirmDeleteTag" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useTagsStore } from 'stores/tags'

const props = defineProps({
  modelValue: Boolean,
  selectedTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedTags'])

const $q = useQuasar()
const tagsStore = useTagsStore()
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const allTags = computed(() => tagsStore.tags)
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

const handleEnter = () => {
  if (searchQuery.value && !existingTagNames.value.includes(searchQuery.value.toLowerCase())) {
    createNewTag()
  }
}

const createNewTag = async () => {
  if (!searchQuery.value.trim()) return

  try {
    const tag = await tagsStore.createTag(searchQuery.value.trim())
    toggleTag(tag)
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

// Deleting a tag removes it everywhere, not just from the entry currently
// being edited — journal_tags rows are cleared explicitly first so this
// doesn't depend on the FK having an ON DELETE CASCADE configured.
const showDeleteTagDialog = ref(false)
const deletingTag = ref(null)
const deletingTagBusy = ref(false)

const openDeleteTag = (tag) => {
  deletingTag.value = tag
  showDeleteTagDialog.value = true
}

const confirmDeleteTag = async () => {
  const tag = deletingTag.value
  deletingTagBusy.value = true
  try {
    await tagsStore.deleteTags([tag.id])
    selectedTags.value = selectedTags.value.filter((t) => t.id !== tag.id)
    showDeleteTagDialog.value = false

    $q.notify({ type: 'positive', message: 'Tag deleted' })
  } catch (error) {
    console.error('Error deleting tag:', error)
    $q.notify({ type: 'negative', message: 'Failed to delete tag' })
  } finally {
    deletingTagBusy.value = false
  }
}

// Fetch tags when the modal opens
watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    await tagsStore.fetchTags()
  }
})
</script>
