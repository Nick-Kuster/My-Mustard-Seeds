<template>
  <div class="tag-selector">
    <div class="text-subtitle1 text-weight-medium q-mb-sm">Tags</div>

    <!-- Selected Tags -->
    <div v-if="selectedTags.length > 0" class="q-mb-sm">
      <div class="row q-gutter-sm">
        <q-chip v-for="tag in selectedTags" :key="tag.id" removable @remove="removeTag(tag)" color="info"
          text-color="white">
          {{ tag.name }}
        </q-chip>
      </div>
    </div>

    <!-- Tag Selection Button -->
    <q-btn unelevated color="info" :label="selectedTags.length ? 'Add More Tags' : 'Add Tags'" icon="label"
      @click="showModal = true">
    </q-btn>

    <!-- Tag Selection Modal -->
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
