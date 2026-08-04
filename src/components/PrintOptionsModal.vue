<template>
  <q-dialog v-model="isOpen">
    <q-card style="width: 90vw; max-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">Print Options</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body2 text-grey-8 q-mb-md">
          Choose what to include when printing these entries. Saved for next time.
        </div>

        <div class="q-gutter-sm">
          <q-checkbox v-model="options.content" label="Entry content" dense />
          <q-checkbox v-model="options.verses" label="Bible verses" dense />
          <q-checkbox v-model="options.tags" label="Tags" dense />
          <q-checkbox v-model="options.quotes" label="Quotes" dense />
          <q-checkbox v-model="options.links" label="Links" dense />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn unelevated color="primary" icon="print" label="Continue to Print" :loading="saving"
          @click="confirm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserPreferencesStore } from 'stores/userPreferences'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const router = useRouter()
const userPreferencesStore = useUserPreferencesStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const options = ref({ ...userPreferencesStore.printOptions })
const saving = ref(false)

// Re-seed from the saved preference each time the modal opens, so
// cancelling out of an edit doesn't leave stale local state for next time.
// load() is de-duped/cheap if MainLayout's initTheme already resolved it.
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await userPreferencesStore.load()
    options.value = { ...userPreferencesStore.printOptions }
  },
)

const confirm = async () => {
  saving.value = true
  try {
    await userPreferencesStore.setPrintOptions(options.value)
    isOpen.value = false
    router.push('/print')
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save print options' })
  } finally {
    saving.value = false
  }
}
</script>
