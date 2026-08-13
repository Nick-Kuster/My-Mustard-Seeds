import { ref } from 'vue'

const DISMISSED_KEY = 'my-mustard-seeds:pwa-install-dismissed'

const deferredPrompt = ref(null)
const promptAvailable = ref(false)
const installed = ref(false)
let listenersRegistered = false

export const isStandalonePwa = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export const isIOSDevice = () => {
  const ua = window.navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
}

export const isIOSSafari = () => {
  const ua = window.navigator.userAgent || ''
  return isIOSDevice() && /Safari/i.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(ua)
}

export const isMobileDevice = () => {
  const ua = window.navigator.userAgent || ''
  return window.matchMedia?.('(pointer: coarse) and (max-width: 900px)').matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
}

export const isInstallPromptDismissed = () =>
  window.localStorage.getItem(DISMISSED_KEY) === 'true'

export const setInstallPromptDismissed = (dismissed) => {
  if (dismissed) window.localStorage.setItem(DISMISSED_KEY, 'true')
  else window.localStorage.removeItem(DISMISSED_KEY)
}

export const registerPwaInstallPromptListeners = () => {
  if (listenersRegistered || typeof window === 'undefined') return
  listenersRegistered = true
  installed.value = isStandalonePwa()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event
    promptAvailable.value = true
  })

  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferredPrompt.value = null
    promptAvailable.value = false
  })
}

export const pwaInstallPromptState = () => ({
  deferredPrompt,
  promptAvailable,
  installed,
})

export const promptForPwaInstall = async () => {
  if (!deferredPrompt.value) return null
  const prompt = deferredPrompt.value
  deferredPrompt.value = null
  promptAvailable.value = false
  await prompt.prompt()
  return prompt.userChoice
}
