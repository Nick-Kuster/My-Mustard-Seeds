<template>
  <node-view-wrapper as="div" class="image-ref" contenteditable="false">
    <img v-if="status === 'loaded'" :src="objectUrl" :alt="props.node.attrs.alt" />
    <div v-else-if="status === 'error'" class="image-ref-state">
      <q-icon name="broken_image" size="24px" />
      <span>Image unavailable</span>
    </div>
    <div v-else class="image-ref-state">
      <q-spinner size="24px" />
    </div>
  </node-view-wrapper>
</template>

<script setup>
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { useEncryptedImage } from 'src/composables/useEncryptedImage'

const props = defineProps(nodeViewProps)

const imagePath = computed(() => props.node.attrs.imagePath)
const mimeType = computed(() => props.node.attrs.mimeType)

const { objectUrl, status } = useEncryptedImage(imagePath, mimeType)
</script>

<style scoped>
.image-ref {
  margin: 4px 0;
}

.image-ref img {
  display: block;
  max-width: 100%;
  border-radius: 4px;
}

.image-ref-state {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  color: var(--color-text-secondary, #888);
}
</style>
