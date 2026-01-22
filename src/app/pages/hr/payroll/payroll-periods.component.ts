import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService, PayrollPeriod } from '../../../servicios/payroll.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-payroll-periods',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-calendar-alt me-2"></i>Períodos de Nómina</h4>
          <button class="btn btn-primary" (click)="showNewPeriodModal()">
            <i class="fa fa-plus me-1"></i> Nuevo Período
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3">
              <label class="form-label">Año</label>
              <select class="form-select" [(ngModel)]="filters.year" (change)="loadPeriods()">
                <option *ngFor="let y of years" [value]="y">{{y}}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Tipo</label>
              <select class="form-select" [(ngModel)]="filters.type" (change)="loadPeriods()">
                <option value="">Todos</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="filters.status" (change)="loadPeriods()">
                <option value="">Todos</option>
                <option value="draft">Borrador</option>
                <option value="calculating">Calculando</option>
                <option value="calculated">Calculado</option>
                <option value="approved">Aprobado</option>
                <option value="paid">Pagado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <h3>{{stats.total}}</h3>
              <small>Períodos {{filters.year}}</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body text-center">
              <h3>{{stats.pending}}</h3>
              <small>Por Procesar</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <h3>{{stats.paid}}</h3>
              <small>Pagados</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <h3>{{stats.totalAmount | currency:'MXN':'symbol':'1.0-0'}}</h3>
              <small>Total Pagado</small>
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
                  <th>Período</th>
                  <th>Tipo</th>
                  <th>Fechas</th>
                  <th class="text-center">Empleados</th>
                  <th class="text-end">Total Neto</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let period of periods">
                  <td>
                    <strong>{{period.period_number}}</strong>
                    <br><small class="text-muted">{{period.year}}</small>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getTypeClass(period.period_type)">
                      {{getTypeLabel(period.period_type)}}
                    </span>
                  </td>
                  <td>
                    {{period.start_date | date:'dd/MM'}} - {{period.end_date | date:'dd/MM/yyyy'}}
                    <br>
                    <small class="text-muted">Pago: {{period.payment_date | date:'dd/MM/yyyy'}}</small>
                  </td>
                  <td class="text-center">
                    <span class="badge bg-secondary">{{period.employee_count || 0}}</span>
                  </td>
                  <td class="text-end">
                    <strong>{{period.total_net | currency:'MXN'}}</strong>
                    <br>
                    <small class="text-muted">Bruto: {{period.total_gross | currency:'MXN'}}</small>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(period.status)">
                      {{getStatusLabel(period.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <a [routerLink]="[period.id]" class="btn btn-outline-primary" title="Ver detalle">
                        <i class="fa fa-eye"></i>
                      </a>
                      <button *ngIf="period.status === 'draft'" class="btn btn-outline-success"
                        title="Calcular" (click)="calculate(period)">
                        <i class="fa fa-calculator"></i>
                      </button>
                      <button *ngIf="period.status === 'calculated'" class="btn btn-outline-info"
                        title="Aprobar" (click)="approve(period)">
                        <i class="fa fa-check"></i>
                      </button>
                      <button *ngIf="period.status === 'approved'" class="btn btn-outline-warning"
                        title="Marcar Pagado" (click)="markPaid(period)">
                        <i class="fa fa-money-bill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="periods.length === 0 && !loading">
                  <td colspan="7" class="text-center py-4 text-muted">
                    No hay períodos registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo Período -->
    <div class="modal fade" id="newPeriodModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuevo Período de Nómina</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Tipo de Período</label>
              <select class="form-select" [(ngModel)]="newPeriod.period_type" (change)="onPeriodTypeChange()">
                <option value="">Seleccionar</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Año</label>
              <select class="form-select" [(ngModel)]="newPeriod.year">
                <option *ngFor="let y of years" [value]="y">{{y}}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Número de Período</label>
              <input type="number" class="form-control" [(ngModel)]="newPeriod.period_number" min="1">
              <small class="text-muted">Ej: 1 para primera semana/quincena/mes del año</small>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Inicio <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="newPeriod.start_date">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Fecha Fin <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="newPeriod.end_date"
                  [class.is-invalid]="newPeriod.start_date && newPeriod.end_date && newPeriod.end_date <= newPeriod.start_date">
                <small class="text-muted">Debe ser posterior a fecha de inicio</small>
              </div>
            </div>
            <div class="alert alert-danger py-2" *ngIf="newPeriod.start_date && newPeriod.end_date && newPeriod.end_date <= newPeriod.start_date">
              <i class="fa fa-times-circle me-2"></i>
              La fecha de fin debe ser posterior a la fecha de inicio.
            </div>
            <div class="mb-3">
              <label class="form-label">Fecha de Pago <span class="text-danger">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="newPeriod.payment_date"
                [class.is-invalid]="newPeriod.payment_date && newPeriod.end_date && newPeriod.payment_date < newPeriod.end_date">
              <small class="text-muted">Debe ser igual o posterior a la fecha de fin</small>
            </div>
            <div class="alert alert-warning py-2" *ngIf="newPeriod.payment_date && newPeriod.end_date && newPeriod.payment_date < newPeriod.end_date">
              <i class="fa fa-exclamation-triangle me-2"></i>
              La fecha de pago debe ser igual o posterior a la fecha de fin del período.
            </div>

            <!-- Resumen de reglas -->
            <div class="alert alert-info py-2">
              <strong><i class="fa fa-info-circle me-2"></i>Reglas de validación:</strong>
              <ul class="mb-0 mt-1 small">
                <li>Todos los campos marcados con <span class="text-danger">*</span> son obligatorios</li>
                <li>La fecha de fin debe ser <strong>posterior</strong> a la fecha de inicio</li>
                <li>La fecha de pago debe ser <strong>igual o posterior</strong> a la fecha de fin</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="createPeriod()"
              [disabled]="!isFormValid()">
              <i class="fa fa-save me-1"></i> Crear Período
            </button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class PayrollPeriodsComponent implements OnInit {
  periods: PayrollPeriod[] = [];
  loading = false;
  years: number[] = [];

  filters = {
    year: new Date().getFullYear(),
    type: '',
    status: ''
  };

  stats = {
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0
  };

  newPeriod: Partial<PayrollPeriod> = {
    period_type: '',
    year: new Date().getFullYear(),
    period_number: 1,
    start_date: '',
    end_date: '',
    payment_date: ''
  };

  constructor(private payrollService: PayrollService) {}

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];
    this.loadPeriods();
  }

  loadPeriods() {
    this.loading = true;
    this.payrollService.getPayrollPeriods(this.filters).subscribe({
      next: (res) => {
        this.periods = res.data?.data || res.data || [];
        this.calculateStats();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  calculateStats() {
    this.stats.total = this.periods.length;
    this.stats.pending = this.periods.filter(p => ['draft', 'calculating', 'calculated'].includes(p.status || '')).length;
    this.stats.paid = this.periods.filter(p => p.status === 'paid').length;
    this.stats.totalAmount = this.periods
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.total_net || 0), 0);
  }

  showNewPeriodModal() {
    this.newPeriod = {
      period_type: '',
      year: new Date().getFullYear(),
      period_number: 1,
      start_date: '',
      end_date: '',
      payment_date: ''
    };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('newPeriodModal')).show();
  }

  onPeriodTypeChange() {
    // Auto-calculate next period number based on type
    const sameType = this.periods.filter(p =>
      p.period_type === this.newPeriod.period_type &&
      p.year === this.newPeriod.year
    );
    this.newPeriod.period_number = sameType.length + 1;
  }

  isFormValid(): boolean {
    // Validar campos obligatorios
    if (!this.newPeriod.period_type || !this.newPeriod.year || !this.newPeriod.period_number) {
      return false;
    }
    if (!this.newPeriod.start_date || !this.newPeriod.end_date || !this.newPeriod.payment_date) {
      return false;
    }
    // Validar fecha de fin > fecha de inicio
    if (this.newPeriod.end_date <= this.newPeriod.start_date) {
      return false;
    }
    // Validar fecha de pago >= fecha de fin
    if (this.newPeriod.payment_date < this.newPeriod.end_date) {
      return false;
    }
    return true;
  }

  createPeriod() {
    if (!this.isFormValid()) {
      return;
    }
    this.payrollService.createPayrollPeriod(this.newPeriod as PayrollPeriod).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('newPeriodModal'))?.hide();
        this.loadPeriods();
      }
    });
  }

  calculate(period: PayrollPeriod) {
    if (confirm('¿Calcular nómina para este período?')) {
      this.payrollService.calculatePayroll(period.id!).subscribe({
        next: () => this.loadPeriods()
      });
    }
  }

  approve(period: PayrollPeriod) {
    if (confirm('¿Aprobar este período de nómina?')) {
      this.payrollService.approvePayroll(period.id!).subscribe({
        next: () => this.loadPeriods()
      });
    }
  }

  markPaid(period: PayrollPeriod) {
    if (confirm('¿Marcar este período como pagado?')) {
      this.payrollService.markPayrollPaid(period.id!, { payment_date: new Date().toISOString().split('T')[0] }).subscribe({
        next: () => this.loadPeriods()
      });
    }
  }

  getTypeClass(type?: string): string {
    const classes: { [key: string]: string } = {
      'weekly': 'bg-info',
      'biweekly': 'bg-primary',
      'monthly': 'bg-secondary',
      'semanal': 'bg-info',
      'quincenal': 'bg-primary',
      'mensual': 'bg-secondary'
    };
    return classes[type || ''] || 'bg-secondary';
  }

  getTypeLabel(type?: string): string {
    const labels: { [key: string]: string } = {
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'monthly': 'Mensual',
      'semanal': 'Semanal',
      'quincenal': 'Quincenal',
      'mensual': 'Mensual'
    };
    return labels[type || ''] || type || '';
  }

  getStatusClass(status?: string): string {
    const classes: { [key: string]: string } = {
      'draft': 'bg-secondary',
      'calculating': 'bg-warning text-dark',
      'calculated': 'bg-info',
      'approved': 'bg-primary',
      'paid': 'bg-success'
    };
    return classes[status || ''] || 'bg-secondary';
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Borrador',
      'calculating': 'Calculando',
      'calculated': 'Calculado',
      'approved': 'Aprobado',
      'paid': 'Pagado'
    };
    return labels[status || ''] || status || '';
  }
}
