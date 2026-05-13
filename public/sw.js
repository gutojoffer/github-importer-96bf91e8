const CACHE_STATIC = 'bladex-static-v1';
const CACHE_DYNAMIC = 'bladex-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/sobre',
  '/ranking',
  '/beyblade-x',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_STATIC && key !== CACHE_DYNAMIC)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname.includes('supabase.co')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
    );
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }
});

self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const {
    title = 'BLADEX',
    body = 'Nova notificação',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/badge-72x72.png',
    tag = 'bladex-notif',
    url = '/',
    tipo = 'geral'
  } = data;

  const icones = {
    resultado_torneio: '/icons/icon-trophy.png',
    torre_x_desafio: '/icons/icon-sword.png',
    pedido_amizade: '/icons/icon-friend.png',
    conquista: '/icons/icon-star.png',
  };

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icones[tipo] || icon,
      badge,
      tag,
      data: { url },
      vibrate: [100, 50, 100],
      requireInteraction: tipo === 'torre_x_desafio',
      actions: tipo === 'torre_x_desafio' ? [
        { action: 'aceitar', title: 'Aceitar' },
        { action: 'recusar', title: 'Recusar' }
      ] : tipo === 'pedido_amizade' ? [
        { action: 'aceitar', title: 'Aceitar' },
        { action: 'ver', title: 'Ver perfil' }
      ] : []
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  if (event.action === 'aceitar') {
    event.waitUntil(clients.openWindow(url));
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
    );
  }
});
