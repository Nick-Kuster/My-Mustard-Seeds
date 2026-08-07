<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 280px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1">{{ title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="swatch-grid">
        <button
          v-for="swatch in swatches"
          :key="swatch.color"
          type="button"
          class="swatch-btn"
          :style="{ backgroundColor: swatch.color }"
          :aria-label="swatch.label"
          @click="select(swatch.color)"
        >
          <q-tooltip>{{ swatch.label }}</q-tooltip>
        </button>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat no-caps label="Remove" color="negative" @click="clear" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  swatches: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue', 'select', 'clear'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const select = (color) => {
  emit('select', color)
  show.value = false
}

const clear = () => {
  emit('clear')
  show.value = false
}
</script>

<style scoped>
.swatch-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding-top: 12px;
}

.swatch-btn {
  width: 100%;
  aspect-ratio: 1;
  min-height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.15));
  cursor: pointer;
  padding: 0;
}

.swatch-btn:active {
  transform: scale(0.92);
}
</style>
