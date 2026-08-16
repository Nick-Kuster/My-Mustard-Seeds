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
        <q-item-label class="text-wrap">
          <q-icon v-if="entry.is_favorite" name="star" color="warning" size="16px" class="q-mr-xs" />
          {{ entry.title }}
        </q-item-label>
        <q-item-label v-if="entryResourceContext(entry)" caption class="text-wrap entry-resource-context">
          {{ entryResourceContext(entry) }}
        </q-item-label>
        <q-item-label caption class="text-wrap">{{ formatDate(entry.updated_at || entry.created_at) }}</q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center no-wrap">
          <FavoriteButton :entry="entry" />
          <q-icon name="chevron_right" />
        </div>
      </q-item-section>
    </q-item>
  </q-expansion-item>
</template>

<script setup>
import { getResourceTitle } from 'stores/journalData'
import FavoriteButton from './FavoriteButton.vue'

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

const entryResourceContext = (entry) => {
  if (entry?.type !== 'Devotional') return ''

  const devotional = entry.resources?.find((resource) => resource.type === 'Devotional')
  const title = devotional ? getResourceTitle(devotional) : ''
  return title ? `From ${title}` : ''
}
</script>

<style scoped>
.entry-item {
  min-height: 60px;
  border-bottom: 1px solid var(--color-border);
  border-left: 3px solid transparent;
}

.entry-item:last-child {
  border-bottom: none;
}

.text-wrap {
  white-space: normal !important;
  word-break: break-word;
}

.entry-resource-context {
  color: var(--color-text-secondary);
  font-size: 0.74rem;
  font-weight: 500;
}

.q-item-section {
  min-width: 0;
}
</style>
