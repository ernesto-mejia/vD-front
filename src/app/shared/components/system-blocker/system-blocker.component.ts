import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { notificationEndpoint } from '../../api-endpoint.util';

export interface BlockingNotification {
  id: number;
  title: string;
  body: string;
  severity: 'critical';
  module?: string;
  action?: string;
  created_at: string;
  escalation_count: number;
}

export interface PendingAuthorization {
  id: number;
  title: string;
  body: string;
  module: string;
  action: string;
  severity: string;
  authorizable_type: string;
  authorizable_id: number;
  created_at: string;
}

@Component({
  selector: 'app-system-blocker',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isBlocked && (blockingNotifications.length > 0 || pendingAuthorizations.length > 0)) {
      <div class="blocker-overlay" (click)="$event.stopPropagation()">
        <div class="blocker-modal">
          <div class="blocker-header" [class.authorization-header]="pendingAuthorizations.length > 0 && blockingNotifications.length === 0">
            <i class="bi" [class.bi-exclamation-octagon-fill]="blockingNotifications.length > 0"
               [class.bi-shield-check]="blockingNotifications.length === 0 && pendingAuthorizations.length > 0"
               [class.text-danger]="blockingNotifications.length > 0"
               [class.text-warning]="blockingNotifications.length === 0"></i>
            <h2>{{ blockingNotifications.length > 0 ? '¡Atención Requerida!' : 'Autorizaciones Pendientes' }}</h2>
          </div>

          <div class="blocker-body">
            <!-- Critical notifications -->
            @if (blockingNotifications.length > 0) {
              <p class="lead">
                Tienes <strong>{{ blockingNotifications.length }}</strong>
                {{ blockingNotifications.length === 1 ? 'alerta crítica' : 'alertas críticas' }}
                que requieren atención inmediata.
              </p>

              <div class="notifications-list">
                @for (notification of blockingNotifications; track notification.id) {
                  <div class="notification-card critical">
                    <div class="notification-icon">
                      <i class="bi bi-bell-fill"></i>
                      @if (notification.escalation_count > 0) {
                        <span class="escalation-badge">
                          +{{ notification.escalation_count }}
                        </span>
                      }
                    </div>
                    <div class="notification-content">
                      <h5>{{ notification.title }}</h5>
                      <p>{{ notification.body }}</p>
                      <div class="notification-meta">
                        @if (notification.module) {
                          <span class="badge bg-secondary">{{ notification.module }}</span>
                        }
                        @if (notification.action) {
                          <span class="badge bg-dark">{{ notification.action }}</span>
                        }
                        <small class="text-muted">
                          <i class="bi bi-clock"></i>
                          {{ getTimeAgo(notification.created_at) }}
                        </small>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Authorization requests -->
            @if (pendingAuthorizations.length > 0) {
              @if (blockingNotifications.length > 0) {
                <hr class="my-3">
              }
              <p class="lead">
                <i class="bi bi-shield-check text-warning me-2"></i>
                Tienes <strong>{{ pendingAuthorizations.length }}</strong>
                {{ pendingAuthorizations.length === 1 ? 'autorización pendiente' : 'autorizaciones pendientes' }}.
              </p>

              <div class="notifications-list">
                @for (auth of pendingAuthorizations; track auth.id) {
                  <div class="notification-card authorization">
                    <div class="notification-icon authorization-icon">
                      <i class="bi bi-shield-exclamation"></i>
                    </div>
                    <div class="notification-content">
                      <h5>{{ auth.title }}</h5>
                      <p>{{ auth.body }}</p>
                      <div class="notification-meta">
                        <span class="badge bg-warning text-dark">{{ auth.module }}</span>
                        <span class="badge bg-info">{{ auth.authorizable_type }} #{{ auth.authorizable_id }}</span>
                        <small class="text-muted">
                          <i class="bi bi-clock"></i>
                          {{ getTimeAgo(auth.created_at) }}
                        </small>
                      </div>
                    </div>
                    <div class="authorization-actions">
                      <button class="btn btn-success btn-sm" (click)="approveAuthorization(auth.id)" [disabled]="processingAuth">
                        <i class="bi bi-check-lg"></i> Aprobar
                      </button>
                      <button class="btn btn-outline-danger btn-sm" (click)="rejectAuthorization(auth.id)" [disabled]="processingAuth">
                        <i class="bi bi-x-lg"></i> Rechazar
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="blocker-footer">
            <button class="btn btn-danger btn-lg" (click)="goToNotifications()">
              <i class="bi bi-arrow-right-circle me-2"></i>
              {{ blockingNotifications.length > 0 ? 'Atender Notificaciones' : 'Ver Autorizaciones' }}
            </button>
          </div>

          <div class="timer-bar">
            <div class="timer-progress" [style.width.%]="timerProgress"></div>
          </div>
          <p class="timer-text">
            {{ blockingNotifications.length > 0 ? 'Sistema bloqueado hasta que atiendas estas alertas' : 'Tienes autorizaciones pendientes de revisión' }}
          </p>
        </div>
      </div>
    }
  `,
  styles: [`
    .blocker-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .blocker-modal {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .blocker-header {
      background: linear-gradient(135deg, #dc3545, #c82333);
      color: white;
      padding: 24px;
      text-align: center;
    }

    .blocker-header i {
      font-size: 3rem;
      margin-bottom: 12px;
      display: block;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .blocker-header h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .blocker-body {
      padding: 24px;
      max-height: 40vh;
      overflow-y: auto;
    }

    .blocker-body .lead {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: #fff8f8;
      border: 2px solid #dc3545;
      transition: transform 0.2s;
    }

    .notification-card:hover {
      transform: translateX(4px);
    }

    .notification-icon {
      position: relative;
      width: 48px;
      height: 48px;
      background: #dc3545;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon i {
      color: white;
      font-size: 1.25rem;
    }

    .escalation-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #fd7e14;
      color: white;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: bold;
    }

    .notification-content h5 {
      margin: 0 0 8px;
      font-size: 1rem;
      color: #333;
    }

    .notification-content p {
      margin: 0 0 8px;
      font-size: 0.9rem;
      color: #666;
    }

    .notification-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .blocker-footer {
      padding: 20px 24px;
      background: #f8f9fa;
      text-align: center;
    }

    .blocker-footer .btn {
      min-width: 250px;
      padding: 12px 24px;
      font-size: 1.1rem;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .blocker-footer .btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);
    }

    .timer-bar {
      height: 4px;
      background: #e9ecef;
      overflow: hidden;
    }

    .timer-progress {
      height: 100%;
      background: linear-gradient(90deg, #dc3545, #fd7e14);
      transition: width 1s linear;
    }

    .timer-text {
      text-align: center;
      padding: 12px;
      margin: 0;
      font-size: 0.85rem;
      color: #6c757d;
      background: #f8f9fa;
    }

    /* Authorization styles */
    .authorization-header {
      background: linear-gradient(135deg, #ffc107, #e0a800);
    }

    .notification-card.authorization {
      background: #fffbf0;
      border-color: #ffc107;
      flex-wrap: wrap;
    }

    .authorization-icon {
      background: #ffc107 !important;
    }

    .authorization-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
      align-items: center;
    }

    .authorization-actions .btn {
      padding: 6px 16px;
      font-size: 0.85rem;
    }
  `]
})
export class SystemBlockerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);

  isBlocked = false;
  blockingNotifications: BlockingNotification[] = [];
  pendingAuthorizations: PendingAuthorization[] = [];
  timerProgress = 100;
  processingAuth = false;

  private checkInterval?: Subscription;
  private timerInterval?: Subscription;

  ngOnInit(): void {
    // Check for blocking notifications every 30 seconds
    this.checkBlockingNotifications();
    this.checkInterval = interval(30000).subscribe(() => {
      this.checkBlockingNotifications();
    });

    // Animate timer bar
    this.timerInterval = interval(1000).subscribe(() => {
      this.timerProgress = Math.max(0, this.timerProgress - (100 / 30));
      if (this.timerProgress <= 0) {
        this.timerProgress = 100;
        this.checkBlockingNotifications();
      }
    });
  }

  ngOnDestroy(): void {
    this.checkInterval?.unsubscribe();
    this.timerInterval?.unsubscribe();
  }

  // Prevent keyboard shortcuts while blocked
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (this.isBlocked) {
      // Allow only specific keys
      const allowedKeys = ['Tab', 'Enter', 'Escape'];
      if (!allowedKeys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  private checkBlockingNotifications(): void {
    // Solo verificar si hay token de autenticación
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('[SystemBlocker] No hay token de autenticación, omitiendo verificación');
      this.isBlocked = false;
      return;
    }

    // Validar que el token no esté expirado (decodificar JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      if (exp < now) {
        console.log('[SystemBlocker] Token expirado:', {
          expiraEn: new Date(exp).toISOString(),
          ahora: new Date(now).toISOString(),
          diferencia: `${Math.round((now - exp) / 1000 / 60)} minutos expirado`
        });
        this.isBlocked = false;
        return;
      }
      console.log('[SystemBlocker] Token válido, expira en:', {
        expiraEn: new Date(exp).toISOString(),
        restante: `${Math.round((exp - now) / 1000 / 60)} minutos`
      });
    } catch (e) {
      console.error('[SystemBlocker] Error al decodificar token:', e);
      this.isBlocked = false;
      return;
    }

    const blockingUrl = notificationEndpoint('notifications/blocking');
    const authUrl = notificationEndpoint('notifications/pending-authorizations');
    console.log('[SystemBlocker] Consultando endpoints:', { blockingUrl, authUrl });

    // Fetch both blocking notifications and pending authorizations
    forkJoin({
      blocking: this.http.get<any>(blockingUrl),
      authorizations: this.http.get<any>(authUrl)
    }).subscribe({
      next: ({ blocking, authorizations }) => {
        console.log('[SystemBlocker] Respuesta recibida:', {
          blocking: blocking,
          authorizations: authorizations
        });

        const notifications = blocking?.data ?? [];
        // Filter critical blocking notifications
        this.blockingNotifications = notifications.filter(
          (n: any) => {
            const userStatus = n.user_status || n.status;
            return n.severity === 'critical' && n.requires_blocking && userStatus !== 'viewed' && userStatus !== 'attended';
          }
        );

        // Get pending authorizations
        this.pendingAuthorizations = authorizations?.data ?? [];

        // Block if there are critical notifications OR pending authorizations with requires_blocking
        this.isBlocked = this.blockingNotifications.length > 0 ||
                         this.pendingAuthorizations.some((a: any) => a.requires_blocking);

        console.log('[SystemBlocker] Estado final:', {
          bloqueado: this.isBlocked,
          notificacionesCriticas: this.blockingNotifications.length,
          autorizacionesPendientes: this.pendingAuthorizations.length
        });
      },
      error: (err) => {
        console.warn('[SystemBlocker] Error en la petición:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url,
          error: err.error
        });
        if (err.status === 401) {
          console.log('[SystemBlocker] 401 - Token rechazado por el servidor. Posibles causas:');
          console.log('  - Token inválido o manipulado');
          console.log('  - Usuario inactivo en el backend');
          console.log('  - Secreto JWT diferente entre frontend/backend');
        }
        this.isBlocked = false;
      }
    });
  }

  approveAuthorization(id: number): void {
    this.processingAuth = true;
    this.http.post<any>(notificationEndpoint(`notifications/${id}/approve`), {}).subscribe({
      next: (response) => {
        this.processingAuth = false;
        // Remove from list
        this.pendingAuthorizations = this.pendingAuthorizations.filter(a => a.id !== id);
        // Check if we need to unblock
        if (this.blockingNotifications.length === 0 && this.pendingAuthorizations.length === 0) {
          this.isBlocked = false;
        }
      },
      error: (err) => {
        this.processingAuth = false;
        console.error('Error approving authorization:', err);
        alert('Error al aprobar: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  rejectAuthorization(id: number): void {
    const comment = prompt('Motivo del rechazo (opcional):');
    this.processingAuth = true;
    this.http.post<any>(notificationEndpoint(`notifications/${id}/reject`), { comment }).subscribe({
      next: (response) => {
        this.processingAuth = false;
        // Remove from list
        this.pendingAuthorizations = this.pendingAuthorizations.filter(a => a.id !== id);
        // Check if we need to unblock
        if (this.blockingNotifications.length === 0 && this.pendingAuthorizations.length === 0) {
          this.isBlocked = false;
        }
      },
      error: (err) => {
        this.processingAuth = false;
        console.error('Error rejecting authorization:', err);
        alert('Error al rechazar: ' + (err.error?.message || 'Error desconocido'));
      }
    });
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications/inbox']);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  }
}
