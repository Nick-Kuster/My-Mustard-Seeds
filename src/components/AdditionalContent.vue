<template>
  <div class="q-mb-lg">
    <q-expansion-item icon="add_circle" label="Additional Content" caption="Verses, Tags, and Quotes"
      class="custom-expansion" header-class="bg-grey-2">
      <q-card>
        <q-card-section>
          <div class="q-gutter-y-lg">
            <!-- Linked Verses -->
            <div class="q-mb-lg">
              <LinkedVerses v-model="linkedVerses" @update:modelValue="updateVerses" />
            </div>

            <!-- Tags -->
            <div class="q-mb-lg">
              <TagSelector v-model="selectedTags" @update:modelValue="updateTags" />
            </div>

            <!-- Quotes -->
            <div>
              <QuoteSelector v-model="selectedQuotes" @update:modelValue="updateQuotes" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup>
import LinkedVerses from './LinkedVerses.vue'
import TagSelector from './TagSelector.vue'
import QuoteSelector from './QuoteSelector.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const updateVerses = (newVerses) => {
  emit('update:modelValue', {
    ...props.modelValue,
    linkedVerses: newVerses
  })
}

const updateTags = (newTags) => {
  emit('update:modelValue', {
    ...props.modelValue,
    selectedTags: newTags
  })
}

const updateQuotes = (newQuotes) => {
  emit('update:modelValue', {
    ...props.modelValue,
    selectedQuotes: newQuotes
  })
}
</script>

<style scoped>
.custom-expansion :deep(.q-expansion-item__content) {
  background: white;
}

.custom-expansion {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.custom-expansion :deep(.q-expansion-item__container) {
  border-radius: 8px;
  overflow: hidden;
}

.custom-expansion :deep(.q-item) {
  padding: 16px;
}
</style>
