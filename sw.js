/**
 * sw.js - Service Worker para Visor Forestal ACOPAC (PWA offline)
 *
 * Estrategias de caché:
 *   1. App shell (HTML, JS, CSS) → cache-first con actualización en background.
 *   2. Datos (CSV/JSON) → network-first con fallback a caché.
 *   3. Teselas de mapa → cache-first (con límite de almacenamiento).
 *   4. CDN/librerías → cache-first.
 */

const APP_CACHE = 'visor-acopac-shell-v1';
const TILE_CACHE = 'visor-acopac-tiles-v1';
const DATA_CACHE = 'visor-acopac-data-v1';
const LIB_CACHE  = 'visor-acopac-libs-v1';

// Máximo de teselas en caché (~50 MB estimado a ~20 KB/tile)
const MAX_TILE_ENTRIES = 2500;

// Recursos del app shell que se pre-cachean en install
const APP_SHELL = [
    './',
    './index.html',
    './geo.js',
    './manifest.webmanifest'
];

// Librerías CDN que se cachean en primer uso
const CDN_PATTERNS = [
    'unpkg.com/leaflet',
    'cdnjs.cloudflare.com/ajax/libs/leaflet.draw',
    'cdnjs.cloudflare.com/ajax/libs/PapaParse',
    'cdnjs.cloudflare.com/ajax/libs/proj4js',
    'unpkg.com/@mapbox/togeojson',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// Patrones de URLs de teselas de mapa
const TILE_PATTERNS = [
    'mt1.google.com/vt',
    'mt2.google.com/vt',
    'mt3.google.com/vt',
    'tiles.virtualearth.net',
    'ecn.t3.tiles.virtualearth.net',
    'server.arcgisonline.com/ArcGIS',
    'tile.openstreetmap.org'
];

// Patrones de URLs de datos (Google Sheets CSV)
const DATA_PATTERNS = [
    'docs.google.com/spreadsheets',
    'api.allorigins.win',
    'corsproxy.io',
    'api.codetabs.com',
    'script.google.com'
];

// ── Helpers ──────────────────────────────────────────────────────────

function matchesAny(url, patterns) {
    return patterns.some(p => url.includes(p));
}

async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
        // Eliminar las más antiguas (FIFO)
        const toDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(toDelete.map(k => cache.delete(k)));
    }
}

// ── Install: pre-cachear app shell ──────────────────────────────────

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(APP_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: limpiar cachés obsoletas ──────────────────────────────

self.addEventListener('activate', event => {
    const currentCaches = [APP_CACHE, TILE_CACHE, DATA_CACHE, LIB_CACHE];
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(k => !currentCaches.includes(k))
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch: estrategia según tipo de recurso ─────────────────────────

self.addEventListener('fetch', event => {
    const req = event.request;
    const url = req.url;

    // Solo interceptar GET
    if (req.method !== 'GET') return;

    // 1. Teselas de mapa → cache-first
    if (matchesAny(url, TILE_PATTERNS)) {
        event.respondWith(
            caches.open(TILE_CACHE).then(async cache => {
                const cached = await cache.match(req);
                if (cached) return cached;
                try {
                    const res = await fetch(req);
                    if (res.ok) {
                        cache.put(req, res.clone());
                        // Limitar tamaño del caché de teselas
                        trimCache(TILE_CACHE, MAX_TILE_ENTRIES);
                    }
                    return res;
                } catch (e) {
                    // Offline y sin caché: devolver imagen transparente 1x1
                    return new Response(
                        new Uint8Array([
                            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
                            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
                            0x54, 0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02,
                            0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00,
                            0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
                            0x60, 0x82
                        ]),
                        { headers: { 'Content-Type': 'image/png' } }
                    );
                }
            })
        );
        return;
    }

    // 2. Librerías CDN → cache-first
    if (matchesAny(url, CDN_PATTERNS)) {
        event.respondWith(
            caches.open(LIB_CACHE).then(async cache => {
                const cached = await cache.match(req);
                if (cached) return cached;
                try {
                    const res = await fetch(req);
                    if (res.ok) cache.put(req, res.clone());
                    return res;
                } catch (e) {
                    return cached || Response.error();
                }
            })
        );
        return;
    }

    // 3. Datos (CSV, API) → network-first con fallback a caché
    if (matchesAny(url, DATA_PATTERNS)) {
        event.respondWith(
            fetch(req)
                .then(res => {
                    if (res.ok) {
                        const clone = res.clone();
                        caches.open(DATA_CACHE).then(c => c.put(req, clone));
                    }
                    return res;
                })
                .catch(() => caches.match(req))
        );
        return;
    }

    // 4. App shell y otros recursos locales → cache-first con actualización
    if (new URL(url).origin === self.location.origin) {
        event.respondWith(
            caches.match(req).then(cached => {
                const networkFetch = fetch(req).then(res => {
                    if (res.ok) {
                        const clone = res.clone();
                        caches.open(APP_CACHE).then(c => c.put(req, clone));
                    }
                    return res;
                }).catch(() => cached);

                return cached || networkFetch;
            })
        );
        return;
    }
});

// ── Mensaje desde el cliente ────────────────────────────────────────

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Permitir pre-cachear teselas de un área específica
    if (event.data && event.data.type === 'CACHE_TILES') {
        const { urls } = event.data;
        if (urls && urls.length) {
            caches.open(TILE_CACHE).then(cache => {
                urls.forEach(u => {
                    fetch(u).then(res => {
                        if (res.ok) cache.put(u, res);
                    }).catch(() => {});
                });
            });
        }
    }
});
