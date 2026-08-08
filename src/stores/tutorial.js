import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { MAIN_TOUR_STEPS } from 'src/constants/tutorialSteps'
import { useJournalStore } from 'src/stores/journalData'
import { useSavedFiltersStore } from 'src/stores/savedFilters'
import { usePrayerRequestsStore } from 'src/stores/prayerRequests'
import { usePrayerRequestGroupsStore } from 'src/stores/prayerRequestGroups'
import { useTestimonyStore } from 'src/stores/testimony'
import { useResourcesStore } from 'src/stores/resources'
import { useDemoDataStore, DEMO_TESTIMONY } from 'src/stores/demoData'
import { demoModeActive } from 'src/utils/demoMode'

// Coordinates the guided product tour AND owns the driver.js instance.
// This lives in a Pinia store (a true app-wide singleton) rather than a
// plain composable — the tour is started from more than one component
// (the first-login dialog in MainLayout, "Replay Tour" in Settings), and a
// plain composable would give each of those its own independent driver.js
// instance instead of sharing one, since each call to a composable creates
// fresh closure state.
//
// pendingAction is how a step asks some other page/component to do
// something (open the Filter modal) without the tour engine needing to
// know that component exists — see SearchPage.vue's watcher on it.
export const useTutorialStore = defineStore('tutorial', () => {
  // Must be called here, synchronously during the store's own setup (which
  // itself runs nested inside whichever component's setup() first triggers
  // this store's creation) — useRouter/useRoute rely on Vue's injection
  // context, which isn't available later when start() runs from a click
  // handler, well outside any component's setup call stack.
  const router = useRouter()
  const route = useRoute()
  const journalStore = useJournalStore()
  const savedFiltersStore = useSavedFiltersStore()
  const prayerRequestsStore = usePrayerRequestsStore()
  const prayerRequestGroupsStore = usePrayerRequestGroupsStore()
  const testimonyStore = useTestimonyStore()
  const resourcesStore = useResourcesStore()
  const demoDataStore = useDemoDataStore()

  const active = ref(false)
  const track = ref('quick')
  const stepIndex = ref(0)
  const pendingAction = ref(null)

  let driverObj = null

  // Set only while a "Show with sample data" demo run is active — holds
  // the real data so it can come back exactly as it was, regardless of
  // whether the tour finishes naturally or gets closed early (both paths
  // go through onDestroyed below).
  let realDataSnapshot = null

  const seedDemoData = async () => {
    await demoDataStore.fetchDemoData()
    realDataSnapshot = {
      entries: journalStore.decryptedEntries,
      savedFilters: savedFiltersStore.filters,
      selectedFacets: journalStore.selectedFacets,
      prayerRequests: prayerRequestsStore.requests,
      prayerGroups: prayerRequestGroupsStore.groups,
      testimonyContent: testimonyStore.content,
      testimonyLoaded: testimonyStore.loaded,
      resources: resourcesStore.resources,
    }
    journalStore.decryptedEntries = demoDataStore.demoEntries
    savedFiltersStore.filters = demoDataStore.demoSavedFilters
    journalStore.clearFacets()
    prayerRequestsStore.requests = demoDataStore.demoPrayerRequests
    prayerRequestGroupsStore.groups = demoDataStore.demoPrayerGroups
    // loaded=true stops TestimonyEditor.vue's onMounted call to
    // testimonyStore.load() from immediately overwriting this with the
    // real (or blank) testimony — see useTestimonyStore's own guard.
    testimonyStore.content = DEMO_TESTIMONY
    testimonyStore.loaded = true
    resourcesStore.resources = demoDataStore.demoResources
    // Blocks every table write app-wide for the duration of the demo (see
    // src/boot/supabase.js) — a presenter clicking a real Save/Delete
    // button during a demo shouldn't be able to write to the real account.
    demoModeActive.value = true
  }

  const restoreRealData = () => {
    if (!realDataSnapshot) return
    journalStore.decryptedEntries = realDataSnapshot.entries
    savedFiltersStore.filters = realDataSnapshot.savedFilters
    journalStore.selectedFacets = realDataSnapshot.selectedFacets
    prayerRequestsStore.requests = realDataSnapshot.prayerRequests
    prayerRequestGroupsStore.groups = realDataSnapshot.prayerGroups
    testimonyStore.content = realDataSnapshot.testimonyContent
    testimonyStore.loaded = realDataSnapshot.testimonyLoaded
    resourcesStore.resources = realDataSnapshot.resources
    realDataSnapshot = null
    demoModeActive.value = false
  }

  const requestAction = (action) => {
    pendingAction.value = action
  }

  const clearAction = () => {
    pendingAction.value = null
  }

  const waitForFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()))

  const waitForStepElement = async (step) => {
    if (!step?.selector || typeof document === 'undefined') return
    if (document.querySelector(step.selector)) return

    const timeoutMs = step.waitForElement ?? 2000
    if (timeoutMs <= 0) return

    await new Promise((resolve) => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        observer.disconnect()
        window.clearTimeout(timeout)
        resolve()
      }

      const observer = new MutationObserver(() => {
        if (document.querySelector(step.selector)) finish()
      })
      const timeout = window.setTimeout(finish, timeoutMs)
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true })
    })
  }

  const navigateForStep = async (step) => {
    if (!step?.page) return
    await router.push(step.page)
    await nextTick()
    await waitForFrame()
    await waitForStepElement(step)
  }

  const buildDriveSteps = (rawSteps) =>
    rawSteps.map((raw, i) => {
      const next = rawSteps[i + 1]
      const prev = rawSteps[i - 1]
      const needsForwardNav = Boolean(next && next.page !== raw.page)
      const needsBackwardNav = Boolean(prev && prev.page !== raw.page)

      const popover = { title: raw.title, description: raw.description }

      if (raw.onAdvance || needsForwardNav) {
        popover.onNextClick = async (element, step, opts) => {
          if (raw.onAdvance) {
            requestAction(raw.onAdvance)
            await nextTick()
          }
          if (needsForwardNav) {
            await navigateForStep(next)
          }
          opts.driver.moveTo(i + 1)
        }
      }

      // Reversing onAdvance (e.g. re-closing the filter modal) isn't
      // handled going backward — a low-stakes gap since backing up
      // mid-tour is rare, and the modal being open either way doesn't
      // break anything, just leaves state slightly out of step with the
      // popover text until Next is clicked again.
      if (needsBackwardNav) {
        popover.onPrevClick = async (element, step, opts) => {
          await navigateForStep(prev)
          opts.driver.moveTo(i - 1)
        }
      }

      return {
        element: raw.selector,
        popover,
        waitForElement: raw.waitForElement,
        // Defaults on so a step whose target is conditionally rendered
        // (facets/saved filters need data to exist at all) just gets
        // skipped on a brand-new account instead of stalling the tour.
        skipMissingElement: raw.skipMissingElement ?? true,
      }
    })

  const stop = () => {
    driverObj?.destroy()
  }

  const start = async (_selectedTrack, { useDemoData = false } = {}) => {
    const rawSteps = MAIN_TOUR_STEPS

    // Every tour starts from the homepage regardless of where it was
    // launched from (Settings' Replay Tour is on a different page).
    if (route.path !== '/') {
      await router.push('/')
      await nextTick()
    }

    if (useDemoData) {
      await seedDemoData()
    }

    track.value = 'main'
    stepIndex.value = 0
    active.value = true

    driverObj = driver({
      showProgress: true,
      smoothScroll: true,
      stagePadding: 6,
      stageRadius: 8,
      steps: buildDriveSteps(rawSteps),
      onHighlightStarted: (element, step, opts) => {
        stepIndex.value = opts.driver.getActiveIndex() ?? 0
      },
      onDestroyed: () => {
        active.value = false
        pendingAction.value = null
        driverObj = null
        restoreRealData()
      },
    })

    driverObj.drive()
  }

  return { active, track, stepIndex, pendingAction, start, stop, requestAction, clearAction }
})
