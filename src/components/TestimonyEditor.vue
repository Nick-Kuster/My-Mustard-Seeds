<template>
  <div class="testimony">
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="2em" />
    </div>
    <template v-else>
      <q-expansion-item :model-value="showGuide" @update:model-value="showGuide = $event" icon="help_outline"
        label="What is a testimony?" header-class="text-weight-bold" class="rounded-borders bg-white q-mb-lg guide">
        <q-card-section class="text-body2 text-grey-9">
          <p>
            A testimony is simply the story of how God has worked in your life — not a
            performance, just an honest account for you to remember and for others to
            be encouraged by. There's no wrong way to write it, but a common shape is:
          </p>
          <ul class="q-mb-md">
            <li><strong>Before</strong> — what your life or heart looked like before this.</li>
            <li><strong>How</strong> — the moment or season God met you, and what changed.</li>
            <li><strong>Now</strong> — what's different in how you live, think, or hope.</li>
          </ul>
          <p class="q-mb-none">
            Share it with others when the opportunity comes up — it's often exactly what
            someone else needs to hear. And on the days you're struggling, read it back to
            yourself as a reminder of what God has already done.
          </p>
        </q-card-section>
      </q-expansion-item>

      <q-input v-model="draft" type="textarea" outlined autogrow
        placeholder="Write your testimony here..." :input-style="{ minHeight: '240px' }" class="q-mb-md" />

      <div class="row justify-end">
        <q-btn unelevated color="primary" label="Save" :loading="saving" :disable="!isDirty" @click="save" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTestimonyStore } from 'stores/testimony'

const $q = useQuasar()
const store = useTestimonyStore()

const loading = ref(true)
const draft = ref('')
const showGuide = ref(false)

const isDirty = computed(() => draft.value !== store.content)
const saving = computed(() => store.saving)

const save = async () => {
  try {
    await store.save(draft.value)
    $q.notify({ type: 'positive', message: 'Testimony saved' })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save testimony' })
  }
}

onMounted(async () => {
  try {
    await store.load()
    draft.value = store.content
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load testimony' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.guide {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
