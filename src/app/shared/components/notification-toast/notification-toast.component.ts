import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { PushRealtimeService, PushMessage } from '../../../core/services/push-realtime.service';

interface ToastNotification extends PushMessage {
  visible: boolean;
  hiding?: boolean;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id || toast.timestamp) {
        @if (toast.visible) {
          <div
            class="notification-toast"
            [class.severity-info]="toast.severity === 'info'"
            [class.severity-warning]="toast.severity === 'warning'"
            [class.severity-critical]="toast.severity === 'critical'"
            [class.hiding]="toast.hiding"
            [@slideIn]
          >
            <div class="toast-icon">
              @switch (toast.severity) {
                @case ('critical') {
                  <i class="fas fa-exclamation-circle"></i>
                }
                @case ('warning') {
                  <i class="fas fa-exclamation-triangle"></i>
                }
                @default {
                  <i class="fas fa-bell"></i>
                }
              }
            </div>
            <div class="toast-content">
              <div class="toast-title">{{ toast.title }}</div>
              <div class="toast-body">{{ toast.body | slice:0:100 }}{{ toast.body.length > 100 ? '...' : '' }}</div>
              <div class="toast-meta">
                <span class="toast-time">{{ formatTime(toast.timestamp) }}</span>
                @if (toast.module) {
                  <span class="toast-module">{{ toast.module }}</span>
                }
              </div>
            </div>
            <div class="toast-actions">
              @if (toast.id) {
                <button type="button" class="btn-view" (click)="onViewClick($event, toast)">
                  Ver
                </button>
              }
              <button type="button" class="btn-dismiss" (click)="onDismissClick($event, toast)">
                ×
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      pointer-events: none;
    }

    .notification-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-left: 4px solid #3b82f6;
      animation: slideIn 0.3s ease-out;
      transition: opacity 0.3s ease-out, transform 0.3s ease-out;
      pointer-events: auto;
    }

    .notification-toast.hiding {
      opacity: 0;
      transform: translateX(100%);
    }

    .notification-toast.severity-info {
      border-left-color: #3b82f6;
    }

    .notification-toast.severity-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .notification-toast.severity-critical {
      border-left-color: #ef4444;
      background: #fef2f2;
      animation: pulse 2s infinite;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
      }
      50% {
        box-shadow: 0 4px 30px rgba(239, 68, 68, 0.5);
      }
    }

    .toast-icon {
      font-size: 24px;
      color: #3b82f6;
    }

    .severity-warning .toast-icon {
      color: #f59e0b;
    }

    .severity-critical .toast-icon {
      color: #ef4444;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .toast-body {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .toast-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
    }

    .toast-time {
      color: #9ca3af;
    }

    .toast-module {
      background: #e5e7eb;
      padding: 2px 6px;
      border-radius: 4px;
      color: #4b5563;
      text-transform: uppercase;
      font-size: 10px;
    }

    .toast-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-end;
    }

    .btn-view {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
      pointer-events: auto;
    }

    .btn-view:hover {
      background: #2563eb;
      color: white;
    }

    .btn-dismiss {
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 18px;
      transition: color 0.2s;
      line-height: 1;
      pointer-events: auto;
    }

    .btn-dismiss:hover {
      color: #374151;
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  toasts: ToastNotification[] = [];
  private destroy$ = new Subject<void>();
  private maxToasts = 5;
  private autoHideDelay = 5000; // 5 segundos para info/warning
  private criticalAutoHideDelay = 10000; // 10 segundos para críticos
  private shownNotificationIds = new Set<number>(); // Evitar duplicados

  constructor(
    private pushRealtime: PushRealtimeService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Suscribirse a notificaciones entrantes (polling detecta cambios y emite aquí)
    this.pushRealtime.onPushReceived()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.ngZone.run(() => {
          this.addToast(notification);
          this.cdr.detectChanges();
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.shownNotificationIds.clear();
  }

  private addToast(notification: PushMessage): void {

    // Evitar duplicados - si ya mostramos esta notificación, no volver a mostrarla
    if (notification.id && this.shownNotificationIds.has(notification.id)) {
      return;
    }

    const toast: ToastNotification = {
      ...notification,
      visible: true
    };

    // Marcar como mostrada
    if (notification.id) {
      this.shownNotificationIds.add(notification.id);
    }


    // Agregar al principio
    this.toasts.unshift(toast);

    // Limitar número de toasts
    if (this.toasts.length > this.maxToasts) {
      this.toasts = this.toasts.slice(0, this.maxToasts);
    }

    // Auto-ocultar después de un tiempo
    const delay = notification.severity === 'critical' ? this.criticalAutoHideDelay : this.autoHideDelay;
    setTimeout(() => {
      this.dismiss(toast);
    }, delay);

    // Reproducir sonido si es crítico
    if (notification.severity === 'critical') {
      this.playNotificationSound();
    }
  }

  viewNotification(toast: ToastNotification): void {
    this.dismiss(toast);
    if (toast.id) {
      // Navegar al detalle de la notificación
      this.router.navigate(['/notifications/detail', toast.id]);
    }
  }

  onViewClick(event: MouseEvent, toast: ToastNotification): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.ngZone.run(() => {
      this.viewNotification(toast);
      this.cdr.detectChanges();
    });
  }

  onDismissClick(event: MouseEvent, toast: ToastNotification): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.ngZone.run(() => {
      this.dismiss(toast);
      this.cdr.detectChanges();
    });
  }

  dismiss(toast: ToastNotification): void {
    // Si ya está ocultándose, no hacer nada
    if (toast.hiding || !toast.visible) {
      return;
    }

    // Agregar clase de animación de salida
    toast.hiding = true;
    this.cdr.detectChanges();

    // Después de la animación, remover del DOM
    setTimeout(() => {
      this.ngZone.run(() => {
        toast.visible = false;
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
          this.toasts.splice(index, 1);
        }
        this.cdr.detectChanges();
      });
    }, 300);
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('/assets/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Cannot play notification sound:', e));
    } catch (e) {
      console.log('Audio not available');
    }
  }
}
