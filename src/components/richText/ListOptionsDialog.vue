<template>
  <q-dialog v-model="show">
    <q-card style="min-width: 240px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1">List</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-list class="q-pb-sm">
        <q-item clickable @click="toggle('bulletList')">
          <q-item-section avatar><q-icon name="format_list_bulleted" /></q-item-section>
          <q-item-section>Bullet List</q-item-section>
          <q-item-section v-if="editor.isActive('bulletList')" side>
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
        <q-item clickable @click="toggle('orderedList')">
          <q-item-section avatar><q-icon name="format_list_numbered" /></q-item-section>
          <q-item-section>Numbered List</q-item-section>
          <q-item-section v-if="editor.isActive('orderedList')" side>
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item clickable @click="run(() => editor.chain().focus().sinkListItem('listItem').run())">
          <q-item-section avatar><q-icon name="format_indent_increase" /></q-item-section>
          <q-item-section>Indent (sublevel)</q-item-section>
        </q-item>
        <q-item clickable @click="run(() => editor.chain().focus().liftListItem('listItem').run())">
          <q-item-section avatar><q-icon name="format_indent_decrease" /></q-item-section>
          <q-item-section>Outdent</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editor: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const run = (action) => {
  action()
  show.value = false
}

const toggle = (name) => {
  const command = name === 'bulletList' ? 'toggleBulletList' : 'toggleOrderedList'
  run(() => props.editor.chain().focus()[command]().run())
}
</script>
