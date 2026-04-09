// EDTech Service Worker — Cache-first for static, Network-first for API
const CACHE_NAME = 'edtech-v1';

// 靜態資源（首次安裝時預快取）
const PRECACHE = [
  '/question-detective',
];

// 安裝：預快取核心頁面
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// 啟動：清理舊快取
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Supabase API — 永遠走網路（不快取機密資料）
  if (url.hostname.includes('supabase')) return;

  // 靜態資源（JS/CSS/圖片/字型）— Cache-first
  if (
    e.request.destination === 'script' ||
    e.request.destination === 'style' ||
    e.request.destination === 'image' ||
    e.request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 頁面導航 — Network-first（確保最新），失敗時用快取
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
});
