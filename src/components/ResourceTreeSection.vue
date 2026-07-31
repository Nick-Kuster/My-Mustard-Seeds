<template>
  <q-expansion-item :label="node.title" dense-toggle :style="{ paddingLeft: `${depth * 16}px` }">
    <ResourceTreeSection
      v-for="child in node.children" :key="child.id"
      :node="child" :depth="depth + 1" :color="color"
      @view-entry="$emit('view-entry', $event)"
    />
    <q-item
      v-for="entry in node.entries" :key="entry.id"
      clickable class="entry-item"
      :style="{ paddingLeft: `${16 + (depth + 1) * 16}px`, borderLeftColor: color }"
      @click="$emit('view-entry', entry.id)"
    >
      <q-item-section>
        <q-item-label class="text-wrap">{{ entry.title }}</q-item-label>
        <q-item-label caption class="text-wrap">{{ formatDate(entry.created_at) }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-icon name="chevron_right" />
      </q-item-section>
    </q-item>
  </q-expansion-item>
</template>

<script setup>
defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  color: { type: String, default: 'transparent' },
})
defineEmits(['view-entry'])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.entry-item {
  min-height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  border-left: 3px solid transparent;
}

.entry-item:last-child {
  border-bottom: none;
}

.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.q-item-section {
  min-width: 0;
}
</style>
