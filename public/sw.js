self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  clients.claim()
})

// Optional: basic fetch passthrough (can be extended for offline)
self.addEventListener('fetch', (event) => {
  // Default network-first
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503, statusText: 'Offline' })
    })
  )
})
