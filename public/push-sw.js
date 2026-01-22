/**
 * Custom Service Worker for Push Notifications
 * Este archivo maneja las notificaciones push del navegador
 */

// Escuchar eventos push
self.addEventListener('push', function(event) {
  console.log('[SW] Push notification received:', event);

  let data = {
    title: 'EPICA Notificación',
    body: 'Tienes una nueva notificación',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        data: payload.data || {}
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: data.data?.notificationId || 'epica-notification',
    renotify: true,
    requireInteraction: data.data?.severity === 'critical',
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'Ver detalle',
        icon: '/assets/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Descartar',
        icon: '/assets/icons/dismiss.png'
      }
    ]
  };

  // Si es crítico, agregar acciones especiales
  if (data.data?.severity === 'critical') {
    options.actions = [
      {
        action: 'attend',
        title: '⚠️ Atender ahora',
        icon: '/assets/icons/urgent.png'
      },
      {
        action: 'view',
        title: 'Ver detalle',
        icon: '/assets/icons/view.png'
      }
    ];
  }

  // Notificar a todas las ventanas abiertas sobre la nueva notificación
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      // Enviar mensaje a todas las ventanas de la app
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            notification: {
              id: data.data?.notificationId,
              title: data.title,
              body: data.body,
              severity: data.data?.severity,
              module: data.data?.module,
              action: data.data?.action,
              timestamp: data.data?.timestamp || new Date().toISOString()
            }
          });
        });
      })
    ])
  );
});

// Manejar clicks en la notificación
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/notifications/inbox';

  // Determinar la URL según la acción
  if (event.action === 'view' || event.action === 'attend') {
    if (notificationData.notificationId) {
      targetUrl = `/notifications/detail/${notificationData.notificationId}`;
    } else if (notificationData.url) {
      targetUrl = notificationData.url;
    }
  } else if (event.action === 'dismiss') {
    // Solo cerrar, no abrir nada
    return;
  } else {
    // Click en el body de la notificación
    if (notificationData.url) {
      targetUrl = notificationData.url;
    } else if (notificationData.notificationId) {
      targetUrl = `/notifications/detail/${notificationData.notificationId}`;
    }
  }

  // Construir URL completa
  const urlToOpen = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Buscar si ya hay una ventana abierta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Si no hay ventana, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Manejar cierre de notificación
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.data);

  // Opcional: Reportar al backend que se cerró sin interactuar
  const notificationData = event.notification.data || {};
  if (notificationData.notificationId) {
    // Podrías hacer un fetch aquí para reportar la métrica
    // fetch('/api/notification-metrics/dismissed', {...})
  }
});

// Escuchar mensajes desde la aplicación
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Evento de instalación
self.addEventListener('install', function(event) {
  console.log('[SW] Installing push notification service worker...');
  self.skipWaiting();
});

// Evento de activación
self.addEventListener('activate', function(event) {
  console.log('[SW] Push notification service worker activated');
  event.waitUntil(clients.claim());
});
