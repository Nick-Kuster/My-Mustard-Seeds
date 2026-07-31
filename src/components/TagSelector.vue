<template>
  <div class="q-mb-lg">
    <div v-if="!displayOnly" class="row items-center no-wrap q-mb-sm section-header" role="button"
      @click="showModal = true">
      <div class="text-subtitle1 text-weight-medium">Add Tags</div>
      <q-btn flat round dense color="info" icon="label" class="q-ml-xs" />
    </div>
    <div v-else class="row items-center no-wrap q-mb-sm display-header">
      <div class="text-subtitle1 text-weight-medium">Tags</div>
    </div>

    <div v-if="selectedTags.length > 0" class="row q-gutter-sm">
      <q-chip v-for="tag in selectedTags" :key="tag.id" :removable="!displayOnly" @remove="removeTag(tag)" color="info"
        text-color="white">
        {{ tag.name }}
      </q-chip>
    </div>

    <TagSelectionModal v-model="showModal" v-model:selectedTags="selectedTags" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import TagSelectionModal from './TagSelectionModal.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  displayOnly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const showModal = ref(false)
const selectedTags = ref(props.modelValue || [])

const removeTag = (tag) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tag.id)
  emit('update:modelValue', selectedTags.value)
}

// Watch for changes in selected tags
watch(selectedTags, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  selectedTags.value = newVal || []
}, { deep: true })
</script>

<style scoped>
.section-header {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background: var(--color-hover);
}

.section-header .q-btn {
  pointer-events: none;
}
</style>
