<template>
  <div class="app-empty-state" :class="{ 'app-empty-state--compact': compact }">
    <q-icon :name="icon" class="app-empty-state__icon" />
    <div class="app-empty-state__title">{{ title }}</div>
    <div v-if="message" class="app-empty-state__message">{{ message }}</div>
    <div v-if="primaryLabel || secondaryLabel" class="app-empty-state__actions">
      <q-btn
        v-if="primaryLabel"
        unelevated
        color="primary"
        no-caps
        :icon="primaryIcon"
        :label="primaryLabel"
        :to="primaryTo"
        @click="$emit('primary')"
      />
      <q-btn
        v-if="secondaryLabel"
        flat
        color="primary"
        no-caps
        :icon="secondaryIcon"
        :label="secondaryLabel"
        :to="secondaryTo"
        @click="$emit('secondary')"
      />
    </div>
  </div>
</template>

<script setup>
defineEmits(['primary', 'secondary'])

defineProps({
  icon: {
    type: String,
    default: 'eco',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  primaryLabel: {
    type: String,
    default: '',
  },
  primaryIcon: {
    type: String,
    default: '',
  },
  primaryTo: {
    type: [String, Object],
    default: undefined,
  },
  secondaryLabel: {
    type: String,
    default: '',
  },
  secondaryIcon: {
    type: String,
    default: '',
  },
  secondaryTo: {
    type: [String, Object],
    default: undefined,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 220px;
  padding: 40px 20px;
  color: var(--color-text-secondary);
}

.app-empty-state--compact {
  min-height: 120px;
  padding: 24px 16px;
}

.app-empty-state__icon {
  font-size: 44px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.app-empty-state__title {
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
}

.app-empty-state__message {
  max-width: 420px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.app-empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}
</style>
