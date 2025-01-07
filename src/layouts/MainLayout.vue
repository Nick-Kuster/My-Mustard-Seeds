<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" class="lt-md" />
        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none header-link">
            My Mustard Seeds
            <q-icon size="xs" class="q-ml-sm fa-solid fa-cross" />
          </router-link>
        </q-toolbar-title>
        <q-btn flat dense round icon="logout" aria-label="Logout" @click="handleSignOut" />
      </q-toolbar>
    </q-header>

    <NavigationDrawer v-model="leftDrawerOpen" />

    <q-page-container>
      <div class="content-wrapper">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'src/boot/supabase'
import NavigationDrawer from 'components/NavigationDrawer.vue'

const $q = useQuasar()
const leftDrawerOpen = ref(false)

onMounted(() => {
  leftDrawerOpen.value = !$q.platform.is.mobile
})

watch(() => $q.screen.width, () => {
  leftDrawerOpen.value = !$q.platform.is.mobile
})

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

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

.content-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
}

@media (max-width: 599px) {
  .content-wrapper {
    padding: 0 8px;
  }
}
</style>
