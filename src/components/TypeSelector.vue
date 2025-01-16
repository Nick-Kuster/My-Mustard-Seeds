<template>
  <div class="type-selector">
    <!-- Selected Value Display -->
    <div class="q-mb-lg">
      <div class="text-subtitle1 q-mb-sm">Journal Type</div>
      <q-btn class="type-select-btn full-width" unelevated align="left" @click="isOpen = !isOpen">
        <template v-if="modelValue">
          <div class="row items-center full-width justify-between">
            <div class="row items-center">
              <q-icon :name="getTypeIcon(modelValue)" size="32px" />
              <div class="q-ml-md selected-text">{{ modelValue }}</div>
            </div>
            <q-icon name="arrow_drop_down" size="24px" class="arrow-icon" />
          </div>
        </template>
        <template v-else>
          <div class="row items-center full-width justify-between">
            <div class="text-h6">Select Journal Type</div>
            <q-icon name="arrow_drop_down" size="24px" class="arrow-icon" />
          </div>
        </template>
      </q-btn>
    </div>

    <!-- Grid Dialog -->
    <q-dialog v-model="isOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'">
      <q-card class="type-selector-dialog" style="max-width: 600px; width: 100%;">
        <q-card-section>
          <div class="text-h6 q-mb-md">Select Entry Type</div>

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
  { id: 'Bible', icon: 'menu_book', label: 'Bible' },
  { id: 'Sermon', icon: 'church', label: 'Sermon' },
  { id: 'Answered Prayer / Miracle', icon: 'front_hand', label: 'Answered Prayer/\nMiracle' },
  { id: 'Devotional', icon: 'auto_stories', label: 'Devotional' },
  { id: 'Group', icon: 'group', label: 'Group' },
  { id: 'Video', icon: 'smart_display', label: 'Video' },
  { id: 'Book', icon: 'book', label: 'Book' },
  { id: 'Song', icon: 'music_note', label: 'Song' },
  { id: 'Article', icon: 'article', label: 'Article' },
  { id: 'Podcast', icon: 'podcasts', label: 'Podcast' },
  { id: 'Show', icon: 'tv', label: 'Show' },
  { id: 'Other', icon: 'more_horiz', label: 'Other' }
]

const getTypeIcon = (typeId) => {
  const type = types.find(t => t.id === typeId)
  return type?.icon || 'help_outline'
}

const selectType = (typeId) => {
  emit('update:modelValue', typeId)
  isOpen.value = false
}
</script>

<style scoped>
.entry-type-btn {
  height: 90px;
  padding: 8px !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  background: white;
}

.type-selector {
  margin-top: 2em;
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
  font-size: 0.75rem;
  line-height: 1.2;
  text-align: center;
  max-width: 100%;
  word-wrap: break-word;
  hyphens: auto;
}

:deep(.q-dialog__inner--standard) {
  align-items: center;
}

.type-select-btn {
  height: 72px;
  padding: 0 16px;
  background: white;
  border: 2px solid var(--q-primary);
  border-radius: 12px;
}

.type-select-btn:hover {
  background: rgba(0, 0, 0, 0.03);
}

.selected-text {
  line-height: 1.2;
  white-space: normal;
  word-wrap: break-word;
  display: flex;
  align-items: center;
  min-height: 32px;
}

.arrow-icon {
  flex-shrink: 0;
}

.type-selector-dialog {
  border-radius: 8px;
  background: #faf9f6;
}

@media screen and (max-width: 599px) {
  .type-selector-dialog {
    border-radius: 8px 8px 0 0;
  }
}
</style>
