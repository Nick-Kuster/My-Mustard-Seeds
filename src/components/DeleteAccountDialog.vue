<template>
  <q-dialog v-model="isOpen" :persistent="deletion.deleting.value">
    <q-card style="width: 90vw; max-width: 420px">
      <q-card-section>
        <div class="text-h6 text-negative">Delete your account?</div>
      </q-card-section>

      <q-card-section class="q-pt-none text-body2">
        This permanently deletes every journal entry, prayer request, testimony, tag, resource,
        and saved filter — and removes your login entirely. This cannot be undone.
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-banner class="bg-blue-1 text-body2" rounded>
          Consider exporting your data first.
          <template v-slot:action>
            <q-btn flat no-caps dense color="primary" label="Export My Data" :loading="exportComposable.exporting.value"
              @click="handleExport" />
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body2 q-mb-sm">
          Type <strong>{{ userEmail }}</strong> to confirm.
        </div>
        <q-input v-model="confirmEmail" dense outlined :disable="deletion.deleting.value"
          placeholder="your email address" />
      </q-card-section>

      <q-card-section v-if="deletion.deleting.value" class="q-pt-none text-body2 text-grey-8">
        {{ statusText }}
      </q-card-section>

      <q-card-section v-if="deletion.error.value" class="q-pt-none text-body2 text-negative">
        {{ deletion.error.value }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" :disable="deletion.deleting.value" v-close-popup />
        <q-btn color="negative" label="Delete Account" :loading="deletion.deleting.value" :disable="!emailMatches"
          @click="handleDelete" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useAccountExport } from 'src/composables/useAccountExport'
import { useAccountDeletion } from 'src/composables/useAccountDeletion'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const exportComposable = useAccountExport()
const deletion = useAccountDeletion()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const confirmEmail = ref('')
const userEmail = computed(() => authStore.user?.email || '')
const emailMatches = computed(() => (
  confirmEmail.value.trim().toLowerCase() === userEmail.value.toLowerCase() && !!userEmail.value
))

const statusText = computed(() => {
  if (deletion.step.value === 'wiping-data') return 'Deleting your data…'
  if (deletion.step.value === 'deleting-account') return 'Deleting your account…'
  return ''
})

const handleExport = async () => {
  try {
    await exportComposable.exportAllData()
    $q.notify({ type: 'positive', message: 'Export downloaded' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to export your data' })
  }
}

const handleDelete = async () => {
  try {
    await deletion.deleteAccount()
    router.push('/login')
  } catch {
    // deletion.error already holds a message for display in the dialog
  }
}
</script>
