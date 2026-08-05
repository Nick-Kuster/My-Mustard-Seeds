<template>
  <div class="q-mb-lg">
    <div v-if="!displayOnly" class="row items-center no-wrap q-mb-sm section-header" role="button"
      @click="showModal = true">
      <div class="text-subtitle1 text-weight-medium">Add Strong's Word</div>
      <q-btn flat round dense color="warning" icon="translate" class="q-ml-xs" />
    </div>
    <div v-else class="row items-center no-wrap q-mb-sm display-header">
      <div class="text-subtitle1 text-weight-medium">Strong's Words</div>
    </div>

    <div v-if="items.length > 0" class="q-gutter-y-sm">
      <div v-for="(item, index) in items" :key="item.strongs_number" class="strongs-item">
        <div class="row items-start">
          <div class="col">
            <div class="text-weight-medium">
              {{ item.lemma }}
              <span v-if="item.transliteration" class="text-grey-8">({{ item.transliteration }})</span>
              <span class="text-caption text-grey-6"> — {{ item.strongs_number }}</span>
            </div>
            <div v-if="item.kjv_def || item.strongs_def" class="text-caption text-grey-8">
              {{ item.kjv_def || item.strongs_def }}
            </div>
          </div>
          <div class="col-auto">
            <q-btn v-if="!displayOnly" flat round dense color="negative" icon="delete" size="sm"
              @click="removeItem(index)" />
          </div>
        </div>
      </div>
    </div>

    <StrongsSelectionModal v-model="showModal" :exclude-numbers="items.map((i) => i.strongs_number)"
      @select="onSelect" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import StrongsSelectionModal from './StrongsSelectionModal.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  displayOnly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const showModal = ref(false)
const items = ref(props.modelValue || [])

watch(() => props.modelValue, (newValue) => {
  items.value = [...(newValue || [])]
}, { immediate: true, deep: true })

const onSelect = (entry) => {
  if (items.value.some((i) => i.strongs_number === entry.strongs_number)) return
  items.value.push(entry)
  emit('update:modelValue', items.value)
}

const removeItem = (index) => {
  items.value.splice(index, 1)
  emit('update:modelValue', items.value)
}
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

.strongs-item {
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--color-surface-muted);
  border-left: 3px solid #ffc107;
}
</style>
