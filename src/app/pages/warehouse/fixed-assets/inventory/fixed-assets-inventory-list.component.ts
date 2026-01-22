import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FixedAssetInventoryItem, FixedAssetsService } from '../fixed-assets.service';

declare var $: any;

@Component({
  selector: 'app-fixed-assets-inventory-list',
  templateUrl: './fixed-assets-inventory-list.component.html',
  styleUrls: ['./fixed-assets-inventory-list.component.css'],
})
export class FixedAssetsInventoryListComponent implements OnInit, OnDestroy {
  private dtInstance: any;

  constructor(
    private fixedAssetsService: FixedAssetsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadInventory(): void {
    this.showLoading();
    this.fixedAssetsService.getInventory().subscribe({
      next: (items) => {
        this.destroyDataTable();
        this.initializeDataTable(items || []);
        Swal.close();
      },
      error: (error) => this.handleError(error),
    });
  }

  private initializeDataTable(items: FixedAssetInventoryItem[]): void {
    this.dtInstance = $('#fixedAssetsInventoryTable').DataTable({
      data: items,
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
      { title: 'Num interno', data: 'internal_code' },
      { title: 'Nombre', data: 'name' },
      { title: 'Ubicacion', data: 'location' },
      { title: 'Categoria', data: 'category' },
      {
        title: 'Catalogo',
        data: 'catalog_id',
        render: (data: number) => this.fixedAssetsService.getCatalogName(data),
      },
      {
        title: 'Tipo',
        data: 'ownership_type',
        render: (data: string) => (data === 'owned' ? 'Activo propio' : 'Comodato'),
      },
      { title: 'Placa', data: 'plate_id' },
      {
        title: 'Valor',
        data: 'acquisition_value',
        render: (data: number) => (data ? `$${data.toLocaleString('es-MX')}` : '-'),
      },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (_data: any, _type: any, row: FixedAssetInventoryItem) => this.renderActions(row),
      },
    ];
  }

  private renderActions(row: FixedAssetInventoryItem): string {
    return `
      <div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-info btn-show" data-id="${row.id}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-warning btn-edit" data-id="${row.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-delete" data-id="${row.id}" title="Eliminar">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
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
        last: 'Ultimo',
      },
    };
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
        filename: 'ActivosFijosInventario',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
      },
      {
        text: '<i class="fas fa-plus me-1"></i> Nuevo',
        action: () => this.router.navigate(['/fixed-assets/inventory/add']),
      },
      {
        text: '<i class="fas fa-sync-alt me-1"></i> Refrescar',
        action: () => this.loadInventory(),
      },
    ];
  }

  private attachButtonEvents(): void {
    const table = $('#fixedAssetsInventoryTable');

    table.off('click', '.btn-show').on('click', '.btn-show', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.router.navigate(['/fixed-assets/inventory/show', id]);
    });

    table.off('click', '.btn-edit').on('click', '.btn-edit', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.router.navigate(['/fixed-assets/inventory/edit', id]);
    });

    table.off('click', '.btn-delete').on('click', '.btn-delete', (event: any) => {
      const id = $(event.currentTarget).data('id');
      this.confirmDelete(id);
    });
  }

  private confirmDelete(id: number): void {
    Swal.fire({
      title: '¿Estas seguro?',
      text: 'Esta accion no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteInventory(id);
      }
    });
  }

  private deleteInventory(id: number): void {
    this.showLoading();
    this.fixedAssetsService.deleteInventory(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El activo ha sido eliminado correctamente.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.loadInventory();
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
      text: 'Ocurrio un error al procesar la solicitud.',
    });
  }
}
