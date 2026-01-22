import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PruebaService } from '../prueba.service';
import { Prueba } from '../pruebas';
import { PruebaPermissionService } from '../services/prueba-permission.service';

declare var $: any;

@Component({
  selector: 'app-pruebas-list',
  templateUrl: './pruebas-list.component.html',
  styleUrls: ['./pruebas-list.component.css'],
})
export class PruebasListComponent implements OnInit, OnDestroy {
  private dtInstance: any;

  // Propiedades para control de permisos
  canCreatePruebas: boolean = false;
  canEditPruebas: boolean = false;
  canDeletePruebas: boolean = false;
  canViewPruebas: boolean = false;

  constructor(
    private pruebaService: PruebaService,
    private router: Router,
    private pruebaPermissionService: PruebaPermissionService
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.loadPruebas();
  }

  private checkUserPermissions(): void {
    this.canCreatePruebas = this.pruebaPermissionService.canCreatePruebas();
    this.canEditPruebas = this.pruebaPermissionService.canEditPruebas();
    this.canDeletePruebas = this.pruebaPermissionService.canDeletePruebas();
    this.canViewPruebas = this.pruebaPermissionService.canViewPruebas();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadPruebas(): void {
    this.showLoading();

    this.pruebaService.getPruebas().subscribe({
      next: (pruebas: Prueba[]) => this.handlePruebasResponse(pruebas),
      error: (error) => this.handleError(error),
    });
  }

  private handlePruebasResponse(pruebas: Prueba[]): void {
    this.destroyDataTable();
    this.initializeDataTable(pruebas || []);
    Swal.close();
  }

  private initializeDataTable(pruebas: Prueba[]): void {
    this.dtInstance = $('#pruebasTable').DataTable({
      data: pruebas,
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
      {
        title: 'Cliente',
        data: null,
        render: (_data: any, _type: any, row: Prueba) =>
          row.client?.name ?? `Cliente #${row.client_id ?? '-'}`,
      },
      { title: 'Clave', data: 'code' },
      { title: 'Nombre', data: 'name' },
      { title: 'Clave SAT', data: 'sat_code' },
      { title: 'Unidad de medida SAT', data: 'unit' },
      {
        title: 'Especialidad',
        data: null,
        render: (_data: any, _type: any, row: Prueba) =>
          row.specialty?.name ?? `Especialidad #${row.specialty_id ?? '-'}`,
      },
      {
        title: 'Codigo de impuesto',
        data: 'has_tax_code',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Sí</span>'
            : '<span class="badge bg-secondary">No</span>',
      },
      { title: 'Tax ID', data: 'tax_rule_id' },
      {
        title: 'Se factura',
        data: 'is_billable',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Sí</span>'
            : '<span class="badge bg-secondary">No</span>',
      },
      {
        title: 'Se compra',
        data: 'is_purchasable',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Sí</span>'
            : '<span class="badge bg-secondary">No</span>',
      },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: Prueba) => this.renderActions(row),
      },
    ];
  }

  private renderActions(row: Prueba): string {
    let actions = '<div class="btn-group btn-group-sm" role="group">';

    if (this.canViewPruebas) {
      actions += `
        <button class="btn btn-info btn-show" data-id="${row.id}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>`;
    }

    if (this.canEditPruebas) {
      actions += `
        <button class="btn btn-warning btn-edit" data-id="${row.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>`;
    }

    if (this.canDeletePruebas) {
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
        filename: 'EstudiosList',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win),
      },
    ];

    if (this.canCreatePruebas) {
      buttons.push({
        text: '<i class="fas fa-plus me-1"></i> Nuevo Estudio',
        action: () => this.router.navigate(['/pruebas/add']),
      });
    }

    buttons.push({
      text: '<i class="fas fa-sync-alt me-1"></i> Refrescar',
      action: () => this.loadPruebas(),
    });

    return buttons;
  }

  private customizePrint(win: any): void {
    $(win.document.body).css('font-size', '10pt');
    $(win.document.body)
      .find('table')
      .addClass('compact')
      .css('font-size', 'inherit');
  }

  private attachButtonEvents(): void {
    const table = $('#pruebasTable');

    table.off('click', '.btn-show').on('click', '.btn-show', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.router.navigate(['/pruebas/show', id]);
    });

    table.off('click', '.btn-edit').on('click', '.btn-edit', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.router.navigate(['/pruebas/edit', id]);
    });

    table
      .off('click', '.btn-delete')
      .on('click', '.btn-delete', (event: any) => {
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
        this.deletePrueba(id);
      }
    });
  }

  private deletePrueba(id: number): void {
    this.showLoading();

    this.pruebaService.deletePrueba(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El estudio ha sido eliminado correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadPruebas();
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
      text: 'Por favor espera.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error al procesar la solicitud.',
    });
  }
}
