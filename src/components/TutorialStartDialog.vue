<template>
  <q-dialog v-model="isOpen" :persistent="askName">
    <q-card style="width: 90vw; max-width: 420px">
      <q-card-section>
        <div class="text-h6">{{ askName ? 'Welcome to My Mustard Seeds' : 'Take a Tour' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <template v-if="askName">
          <div class="text-body2 text-grey-8 q-mb-sm">What should we call you?</div>
          <q-input v-model="firstName" dense outlined placeholder="First name (optional)" class="q-mb-md" />
        </template>

        <div class="text-body2 text-grey-8 q-mb-sm">
          Want a guided tour of what the app can do?
        </div>

        <q-checkbox v-if="!askName" v-model="useDemoData" dense label="Show with sample data">
          <q-tooltip>
            Temporarily fills the tour with sample entries, tags, and a saved filter — useful for
            demoing on a sparse account. Nothing is saved; your real data comes back once the tour ends.
          </q-tooltip>
        </q-checkbox>
      </q-card-section>

      <q-card-actions align="right" class="q-pb-md q-px-md">
        <q-btn flat :label="askName ? 'Skip' : 'Cancel'" color="grey" :loading="saving" @click="choose(null)" />
        <q-btn outline color="primary" label="Quick Tour" :loading="saving" @click="choose('quick')" />
        <q-btn unelevated color="primary" label="Full Tour" :loading="saving" @click="choose('full')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useProfileStore } from 'stores/profile'
import { useTutorialStore } from 'stores/tutorial'

const props = defineProps({
  modelValue: Boolean,
  // True only for the automatic first-login flow — captures a name and
  // marks the profile onboarded regardless of which button is pressed.
  // False for the "Replay Tour" entry point in Settings, which just needs
  // to start (or not start) a tour.
  askName: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const profileStore = useProfileStore()
const tutorialStore = useTutorialStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const firstName = ref('')
const useDemoData = ref(false)
const saving = ref(false)

const choose = async (track) => {
  saving.value = true
  try {
    if (props.askName) {
      await profileStore.completeOnboarding(firstName.value.trim())
    }
    isOpen.value = false
    if (track) {
      await tutorialStore.start(track, { useDemoData: useDemoData.value })
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Something went wrong — you can try again from Settings' })
  } finally {
    saving.value = false
  }
}
</script>
