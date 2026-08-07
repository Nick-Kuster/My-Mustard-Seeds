<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'

onMounted(() => {
  useAuthStore().initialize()
})
</script>
