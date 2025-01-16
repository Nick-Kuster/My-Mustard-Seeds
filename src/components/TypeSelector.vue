<template>
  <div class="type-selector q-mb-lg q-mt-lg">
    <!-- Clickable Type Display -->
    <div class="type-display q-mb-md" role="button" @click="isOpen = true">
      <div class="row items-center no-wrap">
        <q-icon :name="getTypeIcon(modelValue)" size="24px" class="q-mr-sm" />
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">{{ modelValue || 'Select Journal Type' }}</div>
          <div v-if="getTypeDescription(modelValue)" class="text-caption text-grey-8">
            {{ getTypeDescription(modelValue) }}
          </div>
        </div>
        <q-icon name="chevron_right" size="20px" class="q-ml-sm text-grey-6" />
      </div>
    </div>

    <!-- Type Selection Dialog -->
    <q-dialog v-model="isOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="type-selector-dialog" style="max-width: 600px; width: 100%;">
        <q-card-section>
          <div class="text-h6 q-mb-md">Select Journal Type</div>

          <div class="row q-col-gutter-md">
            <div v-for="type in types" :key="type.id" class="col-4 col-xs-4">
              <q-btn class="full-width entry-type-btn" :class="{ 'selected': modelValue === type.id }" unelevated
                @click="selectType(type.id)">
                <div class="content-wrapper">
                  <q-icon :name="type.icon" size="24px" />
                  <div class="label-wrapper">{{ type.label }}</div>
                </div>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

const types = [
  { id: 'Bible', icon: 'menu_book', label: 'Bible Study', description: 'Study and reflect on Scripture' },
  { id: 'Sermon', icon: 'church', label: 'Sermon Notes', description: 'Notes from a sermon or teaching' },
  { id: 'Answered Prayer / Miracle', icon: 'front_hand', label: 'Answered Prayer/\nMiracle', description: 'Record of God\'s faithfulness' },
  { id: 'Devotional', icon: 'auto_stories', label: 'Devotional', description: 'Daily devotional reflections' },
  { id: 'Group', icon: 'group', label: 'Group Study', description: 'Small group or Bible study notes' },
  { id: 'Video', icon: 'smart_display', label: 'Video', description: 'Notes from Christian videos' },
  { id: 'Book', icon: 'book', label: 'Book Notes', description: 'Notes from Christian books' },
  { id: 'Song', icon: 'music_note', label: 'Worship Song', description: 'Reflections on worship music' },
  { id: 'Article', icon: 'article', label: 'Article Notes', description: 'Notes from Christian articles' },
  { id: 'Podcast', icon: 'podcasts', label: 'Podcast Notes', description: 'Notes from Christian podcasts' },
  { id: 'Show', icon: 'tv', label: 'Show Notes', description: 'Notes from Christian shows/videos' },
  { id: 'Other', icon: 'more_horiz', label: 'Other', description: 'Other spiritual reflections' }
]

const getTypeIcon = (typeId) => {
  const type = types.find(t => t.id === typeId)
  return type?.icon || 'help_outline'
}

const getTypeDescription = (typeId) => {
  const type = types.find(t => t.id === typeId)
  return type?.description
}

const selectType = (typeId) => {
  emit('update:modelValue', typeId)
  isOpen.value = false
}
</script>

<style scoped>
.type-display {
  cursor: pointer;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.type-display:hover {
  background: rgba(0, 0, 0, 0.03);
}

.entry-type-btn {
  height: 90px;
  padding: 8px !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  background: white;
}

.entry-type-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.entry-type-btn.selected {
  border: 2px solid var(--q-primary);
  background: rgba(var(--q-primary), 0.05);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  gap: 8px;
}

.label-wrapper {
  font-size: 0.875rem;
  line-height: 1.2;
  text-align: center;
  max-width: 100%;
  word-wrap: break-word;
  hyphens: auto;
}

.type-selector-dialog {
  border-radius: 12px;
}

@media screen and (max-width: 599px) {
  .type-selector-dialog {
    border-radius: 12px 12px 0 0;
  }
}
</style>
