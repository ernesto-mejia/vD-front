import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-vacation-balances',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-chart-bar me-2"></i>Saldos de Vacaciones</h4>
          <a routerLink="/hr/vacations" class="btn btn-outline-secondary">
            <i class="fa fa-arrow-left me-1"></i> Volver
          </a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3">
              <label class="form-label">Año</label>
              <select class="form-select" [(ngModel)]="filters.year" (change)="loadBalances()">
                <option *ngFor="let y of years" [value]="y">{{y}}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Departamento</label>
              <select class="form-select" [(ngModel)]="filters.department_id" (change)="loadBalances()">
                <option value="">Todos</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="filters.status" (change)="loadBalances()">
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="expired">Vencido</option>
              </select>
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
                  <th>Empleado</th>
                  <th class="text-center">Antigüedad</th>
                  <th class="text-center">Correspondientes</th>
                  <th class="text-center">Tomados</th>
                  <th class="text-center">Pendientes</th>
                  <th class="text-center">Vencidos</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let balance of balances">
                  <td>
                    <strong>{{balance.employee?.first_name}} {{balance.employee?.paternal_surname}}</strong>
                    <br><small class="text-muted">{{balance.employee?.employee_number}}</small>
                  </td>
                  <td class="text-center">{{balance.seniority_years}} años</td>
                  <td class="text-center">
                    <span class="badge bg-primary">{{balance.entitled_days}}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-info">{{balance.used_days}}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-success">{{balance.pending_days}}</span>
                  </td>
                  <td class="text-center">
                    <span class="badge" [class.bg-danger]="balance.expired_days > 0"
                      [class.bg-secondary]="balance.expired_days === 0">
                      {{balance.expired_days}}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.bg-success]="balance.status === 'active'"
                      [class.bg-warning]="balance.status === 'expired'">
                      {{balance.status === 'active' ? 'Activo' : 'Vencido'}}
                    </span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" title="Ajustar saldo"
                      (click)="showAdjustModal(balance)">
                      <i class="fa fa-edit"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="balances.length === 0 && !loading">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No se encontraron registros
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Ajuste -->
    <div class="modal fade" id="adjustModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Ajustar Saldo de Vacaciones</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" *ngIf="selectedBalance">
            <p><strong>Empleado:</strong> {{selectedBalance.employee?.first_name}} {{selectedBalance.employee?.paternal_surname}}</p>
            <p><strong>Saldo actual:</strong> {{selectedBalance.pending_days}} días</p>
            <hr>
            <div class="mb-3">
              <label class="form-label">Tipo de ajuste</label>
              <select class="form-select" [(ngModel)]="adjustData.adjustment_type">
                <option value="add">Agregar días</option>
                <option value="subtract">Restar días</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Días</label>
              <input type="number" class="form-control" [(ngModel)]="adjustData.adjustment_days" min="1">
            </div>
            <div class="mb-3">
              <label class="form-label">Motivo</label>
              <textarea class="form-control" rows="2" [(ngModel)]="adjustData.reason" required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="adjustBalance()">Aplicar Ajuste</button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class VacationBalancesComponent implements OnInit {
  balances: any[] = [];
  loading = false;
  years: number[] = [];

  filters = {
    year: new Date().getFullYear(),
    department_id: '',
    status: ''
  };

  selectedBalance: any = null;
  adjustData = {
    adjustment_days: 0,
    adjustment_type: 'add',
    reason: ''
  };

  constructor(private hrService: HumanResourcesService) {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear, currentYear - 1, currentYear - 2];
  }

  ngOnInit() {
    this.loadBalances();
  }

  loadBalances() {
    this.loading = true;
    // Por ahora simular datos
    this.balances = [];
    this.loading = false;
  }

  showAdjustModal(balance: any) {
    this.selectedBalance = balance;
    this.adjustData = { adjustment_days: 0, adjustment_type: 'add', reason: '' };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('adjustModal')).show();
  }

  adjustBalance() {
    if (!this.selectedBalance || !this.adjustData.reason) return;

    this.hrService.adjustVacationBalance(this.selectedBalance.employee_id, this.adjustData).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('adjustModal'))?.hide();
        this.loadBalances();
      }
    });
  }
}
