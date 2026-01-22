import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { apiEndpoint } from '../../shared/api-endpoint.util';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  private vapidPublicKey: string = '';
  private swRegistration: ServiceWorkerRegistration | null = null;

  private stateSubject = new BehaviorSubject<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false
  });

  state$ = this.stateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeState();
  }

  /**
   * Initialize the state on service creation
   */
  private async initializeState(): Promise<void> {
    const isSupported = this.isPushSupported();
    const permission = this.getPermissionState();
    let isSubscribed = false;

    if (isSupported) {
      isSubscribed = await this.isSubscribed();
    }

    this.stateSubject.next({
      isSupported,
      permission,
      isSubscribed
    });
  }

  /**
   * Verifica si el navegador soporta notificaciones push
   */
  isPushSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Obtiene el estado actual del permiso de notificaciones
   */
  getPermissionState(): NotificationPermission {
    if (!this.isPushSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Registra el Service Worker personalizado para push
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker no soportado');
    }

    try {
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/'
      });

      this.swRegistration = registration;

      return registration;
    } catch (error) {
      console.error('Error registrando Push SW:', error);
      throw error;
    }
  }

  /**
   * Solicita permiso para mostrar notificaciones
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) {
      throw new Error('Push notifications no soportadas en este navegador');
    }

    const permission = await Notification.requestPermission();


    // Actualizar estado
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      permission
    });

    return permission;
  }

  /**
   * Obtiene la clave pública VAPID desde el backend
   */
  private getVapidPublicKey(): Observable<string> {
    return this.http.get<{ public_key: string }>(apiEndpoint('push/vapid-public-key'))
      .pipe(
        switchMap(response => {
          if (!response.public_key) {
            return throwError(() => new Error('No se pudo obtener la clave pública VAPID'));
          }
          this.vapidPublicKey = response.public_key;
          return from([this.vapidPublicKey]);
        }),
        catchError(error => {
          console.error('Error al obtener clave VAPID:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Convierte la clave pública VAPID de base64 a Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Suscribe al usuario a notificaciones push
   */
  subscribe(): Observable<PushSubscription> {
    if (!this.isPushSupported()) {
      return throwError(() => new Error('Push notifications no soportadas'));
    }

    return from(navigator.serviceWorker.ready).pipe(
      switchMap(registration => {
        this.swRegistration = registration;
        // Obtener la clave VAPID primero
        return this.getVapidPublicKey();
      }),
      switchMap(vapidKey => {
        // Convertir la clave y suscribirse
        const applicationServerKey = this.urlBase64ToUint8Array(vapidKey);
        return from(this.swRegistration!.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        }));
      }),
      switchMap(subscription => {
        // Enviar suscripción al backend
        return this.sendSubscriptionToBackend(subscription);
      }),
      catchError(error => {
        console.error('Error al suscribirse:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancela la suscripción a notificaciones push
   */
  unsubscribe(): Observable<boolean> {
    return from(navigator.serviceWorker.ready).pipe(
      switchMap(registration => from(registration.pushManager.getSubscription())),
      switchMap(subscription => {
        if (!subscription) {
          return from([true]);
        }

        // Cancelar en el backend primero
        const endpoint = subscription.endpoint;
        return this.http.post<{ success: boolean }>(
          apiEndpoint('push/unsubscribe'),
          { endpoint }
        ).pipe(
          switchMap(() => from(subscription.unsubscribe())),
          tap(() => {
            // Actualizar estado
            const currentState = this.stateSubject.value;
            this.stateSubject.next({
              ...currentState,
              isSubscribed: false
            });
          })
        );
      }),
      catchError(error => {
        console.error('Error al cancelar suscripción:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Envía la suscripción al backend
   */
  private sendSubscriptionToBackend(subscription: PushSubscription): Observable<PushSubscription> {
    const subscriptionJson = subscription.toJSON();
    const keys = subscriptionJson.keys as Record<string, string> | undefined;

    const payload = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys?.['p256dh'] || '',
        auth: keys?.['auth'] || ''
      },
      content_encoding: 'aes128gcm'
    };

    return this.http.post<{ success: boolean }>(
      apiEndpoint('push/subscribe'),
      payload
    ).pipe(
      tap(() => {
        // Actualizar estado
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          isSubscribed: true
        });
      }),
      switchMap(() => from([subscription])),
      catchError(error => {
        console.error('Error al enviar suscripción al backend:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si el usuario ya está suscrito
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isPushSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error al verificar suscripción:', error);
      return false;
    }
  }

  /**
   * Envía una notificación push de prueba
   */
  sendTestNotification(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      apiEndpoint('push/send-test'),
      {}
    );
  }

  /**
   * Inicializar todo el sistema de push
   */
  async initializePush(): Promise<boolean> {
    if (!this.isPushSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // 1. Registrar Service Worker
      await this.registerServiceWorker();

      // 2. Solicitar permiso
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Push notification permission denied');
        return false;
      }

      // 3. Suscribirse
      return new Promise((resolve) => {
        this.subscribe().subscribe({
          next: () => {
            resolve(true);
          },
          error: (err) => {
            console.error('Error initializing push:', err);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('Error in initializePush:', error);
      return false;
    }
  }

  /**
   * Convenience method to subscribe to push notifications.
   * This is the main entry point for enabling push notifications.
   * Wraps initializePush() for easy usage.
   */
  async subscribeToNotifications(): Promise<boolean> {
    return this.initializePush();
  }

  /**
   * Get current state synchronously
   */
  getCurrentState(): PushNotificationState {
    return this.stateSubject.value;
  }
}
