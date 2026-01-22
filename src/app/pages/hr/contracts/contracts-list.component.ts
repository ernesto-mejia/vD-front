import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, EmploymentContract } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-contracts-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-file-contract me-2"></i>Contratos Laborales</h4>
          <a routerLink="new" class="btn btn-primary">
            <i class="fa fa-plus me-1"></i> Nuevo Contrato
          </a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="Buscar empleado..."
                [(ngModel)]="filters.search" (keyup.enter)="loadContracts()">
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.status" (change)="loadContracts()">
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="expired">Vencido</option>
                <option value="terminated">Terminado</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.contract_type" (change)="loadContracts()">
                <option value="">Tipo de contrato</option>
                <option *ngFor="let type of contractTypes | keyvalue" [value]="type.key">
                  {{type.value}}
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" (click)="loadContracts()">
                <i class="fa fa-search me-1"></i> Buscar
              </button>
            </div>
            <div class="col-md-3 text-end">
              <button class="btn btn-outline-warning me-2" (click)="loadExpiringContracts()">
                <i class="fa fa-clock me-1"></i> Por Vencer ({{expiringCount}})
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>No. Contrato</th>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Salario Mensual</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let contract of contracts">
                  <td>{{contract.contract_number}}</td>
                  <td>
                    <strong>{{contract.employee?.first_name}} {{contract.employee?.paternal_surname}}</strong>
                    <br><small class="text-muted">{{contract.employee?.employee_number}}</small>
                  </td>
                  <td>{{contractTypes[contract.contract_type] || contract.contract_type}}</td>
                  <td>{{contract.start_date | date:'dd/MM/yyyy'}}</td>
                  <td>
                    <span *ngIf="contract.end_date">{{contract.end_date | date:'dd/MM/yyyy'}}</span>
                    <span *ngIf="!contract.end_date" class="badge bg-info">Indefinido</span>
                  </td>
                  <td>{{contract.base_salary_monthly | currency:'MXN'}}</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(contract.status)">
                      {{getStatusLabel(contract.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <a [routerLink]="[contract.id]" class="btn btn-outline-primary" title="Ver/Editar">
                        <i class="fa fa-edit"></i>
                      </a>
                      <button *ngIf="contract.status === 'draft'" class="btn btn-outline-success"
                        title="Aprobar" (click)="approveContract(contract)">
                        <i class="fa fa-check"></i>
                      </button>
                      <button *ngIf="contract.status === 'active'" class="btn btn-outline-info"
                        title="Renovar" (click)="showRenewModal(contract)">
                        <i class="fa fa-sync"></i>
                      </button>
                      <button *ngIf="contract.status === 'active'" class="btn btn-outline-danger"
                        title="Terminar" (click)="showTerminateModal(contract)">
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="contracts.length === 0 && !loading">
                  <td colspan="8" class="text-center py-4 text-muted">
                    <i class="fa fa-inbox fa-2x mb-2 d-block"></i>
                    No se encontraron contratos
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-between align-items-center" *ngIf="pagination">
          <small class="text-muted">
            Mostrando {{contracts.length}} de {{pagination.total}} registros
          </small>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" [class.disabled]="pagination.current_page === 1">
                <a class="page-link" (click)="loadContracts(pagination.current_page - 1)">Anterior</a>
              </li>
              <li class="page-item" [class.disabled]="pagination.current_page === pagination.last_page">
                <a class="page-link" (click)="loadContracts(pagination.current_page + 1)">Siguiente</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal Renovar -->
    <div class="modal fade" id="renewModal" tabindex="-1" #renewModal>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Renovar Contrato</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nueva fecha de término</label>
              <input type="date" class="form-control" [(ngModel)]="renewData.new_end_date">
            </div>
            <div class="mb-3">
              <label class="form-label">Incremento salarial (%)</label>
              <input type="number" class="form-control" [(ngModel)]="renewData.salary_increase_percentage"
                min="0" max="100" step="0.5">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="renewContract()">Renovar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Terminar -->
    <div class="modal fade" id="terminateModal" tabindex="-1" #terminateModal>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Terminar Contrato</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Fecha de terminación</label>
              <input type="date" class="form-control" [(ngModel)]="terminateData.termination_date">
            </div>
            <div class="mb-3">
              <label class="form-label">Motivo de terminación</label>
              <textarea class="form-control" rows="3" [(ngModel)]="terminateData.termination_reason"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Finiquito/Liquidación</label>
              <input type="number" class="form-control" [(ngModel)]="terminateData.settlement_amount" min="0">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="terminateContract()">Terminar Contrato</button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class ContractsListComponent implements OnInit {
  contracts: EmploymentContract[] = [];
  loading = false;
  pagination: any = null;
  expiringCount = 0;

  filters = {
    search: '',
    status: '',
    contract_type: ''
  };

  contractTypes: { [key: string]: string } = {
    '01': 'Contrato de trabajo por tiempo indeterminado',
    '02': 'Contrato de trabajo por tiempo determinado',
    '03': 'Contrato de trabajo por obra determinada',
    '04': 'Contrato de trabajo por temporada',
    '05': 'Contrato de trabajo sujeto a prueba',
    '06': 'Contrato de trabajo con capacitación inicial',
    '07': 'Modalidad de contratación por pago de hora laborada',
    '08': 'Modalidad de contratación por comisión laboral',
    '09': 'Modalidades de contratación donde no existe relación de trabajo',
    '10': 'Jubilación, pensión, retiro',
    '99': 'Otro contrato'
  };

  selectedContract: EmploymentContract | null = null;
  renewData = { new_end_date: '', salary_increase_percentage: 0 };
  terminateData = { termination_date: '', termination_reason: '', settlement_amount: 0 };

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.loadContracts();
    this.loadExpiringCount();
  }

  loadContracts(page: number = 1) {
    this.loading = true;
    const params = { ...this.filters, page };
    this.hrService.getContracts(params).subscribe({
      next: (res) => {
        this.contracts = res.data?.data || res.data || [];
        this.pagination = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadExpiringCount() {
    this.hrService.getExpiringContracts(30).subscribe({
      next: (res) => this.expiringCount = res.data?.length || 0
    });
  }

  loadExpiringContracts() {
    this.filters = { search: '', status: '', contract_type: '' };
    this.hrService.getExpiringContracts(30).subscribe({
      next: (res) => {
        this.contracts = res.data || [];
        this.pagination = null;
      }
    });
  }

  approveContract(contract: EmploymentContract) {
    if (confirm('¿Aprobar este contrato?')) {
      this.hrService.approveContract(contract.id!).subscribe({
        next: () => this.loadContracts()
      });
    }
  }

  showRenewModal(contract: EmploymentContract) {
    this.selectedContract = contract;
    this.renewData = { new_end_date: '', salary_increase_percentage: 0 };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('renewModal')).show();
  }

  renewContract() {
    if (!this.selectedContract) return;
    this.hrService.renewContract(this.selectedContract.id!, this.renewData).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('renewModal'))?.hide();
        this.loadContracts();
      }
    });
  }

  showTerminateModal(contract: EmploymentContract) {
    this.selectedContract = contract;
    this.terminateData = { termination_date: '', termination_reason: '', settlement_amount: 0 };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('terminateModal')).show();
  }

  terminateContract() {
    if (!this.selectedContract) return;
    this.hrService.terminateContract(this.selectedContract.id!, this.terminateData).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('terminateModal'))?.hide();
        this.loadContracts();
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'draft': 'bg-secondary',
      'active': 'bg-success',
      'expired': 'bg-warning text-dark',
      'terminated': 'bg-danger',
      'renewed': 'bg-info'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Borrador',
      'active': 'Activo',
      'expired': 'Vencido',
      'terminated': 'Terminado',
      'renewed': 'Renovado'
    };
    return labels[status] || status;
  }
}
