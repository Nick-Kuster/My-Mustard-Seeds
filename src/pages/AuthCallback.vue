<template>
  <q-page class="flex flex-center">
    <q-spinner color="primary" size="3em" />
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'src/boot/supabase'

const router = useRouter()

onMounted(async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error

    if (session) {
      const redirect = sessionStorage.getItem('postLoginRedirect') || '/'
      sessionStorage.removeItem('postLoginRedirect')
      router.push(redirect)
    } else {
      router.push('/login')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    router.push('/login')
  }
})
</script>
