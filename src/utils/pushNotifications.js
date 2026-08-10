import { supabase } from 'src/boot/supabase'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

const isStandalonePwa = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export const pushPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

export const pushSupportStatus = () => {
  if (!('serviceWorker' in navigator)) return { supported: false, reason: 'Service workers are not supported here.' }
  if (!('PushManager' in window)) return { supported: false, reason: 'Push notifications are not supported here.' }
  if (!('Notification' in window)) return { supported: false, reason: 'Notifications are not supported here.' }
  if (!pushPublicKey) return { supported: false, reason: 'Missing VITE_VAPID_PUBLIC_KEY.' }

  const ua = window.navigator.userAgent || ''
  const isiOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
  if (isiOS && !isStandalonePwa()) {
    return {
      supported: false,
      reason: 'On iPhone or iPad, install My Mustard Seeds to your Home Screen before enabling reminders.',
    }
  }

  return { supported: true, reason: '' }
}

export const getPushRegistration = async () => {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export const enablePushNotifications = async () => {
  const status = pushSupportStatus()
  if (!status.supported) throw new Error(status.reason)

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription() ||
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(pushPublicKey),
    })

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: session.user.id,
      endpoint: subscription.endpoint,
      subscription: subscription.toJSON(),
      user_agent: window.navigator.userAgent,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )

  if (error) throw error
  return subscription
}

export const disablePushNotifications = async () => {
  const subscription = await getPushRegistration()
  if (subscription) {
    await supabase
      .from('push_subscriptions')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }
}
