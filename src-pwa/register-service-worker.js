import { register } from 'register-service-worker'

register(process.env.SERVICE_WORKER_FILE, {
  ready () {
    // Service worker is active.
  },

  registered () {
    // Service worker has been registered.
  },

  cached () {
    // App shell has been cached for offline use.
  },

  updatefound () {
    // New content is downloading.
  },

  updated () {
    // New content is available after refresh.
  },

  offline () {
    // App is running without a network connection.
  },

  error (err) {
    console.error('Service worker registration failed:', err)
  }
})
