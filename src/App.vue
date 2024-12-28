<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './boot/supabase'

const router = useRouter()

onMounted(() => {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      router.push('/')
    }
    if (event === 'SIGNED_OUT') {
      router.push('/login')
    }
  })
})
</script>
