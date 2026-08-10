self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() || {}
  } catch {
    data = {}
  }

  const title = data.title || 'Prayer follow-up'
  const options = {
    body: data.body || 'You have prayer follow-ups ready to revisit.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/favicon-96x96.png',
    tag: data.tag || 'prayer-follow-up',
    data: {
      url: data.url || '/?tab=prayers',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/?tab=prayers'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((client) => client.url.includes(url))
      if (matchingClient) return matchingClient.focus()
      return self.clients.openWindow(url)
    }),
  )
})
