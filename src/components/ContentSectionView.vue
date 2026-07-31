<template>
  <div class="content-section q-mb-lg">
    <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ section.title || 'Untitled Section' }}</div>

    <q-list v-if="section.fieldType === 'list'" dense class="list-view">
      <q-item v-for="(item, i) in listItems" :key="i" class="q-pl-none">
        <q-item-section avatar class="list-bullet-col">
          <q-icon name="fiber_manual_record" size="6px" class="list-bullet" />
        </q-item-section>
        <q-item-section>{{ item }}</q-item-section>
      </q-item>
    </q-list>
    <div v-else-if="section.content" class="text-body1" style="white-space: pre-wrap">{{ section.content }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getListItems } from 'src/utils/sectionListUtils'

const props = defineProps({
  section: { type: Object, required: true },
})

const listItems = computed(() => getListItems(props.section.content).filter((item) => item.trim()))
</script>

<style scoped>
.list-view :deep(.q-item) {
  padding-left: 0;
  min-height: 28px;
}

.list-bullet-col {
  min-width: 20px;
}

.list-bullet {
  color: rgba(0, 0, 0, 0.4);
}
</style>
