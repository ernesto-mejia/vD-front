import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { GenericEntityConfig } from '../generic-entity.config';

declare var $: any;

@Component({
  selector: 'app-generic-list',
  standalone: true,
  imports: [SidebarComponent, CommonModule, DataTablesModule],
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.css']
})
export class GenericListComponent implements OnInit, OnDestroy {
  @Input() config!: GenericEntityConfig;
  @ViewChild('dataTable', { static: false }) dataTable?: ElementRef<HTMLTableElement>;

  private dtInstance: any;
  data: any[] = [];

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      console.error('GenericListComponent requires config input');
      return;
    }
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  /**
   * Carga los datos de la entidad
   */
  private loadData(): void {
    Swal.fire({
      title: 'Cargando...',
      text: `Por favor espera mientras se cargan los ${this.config.pluralName.toLowerCase()}.`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    // Usar el servicio inyectado desde la configuración
    const service = this.config.serviceClass;
    const listMethod = this.getListMethodName();

    service[listMethod]().subscribe({
      next: (response: any) => {
        const items = this.extractDataFromResponse(response);
        this.data = items;
        this.destroyDataTable();
        this.initializeDataTable(items);
        Swal.close();
      },
      error: (error: any) => {
        console.error(`Error al cargar los ${this.config.pluralName.toLowerCase()}:`, error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `Ocurrió un error al cargar los ${this.config.pluralName.toLowerCase()}`
        });
      }
    });
  }

  /**
   * Obtiene el nombre del método del servicio para listar
   */
  private getListMethodName(): string {
    switch (this.config.entityType) {
      case 'provider':
        return 'getProviders';
      case 'customer':
        return 'getCustomers';
      default:
        return 'getData';
    }
  }

  /**
   * Extrae los datos de la respuesta de la API
   */
  private extractDataFromResponse(response: any): any[] {
    if (response.ok && response.data) {
      return Array.isArray(response.data) ? response.data : [response.data];
    }
    return [];
  }

  /**
   * Inicializa DataTable
   */
  private initializeDataTable(items: any[]): void {
    if (!this.dataTable?.nativeElement) return;

    const columns = this.getTableColumns();
    this.dtInstance = $(this.dataTable.nativeElement).DataTable({
      data: items,
      columns: columns,
      lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'Todos']],
      dom: '<"d-flex justify-content-between mb-3"Bf>rt<"d-flex justify-content-between mt-3"p li>',
      language: this.getTableLanguage(),
      buttons: this.getTableButtons(),
      autoWidth: false,
      scrollX: true,
      responsive: true,
      initComplete: () => this.attachButtonEvents()
    });
  }

  /**
   * Define las columnas de la tabla
   */
  private getTableColumns(): any[] {
    if (this.config.listColumns) {
      return [...this.config.listColumns, this.getActionColumn()];
    }

    // Columnas por defecto según el tipo de entidad
    const defaultColumns: any[] = [
      { title: 'Empresa', data: 'company' },
      { title: 'RFC', data: 'tax_id' },
      { title: 'Sitio Web', data: 'website' },
      { title: 'Ámbito', data: 'company_scope' }
    ];

    return [...defaultColumns, this.getActionColumn()];
  }

  /**
   * Columna de acciones
   */
  private getActionColumn(): any {
    return {
      title: 'Acciones',
      data: null,
      orderable: false,
      render: (data: any, type: string, row: any) => `
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-info btn-sm view-btn" data-id="${row.id}">
            <i class="bi bi-eye"></i> Ver
          </button>
          <button class="btn btn-warning btn-sm edit-btn" data-id="${row.id}">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${row.id}">
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </div>
      `
    };
  }

  /**
   * Configuración de idioma para DataTable
   */
  private getTableLanguage(): any {
    return {
      sProcessing: 'Procesando...',
      sLengthMenu: 'Mostrar _MENU_ registros',
      sZeroRecords: `No se encontraron ${this.config.pluralName.toLowerCase()}`,
      sEmptyTable: `No hay ${this.config.pluralName.toLowerCase()} disponibles`,
      sInfo: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
      sInfoEmpty: 'Mostrando 0 a 0 de 0 registros',
      sInfoFiltered: '(filtrado de _MAX_ registros en total)',
      sInfoPostFix: '',
      sSearch: 'Buscar:',
      sUrl: '',
      sLoadingRecords: 'Cargando...'
    };
  }

  /**
   * Botones de exportación
   */
  private getTableButtons(): any[] {
    return [
      {
        extend: 'copy',
        text: 'Copiar',
        className: 'btn btn-sm btn-secondary'
      },
      {
        extend: 'csv',
        text: 'CSV',
        className: 'btn btn-sm btn-secondary'
      },
      {
        extend: 'excel',
        text: 'Excel',
        className: 'btn btn-sm btn-secondary'
      },
      {
        extend: 'pdf',
        text: 'PDF',
        className: 'btn btn-sm btn-secondary'
      },
      {
        extend: 'print',
        text: 'Imprimir',
        className: 'btn btn-sm btn-secondary'
      }
    ];
  }

  /**
   * Adjunta eventos a los botones de acción
   */
  private attachButtonEvents(): void {
    const self = this;

    // Botones de ver
    $(this.dataTable?.nativeElement).on('click', '.view-btn', function (this: any) {
      const id = $(this).data('id');
      self.router.navigate([self.config.showRoute, id]);
    });

    // Botones de editar
    $(this.dataTable?.nativeElement).on('click', '.edit-btn', function (this: any) {
      const id = $(this).data('id');
      self.router.navigate([self.config.editRoute, id]);
    });

    // Botones de eliminar
    $(this.dataTable?.nativeElement).on('click', '.delete-btn', function (this: any) {
      const id = $(this).data('id');
      self.onDelete(id);
    });
  }

  /**
   * Maneja la eliminación de un registro
   */
  private onDelete(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el ${this.config.singularName.toLowerCase()}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteItem(id);
      }
    });
  }

  /**
   * Elimina un elemento
   */
  private deleteItem(id: number): void {
    Swal.fire({
      title: 'Eliminando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    const service = this.config.serviceClass;
    const deleteMethod = this.getDeleteMethodName();

    service[deleteMethod](id).subscribe({
      next: (response: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: `${this.config.singularName} eliminado correctamente`
        }).then(() => {
          this.loadData();
        });
      },
      error: (error: any) => {
        console.error('Error al eliminar:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: `No se pudo eliminar el ${this.config.singularName.toLowerCase()}`
        });
      }
    });
  }

  /**
   * Obtiene el nombre del método del servicio para eliminar
   */
  private getDeleteMethodName(): string {
    switch (this.config.entityType) {
      case 'provider':
        return 'deleteProvider';
      case 'customer':
        return 'deleteCustomer';
      default:
        return 'deleteItem';
    }
  }

  /**
   * Destruye la instancia de DataTable
   */
  private destroyDataTable(): void {
    if (this.dtInstance && $.fn.DataTable.isDataTable(this.dataTable?.nativeElement)) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }

  /**
   * Navega a la página de agregar
   */
  onAddNew(): void {
    this.router.navigate([this.config.addRoute]);
  }
}
