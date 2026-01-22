import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ProviderContractService } from '../contract.service';
import { ProviderContract, ProviderContractFilters, ProviderOption } from '../contracts';

declare var $: any;

@Component({
  selector: 'app-contracts-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './contracts-list.component.html',
  styleUrl: './contracts-list.component.css'
})
export class ContractsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private dtInstance: any;

  contracts: ProviderContract[] = [];
  providers: ProviderOption[] = [];
  loading = false;

  // Filtros
  filters: ProviderContractFilters = {};
  hasClientContractFilter: string = '';  // '', 'yes', 'no'

  // Permisos
  canCreate = true;
  canEdit = true;
  canDelete = true;
  canView = true;

  constructor(
    private contractService: ProviderContractService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProviders();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyDataTable();
  }

  private loadProviders(): void {
    this.contractService.getProviders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => this.providers = providers,
        error: (err) => console.error('Error cargando proveedores:', err)
      });
  }

  loadContracts(): void {
    this.loading = true;
    this.showLoading();

    // Procesar filtro de relación con cliente
    if (this.hasClientContractFilter === 'yes') {
      this.filters.has_client_contract = true;
    } else if (this.hasClientContractFilter === 'no') {
      this.filters.has_client_contract = false;
    } else {
      delete this.filters.has_client_contract;
    }

    this.contractService.getContracts(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contracts = response.data || [];
          this.destroyDataTable();
          this.initializeDataTable();
          Swal.close();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando contratos:', err);
          Swal.fire('Error', 'No se pudieron cargar los contratos', 'error');
          this.loading = false;
        }
      });
  }

  private showLoading(): void {
    Swal.fire({
      title: 'Cargando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });
  }

  private initializeDataTable(): void {
    setTimeout(() => {
      this.dtInstance = $('#providerContractsTable').DataTable({
        data: this.contracts,
        columns: this.getTableColumns(),
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, 'Todos']],
        dom: '<"d-flex justify-content-between mb-3"Bf>rt<"d-flex justify-content-between mt-3"pli>',
        language: this.getTableLanguage(),
        buttons: this.getTableButtons(),
        autoWidth: false,
        scrollX: true,
        responsive: true,
        initComplete: () => this.attachButtonEvents()
      });
    }, 100);
  }

  private getTableColumns(): any[] {
    return [
      { title: 'ID', data: 'id', width: '50px' },
      { title: 'Nombre Contrato', data: 'contract_name' },
      { title: 'Proveedor', data: 'provider_name' },
      {
        title: 'Contrato Cliente',
        data: null,
        render: (data: any, type: any, row: ProviderContract) =>
          row.client_contract_name ? `<span class="badge bg-success">${row.client_contract_name}</span>` : '<span class="text-muted">-</span>'
      },
      {
        title: 'Items',
        data: null,
        render: (data: any, type: any, row: ProviderContract) =>
          `<span class="badge bg-info">${row.items_count ?? row.items?.length ?? 0}</span>`
      },
      { title: 'Estado', data: 'status_name' },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: ProviderContract) => this.renderActions(row)
      }
    ];
  }

  private renderActions(row: ProviderContract): string {
    let actions = '<div class="btn-group" role="group">';

    if (this.canView) {
      actions += `<button class="btn btn-sm btn-transparent view-btn" data-id="${row.id}" title="Ver"><i class="fa fa-eye"></i></button>`;
    }
    if (this.canEdit) {
      actions += `<button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar"><i class="fa fa-edit"></i></button>`;
    }
    if (this.canDelete) {
      actions += `<button class="btn btn-sm btn-transparent delete-btn" data-id="${row.id}" title="Eliminar"><i class="fa fa-trash"></i></button>`;
    }

    actions += '</div>';
    return actions;
  }

  private getTableButtons(): any[] {
    const buttons: any[] = [];

    if (this.canCreate) {
      buttons.push({
        text: '<i class="fas fa-plus me-1"></i> Nuevo Contrato',
        className: 'btn btn-primary btn-sm',
        action: () => this.router.navigate(['/purchases/contracts-providers/add'])
      });
    }

    buttons.push(
      { extend: 'excel', text: '<i class="fas fa-file-excel me-1"></i> Excel', className: 'btn btn-success btn-sm' },
      { extend: 'pdf', text: '<i class="fas fa-file-pdf me-1"></i> PDF', className: 'btn btn-danger btn-sm' }
    );

    return buttons;
  }

  private getTableLanguage(): any {
    return {
      lengthMenu: 'Mostrar _MENU_ registros',
      zeroRecords: 'No se encontraron contratos',
      info: 'Mostrando _START_ a _END_ de _TOTAL_ contratos',
      infoEmpty: 'No hay contratos disponibles',
      infoFiltered: '(filtrado de _MAX_ contratos totales)',
      search: 'Buscar:',
      paginate: { first: 'Primero', last: 'Último', next: 'Siguiente', previous: 'Anterior' }
    };
  }

  private attachButtonEvents(): void {
    $('#providerContractsTable').on('click', '.view-btn', (e: any) => {
      const id = $(e.currentTarget).data('id');
      this.router.navigate(['/purchases/contracts-providers/show', id]);
    });

    $('#providerContractsTable').on('click', '.edit-btn', (e: any) => {
      const id = $(e.currentTarget).data('id');
      this.router.navigate(['/purchases/contracts-providers/edit', id]);
    });

    $('#providerContractsTable').on('click', '.delete-btn', (e: any) => {
      const id = $(e.currentTarget).data('id');
      this.confirmDelete(id);
    });
  }

  private confirmDelete(id: number): void {
    Swal.fire({
      title: '¿Eliminar contrato?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteContract(id);
      }
    });
  }

  private deleteContract(id: number): void {
    this.contractService.deleteContract(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire('Eliminado', 'El contrato ha sido eliminado', 'success');
          this.loadContracts();
        },
        error: (err) => Swal.fire('Error', 'No se pudo eliminar el contrato', 'error')
      });
  }

  private destroyDataTable(): void {
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }

  applyFilters(): void {
    this.loadContracts();
  }

  clearFilters(): void {
    this.filters = {};
    this.hasClientContractFilter = '';
    this.loadContracts();
  }
}
