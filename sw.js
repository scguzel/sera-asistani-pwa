// Service Worker - Offline çalışma için
const CACHE_NAME = 'sera-asistani-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js'
];

// Install event - cache dosyaları
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - eski cache'leri temizle
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Teachable Machine API istekleri için özel strateji
  if (event.request.url.includes('teachablemachine.withgoogle.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - Model yüklenemedi' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Diğer istekler için cache-first stratejisi
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'de varsa döndür
        if (response) {
          return response;
        }

        // Cache'de yoksa network'ten al
        return fetch(event.request)
          .then((response) => {
            // Geçersiz response kontrolü
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Response'u clone et (bir kez kullanılabilir)
            const responseToCache = response.clone();

            // Yeni dosyayı cache'e ekle
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Network başarısız, offline sayfası göster
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Background sync - Gelecekte eklenebilir
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analyses') {
    console.log('[SW] Background sync triggered');
    // Senkronizasyon işlemleri buraya
  }
});

// Push notification - Gelecekte eklenebilir
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni hastalık uyarısı!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Aç',
        icon: '/icon-72.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/icon-72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Sera Asistanı', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler - App'den mesaj alma
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});