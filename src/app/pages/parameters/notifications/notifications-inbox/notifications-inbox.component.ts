import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NotificationGatewayService, NotificationFilters } from '../../../../core/services/notification-gateway.service';
import { NotificationItem, NotificationModule, NotificationStatus, NotificationSeverity, PendingAuthorization } from '../../../../shared/models/notification.model';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { notificationEndpoint } from '../../../../shared/api-endpoint.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './notifications-inbox.component.html',
  styleUrls: ['./notifications-inbox.component.css']
})
export class NotificationsInboxComponent implements OnInit, OnDestroy {
  list: NotificationItem[] = [];
  pendingAuthorizations: PendingAuthorization[] = [];
  loading = false;
  loadingAuth = false;
  processingAuthId: number | null = null;
  processingBulk = false;
  error?: string;

  // Filtros
  filterModule: NotificationModule | '' = '';
  filterSeverity: NotificationSeverity | '' = '';
  searchText = '';

  // Paginación
  currentPage = 1;
  lastPage = 1;
  total = 0;
  perPage = 15;

  // Opciones para filtros
  modules: NotificationModule[] = ['users', 'customers', 'providers'];
  severities: NotificationSeverity[] = ['info', 'warning', 'critical'];

  private destroy$ = new Subject<void>();

  constructor(
    private gateway: NotificationGatewayService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadPendingAuthorizations();

    // Suscribirse a cambios de paginación
    this.gateway.getPagination().pipe(takeUntil(this.destroy$)).subscribe((pagination: any) => {
      this.currentPage = pagination.currentPage;
      this.lastPage = pagination.lastPage;
      this.total = pagination.total;
      this.perPage = pagination.perPage;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = undefined;

    const filters: NotificationFilters = {
      perPage: this.perPage,
      page: this.currentPage,
      // Excluir notificaciones atendidas - solo mostrar pendientes y vistas
      exclude_status: 'attended'
    };

    if (this.filterModule) filters.module = this.filterModule;
    if (this.filterSeverity) filters.severity = this.filterSeverity;
    if (this.searchText.trim()) filters.search = this.searchText.trim();

    // Use loadInbox for user's notification inbox (only pending notifications)
    this.gateway.loadInbox(filters).subscribe({
      next: (resp) => {
        const data = resp?.data ?? [];
        this.list = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar las notificaciones';
        this.list = [];
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  clearFilters(): void {
    this.filterModule = '';
    this.filterSeverity = '';
    this.searchText = '';
    this.currentPage = 1;
    this.loadNotifications();
  }

  open(item: NotificationItem): void {
    // Marcar como vista al abrir
    this.gateway.markViewed(item.id).subscribe();
    this.router.navigate(['/notifications/detail', item.id]);
  }

  markViewed(item: NotificationItem, event: Event): void {
    event.stopPropagation();
    this.gateway.markViewed(item.id).subscribe({
      next: () => this.loadNotifications()
    });
  }

  markAttended(item: NotificationItem, event: Event): void {
    event.stopPropagation();
    this.gateway.markAttended(item.id).subscribe({
      next: () => this.loadNotifications()
    });
  }

  /**
   * Marcar todas las notificaciones como visualizadas
   */
  markAllViewed(): void {
    Swal.fire({
      title: '¿Marcar todas como vistas?',
      text: 'Todas las notificaciones pendientes se marcarán como visualizadas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#17a2b8',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, marcar todas',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processingBulk = true;
        this.gateway.markAllAsViewed().subscribe({
          next: (response) => {
            this.processingBulk = false;
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: response.message || 'Todas las notificaciones han sido marcadas como vistas.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadNotifications();
          },
          error: (err) => {
            this.processingBulk = false;
            Swal.fire('Error', 'No se pudieron marcar las notificaciones.', 'error');
          }
        });
      }
    });
  }

  /**
   * Marcar todas las notificaciones como atendidas
   */
  markAllAttended(): void {
    Swal.fire({
      title: '¿Marcar todas como atendidas?',
      text: 'Todas las notificaciones se marcarán como atendidas y desaparecerán de la bandeja.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, marcar todas',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processingBulk = true;
        this.gateway.markAllAsAttended().subscribe({
          next: (response) => {
            this.processingBulk = false;
            Swal.fire({
              icon: 'success',
              title: '¡Listo!',
              text: response.message || 'Todas las notificaciones han sido marcadas como atendidas.',
              timer: 2000,
              showConfirmButton: false
            });
            this.loadNotifications();
          },
          error: (err) => {
            this.processingBulk = false;
            Swal.fire('Error', 'No se pudieron marcar las notificaciones.', 'error');
          }
        });
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadNotifications();
  }

  getSeverityClass(severity: string): string {
    const classes: { [key: string]: string } = {
      'info': 'badge bg-info',
      'warning': 'badge bg-warning text-dark',
      'critical': 'badge bg-danger'
    };
    return classes[severity] || 'badge bg-secondary';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'badge bg-warning text-dark',
      'sent': 'badge bg-primary',
      'viewed': 'badge bg-info',
      'attended': 'badge bg-success',
      'accepted': 'badge bg-success',
      'rejected': 'badge bg-danger'
    };
    return classes[status] || 'badge bg-secondary';
  }

  isUnread(item: NotificationItem): boolean {
    // Use user_status (per-user status from NotificationLog) if available, otherwise fall back to status
    const status = item.user_status || item.status;
    return status === 'pending' || status === 'sent';
  }

  // ===================== AUTHORIZATION METHODS =====================

  loadPendingAuthorizations(): void {
    this.loadingAuth = true;
    this.http.get<any>(notificationEndpoint('notifications/pending-authorizations')).subscribe({
      next: (response) => {
        this.pendingAuthorizations = response?.data ?? [];
        this.loadingAuth = false;
      },
      error: (err) => {
        console.error('Error loading authorizations:', err);
        this.pendingAuthorizations = [];
        this.loadingAuth = false;
      }
    });
  }

  approveAuthorization(auth: PendingAuthorization): void {
    Swal.fire({
      title: '¿Aprobar solicitud?',
      html: `<p>Estás a punto de aprobar:</p><strong>${auth.title}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, Aprobar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processingAuthId = auth.id;
        this.http.post<any>(notificationEndpoint(`notifications/${auth.id}/approve`), {}).subscribe({
          next: (response) => {
            this.processingAuthId = null;
            Swal.fire({
              icon: 'success',
              title: 'Aprobado',
              text: response.message || 'La solicitud fue aprobada exitosamente',
              timer: 2000
            });
            this.loadPendingAuthorizations();
          },
          error: (err) => {
            this.processingAuthId = null;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Error al aprobar la solicitud'
            });
          }
        });
      }
    });
  }

  rejectAuthorization(auth: PendingAuthorization): void {
    Swal.fire({
      title: '¿Rechazar solicitud?',
      html: `<p>Estás a punto de rechazar:</p><strong>${auth.title}</strong>`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo (opcional)',
      inputPlaceholder: 'Escribe el motivo del rechazo...',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processingAuthId = auth.id;
        const comment = result.value || null;
        this.http.post<any>(notificationEndpoint(`notifications/${auth.id}/reject`), { comment }).subscribe({
          next: (response) => {
            this.processingAuthId = null;
            Swal.fire({
              icon: 'success',
              title: 'Rechazado',
              text: response.message || 'La solicitud fue rechazada',
              timer: 2000
            });
            this.loadPendingAuthorizations();
          },
          error: (err) => {
            this.processingAuthId = null;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.message || 'Error al rechazar la solicitud'
            });
          }
        });
      }
    });
  }

  getAuthTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'document': 'Documento',
      'contract': 'Contrato',
      'inventory': 'Inventario',
      'item': 'Artículo',
      'ticket': 'Ticket',
      'equipment': 'Equipo',
      'employee': 'Empleado'
    };
    return labels[type] || type;
  }
}
