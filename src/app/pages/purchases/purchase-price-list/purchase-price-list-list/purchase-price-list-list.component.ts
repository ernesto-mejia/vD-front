import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PurchasePriceListService } from '../purchase-price-list.service';
import { PurchasePriceList } from '../purchase-price-list';
import { PurchasePriceListPermissionService } from '../services/purchase-price-list-permission.service';

declare var $: any;

@Component({
  selector: 'app-purchase-price-list-list',
  templateUrl: './purchase-price-list-list.component.html',
  styleUrls: ['./purchase-price-list-list.component.css'],
})
export class PurchasePriceListListComponent implements OnInit, OnDestroy {
  private dtInstance: any;

  // Propiedades para control de permisos
  canCreatePriceLists: boolean = false;
  canEditPriceLists: boolean = false;
  canDeletePriceLists: boolean = false;
  canViewPriceLists: boolean = false;

  constructor(
    private priceListService: PurchasePriceListService,
    private router: Router,
    private permissionService: PurchasePriceListPermissionService
  ) {}

  ngOnInit(): void {
    // Verificar permisos del usuario actual
    this.checkUserPermissions();
    this.loadPriceLists();
  }

  private checkUserPermissions(): void {
    this.canCreatePriceLists = this.permissionService.canCreatePriceLists();
    this.canEditPriceLists = this.permissionService.canEditPriceLists();
    this.canDeletePriceLists = this.permissionService.canDeletePriceLists();
    this.canViewPriceLists = this.permissionService.canViewPriceLists();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadPriceLists(): void {
    this.showLoading();

    this.priceListService.getPriceLists().subscribe({
      next: (priceLists: PurchasePriceList[]) => this.handlePriceListsResponse(priceLists),
      error: (error) => this.handleError(error),
    });
  }

  private handlePriceListsResponse(priceLists: PurchasePriceList[]): void {
    this.destroyDataTable();
    this.initializeDataTable(priceLists || []);
    Swal.close();
  }

  private initializeDataTable(priceLists: PurchasePriceList[]): void {
    this.dtInstance = $('#priceListTable').DataTable({
      data: priceLists,
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
      { title: 'Código', data: 'code' },
      { title: 'Nombre', data: 'name' },
      { title: 'Proveedor', data: 'provider_name', defaultContent: '-' },
      { title: 'Moneda', data: 'currency' },
      {
        title: 'Descuento %',
        data: 'discount_percentage',
        render: (data: number) => data ? `${data}%` : '0%',
      },
      {
        title: 'Vigencia Inicio',
        data: 'start_date',
        render: (data: string) => data ? new Date(data).toLocaleDateString('es-MX') : '-',
      },
      {
        title: 'Vigencia Fin',
        data: 'end_date',
        render: (data: string) => data ? new Date(data).toLocaleDateString('es-MX') : '-',
      },
      {
        title: 'Estado',
        data: 'is_active',
        render: (data: boolean) =>
          data
            ? '<span class="badge bg-success">Activa</span>'
            : '<span class="badge bg-danger">Inactiva</span>',
      },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: PurchasePriceList) => this.renderActions(row),
      },
    ];
  }

  private renderActions(row: PurchasePriceList): string {
    let actions = '<div class="btn-group btn-group-sm" role="group">';

    // Botón Ver
    if (this.canViewPriceLists) {
      actions += `
        <button class="btn btn-info btn-show" data-id="${row.id}" title="Ver">
          <i class="fas fa-eye"></i>
        </button>`;
    }

    // Botón Editar
    if (this.canEditPriceLists) {
      actions += `
        <button class="btn btn-warning btn-edit" data-id="${row.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>`;
    }

    // Botón Eliminar
    if (this.canDeletePriceLists) {
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
        filename: 'ListasPreciosCompra',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win),
      },
    ];

    // Botón Agregar (solo si tiene permiso)
    if (this.canCreatePriceLists) {
      buttons.push({
        text: '<i class="fas fa-plus me-1"></i> Nueva Lista de Precios',
        action: () => this.router.navigate(['/purchases/purchase-price-list/add']),
      });
    }

    // Botón Refrescar
    buttons.push({
      text: '<i class="fas fa-sync-alt"></i> Refrescar',
      action: () => this.loadPriceLists(),
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
    const tableBody = document.querySelector('#priceListTable tbody');
    if (tableBody) {
      tableBody.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const button = target.closest('button');

        if (button) {
          const id = button.getAttribute('data-id');
          if (id) {
            if (button.classList.contains('btn-show')) {
              this.viewPriceList(Number(id));
            } else if (button.classList.contains('btn-edit')) {
              this.editPriceList(Number(id));
            } else if (button.classList.contains('btn-delete')) {
              this.confirmDelete(Number(id));
            }
          }
        }
      });
    }
  }

  private viewPriceList(id: number): void {
    this.router.navigate(['/purchases/purchase-price-list/show', id]);
  }

  private editPriceList(id: number): void {
    this.router.navigate(['/purchases/purchase-price-list/edit', id]);
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
        this.deletePriceList(id);
      }
    });
  }

  private deletePriceList(id: number): void {
    Swal.fire({
      title: 'Eliminando...',
      text: 'Por favor espera.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.priceListService.deletePriceList(id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'La lista de precios ha sido eliminada correctamente.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          this.loadPriceLists();
        });
      },
      error: (error) => {
        console.error('Error al eliminar lista de precios:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la lista de precios.',
        });
      },
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
      text: 'Obteniendo listas de precios...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });
  }

  private handleError(error: any): void {
    console.error('Error al cargar listas de precios:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las listas de precios.',
    });
  }
}
