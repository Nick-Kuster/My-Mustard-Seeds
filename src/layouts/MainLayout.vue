<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          My Mustard Seeds
        </q-toolbar-title>

        <q-btn flat dense round icon="logout" aria-label="Logout" @click="handleSignOut" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()

const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error signing out',
      caption: error.message
    })
  }
}
</script>
