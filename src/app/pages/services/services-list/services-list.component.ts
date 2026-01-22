import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ServiceService } from '../service.service';
import { Service } from '../services';
import { ServicePermissionService } from '../services/service-permission.service';

declare var $: any;

@Component({
  selector: 'app-services-list',
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.css'],
})
export class ServicesListComponent implements OnInit, OnDestroy {
  private dtInstance: any;

  // Propiedades para control de permisos
  canCreateServices: boolean = false;
  canEditServices: boolean = false;
  canDeleteServices: boolean = false;
  canViewServices: boolean = false;

  constructor(
    private serviceService: ServiceService,
    private router: Router,
    private servicePermissionService: ServicePermissionService
  ) {}

  ngOnInit(): void {
    // Verificar permisos del usuario actual
    this.checkUserPermissions();

    this.loadServices();
  }

  private checkUserPermissions(): void {
    this.canCreateServices = this.servicePermissionService.canCreateServices();
    this.canEditServices = this.servicePermissionService.canEditServices();
    this.canDeleteServices = this.servicePermissionService.canDeleteServices();
    this.canViewServices = this.servicePermissionService.canViewServices();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadServices(): void {
    this.showLoading();

    this.serviceService.getServices().subscribe({
      next: (services: Service[]) => this.handleServicesResponse(services),
      error: (error) => this.handleError(error),
    });
  }

  private handleServicesResponse(services: Service[]): void {
    this.destroyDataTable();
    this.initializeDataTable(services || []);
    Swal.close();
  }

  private initializeDataTable(services: Service[]): void {
    this.dtInstance = $('#servicesTable').DataTable({
      data: services,
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
      { title: 'ID', data: 'id' },
      { title: 'Clave', data: 'code' },
      { title: 'Nombre', data: 'name' },
      { title: 'Descripción', data: 'description' },
      { title: 'Unidad', data: 'unit' },
      { title: 'Unidad SAT', data: 'sat_unit_code' },
      {
        title: 'Se compra',
        data: 'is_purchasable',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Sí</span>'
            : '<span class="badge bg-secondary">No</span>',
      },
      {
        title: 'Se factura',
        data: 'is_billable',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Sí</span>'
            : '<span class="badge bg-secondary">No</span>',
      },
      {
        title: 'Estado',
        data: 'is_active',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Activo</span>'
            : '<span class="badge bg-danger">Inactivo</span>',
      },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: Service) => this.renderActions(row),
      },
    ];
  }

  private renderActions(row: Service): string {
    let actions = '<div class="btn-group btn-group-sm" role="group">';

    // Botón Ver
    if (this.canViewServices) {
      actions += `
        <button class="btn btn-info btn-show" data-id="${row.id}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>`;
    }

    // Botón Editar
    if (this.canEditServices) {
      actions += `
        <button class="btn btn-warning btn-edit" data-id="${row.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>`;
    }

    // Botón Eliminar
    if (this.canDeleteServices) {
      actions += `
        <button class="btn btn-danger btn-delete" data-id="${row.id}" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>`;
    }

    actions += '</div>';
    return actions;
  }

  private getTableLanguage(): any {
    return {
      processing: 'Procesando...',
      search: 'Buscar:',
      lengthMenu: 'Mostrar _MENU_ elementos',
      info: 'Mostrando _START_ a _END_ de _TOTAL_ elementos',
      infoEmpty: 'Mostrando 0 a 0 de 0 elementos',
      infoFiltered: '(filtrado de _MAX_ elementos totales)',
      loadingRecords: 'Cargando...',
      zeroRecords: 'No se encontraron resultados',
      emptyTable: 'No hay datos disponibles en la tabla',
      paginate: {
        first: 'Primero',
        previous: 'Anterior',
        next: 'Siguiente',
        last: 'Último',
      },
    };
  }

  private getTableButtons(): any[] {
    const buttons: any[] = [
      {
        text: '<i class="fa fa-home"></i> Inicio',
        action: () => this.router.navigate(['/dashboard']),
      },
      {
        extend: 'excel',
        text: '<i class="fa-solid fa-file-excel"></i> Exportar',
        filename: 'ServicesList',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win),
      },
    ];

    // Botón Agregar (solo si tiene permiso)
    if (this.canCreateServices) {
      buttons.push({
        text: '<i class="fas fa-plus me-1"></i> Nuevo Servicio',
        action: () => this.router.navigate(['/services/add']),
      });
    }

    // Botón Refrescar
    buttons.push({
      text: '<i class="fas fa-sync-alt me-1"></i> Refrescar',
      action: () => this.loadServices(),
    });

    return buttons;
  }

  private customizePrint(win: any): void {
    const currentDate = new Date().toLocaleDateString('es-MX');
    const css = this.getPrintStyles();
    const header = this.getPrintHeader(currentDate);

    $(win.document.body)
      .prepend(css + header)
      .find(
        '.dt-buttons, .dataTables_filter, .dataTables_length, .dataTables_info, .dataTables_paginate'
      )
      .hide();
  }

  private getPrintStyles(): string {
    return `
      <style>
        body { font-family: Arial; margin: 20px; }
        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .print-header h1 { font-size: 20px; margin: 0; color: #2c3e50; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f8f9fa; padding: 8px; border-bottom: 2px solid #dee2e6; }
        td { padding: 6px 8px; border-bottom: 1px solid #dee2e6; }
      </style>
    `;
  }

  private getPrintHeader(date: string): string {
    return `
      <div class="print-header">
        <h1>LISTA DE SERVICIOS</h1>
        <div>Generado: ${date}</div>
      </div>
    `;
  }

  private attachButtonEvents(): void {
    const $table = $('#servicesTable');

    // Evento para botón Ver
    $table.on('click', '.btn-show', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.router.navigate(['/services/show', id]);
    });

    // Evento para botón Editar
    $table.on('click', '.btn-edit', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.router.navigate(['/services/edit', id]);
    });

    // Evento para botón Eliminar
    $table.on('click', '.btn-delete', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.confirmDelete(id);
    });
  }

  private confirmDelete(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteService(id);
      }
    });
  }

  private deleteService(id: number): void {
    this.showLoading();

    this.serviceService.deleteService(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El servicio ha sido eliminado correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadServices();
      },
      error: (error) => this.handleError(error),
    });
  }

  private destroyDataTable(): void {
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al procesar la solicitud.',
    });
  }
}
