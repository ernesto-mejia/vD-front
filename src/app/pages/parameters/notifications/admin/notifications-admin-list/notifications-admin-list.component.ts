import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { NotificationGatewayService } from '../../../../../core/services/notification-gateway.service';
import { NotificationAnalyticsService, NotificationLogItem } from '../../../../../core/services/notification-analytics.service';
import { NotificationItem, NotificationLog } from '../../../../../shared/models/notification.model';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-notifications-admin-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTablesModule],
  templateUrl: './notifications-admin-list.component.html',
  styleUrls: ['./notifications-admin-list.component.css']
})
export class NotificationsAdminListComponent implements OnInit, OnDestroy {
  list: NotificationItem[] = [];
  filteredList: NotificationItem[] = [];
  logs: NotificationLogItem[] = [];
  selectedLog?: NotificationLogItem;
  showLogModal = false;
  filterText = '';
  loadingLogs = false;

  @ViewChild('notificationsTable', { static: false }) notificationsTable?: ElementRef<HTMLTableElement>;
  @ViewChild('logsTable', { static: false }) logsTable?: ElementRef<HTMLTableElement>;

  private dtInstance: any;
  private dtLogsInstance: any;
  private destroy$ = new Subject<void>();

  constructor(
    private gateway: NotificationGatewayService,
    private analyticsService: NotificationAnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
    if (this.dtLogsInstance) {
      this.dtLogsInstance.destroy();
      this.dtLogsInstance = null;
    }
  }

  private loadNotifications(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan las notificaciones.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    // Use load for admin view (all notifications)
    this.gateway.load().subscribe({
      next: (response) => {
        this.list = Array.isArray(response?.data) ? response.data : [];
        this.filteredList = [...this.list];


        // Destruir tabla existente antes de recrear
        if (this.dtInstance) {
          this.dtInstance.destroy();
          this.dtInstance = null;
        }

        // Inicializar la tabla con un pequeño delay
        setTimeout(() => {
          this.initializeDataTable(this.filteredList);
          Swal.close();
        }, 100);
      },
      error: (error: any) => {
        console.error('Error al cargar las notificaciones:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al cargar las notificaciones',
        });
      },
    });
  }

  private initializeDataTable(notifications: NotificationItem[]): void {
    const $table = this.$table();

    this.dtInstance = $table.DataTable({
      data: notifications,
      columns: this.getTableColumns(),
      lengthMenu: [
        [10, 25, 50, -1],
        [10, 25, 50, 'Todos'],
      ],
      dom: '<"d-flex justify-content-between mb-3 custom-margin"Bf>rt<"d-flex justify-content-between mt-3"p li>',
      language: this.getTableLanguage(),
      buttons: this.getTableButtons(),
      autoWidth: false,
      scrollX: true,
      responsive: true,
      initComplete: () => this.attachButtonEvents(),
    });
  }

  private getTableColumns(): any[] {
    return [
      {
        title: 'ID',
        data: 'id',
        width: '60px'
      },
      {
        title: 'Título',
        data: 'title',
        render: (data: string) => data || 'Sin título'
      },
      {
        title: 'Mensaje',
        data: 'body',
        render: (data: string) => {
          if (!data) return 'Sin mensaje';
          return data.length > 50 ? data.substring(0, 50) + '...' : data;
        }
      },
      {
        title: 'Módulo',
        data: 'module',
        render: (data: string) => {
          const moduleLabels: Record<string, string> = {
            'users': '<span class="badge bg-primary">Usuarios</span>',
            'customers': '<span class="badge bg-info">Clientes</span>',
            'providers': '<span class="badge bg-success">Proveedores</span>',
            'sales': '<span class="badge bg-warning">Ventas</span>'
          };
          return moduleLabels[data] || `<span class="badge bg-secondary">${data}</span>`;
        }
      },
      {
        title: 'Severidad',
        data: 'severity',
        render: (data: string) => {
          const severityLabels: Record<string, string> = {
            'info': '<span class="badge bg-info">Info</span>',
            'warning': '<span class="badge bg-warning">Advertencia</span>',
            'critical': '<span class="badge bg-danger">Crítico</span>'
          };
          return severityLabels[data] || `<span class="badge bg-secondary">${data}</span>`;
        }
      },
      {
        title: 'Estado',
        data: 'active',
        render: (data: boolean) => {
          return data
            ? '<span class="badge bg-success">Activa</span>'
            : '<span class="badge bg-secondary">Inactiva</span>';
        }
      },
      {
        title: 'Fecha Creación',
        data: 'createdAt',
        render: (data: string) => {
          if (!data) return '-';
          return new Date(data).toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        width: '150px',
        render: (data: any, type: any, row: NotificationItem) =>
          this.renderActions(row),
      },
    ];
  }

  private renderActions(row: NotificationItem): string {
    const toggleBtn = row.active
      ? `<button class="btn btn-sm btn-transparent toggle-btn" data-id="${row.id}" data-active="true" title="Desactivar"><i class="fa fa-toggle-on text-success"></i></button>`
      : `<button class="btn btn-sm btn-transparent toggle-btn" data-id="${row.id}" data-active="false" title="Activar"><i class="fa fa-toggle-off text-secondary"></i></button>`;

    return `
      <div class="btn-group" role="group">
        <button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar">
          <i class="fa fa-edit"></i>
        </button>
        ${toggleBtn}
      </div>
    `;
  }

  private getTableButtons(): any[] {
    return [
      {
        text: '<i class="fa fa-home"></i> Inicio',
        action: () => this.router.navigate(['/dashboard']),
      },
      {
        extend: 'excel',
        text: '<i class="fa-solid fa-file-excel"></i> Exportar',
        filename: 'NotificationsList',
        exportOptions: {
          columns: [0, 1, 2, 3, 4, 5] // Excluir la columna de acciones
        }
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        exportOptions: {
          columns: [0, 1, 2, 3, 4, 5] // Excluir la columna de acciones
        },
        customize: (win: any) => this.customizePrint(win),
      },
      {
        text: '<i class="fa fa-add"></i> Nueva Notificación',
        action: () => this.router.navigate(['/notifications/admin/add']),
      },
    ];
  }

  private getTableLanguage(): any {
    return {
      search: 'Buscar:',
      lengthMenu: '_MENU_ registros por página',
      info: 'De _START_ a _END_ de _TOTAL_ registros',
      infoEmpty: 'Mostrando 0 registros',
      infoFiltered: '(filtrado de _MAX_ registros totales)',
      emptyTable: 'Sin información',
      paginate: {
        previous: 'Anterior',
        next: 'Siguiente',
      },
    };
  }

  private attachButtonEvents(): void {
    const $table = this.$table();

    // Delegated event handlers attached to the table element
    $table
      .on('click', '.edit-btn', (event: any) => {
        const id = $(event.currentTarget).data('id');
        this.editNotification(id);
      })
      .on('click', '.toggle-btn', (event: any) => {
        const id = $(event.currentTarget).data('id');
        const isActive = $(event.currentTarget).data('active');
        this.toggleNotificationStatus(id, isActive);
      });
  }

  private editNotification(id: number): void {
    this.router.navigate(['/notifications/admin/edit', id]);
  }

  private toggleNotificationStatus(id: number, currentlyActive: boolean): void {
    const action = currentlyActive ? 'desactivar' : 'activar';
    const newStatus = !currentlyActive;

    Swal.fire({
      title: `¿${currentlyActive ? 'Desactivar' : 'Activar'} plantilla?`,
      text: `La plantilla será ${action}da.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.gateway.update(id, { active: newStatus }).subscribe({
          next: () => {
            Swal.fire('Actualizado', `La plantilla ha sido ${action}da.`, 'success');
            this.loadNotifications();
          },
          error: (error: any) => {
            console.error('Error al actualizar la plantilla:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al actualizar la plantilla',
            });
          },
        });
      }
    });
  }

  private customizePrint(win: any): void {
    const now = new Date();
    const date = now.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const time = now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const styles = `
      <style>
        body { font-family: Arial, sans-serif; }
        .print-header { text-align: center; margin-bottom: 20px; }
        .print-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    `;

    const headerMarkup = `
      <div class="print-header">
        <h2>Lista de Notificaciones</h2>
        <p>Generado: ${date} ${time} hrs</p>
        <p>Fuente: Sistema Épica</p>
      </div>
    `;

    const footerMarkup = `
      <div class="print-footer">
        <p>Reporte generado automáticamente el ${date} a las ${time} hrs por el Sistema Épica.</p>
      </div>
    `;

    $(win.document.head).append(styles);
    $(win.document.body)
      .addClass('print-ready')
      .prepend(headerMarkup)
      .append(footerMarkup)
      .find('.dt-buttons, .dataTables_filter, .dataTables_length, .dataTables_info, .dataTables_paginate')
      .hide();
  }

  viewUserProfile(userId: number): void {
    this.router.navigate(['/users/view', userId]);
  }

  /**
   * Safe jQuery wrapper for the table element, with a fallback to the global selector
   */
  private $table(): any {
    return this.notificationsTable
      ? $(this.notificationsTable.nativeElement)
      : $('#notificationsTable');
  }
}
