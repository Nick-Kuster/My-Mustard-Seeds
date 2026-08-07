<template>
  <q-list bordered dense class="mention-suggestion-list">
    <template v-if="items.length > 0">
      <q-item v-for="(item, index) in items" :key="index" clickable
        :active="index === selectedIndex" active-class="mention-item-active" @click="select(index)">
        <q-item-section>
          <q-item-label>{{ item.label }}</q-item-label>
          <q-item-label v-if="item.sublabel" caption lines="1">{{ item.sublabel }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <q-item v-else class="text-grey">
      <q-item-section>No matches</q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { ref, watch } from 'vue'

// Generic popup for the `#tag`/`$strongs` type-ahead — each reference
// node's own items() prepares { label, sublabel?, ...raw } objects so
// this component never needs to know whether it's showing tags or
// Strong's entries. `command` is TipTap's own suggestion-plugin function
// (threaded through via useMentionSuggestion.js's buildSuggestionRenderer)
// — calling it with a picked item is what actually inserts the node.
const props = defineProps({
  items: { type: Array, default: () => [] },
  command: { type: Function, required: true },
})

const selectedIndex = ref(0)
watch(() => props.items, () => {
  selectedIndex.value = 0
})

const select = (index) => {
  const item = props.items[index]
  if (item) props.command(item)
}

const onKeyDown = ({ event }) => {
  if (props.items.length === 0) return false
  if (event.key === 'ArrowUp') {
    selectedIndex.value = (selectedIndex.value + props.items.length - 1) % props.items.length
    return true
  }
  if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length
    return true
  }
  if (event.key === 'Enter') {
    select(selectedIndex.value)
    return true
  }
  return false
}

defineExpose({ onKeyDown })
</script>

<style scoped>
.mention-suggestion-list {
  min-width: 220px;
  max-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-surface, white);
}

.mention-item-active {
  background: var(--color-hover);
}
</style>
