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
              <AppLogoMark class="header-logo-mark" />
              <span class="header-title-text">My Mustard <em>Seeds</em></span>
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

          <q-btn
            v-if="$q.screen.lt.md"
            flat
            dense
            round
            icon="inventory_2"
            data-tour="nav-resources"
            aria-label="Resources"
            :class="['header-icon-btn', { 'header-icon-btn--active': route.path === '/resources' }]"
            @click="router.push('/resources')"
          >
            <q-tooltip>Resources</q-tooltip>
          </q-btn>
          <q-btn flat dense round :icon="themeIcon" data-tour="theme-toggle" aria-label="Toggle theme"
            @click="toggleTheme">
            <q-tooltip>{{ themeLabel }} — click to change</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="groups"
            aria-label="Prayer context"
            :loading="sharedPrayerContextsStore.loading"
          >
            <q-tooltip>Prayer context: {{ activePrayerContextLabel }}</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
              <q-list class="context-menu">
                <q-item-label header>Prayer Context</q-item-label>
                <q-item
                  v-for="option in prayerContextOptions"
                  :key="option.id"
                  clickable
                  v-close-popup
                  :active="option.id === sharedPrayerContextsStore.activeContextId"
                  active-class="translation-menu-item--active"
                  @click="setPrayerContext(option.id)"
                >
                  <q-item-section avatar>
                    <q-icon :name="option.icon" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ option.label }}</q-item-label>
                    <q-item-label caption>{{ option.description }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="option.id === sharedPrayerContextsStore.activeContextId" side>
                    <q-icon name="check" color="primary" />
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="showCreateSharedGroupDialog = true">
                  <q-item-section avatar>
                    <q-icon name="group_add" color="primary" />
                  </q-item-section>
                  <q-item-section>Create Shared Group</q-item-section>
                </q-item>
                <q-item
                  v-if="canCopyInviteLink"
                  clickable
                  v-close-popup
                  @click="copyActiveInviteLink"
                >
                  <q-item-section avatar>
                    <q-icon name="link" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Copy Invite Link</q-item-label>
                    <q-item-label caption>{{ sharedPrayerContextsStore.activeGroup?.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="menu_book"
            aria-label="Bible translation"
            :loading="savingBibleTranslation"
          >
            <q-tooltip>Bible translation: {{ activeBibleTranslation.abbreviation }}</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
              <q-list class="translation-menu">
                <q-item-label header>Passage Translation</q-item-label>
                <q-item
                  v-for="option in bibleTranslationOptions"
                  :key="bibleOptionKey(option)"
                  clickable
                  v-close-popup
                  :active="bibleOptionKey(option) === bibleOptionKey(activeBibleTranslation)"
                  active-class="translation-menu-item--active"
                  @click="setBibleTranslation(option)"
                >
                  <q-item-section>
                    <q-item-label>{{ option.abbreviation }}</q-item-label>
                    <q-item-label caption>{{ option.description }}</q-item-label>
                  </q-item-section>
                  <q-item-section v-if="bibleOptionKey(option) === bibleOptionKey(activeBibleTranslation)" side>
                    <q-icon name="check" color="primary" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
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

  <q-dialog v-model="showCreateSharedGroupDialog">
    <q-card style="width: 92vw; max-width: 420px">
      <q-card-section>
        <div class="text-h6">Create Shared Prayer Group</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Anyone with the invite link can join this shared prayer context.
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          v-model="newSharedGroupName"
          outlined
          dense
          label="Group name"
          autofocus
          @keyup.enter="createSharedGroup"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Create"
          icon="group_add"
          :loading="creatingSharedGroup"
          :disable="!newSharedGroupName.trim()"
          @click="createSharedGroup"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useThemeMode } from 'src/composables/useThemeMode'
import { useAuthStore } from 'src/stores/auth'
import { useUserPreferencesStore } from 'src/stores/userPreferences'
import { useSharedPrayerContextsStore } from 'stores/sharedPrayerContexts'
import { useProfileStore } from 'stores/profile'
import { useTutorialStore } from 'stores/tutorial'
import {
  BIBLE_TRANSLATION_OPTIONS,
  bibleOptionKey,
  findBibleTranslationOption,
} from 'src/constants/bibleTranslations'
import BottomNavBar from 'components/BottomNavBar.vue'
import TutorialStartDialog from 'components/TutorialStartDialog.vue'
import AppLogoMark from 'components/AppLogoMark.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const { themeIcon, themeLabel, initTheme, toggleTheme } = useThemeMode()
const authStore = useAuthStore()
const userPreferencesStore = useUserPreferencesStore()
const sharedPrayerContextsStore = useSharedPrayerContextsStore()
const profileStore = useProfileStore()
const tutorialStore = useTutorialStore()

const showWelcomeDialog = ref(false)
const savingBibleTranslation = ref(false)
const showCreateSharedGroupDialog = ref(false)
const newSharedGroupName = ref('')
const creatingSharedGroup = ref(false)
const bibleTranslationOptions = BIBLE_TRANSLATION_OPTIONS
const activeBibleTranslation = computed(() =>
  findBibleTranslationOption(userPreferencesStore.bibleTranslation),
)
const prayerContextOptions = computed(() => sharedPrayerContextsStore.contextOptions)
const activePrayerContextLabel = computed(() =>
  sharedPrayerContextsStore.isPersonalContext
    ? 'Personal'
    : sharedPrayerContextsStore.activeGroup?.name || 'Shared',
)
const canCopyInviteLink = computed(() =>
  !!sharedPrayerContextsStore.activeGroup
  && ['owner', 'admin'].includes(sharedPrayerContextsStore.activeMembership?.role),
)

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

const setBibleTranslation = async (option) => {
  if (bibleOptionKey(option) === bibleOptionKey(activeBibleTranslation.value)) return

  savingBibleTranslation.value = true
  try {
    await userPreferencesStore.setBibleTranslation({
      provider: option.provider,
      bibleId: option.bibleId,
      label: option.label,
      abbreviation: option.abbreviation,
    })
    $q.notify({ type: 'positive', message: `${option.abbreviation} selected` })
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save Bible translation' })
  } finally {
    savingBibleTranslation.value = false
  }
}

const setPrayerContext = (contextId) => {
  sharedPrayerContextsStore.setActiveContext(contextId)
  if (route.path === '/') {
    router.replace({ path: '/', query: { ...route.query, tab: 'prayers' } })
  }
}

const copyInviteLink = async (group) => {
  const url = sharedPrayerContextsStore.inviteUrlForGroup(group)
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    $q.notify({ type: 'positive', message: 'Invite link copied' })
  } catch {
    $q.notify({ type: 'warning', message: 'Invite link ready', caption: url })
  }
}

const copyActiveInviteLink = () => copyInviteLink(sharedPrayerContextsStore.activeGroup)

const createSharedGroup = async () => {
  const name = newSharedGroupName.value.trim()
  if (!name) return

  creatingSharedGroup.value = true
  try {
    const group = await sharedPrayerContextsStore.createGroup(name)
    showCreateSharedGroupDialog.value = false
    newSharedGroupName.value = ''
    $q.notify({ type: 'positive', message: `${group.name} created` })
    await copyInviteLink(group)
    router.push({ path: '/', query: { tab: 'prayers' } })
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message || 'Failed to create shared group' })
  } finally {
    creatingSharedGroup.value = false
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
  sharedPrayerContextsStore.loadGroups()

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

.header-logo-mark {
  width: 34px;
  height: 35px;
  flex: none;
  color: #fffdf8;
  margin-right: 10px;
}

.header-title-text {
  font-family: Georgia, 'Iowan Old Style', 'Palatino Linotype', serif;
  font-size: 1.3rem;
  letter-spacing: 0.01em;
  color: #fffdf8;
  white-space: nowrap;
}

.header-title-text em {
  font-style: italic;
  font-weight: 400;
  color: #f6e4c0;
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

.header-icon-btn {
  color: rgba(255, 255, 255, 0.9);
}

.header-icon-btn--active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.16);
}

.translation-menu,
.context-menu {
  min-width: 260px;
}

.translation-menu-item--active {
  background: var(--color-surface-muted);
  color: var(--color-text);
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
