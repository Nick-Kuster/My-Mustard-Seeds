<template>
  <div>
    <q-btn @click="testConnection" color="primary" label="Test Connection" />
    <div v-if="status">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../boot/supabase'

const status = ref('')

const testConnection = async () => {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (error) {
      status.value = 'Error: ' + error.message
    } else {
      status.value = 'Connection successful!'
      console.log('Query result:', data)
    }
  } catch (err) {
    status.value = 'Error: ' + err.message
  }
}
</script>
