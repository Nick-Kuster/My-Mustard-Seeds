<!-- NavigationDrawer.vue -->
<template>
  <q-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :mini="miniState"
    bordered :breakpoint="1023" :width="250" class="bg-white">
    <q-scroll-area class="fit">
      <q-list padding>
        <q-item-label header>Menu</q-item-label>

        <q-item clickable v-ripple to="/" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Home</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/entry/new">
          <q-item-section avatar>
            <q-icon name="agriculture" />
          </q-item-section>
          <q-item-section>Plant a Seed</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/search">
          <q-item-section avatar>
            <q-icon name="search" />
          </q-item-section>
          <q-item-section>Search Seeds</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label header>Categories</q-item-label>

        <q-item clickable v-ripple to="/type/Bible">
          <q-item-section avatar>
            <q-icon name="menu_book" />
          </q-item-section>
          <q-item-section>Bible Studies</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/type/Sermon">
          <q-item-section avatar>
            <q-icon name="church" />
          </q-item-section>
          <q-item-section>Sermon Notes</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/type/Song">
          <q-item-section avatar>
            <q-icon name="music_note" />
          </q-item-section>
          <q-item-section>Song Reflections</q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

defineEmits(['update:modelValue'])

const miniState = ref(false)
</script>
