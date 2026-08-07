<template>
  <!-- Background image wrapper -->
  <div class="bg-wrapper">
    <q-img src="bg.png" class="fixed-full" style="min-height: 100vh" repeat />
  </div>

  <!-- Main layout container -->
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="app-header">
      <q-toolbar class="app-toolbar">
        <!-- On very wide screens the bar itself still spans edge to edge,
             but its content stays capped and centered so the logo and the
             nav/logout aren't stretched far apart from each other. -->
        <div class="app-toolbar-inner">
          <q-toolbar-title>
            <router-link to="/" class="text-white text-decoration-none header-link">
              <q-avatar size="32px" class="header-logo-badge">
                <img src="icons/favicon-32x32.png" alt="" class="header-logo" />
              </q-avatar>
              <span class="header-title-text">My Mustard Seeds</span>
              <q-icon size="xs" class="q-ml-sm header-cross fa-solid fa-cross" />
            </router-link>
          </q-toolbar-title>

          <!-- Desktop nav: the side drawer no longer exists, so this is the
               only way to reach anything besides Home on larger screens -->
          <div v-if="$q.screen.gt.sm" class="header-nav">
            <router-link v-for="link in navLinks" :key="link.to" :to="link.to" custom
              v-slot="{ navigate, isExactActive }">
              <q-btn
                flat no-caps dense
                :data-tour="link.tour"
                :class="['header-nav-btn', { 'header-nav-btn--active': isExactActive }]"
                @click="navigate"
              >
                <q-icon :name="link.icon" size="18px" class="q-mr-xs" />
                {{ link.label }}
              </q-btn>
            </router-link>
          </div>

          <q-btn flat dense round :icon="themeIcon" data-tour="theme-toggle" aria-label="Toggle theme"
            @click="toggleTheme">
            <q-tooltip>{{ themeLabel }} — click to change</q-tooltip>
          </q-btn>
          <q-btn flat dense round icon="logout" aria-label="Logout" @click="handleSignOut" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="content-wrapper">
        <router-view />
      </div>
    </q-page-container>

    <BottomNavBar />
  </q-layout>

  <TutorialStartDialog v-model="showWelcomeDialog" ask-name />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useThemeMode } from 'src/composables/useThemeMode'
import { useAuthStore } from 'src/stores/auth'
import { useProfileStore } from 'stores/profile'
import { useTutorialStore } from 'stores/tutorial'
import BottomNavBar from 'components/BottomNavBar.vue'
import TutorialStartDialog from 'components/TutorialStartDialog.vue'

const $q = useQuasar()
const router = useRouter()
const { themeIcon, themeLabel, initTheme, toggleTheme } = useThemeMode()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const tutorialStore = useTutorialStore()

const showWelcomeDialog = ref(false)

const navLinks = [
  { to: '/', icon: 'home', label: 'Home', tour: 'nav-home' },
  { to: '/entry/new', icon: 'agriculture', label: 'Plant a Seed', tour: 'nav-plant' },
  { to: '/search', icon: 'search', label: 'Search', tour: 'nav-search' },
  { to: '/resources', icon: 'inventory_2', label: 'Resources', tour: 'nav-resources' },
  { to: '/settings', icon: 'settings', label: 'Settings', tour: 'nav-settings' },
]

const handleSignOut = async () => {
  // A tour still active mid-logout would otherwise leave its overlay
  // dangling over whatever renders next (the login page).
  if (tutorialStore.active) tutorialStore.stop()

  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Error signing out',
      caption: error.message
    })
  }
}

// MainLayout mounts on every full page load/refresh (Vue Router doesn't
// remount it for in-app navigation), so gating on sessionStorage rather
// than just "did this component mount" keeps the greeting to once per
// browser session — refreshing the page won't show it again, but a fresh
// tab/session will.
const WELCOME_TOAST_KEY = 'welcomeToastShown'

onMounted(async () => {
  initTheme()

  try {
    await profileStore.fetchProfile()
    if (!profileStore.profile?.onboarded) {
      showWelcomeDialog.value = true
    } else if (profileStore.profile.first_name && !sessionStorage.getItem(WELCOME_TOAST_KEY)) {
      $q.notify({ type: 'positive', message: `Welcome back, ${profileStore.profile.first_name}!` })
      sessionStorage.setItem(WELCOME_TOAST_KEY, '1')
    }
  } catch {
    // First-login prompt/greeting are a nice-to-have, not core app
    // function — a failed profile fetch shouldn't block anything else.
  }
})
</script>

<style scoped>
.bg-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.app-header {
  background: linear-gradient(135deg, #8ba192 0%, #7c9082 55%, #66795e 100%);
}

body.body--dark .app-header {
  background: linear-gradient(135deg, #5c6e62 0%, #4f5c52 55%, #3d473b 100%);
}

.app-toolbar {
  min-height: 60px;
  padding: 0 12px;
}

.app-toolbar-inner {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.app-toolbar-inner :deep(.q-toolbar__title) {
  flex: 1;
}

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

.header-logo-badge {
  background: rgba(255, 253, 248, 0.95);
  padding: 4px;
  margin-right: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.header-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
}

.header-nav-btn {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8rem;
  font-weight: 600;
}

.header-nav-btn--active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
}

.header-title-text {
  font-weight: 800;
  font-size: 1.2rem;
  letter-spacing: 0.02em;
}

.header-cross {
  opacity: 0.85;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

@media (max-width: 599px) {
  .content-wrapper {
    padding: 0 8px;
  }
}
</style>
