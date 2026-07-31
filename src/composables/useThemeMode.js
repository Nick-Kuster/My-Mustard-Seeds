import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useUserPreferencesStore } from 'src/stores/userPreferences'

const ICONS = { light: 'light_mode', dark: 'dark_mode' }
const LABELS = { light: 'Light', dark: 'Dark' }

// Central place that applies the theme ('light' | 'dark', a plain on/off —
// no "follow system" option) via Quasar's Dark plugin. Persistence goes
// through the user_preferences store, same as journal order.
export const useThemeMode = () => {
  const $q = useQuasar()
  const preferencesStore = useUserPreferencesStore()

  const applyMode = (mode) => {
    $q.dark.set(mode === 'dark')
  }

  // Loads the saved preference (if not already loaded elsewhere) and
  // applies it — call once, e.g. from MainLayout's onMounted.
  const initTheme = async () => {
    await preferencesStore.load()
    applyMode(preferencesStore.themeMode)
  }

  const setTheme = async (mode) => {
    applyMode(mode)
    try {
      await preferencesStore.setThemeMode(mode)
    } catch {
      // Applied locally regardless; a failed save just means it won't
      // stick on the next visit.
    }
  }

  const toggleTheme = () => setTheme(preferencesStore.themeMode === 'dark' ? 'light' : 'dark')

  const themeMode = computed(() => preferencesStore.themeMode)
  const themeIcon = computed(() => ICONS[themeMode.value])
  const themeLabel = computed(() => LABELS[themeMode.value])

  return { themeMode, themeIcon, themeLabel, initTheme, setTheme, toggleTheme }
}
