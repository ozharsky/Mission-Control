// Service Worker for Mission Control V5
// Provides offline support and caching

const CACHE_NAME = 'mission-control-v5-cache-v124'
const STATIC_ASSETS = [
  './',
  './index.html',
  './js/app.js',
  './js/config.js',
  './js/firebase.js',
  './js/namespace.js',
  './js/state/store.js',
  './js/state/local.js',
  './js/state/undo.js',
  './js/state/safeSection.js',
  './js/utils/cache.js',
  './js/utils/dom.js',
  './js/utils/lazyLoader.js',
  './js/utils/storageManager.js',
  './js/utils/errorTracker.js',
  './js/utils/focusManager.js',
  './js/utils/animations.js',
  './js/utils/performance.js',
  './js/utils/accessibility.js',
  './js/utils/touchFeedback.js',
  './js/utils/mobileInteractions.js',
  './js/components/Button.js',
  './js/components/Card.js',
  './js/components/Input.js',
  './js/components/Badge.js',
  './js/components/Navigation.js',
  './js/components/Toast.js',
  './js/components/LoadingStates.js',
  './js/components/MobileNav.js',
  './js/components/Skeleton.js',
  './js/components/ErrorBoundary.js',
  './js/sections/Dashboard.js',
  './js/sections/Inventory.js',
  './js/sections/Jobs.js',
  './js/sections/Calendar.js',
  './js/sections/Settings.js',
  './css/styles.css',
  './css/animations.css',
  './css/mobile-optimizations.css',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/navigation.css',
  './css/modal.css',
  './css/utilities.css',
  './css/toast.css',
  './css/skeleton.css',
  './css/kanban.css',
  './css/calendar-views.css',
  './css/dragdrop.css',
  './css/print.css',
  './css/empty-states.css',
  './css/progress.css',
  './css/pagination.css',
  './css/bulk.css',
  './css/tooltips.css',
  './css/ui-components.css',
  './css/hover-effects.css',
  './css/scroll-animations.css',
  './css/performance.css',
  './css/file-storage.css',
  './css/mobile-visual.css',
  './css/mobile-nav.css',
  './css/accessibility.css',
  './css/animations-utilities.css',
  './css/color-system.css',
  './css/layout.css',
  './css/spacing-system.css',
  './css/design-system.css',
  './css/loading-states.css',
  './css/focus-styles.css',
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
        // Cache assets individually to handle failures gracefully
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: 'no-cache' })
            if (response.ok) {
              await cache.put(asset, response)
              return { asset, success: true }
            } else {
              console.warn(`⚠️ Failed to cache ${asset}: ${response.status}`)
              return { asset, success: false, status: response.status }
            }
          } catch (err) {
            console.warn(`⚠️ Error caching ${asset}:`, err.message)
            return { asset, success: false, error: err.message }
          }
        })
        return Promise.all(cachePromises)
      })
      .then((results) => {
        const successful = results.filter(r => r.success).length
        const failed = results.filter(r => !r.success).length
        console.log(`✅ Static assets cached: ${successful} success, ${failed} failed`)
        return self.skipWaiting()
      })
      .catch(err => {
        console.error('❌ Cache initialization failed:', err)
        // Continue with activation even if caching fails
        return self.skipWaiting()
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
    // Network-first for external resources with timeout
    if (isExternalResource(request)) {
      event.respondWith(networkWithTimeout(request, 5000))
      return
    }
    return
  }
  
  // Strategy: Images - Cache first with network fallback
  if (isImage(request)) {
    event.respondWith(cacheFirstWithNetworkFallback(request))
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
  return request.url.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i)
}

// Check if request is for source map (suppress 404 errors)
function isSourceMap(request) {
  return request.url.endsWith('.map')
}

// Check if request is for external resource
function isExternalResource(request) {
  const externalPatterns = [
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
    /cdn\.jsdelivr\.net/,
    /cdnjs\.cloudflare\.com/
  ]
  return externalPatterns.some(pattern => pattern.test(request.url))
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = request.url
  // Skip URLs with query parameters for static asset check
  const urlWithoutQuery = url.split('?')[0]
  const staticExtensions = ['.css', '.js', '.woff', '.woff2']
  return staticExtensions.some(ext => urlWithoutQuery.endsWith(ext))
}

// Check if request is for data
function isDataRequest(request) {
  return request.url.includes('/api/') || request.headers.get('Accept')?.includes('application/json')
}

// Network with timeout fallback
async function networkWithTimeout(request, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
  })
  
  try {
    const response = await Promise.race([fetch(request), timeoutPromise])
    return response
  } catch (error) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached
    throw error
  }
}

// Cache First with network fallback for images
async function cacheFirstWithNetworkFallback(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  
  if (cached) {
    // Return cached version immediately but update in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response)
      }
    }).catch(() => {})
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('', { status: 204 })
  }
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
