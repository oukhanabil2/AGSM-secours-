// sw.js - Service Worker pour SGA v8.0 
         //  FINAL //
const CACHE_NAME = 'sga-v8.0';
const urlsToCache = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './manifest.json',
    './logo.png',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    console.log('🔧 Service Worker - Installation');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Mise en cache des ressources');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('❌ Erreur cache:', err))
    );
    // Force l'activation immédiate
    self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker - Activation');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Ancien cache supprimé:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Prend le contrôle immédiatement
    return self.clients.claim();
});

// Gestion des requêtes réseau
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    
    // Stratégie : Cache d'abord (network fallback) pour les ressources statiques
    if (requestUrl.origin === self.location.origin) {
        // Pour les ressources locales (HTML, JS, CSS, etc.)
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request)
                        .then(response => {
                            // Mettre en cache les nouvelles ressources
                            if (response && response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, responseClone));
                            }
                            return response;
                        })
                        .catch(() => {
                            // Page hors ligne personnalisée
                            if (event.request.mode === 'navigate') {
                                return caches.match('./index.html');
                            }
                            return new Response('Hors ligne', { status: 503 });
                        });
                })
        );
    } else {
        // Pour les ressources externes (CDN) - stratégie réseau d'abord
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    }
});

// Gestion des erreurs
self.addEventListener('error', (error) => {
    console.error('❌ Erreur SW:', error);
});
