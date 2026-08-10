import { register } from 'register-service-worker'
import { Notify } from 'quasar'

let updatePromptVisible = false

const applyWaitingUpdate = (registration) => {
  if (!registration?.waiting) return
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}

const promptForUpdate = (registration) => {
  if (!registration?.waiting || updatePromptVisible) return

  updatePromptVisible = true
  Notify.create({
    type: 'info',
    message: 'Update available',
    timeout: 0,
    actions: [
      {
        label: 'Refresh',
        color: 'white',
        handler: () => applyWaitingUpdate(registration),
      },
      {
        label: 'Later',
        color: 'white',
        handler: () => {
          updatePromptVisible = false
        },
      },
    ],
  })
}

const watchForUpdates = (registration) => {
  if (!registration) return

  registration.update()
  if (registration.waiting) promptForUpdate(registration)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration.update()
  })
}

let refreshing = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return
  refreshing = true
  window.location.reload()
})

register(process.env.SERVICE_WORKER_FILE, {
  ready () {
    // Service worker is active.
  },

  registered (registration) {
    watchForUpdates(registration)
  },

  cached () {
    // App shell has been cached for offline use.
  },

  updatefound () {
    // New content is downloading.
  },

  updated (registration) {
    promptForUpdate(registration)
  },

  offline () {
    // App is running without a network connection.
  },

  error (err) {
    console.error('Service worker registration failed:', err)
  }
})
