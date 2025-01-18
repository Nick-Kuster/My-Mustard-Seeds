<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ editData ? 'Edit Link' : 'Add Link' }}</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="linkData.name" label="Link Name" :rules="[val => !!val || 'Name is required']"
          class="q-mb-md" />

        <q-input v-model="linkData.url" label="URL" :rules="[
          val => !!val || 'URL is required',
          val => /^https?:\/\//.test(val) || 'Must start with http:// or https://'
        ]" />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn flat :label="editData ? 'Update' : 'Add'" @click="submitLink" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  editData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'update'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const linkData = ref({
  name: '',
  url: ''
})

watch(() => props.editData, (newValue) => {
  if (newValue) {
    linkData.value = { ...newValue }
  } else {
    linkData.value = { name: '', url: '' }
  }
}, { immediate: true })

const submitLink = () => {
  if (!linkData.value.name || !linkData.value.url) return

  if (props.editData) {
    emit('update', { ...linkData.value })
  } else {
    emit('select', { ...linkData.value })
  }

  isOpen.value = false
  linkData.value = { name: '', url: '' }
}
</script>
