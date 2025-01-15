<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="width: 700px; max-width: 95vw;">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEditing ? 'Edit Quote' : 'Add Quote' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="q-gutter-y-md">
          <q-input v-model="quoteData.quote" type="textarea" label="Quote" autogrow
            :rules="[val => !!val || 'Quote is required']" />

          <q-input v-model="quoteData.source" label="Source" placeholder="Optional" />

          <q-input v-model="quoteData.page_number" label="Page Number" placeholder="Optional" />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn :loading="saving" flat :label="isEditing ? 'Save Changes' : 'Add Quote'" color="primary"
          @click="isEditing ? updateQuote() : addQuote()" :disable="!quoteData.quote" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'


const props = defineProps({
  modelValue: Boolean,
  editData: {
    type: Object,
    default: null
  }
})

const isEditing = computed(() => !!props.editData)

const quoteData = ref({
  quote: '',
  source: '',
  page_number: ''
})

const emit = defineEmits(['update:modelValue', 'select'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const saving = ref(false)

watch(() => props.editData, (newVal) => {
  if (newVal) {
    quoteData.value = { ...newVal }
  } else {
    quoteData.value = { quote: '', source: '', page_number: '' }
  }
}, { immediate: true })

const updateQuote = async () => {
  if (!quoteData.value.quote) return

  try {
    saving.value = true
    emit('update', { ...quoteData.value })
    quoteData.value = { quote: '', source: '', page_number: '' }
    isOpen.value = false
  } catch (error) {
    console.error('Error updating quote:', error)
  } finally {
    saving.value = false
  }
}



const addQuote = async () => {
  if (!quoteData.value.quote) return

  try {
    saving.value = true
    emit('select', { ...quoteData.value })
    quoteData.value = { quote: '', source: '', page_number: '' }
    isOpen.value = false
  } catch (error) {
    console.error('Error adding quote:', error)
  } finally {
    saving.value = false
  }
}
</script>
