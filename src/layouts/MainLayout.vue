<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none header-link">
            My Mustard Seeds
          </router-link>
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

<style scoped>
.text-decoration-none {
  text-decoration: none;
}

.text-decoration-none:hover {
  opacity: 0.9;
}

.header-link {
  display: flex;
  align-items: center;
}

.header-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
