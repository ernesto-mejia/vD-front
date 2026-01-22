import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ProviderService } from '../../providers/provider.service';
import { ProvidersListResponse, Provider } from '../providers';
import { ProviderPermissionService } from '../services/provider-permission.service';

declare var $: any;

@Component({
  selector: 'app-providers-list',
  templateUrl: './providers-list.component.html',
  styleUrl: './providers-list.component.css',
})
export class ProvidersListComponent implements OnInit, OnDestroy {
  private dtInstance: any;

  // Propiedades para control de permisos
  canCreateProviders: boolean = false;
  canEditProviders: boolean = false;
  canDeleteProviders: boolean = false;
  canViewProviders: boolean = false;

  constructor(
    private providerService: ProviderService,
    private router: Router,
    private providerPermissionService: ProviderPermissionService
  ) {}

  ngOnInit(): void {
    // Verificar permisos del usuario actual
    this.checkUserPermissions();

    this.loadProviders();
  }

  private checkUserPermissions(): void {
    this.canCreateProviders =
      this.providerPermissionService.canCreateProviders();
    this.canEditProviders = this.providerPermissionService.canEditProviders();
    this.canDeleteProviders =
      this.providerPermissionService.canDeleteProviders();
    this.canViewProviders = this.providerPermissionService.canViewProviders();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadProviders(): void {
    this.showLoading();

    this.providerService.getProviders().subscribe({
      next: (response: ProvidersListResponse) => {
        this.handleProvidersResponse(response);
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleProvidersResponse(response: ProvidersListResponse): void {
    const providers = response.ok && response.data ? response.data : [];

    this.destroyDataTable();
    this.initializeDataTable(providers);
    Swal.close();
  }

  private initializeDataTable(providers: Provider[]): void {
    this.dtInstance = $('#providersTable').DataTable({
      data: providers,
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
      { title: 'Nombre corto', data: 'shortname' },
      { title: 'Razón social', data: 'company' },
      /* { title: 'RFC', data: 'tax_id' }, */
      { title: 'Teléfono', data: 'main_contact_phone' },
      { title: 'Mail', data: 'main_contact_email' },
      { title: 'Contacto', data: 'main_contact_name' },
      { title: 'Tipo de pago', data: 'payment_term' },
      { title: 'Días de crédito', data: 'credit_days' },
      { title: 'Monto del credito', data: 'credit_limit' },
      { title: 'Saldo', data: 'credit_balance' },
      { title: 'Monto disponible', data: 'available_credit' },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: Provider) =>
          this.renderActions(row),
      },
    ];
  }

  private renderActions(row: Provider): string {
    let actions = '<div class="btn-group" role="group">';

    // Botón Ver - Solo si tiene permiso de ver providers
    if (this.canViewProviders) {
      actions += `
        <button class="btn btn-sm btn-transparent view-btn" data-id="${row.id}" title="Ver">
          <i class="fa fa-eye"></i>
        </button>
      `;
    }

    // Botón Editar - Solo si tiene permiso de editar providers
    if (this.canEditProviders) {
      actions += `
        <button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar">
          <i class="fa fa-edit"></i>
        </button>
      `;
    }

    // Botón Eliminar - Solo si tiene permiso de eliminar providers
    if (this.canDeleteProviders) {
      actions += `
        <button class="btn btn-sm btn-transparent delete-btn" data-id="${row.id}" title="Eliminar">
          <i class="fa fa-trash"></i>
        </button>
      `;
    }

    actions += '</div>';

    // Si no tiene ningún permiso, mostrar mensaje
    if (
      !this.canViewProviders &&
      !this.canEditProviders &&
      !this.canDeleteProviders
    ) {
      actions = '<small class="text-muted">Sin permisos</small>';
    }

    return actions;
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
        filename: 'ProvidersList',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win),
      },
    ];

    // Solo agregar botón de "Agregar Proveedor" si tiene permisos
    if (this.canCreateProviders) {
      buttons.push({
        text: '<i class="fa fa-add"></i> Agregar Proveedor',
        action: () => this.router.navigate(['/providers/add']),
      });
    }

    return buttons;
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
    $('#providersTable')
      .on('click', '.view-btn', (event: any) =>
        this.navigateToProvider($(event.currentTarget).data('id'), 'view')
      )
      .on('click', '.edit-btn', (event: any) =>
        this.navigateToProvider($(event.currentTarget).data('id'), 'edit')
      )
      .on('click', '.delete-btn', (event: any) =>
        this.deleteProvider($(event.currentTarget).data('id'))
      );
  }

  private navigateToProvider(id: number, action: string): void {
    const routes = {
      view: '/providers/show/',
      edit: '/providers/edit/',
    } as const;
    this.router.navigate([routes[action as keyof typeof routes], id]);
  }

  private deleteProvider(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete(id);
      }
    });
  }

  private executeDelete(id: number): void {
    this.providerService.deleteProvider(id).subscribe({
      next: () => {
        Swal.fire('Eliminado', 'El proveedor ha sido eliminado.', 'success');
        this.loadProviders();
      },
      error: (error) => this.handleError(error, 'eliminar el proveedor'),
    });
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
        <h1>LISTA DE PROVEEDORES</h1>
        <div>Generado: ${date}</div>
      </div>
    `;
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });
  }

  private handleError(
    error: any,
    action: string = 'cargar los proveedores'
  ): void {
    console.error(`Error al ${action}:`, error);
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Ocurrió un error al ${action}`,
    });
  }

  private destroyDataTable(): void {
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }
}
