import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ClientContractService } from '../contract.service';
import { ClientContract, IMSSRegion, ContractFilters } from '../contracts';

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

  contracts: ClientContract[] = [];
  regions: IMSSRegion[] = [];
  loading = false;

  // Filtros
  filters: ContractFilters = {};

  // Permisos
  canCreate = true;
  canEdit = true;
  canDelete = true;
  canView = true;

  constructor(
    private contractService: ClientContractService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRegions();
    this.loadContracts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyDataTable();
  }

  private loadRegions(): void {
    this.contractService.getIMSSRegions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (regions) => this.regions = regions,
        error: (err) => console.error('Error cargando regiones:', err)
      });
  }

  loadContracts(): void {
    this.loading = true;
    this.showLoading();

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
      this.dtInstance = $('#contractsTable').DataTable({
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
      { title: 'Proyecto', data: 'project_name' },
      { title: 'Cliente', data: 'customer_name' },
      {
        title: 'Región',
        data: null,
        render: (data: any, type: any, row: ClientContract) => {
          // Usar regions_display si existe, sino usar region_name (legacy)
          const display = row.regions_display || row.region_name || '-';
          // Si hay múltiples regiones, mostrar con tooltip
          if (row.region_names && row.region_names.length > 1) {
            return `<span title="${row.region_names.join(', ')}" style="cursor: help;">${display}</span>`;
          }
          return display;
        }
      },
      {
        title: 'Vigencia',
        data: null,
        render: (data: any, type: any, row: ClientContract) =>
          `${this.formatDate(row.start_date)} - ${this.formatDate(row.end_date)}`
      },
      {
        title: 'Montos',
        data: null,
        render: (data: any, type: any, row: ClientContract) =>
          `$${this.formatMoney(row.min_amount)} - $${this.formatMoney(row.max_amount)}`
      },
      { title: 'Estado', data: 'status_name' },
      {
        title: 'Acciones',
        data: null,
        orderable: false,
        render: (data: any, type: any, row: ClientContract) => this.renderActions(row)
      }
    ];
  }

  private renderActions(row: ClientContract): string {
    let actions = '<div class="btn-group" role="group">';

    if (this.canView) {
      actions += `
        <button class="btn btn-sm btn-transparent view-btn" data-id="${row.id}" title="Ver">
          <i class="fa fa-eye"></i>
        </button>
      `;
    }

    if (this.canEdit) {
      actions += `
        <button class="btn btn-sm btn-transparent edit-btn" data-id="${row.id}" title="Editar">
          <i class="fa fa-edit"></i>
        </button>
      `;
    }

    if (this.canDelete) {
      actions += `
        <button class="btn btn-sm btn-transparent delete-btn" data-id="${row.id}" title="Eliminar">
          <i class="fa fa-trash"></i>
        </button>
      `;
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
        action: () => this.router.navigate(['/purchases/contracts-clients/add'])
      });
    }

    buttons.push(
      {
        extend: 'excel',
        text: '<i class="fas fa-file-excel me-1"></i> Excel',
        className: 'btn btn-success btn-sm',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6] }
      },
      {
        extend: 'pdf',
        text: '<i class="fas fa-file-pdf me-1"></i> PDF',
        className: 'btn btn-danger btn-sm',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6] }
      }
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
      paginate: {
        first: 'Primero',
        last: 'Último',
        next: 'Siguiente',
        previous: 'Anterior'
      }
    };
  }

  private attachButtonEvents(): void {
    $('#contractsTable').on('click', '.view-btn', (e: any) => {
      const id = $(e.currentTarget).data('id');
      this.router.navigate(['/purchases/contracts-clients/show', id]);
    });

    $('#contractsTable').on('click', '.edit-btn', (e: any) => {
      const id = $(e.currentTarget).data('id');
      this.router.navigate(['/purchases/contracts-clients/edit', id]);
    });

    $('#contractsTable').on('click', '.delete-btn', (e: any) => {
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
        error: (err) => {
          console.error('Error eliminando contrato:', err);
          Swal.fire('Error', 'No se pudo eliminar el contrato', 'error');
        }
      });
  }

  private destroyDataTable(): void {
    if (this.dtInstance) {
      this.dtInstance.destroy();
      this.dtInstance = null;
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX');
  }

  private formatMoney(amount: number): string {
    if (!amount) return '0.00';
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  applyFilters(): void {
    this.loadContracts();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadContracts();
  }
}
