import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { Config } from 'datatables.net-dt';
import 'datatables.net-buttons-dt';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SharedService } from '../../../../servicios/shared.service';
import { UserService } from '../user.service';
import Swal from 'sweetalert2';
import { user } from '../user';
import { UserPermissionService } from '../../services/user-permission.service';


@Component({
  selector: 'app-user-list',

  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit, OnDestroy {
  private dtInstance: any;
    @ViewChild('usersTable', { static: false }) usersTable?: ElementRef<HTMLTableElement>;


  errorMessage: string = '';
  users: any[] = [];
  dtOptions: Config = {};
  currentPage: number = 1;
  totalRecords: number = 0;
  pageLength: number = 15;
  searchTerm: string = '';
  searchTimeout: any;
  router = inject(Router);

  // Propiedades para control de permisos
  canCreateUsers: boolean = false;
  canEditUsers: boolean = false;
  canDeleteUsers: boolean = false;
  canViewUsers: boolean = false;
  canListUsers: boolean = false;

  public activeSubSection = new BehaviorSubject<string | null>(localStorage.getItem('activeSubSection'));
  public activeSection = new BehaviorSubject<string | null>(localStorage.getItem('activeSection'));

  constructor(
    private userService: UserService,
    public sharedService: SharedService,
    private userPermissionService: UserPermissionService
  ) {}

  ngOnInit(): void {
    // Verificar permisos del usuario actual
    this.checkUserPermissions();

    this.sharedService.reloadPermissions();

    // Configurar la sección activa para usuarios
    localStorage.setItem('activeSection', 'users');
    localStorage.setItem('activeSubSection', 'users');
    this.activeSection.next('users');
    this.activeSubSection.next('users');

    this.initializeDataTableServerSide();
  }

  private checkUserPermissions(): void {
    this.canCreateUsers = this.userPermissionService.canCreateUsers();
    this.canEditUsers = this.userPermissionService.canEditUsers();
    this.canDeleteUsers = this.userPermissionService.canDeleteUsers();
    this.canViewUsers = this.userPermissionService.canViewUsers();
    this.canListUsers = this.userPermissionService.canListUsers();
  }

  private initializeDataTableServerSide(): void {
    const self = this;
    this.dtInstance = $('#usersTable').DataTable({
      serverSide: true,
      processing: true,
      ajax: (dataTablesParams: any, callback: any) => {
        const page = dataTablesParams.start / dataTablesParams.length + 1;
        const length = dataTablesParams.length;
        const search = dataTablesParams.search?.value || '';

        // Actualizar término de búsqueda
        self.searchTerm = search;

        Swal.fire({
          title: 'Cargando...',
          text: 'Por favor espera mientras se cargan los datos.',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(null)
        });

        self.userService.getUsers(page, length, search).subscribe({
          next: (resp) => {
            self.currentPage = resp.meta?.current_page || page;
            self.totalRecords = resp.meta?.total || resp.data.length;
            self.pageLength = resp.meta?.per_page || length;
            callback({
              data: resp.data,
              recordsTotal: self.totalRecords,
              recordsFiltered: self.totalRecords
            });
            Swal.close();
          },
          error: (error) => {
            console.error('Error al cargar usuarios:', error);
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al cargar los usuarios'
            });
            callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
          }
        });
      },
      columns: this.getTableColumns(),
      pageLength: this.pageLength,
      lengthMenu: [[10, 15, 25, 50], [10, 15, 25, 50]],
      dom: '<"d-flex justify-content-between mb-3 custom-margin"Bf>rt<"d-flex justify-content-between mt-3"p li>',
      language: this.getTableLanguage(),
      buttons: this.getTableButtons(),
      autoWidth: false,
      scrollX: true,
      searchDelay: 500,
      initComplete: () => this.attachButtonEvents()
    });
  }

  private attachButtonEvents(): void {
    const $table = $('#usersTable');

    $table.on('click', '.view-btn', (event: any) => {
      const userId = $(event.currentTarget).data('id');
      this.userService.userView(userId);
    });

    $table.on('click', '.edit-btn', (event: any) => {
      const userId = $(event.currentTarget).data('id');
      this.userService.editUser(userId);
    });

    $table.on('click', '.delete-btn', (event: any) => {
      const userId = $(event.currentTarget).data('id');
      this.confirmAndDeleteUser(userId);
    });
  }

  private confirmAndDeleteUser(userId: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.softDeleteUser(userId);
      }
    });
  }

    private getTableColumns(): any[] {
      return [

        { title: "Nombre de Usuario", data: "user_name" },
        { title: "Email", data: "email" },
        { title: "Estatus", data: "status" },
       // { title: "Rol", data: "roles", render: (data: any, type: any, row: user) => {} },
        {
          title: "Acciones",
          data: null,
          orderable: false,
          render: (data: any, type: any, row: user) => this.renderActions(row)
        }
      ];
    }

  private renderActions(row: user): string {
    let actions = '<div class="btn-group" role="group">';

    // Botón Ver - Solo si tiene permiso de ver usuarios
    if (this.canViewUsers) {
      actions += `
        <button class="btn btn-sm btn-transparent view-btn" data-id="${row.id}" title="Ver">
          <i class="fa fa-eye"></i>
        </button>
      `;
    }

    // Botón Editar - Solo si tiene permiso de editar usuarios
    if (this.canEditUsers) {
      actions += `
        <button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar">
          <i class="fa fa-edit"></i>
        </button>
      `;
    }

    // Botón Eliminar - Solo si tiene permiso de eliminar usuarios
    if (this.canDeleteUsers) {
      actions += `
        <button class="btn btn-sm btn-transparent delete-btn" data-id="${row.id}" title="Eliminar">
          <i class="fa fa-trash"></i>
        </button>
      `;
    }

    actions += '</div>';

    // Si no tiene ningún permiso, mostrar mensaje
    if (!this.canViewUsers && !this.canEditUsers && !this.canDeleteUsers) {
      actions = '<small class="text-muted">Sin permisos</small>';
    }



    return actions;
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

  private getTableButtons(): any[] {
    const buttons: any[] = [
      {
        text: '<i class="fa fa-home"></i> Inicio',
        action: () => this.router.navigate(['/dashboard'])
      },
      {
        extend: 'excel',
        text: '<i class="fa-solid fa-file-excel"></i> Exportar',
        filename: 'UsersList'
      },
      {
        extend: 'print',
        text: '<i class="fa fa-print"></i> Imprimir',
        customize: (win: any) => this.customizePrint(win)
      }
    ];

    // Solo agregar botón de "Agregar Usuario" si tiene permisos
    if (this.canCreateUsers) {
      buttons.push({
        text: '<i class="fa fa-add"></i> Agregar Usuario',
        action: () => this.router.navigate(['/users/create'])
      });
    }

    return buttons;
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
ngOnDestroy(): void {
  this.destroyDataTable();
}

  private destroyDataTable(): void {
    const $table = this.$table();
    $table?.off('click', '.view-btn')?.off('click', '.edit-btn')?.off('click', '.delete-btn');
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    if (this.dtInstance) {
      this.dtInstance.destroy(true);
      this.dtInstance = null;
    }
  }

    private $table(): any {
    return this.usersTable ? $(this.usersTable.nativeElement) : $('#usersTable');
  }

}
