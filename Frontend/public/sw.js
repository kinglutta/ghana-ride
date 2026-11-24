/* YENKO PWA service worker — offline app shell (100% free, no Workbox needed) */

const CACHE_NAME = 'yenko-v2';
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/icon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    const isAppShell = APP_SHELL.includes(url.pathname) || request.mode === 'navigate';
    const isHashedAsset = url.pathname.startsWith('/assets/');

    // Never cache dev modules, API calls, or anything else outside the app shell / built assets.
    if (!isAppShell && !isHashedAsset) return;

    // Network-first: deployed updates take effect immediately; cached copy is an offline fallback.
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request).then((cached) => cached || (isAppShell ? caches.match('/index.html') : undefined)))
    );
});
