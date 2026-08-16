<template>
  <q-btn flat round dense size="sm" icon="palette" :style="buttonStyle">
    <q-tooltip>Section color</q-tooltip>
    <q-menu class="section-color-popover" anchor="bottom right" self="top right" :content-style="menuSurfaceStyle">
      <div class="section-color-menu" :style="menuSurfaceStyle" @mousedown.prevent>
        <div class="section-color-label">Background</div>
        <button
          v-for="swatch in SECTION_BACKGROUND_SWATCHES"
          :key="swatch.id"
          type="button"
          class="section-color-swatch"
          :class="{ selected: selectedBackground === swatch.id }"
          :style="{ backgroundColor: `var(--section-bg-${swatch.id})` }"
          :aria-label="swatch.label"
          v-close-popup
          @click="selectColor(swatch.id)"
        >
          <q-tooltip>{{ swatch.label }}</q-tooltip>
        </button>
        <q-btn flat dense no-caps color="negative" label="Remove background" class="section-color-clear"
          v-close-popup @click="clearColor" />

        <div class="section-color-label">Text</div>
        <button
          v-for="swatch in SECTION_TEXT_SWATCHES"
          :key="swatch.id"
          type="button"
          class="section-color-swatch"
          :class="{ selected: selectedText === swatch.id }"
          :style="{ backgroundColor: `var(--section-text-${swatch.id})` }"
          :aria-label="swatch.label"
          v-close-popup
          @click="selectTextColor(swatch.id)"
        >
          <q-tooltip>{{ swatch.label }}</q-tooltip>
        </button>
        <q-btn flat dense no-caps color="negative" label="Use default text" class="section-color-clear"
          v-close-popup @click="clearTextColor" />
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'
import {
  SECTION_BACKGROUND_SWATCHES,
  SECTION_TEXT_SWATCHES,
  getSectionStyle,
  normalizeSectionBackgroundColor,
  normalizeSectionTextColor,
} from 'src/utils/sectionColors'

const props = defineProps({
  modelValue: { type: String, default: '' },
  textColor: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:textColor'])

const selectedBackground = computed(() => normalizeSectionBackgroundColor(props.modelValue))
const selectedText = computed(() => normalizeSectionTextColor(props.textColor))

const buttonStyle = computed(() => getSectionStyle({ color: props.modelValue, textColor: props.textColor }))
const menuSurfaceStyle = computed(() => {
  const style = getSectionStyle({ color: props.modelValue, textColor: props.textColor })
  return {
    backgroundColor: style.backgroundColor || 'var(--color-surface)',
    color: style.color || 'var(--color-text)',
    ...(style['--section-text-color'] ? { '--section-text-color': style['--section-text-color'] } : {}),
  }
})

const selectColor = (color) => {
  emit('update:modelValue', color)
}

const clearColor = () => {
  emit('update:modelValue', '')
}

const selectTextColor = (color) => {
  emit('update:textColor', color)
}

const clearTextColor = () => {
  emit('update:textColor', '')
}
</script>

<style scoped>
.section-color-menu {
  display: grid;
  grid-template-columns: repeat(4, 34px);
  gap: 8px;
  padding: 10px;
}

.section-color-label {
  grid-column: 1 / -1;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  padding: 4px 0 2px;
}

.section-color-swatch {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border, rgba(0, 0, 0, 0.16));
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
}

.section-color-swatch.selected {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.section-color-clear {
  grid-column: 1 / -1;
}

:global(.section-color-popover) {
  border: 1px solid var(--color-border);
}
</style>
