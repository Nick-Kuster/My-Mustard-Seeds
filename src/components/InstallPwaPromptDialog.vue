<template>
  <q-dialog v-model="show" persistent>
    <q-card class="install-pwa-card">
      <q-card-section class="row items-start no-wrap">
        <q-icon name="install_mobile" color="primary" size="32px" class="q-mr-sm" />
        <div>
          <div class="text-h6">Install My Mustard Seeds</div>
          <div class="text-body2 text-grey-8 q-mt-xs">
            Add this journal to your phone for a faster app-like experience.
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <template v-if="isIos">
          <ol class="install-steps">
            <li>Open this page in Safari.</li>
            <li>Tap the Share button.</li>
            <li>Choose Add to Home Screen.</li>
            <li>Tap Add.</li>
          </ol>
          <div v-if="!isSafari" class="text-caption text-grey-7 q-mt-sm">
            iPhone and iPad installation works from Safari. If this opened in another browser, open it in Safari first.
          </div>
        </template>
        <div v-else class="text-body2">
          Your browser can install this site as an app on your phone.
        </div>

        <q-checkbox v-model="doNotAskAgain" dense class="q-mt-md" label="Do not ask this again" />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat color="grey" label="Not Now" @click="dismiss" />
        <q-btn v-if="canInstallDirectly" unelevated color="primary" icon="download" label="Install" @click="install" />
        <q-btn v-else unelevated color="primary" label="Done" @click="dismiss" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { setInstallPromptDismissed, promptForPwaInstall } from 'src/utils/pwaInstallPrompt'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  canInstallDirectly: { type: Boolean, default: false },
  isIos: { type: Boolean, default: false },
  isSafari: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const doNotAskAgain = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const close = () => {
  if (doNotAskAgain.value) setInstallPromptDismissed(true)
  show.value = false
}

const dismiss = () => {
  close()
}

const install = async () => {
  await promptForPwaInstall()
  close()
}
</script>

<style scoped>
.install-pwa-card {
  width: 90vw;
  max-width: 420px;
}

.install-steps {
  margin: 0;
  padding-left: 20px;
}

.install-steps li {
  margin-bottom: 6px;
}
</style>
