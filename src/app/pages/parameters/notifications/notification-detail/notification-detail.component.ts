import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationGatewayService } from '../../../../core/services/notification-gateway.service';
import { NotificationAnalyticsService } from '../../../../core/services/notification-analytics.service';
import { NotificationItem, NotificationLog } from '../../../../shared/models/notification.model';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-notification-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.css']
})
export class NotificationDetailComponent implements OnInit {
  item?: NotificationItem;
  logs: NotificationLog[] = [];
  id?: number;
  loading = true;
  error?: string;
  isInboxView = false; // True si viene del inbox, false si viene del admin

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private gateway: NotificationGatewayService,
    private analytics: NotificationAnalyticsService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.id) {
      this.error = 'ID de notificación no válido';
      this.loading = false;
      return;
    }

    // Detectar si viene del inbox o del admin por la URL
    const currentUrl = this.router.url;
    // Es vista de inbox si la ruta es /notifications/:id (sin admin/view)
    this.isInboxView = !currentUrl.includes('/admin/');

    // Cargar la notificación desde el endpoint correcto
    this.loadNotification();
  }

  private loadNotification(): void {
    if (!this.id) return;

    this.gateway.getById(this.id).subscribe({
      next: (notification) => {
        if (notification) {
          this.item = this.mapNotification(notification);

          // Si viene del inbox, marcar como vista automáticamente
          // Use user_status (per-user status) if available
          const currentStatus = this.item.user_status || this.item.status;
          if (this.isInboxView && currentStatus !== 'viewed' && currentStatus !== 'attended') {
            this.gateway.markViewed(this.id!).subscribe({
              next: () => {
                if (this.item) {
                  this.item = { ...this.item, status: 'viewed', user_status: 'viewed' };
                }
              }
            });
          }

          // Cargar logs si es vista de admin
          if (!this.isInboxView) {
            this.loadLogs();
          }
        } else {
          this.error = 'Notificación no encontrada';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando notificación:', err);
        this.error = 'Error al cargar la notificación';
        this.loading = false;
      }
    });
  }

  private mapNotification(notif: any): NotificationItem {
    return {
      id: notif.id,
      module: notif.module || '',
      action: notif.action || '',
      type: notif.type || 'simple',
      entityId: notif.entity_id || notif.entityId,
      title: notif.title || '',
      body: notif.body || '',
      severity: notif.severity || 'info',
      status: notif.status || 'pending',
      user_status: notif.user_status,
      user_viewed_at: notif.user_viewed_at,
      user_attended_at: notif.user_attended_at,
      escalationHours: notif.escalation_hours || notif.escalationHours || 24,
      escalationCount: notif.escalation_count || notif.escalationCount || 0,
      requiresBlocking: notif.requires_blocking || notif.requiresBlocking || false,
      isBlockingActive: notif.is_blocking_active || notif.isBlockingActive || false,
      active: notif.active !== false,
      channels: notif.channels || ['push'],
      userIds: notif.user_ids || notif.userIds || [],
      roleIds: notif.role_ids || notif.roleIds || [],
      createdAt: notif.created_at || notif.createdAt,
      updatedAt: notif.updated_at || notif.updatedAt,
      // Authorization fields
      authorizableType: notif.authorizable_type || notif.authorizableType,
      authorizableId: notif.authorizable_id || notif.authorizableId,
      authorizationField: notif.authorization_field || notif.authorizationField,
      approveValue: notif.approve_value || notif.approveValue,
      rejectValue: notif.reject_value || notif.rejectValue,
      authorizedBy: notif.authorized_by || notif.authorizedBy,
      authorizedAt: notif.authorized_at || notif.authorizedAt,
      authorizationComment: notif.authorization_comment || notif.authorizationComment
    };
  }

  private loadLogs(): void {
    if (!this.id || this.isInboxView) return;
    this.analytics.getLogsByNotification(this.id).subscribe({
      next: (logs) => {
        this.logs = logs.map(log => ({
          id: log.id,
          notificationId: log.notificationId,
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          details: log.details,
          timestamp: log.timestamp
        }));
      }
    });
  }

  markAttended(): void {
    if (!this.id) return;
    this.gateway.markAttended(this.id).subscribe({
      next: () => {
        if (this.item) {
          this.item = { ...this.item, status: 'attended' };
        }
        // Regresar a la página anterior después de marcar como atendido
        this.goBack();
      },
      error: (err) => {
        console.error('Error al marcar como atendida:', err);
      }
    });
  }

  goBack(): void {
    // Usar location.back() para volver a la página anterior
    this.location.back();
  }

  getSeverityClass(severity: string): string {
    const classes: { [key: string]: string } = {
      'info': 'badge bg-info',
      'warning': 'badge bg-warning',
      'critical': 'badge bg-danger'
    };
    return classes[severity] || 'badge bg-secondary';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'badge bg-warning',
      'sent': 'badge bg-primary',
      'viewed': 'badge bg-info',
      'attended': 'badge bg-success',
      'accepted': 'badge bg-success',
      'rejected': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  getChannelLabel(channel: string): string {
    const labels: { [key: string]: string } = {
      'email': 'Email',
      'push': 'Push'
    };
    return labels[channel] || channel;
  }

  getChannelIcon(channel: string): string {
    const icons: { [key: string]: string } = {
      'email': 'fa-envelope',
      'push': 'fa-mobile-alt'
    };
    return icons[channel] || 'fa-bell';
  }
}
