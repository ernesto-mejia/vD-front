import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { ProductsService } from '../products.service';
import { Product, ProductsListResponse } from '../products';

declare var $: any;

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [SidebarComponent, CommonModule, DataTablesModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css',
})
export class ProductsListComponent implements OnInit, OnDestroy {
  private dtInstance: any;

  constructor(
    private productsService: ProductsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadProducts(): void {
    this.showLoading();

    this.productsService.getProducts().subscribe({
      next: (response: ProductsListResponse) => {
        const products = response.ok && response.data ? response.data : [];
        this.destroyDataTable();
        this.initializeDataTable(products);
        Swal.close();
      },
      error: (error) => this.handleError(error, 'cargar los productos'),
    });
  }

  private initializeDataTable(products: Product[]): void {
    this.dtInstance = $('#productsTable').DataTable({
      data: products,
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
      { title: 'SKU', data: 'sku' },
      { title: 'Nombre', data: 'name' },
      {
        title: 'Proveedor',
        data: 'primary_provider.name',
        defaultContent: '',
      },
      {
        title: '# Catálogo',
        data: 'primary_provider.provider_code',
        defaultContent: '',
      },
      {
        title: 'Tipo de producto',
        data: 'product_type_name',
        defaultContent: '',
      },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: Product) => this.renderActions(row),
      },
    ];
  }

  private renderActions(row: Product): string {
    return `
      <div class="btn-group" role="group">
        <button class="btn btn-sm btn-transparent view-btn" data-id="${row.id}" title="Ver">
          <i class="fa fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar">
          <i class="fa fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-transparent delete-btn" data-id="${row.id}" title="Eliminar">
          <i class="fa fa-trash"></i>
        </button>
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
        filename: 'ProductsList',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
      },
      {
        text: '<i class="fa fa-add"></i> Agregar Productos',
        action: () => this.router.navigate(['/products/add']),
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
    $('#productsTable')
      .on('click', '.view-btn', (event: any) =>
        this.navigateToProduct($(event.currentTarget).data('id'), 'view')
      )
      .on('click', '.edit-btn', (event: any) =>
        this.navigateToProduct($(event.currentTarget).data('id'), 'edit')
      )
      .on('click', '.delete-btn', (event: any) =>
        this.confirmDelete($(event.currentTarget).data('id'))
      );
  }

  private confirmDelete(id: number): void {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteProduct(id);
      }
    });
  }

  private deleteProduct(id: number): void {
    Swal.fire({
      title: 'Eliminando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.productsService.deleteProduct(id).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al eliminar el producto:', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudo eliminar el producto. Intente nuevamente.',
          'error'
        );
      },
    });
  }

  private navigateToProduct(id: number, action: string): void {
    const routes = {
      view: '/products/show/',
      edit: '/products/edit/',
    } as const;
    this.router.navigate([routes[action as keyof typeof routes], id]);
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });
  }

  private handleError(error: any, action: string): void {
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
