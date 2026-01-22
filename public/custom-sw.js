// Custom Service Worker para notificaciones push
// Este archivo se combinará con ngsw-worker.js

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recibido:', event);

  const data = event.data ? event.data.json() : {};

  const title = data.title || 'Nueva Notificación';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification-' + Date.now(),
    requireInteraction: false,
    actions: data.actions || [
      { action: 'view', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  // Si el usuario hizo click en una acción específica
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUnrelated: false })
        .then((clientList) => {
          // Si ya hay una ventana abierta, enfócala
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Si no, abre una nueva ventana
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'close') {
    // Simplemente cerrar la notificación (ya se hizo arriba)
    console.log('Notificación cerrada');
  } else {
    // Click en el cuerpo de la notificación
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUnrelated: false })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription cambió');

  event.waitUntil(
    // Resubscribirse automáticamente
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription?.options?.applicationServerKey
    })
    .then((subscription) => {
      console.log('[Service Worker] Resuscrito:', subscription);
      // Aquí podrías enviar la nueva suscripción al backend
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription.toJSON())
      });
    })
  );
});
