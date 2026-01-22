import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { NotificationGatewayService } from './notification-gateway.service';
import { HttpClient } from '@angular/common/http';
import { notificationEndpoint } from '../../shared/api-endpoint.util';

export interface PushMessage {
  id?: number;
  title: string;
  body: string;
  severity?: string;
  module?: string;
  action?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushRealtimeService {
  private pushReceived$ = new Subject<PushMessage>();
  private isListening = false;

  constructor(
    private ngZone: NgZone,
    private gateway: NotificationGatewayService,
    private http: HttpClient
  ) {}

  /**
   * Obtiene el stream de notificaciones push recibidas
   */
  onPushReceived(): Observable<PushMessage> {
    return this.pushReceived$.asObservable();
  }

  /**
   * Emitir notificación cuando se detectan nuevas por polling
   */
  emitNewNotification(count: number): void {

    // Cargar la última notificación con timestamp para evitar cache
    const timestamp = new Date().getTime();
    const userId = this.getCurrentUserId();
    let url = `notifications/inbox?perPage=1&sortBy=created_at&sortOrder=desc&_t=${timestamp}`;
    if (userId) {
      url += `&user_id=${userId}`;
    }


    this.http.get<any>(notificationEndpoint(url)).subscribe({
      next: (response) => {
        if (response?.data?.length > 0) {
          const notification = response.data[0];
          const pushMessage: PushMessage = {
            id: notification.id,
            title: notification.title || 'Nueva notificación',
            body: notification.body || '',
            severity: notification.severity || 'info',
            module: notification.module,
            action: notification.action,
            timestamp: notification.created_at || new Date().toISOString()
          };
          this.pushReceived$.next(pushMessage);
        } else {
          // Emitir mensaje genérico si no hay datos
          const genericMessage: PushMessage = {
            title: 'Nueva notificación',
            body: `Tienes ${count} nueva(s) notificación(es)`,
            severity: 'info',
            timestamp: new Date().toISOString()
          };
          this.pushReceived$.next(genericMessage);
        }
      },
      error: (err) => {
        console.error('[PushRealtime] Error fetching notification:', err);
        // En caso de error, emitir mensaje genérico
        const errorMessage: PushMessage = {
          title: 'Nueva notificación',
          body: `Tienes ${count} nueva(s) notificación(es)`,
          severity: 'info',
          timestamp: new Date().toISOString()
        };
        this.pushReceived$.next(errorMessage);
      }
    });
  }

  /**
   * Obtiene el user_id del usuario actual desde localStorage
   */
  private getCurrentUserId(): number | null {
    try {
      // Primero intentar obtener directamente de 'user_id' (como lo guarda auth.service)
      const directUserId = localStorage.getItem('user_id');
      if (directUserId) {
        const parsed = parseInt(directUserId, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }

      // Intentar obtener de user_permissions
      const permissions = localStorage.getItem('user_permissions');
      if (permissions) {
        const parsed = JSON.parse(permissions);
        if (parsed.user_id) return parsed.user_id;
      }

      // Intentar de userData
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.id) return parsed.id;
      }

      // Intentar decodificar el JWT
      const token = localStorage.getItem('authToken');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.sub) return parseInt(payload.sub, 10);
        }
      }
    } catch (e) {
      console.error('[PushRealtime] Error getting user ID:', e);
    }
    return null;
  }

  /**
   * Iniciar escucha de mensajes del Service Worker
   */
  startListening(): void {
    if (this.isListening) {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[PushRealtime] Service Worker not supported');
      return;
    }

    navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    this.isListening = true;
  }

  /**
   * Detener escucha de mensajes
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage.bind(this));
    this.isListening = false;
  }

  /**
   * Manejar mensaje del Service Worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {

    if (event.data?.type === 'PUSH_RECEIVED') {
      const notification = event.data.notification as PushMessage;

      // Ejecutar dentro de la zona de Angular para que detecte los cambios
      this.ngZone.run(() => {
        // Emitir la notificación
        this.pushReceived$.next(notification);

        // Actualizar el contador de no leídas
        this.gateway.loadUnreadCount().subscribe();
      });
    }
  }
}
