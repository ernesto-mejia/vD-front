import { Component, OnInit, OnDestroy  } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { RoleService } from '../../role/role.service';
import { RolesListResponse, RoleDetail } from '../role';
import 'datatables.net-buttons-dt';

@Component({
  selector: 'app-roles-list',
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.css'
})
export class RolesListComponent  implements OnInit, OnDestroy {
  private dtInstance: any;
  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroyDataTable();
  }

  private loadRoles(): void {
    this.showLoading();

    this.roleService.getRoles().subscribe({
      next: (response: RolesListResponse) => {
        this.handleRolesResponse(response);
      },
      error: (error) => this.handleError(error)
    });
  }

  private handleRolesResponse(response: RolesListResponse): void {
    const roles = response.data?.data || [];
    this.destroyDataTable();
    this.initializeDataTable(roles);
    Swal.close();
  }

  private initializeDataTable(roles: RoleDetail[]): void {
    this.dtInstance = $('#rolesTable').DataTable({
      data: roles,
      columns: this.getTableColumns(),
      lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
      dom: '<"d-flex justify-content-between mb-3 custom-margin"Bf>rt<"d-flex justify-content-between mt-3"p li>',
      language: this.getTableLanguage(),
      buttons: this.getTableButtons(),
      autoWidth: false,
      scrollX: true,
      // @ts-ignore
      responsive: true,
      initComplete: () => this.attachButtonEvents()
    });
  }

  private getTableColumns(): any[] {
    return [
      { title: "Rol", data: "name" },
      {
        title: "Acciones",
        data: null,
        orderable: false,
        render: (data: any, type: any, row: RoleDetail) => this.renderActions(row)
      }
    ];
  }

  private renderActions(row: RoleDetail): string {
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
        action: () => this.router.navigate(['/dashboard'])
      },
      {
        extend: 'excel',
        text: '<i class="fa-solid fa-file-excel"></i> Exportar',
        filename: 'ProvidersList'
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win)
      },
      {
        text: '<i class="fa fa-add"></i> Agregar Rol',
        action: () => this.router.navigate(['/roles/add'])
      }
    ];
  }

  private getTableLanguage(): any {
    return {
      search: "Buscar:",
      lengthMenu: '_MENU_ registros por página',
      info: 'De _START_ a _END_ de _TOTAL_ registros',
      infoEmpty: 'Mostrando 0 registros',
      infoFiltered: '(filtrado de _MAX_ registros totales)',
      emptyTable: "Sin información",
      paginate: {
        previous: 'Anterior',
        next: 'Siguiente'
      }
    };
  }

  private attachButtonEvents(): void {
    $('#rolesTable')
      .on('click', '.view-btn', (event: any) =>
        this.navigateToProvider($(event.currentTarget).data('id'), 'view'))
      .on('click', '.edit-btn', (event: any) =>
        this.navigateToProvider($(event.currentTarget).data('id'), 'edit'))
      .on('click', '.delete-btn', (event: any) =>
        this.deleteProvider($(event.currentTarget).data('id')));
  }

  private navigateToProvider(id: number, action: string): void {
    const routes = {
      view: '/roles/show/',
      edit: '/roles/edit/'
    } as const;
    this.router.navigate([routes[action as keyof typeof routes], id]);
  }

  private deleteProvider(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete(id);
      }
    });
  }

  private executeDelete(id: number): void {
    this.roleService.deleteRole(id).subscribe({
      next: () => {
        Swal.fire('Eliminado', 'El rol ha sido eliminado.', 'success');
        this.loadRoles();
      },
      error: (error) => this.handleError(error, 'eliminar el rol')
    });
  }


  private customizePrint(win: any): void {
    const currentDate = new Date().toLocaleDateString('es-MX');
    const css = this.getPrintStyles();
    const header = this.getPrintHeader(currentDate);

    $(win.document.body)
      .prepend(css + header)
      .find('.dt-buttons, .dataTables_filter, .dataTables_length, .dataTables_info, .dataTables_paginate')
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

  private handleError(error: any, action: string = 'cargar los roles'): void {
      console.error(`Error al ${action}:`, error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Ocurrió un error al ${action}`
      });
    }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });
  }

  private destroyDataTable(): void {
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }
}
