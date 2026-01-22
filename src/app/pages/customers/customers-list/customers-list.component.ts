import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CustomerService } from '../../../pages/customers/customer.service';
import {
  CustomersListResponse,
  Customer,
  CustomerDeleteResponse,
} from '../../sales/customers/customer.model';
import {
  CustomersPrintTemplateService,
  CustomersPrintTemplates,
} from './customers-print-template.service';
import { Subscription } from 'rxjs';
import { CustomerPermissionService } from '../services/customer-permission.service';

declare var $: any;

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.css'],
})
export class CustomersListComponent implements OnInit, OnDestroy {
  @ViewChild('customersTable', { static: false })
  customersTable?: ElementRef<HTMLTableElement>;
  private dtInstance: any;
  private printTemplates?: CustomersPrintTemplates;
  private printTemplatesSub?: Subscription;

  // Propiedades para control de permisos
  canCreateCustomers: boolean = false;
  canEditCustomers: boolean = false;
  canDeleteCustomers: boolean = false;
  canViewCustomers: boolean = false;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private printTemplateService: CustomersPrintTemplateService,
    private customerPermissionService: CustomerPermissionService
  ) {}

  ngOnInit(): void {
    // Verificar permisos del usuario actual
    this.checkUserPermissions();

    this.printTemplatesSub = this.printTemplateService
      .getTemplates()
      .subscribe({
        next: (templates) => (this.printTemplates = templates),
        error: (error) =>
          console.error(
            'No fue posible cargar las plantillas de impresión.',
            error
          ),
      });
    this.loadCustomers();
  }

  private checkUserPermissions(): void {
    this.canCreateCustomers = this.customerPermissionService.canCreateCustomers();
    this.canEditCustomers = this.customerPermissionService.canEditCustomers();
    this.canDeleteCustomers = this.customerPermissionService.canDeleteCustomers();
    this.canViewCustomers = this.customerPermissionService.canViewCustomers();

  }

  ngOnDestroy(): void {
    this.destroyDataTable();
    this.printTemplatesSub?.unsubscribe();
  }

  private loadCustomers(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.customerService.getCustomers().subscribe({
      next: (response: CustomersListResponse) => {
        const customers = response.ok && response.data ? response.data : [];

        // Si la tabla ya existe, actualizar los datos sin destruirla
        if (this.dtInstance) {
          this.dtInstance.clear();
          this.dtInstance.rows.add(customers);
          this.dtInstance.draw();
        } else {
          // Primera carga: inicializar la tabla
          this.initializeDataTable(customers);
        }

        Swal.close();
      },
      error: (error) => {
        console.error('Error al cargar los clientes:', error);
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al cargar los clientes',
        });
      },
    });
  }

  private initializeDataTable(customers: Customer[]): void {
    const $table = this.$table();

    this.dtInstance = $table.DataTable({
      data: customers,
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
      //{ title: "Nombre Corto", data: "shortname" },
      { title: 'Empresa', data: 'company' },
      { title: 'RFC', data: 'tax_id' },
      { title: 'Sitio Web', data: 'website' },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: Customer) =>
          this.renderActions(row),
      },
    ];
  }

  private renderActions(row: Customer): string {
    let actions = '<div class="btn-group" role="group">';

    // Botón Ver - Solo si tiene permiso de ver customers
    if (this.canViewCustomers) {
      actions += `
        <button class="btn btn-sm btn-transparent view-btn" data-id="${row.id}" title="Ver">
          <i class="fa fa-eye"></i>
        </button>
      `;
    }

    // Botón Editar - Solo si tiene permiso de editar customers
    if (this.canEditCustomers) {
      actions += `
        <button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar">
          <i class="fa fa-edit"></i>
        </button>
      `;
    }

    // Botón Eliminar - Solo si tiene permiso de eliminar customers
    if (this.canDeleteCustomers) {
      actions += `
        <button class="btn btn-sm btn-transparent delete-btn" data-id="${row.id}" title="Eliminar">
          <i class="fa fa-trash"></i>
        </button>
      `;
    }

    actions += '</div>';

    // Si no tiene ningún permiso, mostrar mensaje
    if (!this.canViewCustomers && !this.canEditCustomers && !this.canDeleteCustomers) {
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
        filename: 'CustomersList',
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win),
      }
    ];

    // Solo agregar botón de "Agregar Cliente" si tiene permisos
    if (this.canCreateCustomers) {
      buttons.push({
        text: '<i class="fa fa-add"></i> Agregar Cliente',
        action: () => this.router.navigate(['/customers/add']),
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
    const $table = this.$table();

    // Delegated event handlers attached to the table element
    $table
      .on('click', '.view-btn', (event: any) =>
        this.router.navigate([
          '/customers/show',
          $(event.currentTarget).data('id'),
        ])
      )
      .on('click', '.edit-btn', (event: any) =>
        this.router.navigate([
          '/customers/edit',
          $(event.currentTarget).data('id'),
        ])
      )
      .on('click', '.delete-btn', (event: any) =>
        this.deleteCustomer($(event.currentTarget).data('id'))
      );
  }

  private deleteCustomer(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará al cliente sin eliminarlo definitivamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.customerService.deleteCustomer(id).subscribe({
          next: (response: CustomerDeleteResponse) => {
            const message =
              response?.message || 'El cliente ha sido desactivado.';
            Swal.fire('Desactivado', message, 'success');
            this.loadCustomers();
          },
          error: (error) => {
            console.error('Error al desactivar al cliente:', error);
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al desactivar al cliente',
            });
          },
        });
      }
    });
  }

  private customizePrint(win: any): void {
    if (!this.printTemplates) {
      console.warn('Plantillas de impresión no disponibles.');
      return;
    }

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

    const { styles, header, footer } = this.printTemplates;
    const headerMarkup = this.buildPrintMarkup(header, date, time, true);
    const footerMarkup = this.buildPrintMarkup(footer, date, time, false);

    if (styles) $(win.document.head).append(`<style>${styles}</style>`);

    $(win.document.body)
      .addClass('print-ready')
      .prepend(headerMarkup)
      .append(footerMarkup)
      .find(
        '.dt-buttons, .dataTables_filter, .dataTables_length, .dataTables_info, .dataTables_paginate'
      )
      .hide();
  }

  private buildPrintMarkup(
    template: string,
    date: string,
    time: string,
    isHeader: boolean
  ): string {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(template, 'text/html');
    const element = parsed.body.firstElementChild;
    const selector = isHeader ? '[data-print-meta]' : '[data-print-footer]';
    const target = element?.hasAttribute(selector.slice(1, -1))
      ? element
      : element?.querySelector(selector);

    if (target) {
      target.innerHTML = isHeader
        ? `<div>Generado: ${date} ${time} hrs</div><div>Fuente: Sistema Épica</div>`
        : `Reporte generado automáticamente el ${date} a las ${time} hrs por el Sistema Épica.`;
    }

    return element ? element.outerHTML : template;
  }

  private subscribeToPrintTemplates(): void {
    this.printTemplatesSub = this.printTemplateService
      .getTemplates()
      .subscribe({
        next: (templates) => {
          this.printTemplates = templates;
        },
        error: (error) => {
          console.error(
            'No fue posible cargar las plantillas de impresión.',
            error
          );
        },
      });
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
    action: string = 'cargar los clientes'
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
    const $table = this.$table();
    $table
      ?.off('click', '.view-btn')
      ?.off('click', '.edit-btn')
      ?.off('click', '.delete-btn');
    if (this.dtInstance) {
      this.dtInstance.destroy(true);
      this.dtInstance = null;
    }
  }

  /**
   * Safe jQuery wrapper for the table element, with a fallback to the global selector
   */
  private $table(): any {
    return this.customersTable
      ? $(this.customersTable.nativeElement)
      : $('#customersTable');
  }
}
