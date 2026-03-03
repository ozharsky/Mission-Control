// Service Worker for Mission Control V4
// Provides offline support and caching

const CACHE_NAME = 'mission-control-v4-cache-v29'
const STATIC_ASSETS = [
  './',
  './index.html',
  './main.js',
  './js/config.js',
  './js/namespace.js',
  './js/state/store.js',
  './js/state/local.js',
  './js/state/undo.js',
  './js/storage/sync.js',
  './css/variables.css',
  './css/ui-components.css',
  './css/base.css',
  './css/components.css',
  './css/navigation.css',
  './css/modal.css',
  './css/utilities.css',
  './css/toast.css',
  './css/skeleton.css',
  './css/animations.css',
  './css/kanban.css',
  './css/calendar-views.css',
  './css/dragdrop.css',
  './css/print.css',
  './css/empty-states.css',
  './css/progress.css',
  './css/pagination.css',
  './css/search.css',
  './css/bulk.css',
  './css/tooltips.css',
  './css/scoping.css',
  './css/mobile-visual.css',
  './favicon.svg',
  './site.webmanifest'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ Static assets cached')
        return self.skipWaiting()
      })
      .catch(err => {
        console.error('❌ Cache failed:', err)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('🗑️ Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        console.log('✅ Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip external requests (CDNs, APIs)
  if (url.origin !== self.location.origin) {
    // Silently ignore source map 404s from CDNs
    if (isSourceMap(request)) {
      event.respondWith(new Response('', { status: 204 }))
      return
    }
    return
  }
  
  // Strategy: Images - Network only (no caching)
  if (isImage(request)) {
    event.respondWith(fetch(request))
    return
  }
  
  // Strategy: Cache First for static assets
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request))
    return
  }
  
  // Strategy: Network First for data
  if (isDataRequest(request)) {
    event.respondWith(networkFirst(request))
    return
  }
  
  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request))
})

// Check if request is for an image
function isImage(request) {
  return request.url.match(/\.(png|jpg|jpeg|gif|webp)$/i)
}

// Check if request is for source map (suppress 404 errors)
function isSourceMap(request) {
  return request.url.endsWith('.map')
}

// Check if request is for static asset
function isStaticAsset(request) {
  const staticExtensions = ['.css', '.js', '.woff', '.woff2']
  return staticExtensions.some(ext => request.url.endsWith(ext))
}

// Check if request is for data
function isDataRequest(request) {
  return request.url.includes('/api/') || request.headers.get('Accept')?.includes('application/json')
}

// Cache First strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  
  if (cached) {
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('Fetch failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network First strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache...')
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Network with cache fallback
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    throw error
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  console.log('🔄 Syncing data...')
  // This would sync any queued operations
  // Implementation depends on your offline queue system
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Mission Control', {
      body: data.body || 'New notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data
    })
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/')
  )
})
