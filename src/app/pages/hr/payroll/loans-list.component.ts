import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService, Loan } from '../../../servicios/payroll.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-loans-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-hand-holding-usd me-2"></i>Préstamos a Empleados</h4>
          <button class="btn btn-primary" (click)="showNewLoanModal()">
            <i class="fa fa-plus me-1"></i> Nuevo Préstamo
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'active'" (click)="setTab('active')">
            Activos <span class="badge bg-success">{{counts.active}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'pending'" (click)="setTab('pending')">
            Pendientes <span class="badge bg-warning text-dark">{{counts.pending}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'all'" (click)="setTab('all')">
            Todos
          </a>
        </li>
      </ul>

      <!-- Estadísticas -->
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center py-2">
              <h5 class="mb-0">{{stats.totalLoans}}</h5>
              <small>Préstamos Activos</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center py-2">
              <h5 class="mb-0">{{stats.totalAmount | currency:'MXN':'symbol':'1.0-0'}}</h5>
              <small>Monto Total</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center py-2">
              <h5 class="mb-0">{{stats.totalPaid | currency:'MXN':'symbol':'1.0-0'}}</h5>
              <small>Total Pagado</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body text-center py-2">
              <h5 class="mb-0">{{stats.totalPending | currency:'MXN':'symbol':'1.0-0'}}</h5>
              <small>Saldo Pendiente</small>
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
                  <th>Tipo</th>
                  <th class="text-end">Monto</th>
                  <th class="text-center">Pagos</th>
                  <th class="text-end">Cuota</th>
                  <th class="text-end">Saldo</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let loan of loans">
                  <td>
                    <strong>{{loan.employee?.first_name}} {{loan.employee?.paternal_surname}}</strong>
                    <br><small class="text-muted">{{loan.employee?.employee_number}}</small>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getLoanTypeClass(loan.loan_type)">
                      {{getLoanTypeLabel(loan.loan_type)}}
                    </span>
                  </td>
                  <td class="text-end">{{loan.amount | currency:'MXN'}}</td>
                  <td class="text-center">
                    <span class="badge bg-secondary">
                      {{loan.payments_made || 0}} / {{loan.total_payments}}
                    </span>
                    <div class="progress mt-1" style="height: 4px;">
                      <div class="progress-bar bg-success"
                        [style.width.%]="getPaymentProgress(loan)">
                      </div>
                    </div>
                  </td>
                  <td class="text-end">{{loan.payment_amount | currency:'MXN'}}</td>
                  <td class="text-end">
                    <strong [class.text-danger]="loan.remaining_balance && loan.remaining_balance > 0">
                      {{loan.remaining_balance | currency:'MXN'}}
                    </strong>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(loan.status)">
                      {{getStatusLabel(loan.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" title="Ver detalle" (click)="showDetail(loan)">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button *ngIf="loan.status === 'pending'" class="btn btn-outline-success"
                        title="Aprobar" (click)="approve(loan)">
                        <i class="fa fa-check"></i>
                      </button>
                      <button *ngIf="loan.status === 'pending'" class="btn btn-outline-danger"
                        title="Rechazar" (click)="showRejectModal(loan)">
                        <i class="fa fa-times"></i>
                      </button>
                      <button *ngIf="loan.status === 'active'" class="btn btn-outline-info"
                        title="Registrar pago" (click)="showPaymentModal(loan)">
                        <i class="fa fa-money-bill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="loans.length === 0 && !loading">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No hay préstamos registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo Préstamo -->
    <div class="modal fade" id="newLoanModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nuevo Préstamo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Empleado</label>
                <select class="form-select" [(ngModel)]="newLoan.employee_id" (change)="onEmployeeChange()">
                  <option value="">Seleccionar</option>
                  <option *ngFor="let emp of employees" [value]="emp.id">
                    {{emp.first_name}} {{emp.paternal_surname}}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo de Préstamo</label>
                <select class="form-select" [(ngModel)]="newLoan.loan_type">
                  <option value="">Seleccionar</option>
                  <option value="personal">Personal</option>
                  <option value="fonacot">FONACOT</option>
                  <option value="infonavit">INFONAVIT</option>
                  <option value="emergency">Emergencia</option>
                  <option value="advance">Adelanto de Nómina</option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Monto</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [(ngModel)]="newLoan.amount"
                    (change)="calculatePayment()" step="100">
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Número de Pagos</label>
                <input type="number" class="form-control" [(ngModel)]="newLoan.total_payments"
                  (change)="calculatePayment()" min="1" max="52">
              </div>
              <div class="col-md-4">
                <label class="form-label">Cuota por Período</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [value]="calculatedPayment" readonly>
                </div>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Fecha de Inicio</label>
                <input type="date" class="form-control" [(ngModel)]="newLoan.start_date">
              </div>
              <div class="col-md-6">
                <label class="form-label">Tasa de Interés (%)</label>
                <div class="input-group">
                  <input type="number" class="form-control" [(ngModel)]="newLoan.interest_rate"
                    step="0.5" min="0" max="100">
                  <span class="input-group-text">%</span>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Descripción / Motivo</label>
              <textarea class="form-control" [(ngModel)]="newLoan.description" rows="2"></textarea>
            </div>

            <!-- Resumen -->
            <div class="card bg-light" *ngIf="newLoan.amount && newLoan.total_payments">
              <div class="card-body">
                <h6><i class="fa fa-calculator me-2"></i>Resumen del Préstamo</h6>
                <div class="row">
                  <div class="col-md-3">
                    <small class="text-muted">Monto:</small>
                    <p class="mb-0"><strong>{{newLoan.amount | currency:'MXN'}}</strong></p>
                  </div>
                  <div class="col-md-3">
                    <small class="text-muted">Pagos:</small>
                    <p class="mb-0"><strong>{{newLoan.total_payments}}</strong></p>
                  </div>
                  <div class="col-md-3">
                    <small class="text-muted">Cuota:</small>
                    <p class="mb-0"><strong>{{calculatedPayment | currency:'MXN'}}</strong></p>
                  </div>
                  <div class="col-md-3">
                    <small class="text-muted">Total a Pagar:</small>
                    <p class="mb-0"><strong class="text-primary">{{getTotalToPay() | currency:'MXN'}}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="createLoan()">Crear Préstamo</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <div class="modal fade" id="loanDetailModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" *ngIf="selectedLoan">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Préstamo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <p><strong>Empleado:</strong> {{selectedLoan.employee?.first_name}} {{selectedLoan.employee?.paternal_surname}}</p>
                <p><strong>Tipo:</strong> {{getLoanTypeLabel(selectedLoan.loan_type)}}</p>
                <p><strong>Fecha de inicio:</strong> {{selectedLoan.start_date | date:'dd/MM/yyyy'}}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Monto original:</strong> {{selectedLoan.amount | currency:'MXN'}}</p>
                <p><strong>Pagos:</strong> {{selectedLoan.payments_made || 0}} de {{selectedLoan.total_payments}}</p>
                <p><strong>Saldo pendiente:</strong>
                  <span class="text-danger">{{selectedLoan.remaining_balance | currency:'MXN'}}</span>
                </p>
              </div>
            </div>

            <h6>Historial de Pagos</h6>
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Período</th>
                  <th class="text-end">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let payment of selectedLoan.payments; let i = index">
                  <td>{{i + 1}}</td>
                  <td>{{payment.payment_date | date:'dd/MM/yyyy'}}</td>
                  <td>{{payment.payroll_period?.period_number || '-'}}</td>
                  <td class="text-end">{{payment.amount | currency:'MXN'}}</td>
                </tr>
                <tr *ngIf="!selectedLoan.payments?.length">
                  <td colspan="4" class="text-center text-muted">Sin pagos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Registrar Pago -->
    <div class="modal fade" id="paymentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Registrar Pago</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Monto del Pago</label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" class="form-control" [(ngModel)]="paymentData.amount" step="0.01">
              </div>
              <small class="text-muted">Cuota sugerida: {{selectedLoan?.payment_amount | currency:'MXN'}}</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Fecha de Pago</label>
              <input type="date" class="form-control" [(ngModel)]="paymentData.payment_date">
            </div>
            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea class="form-control" [(ngModel)]="paymentData.notes" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="registerPayment()">Registrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rechazar -->
    <div class="modal fade" id="rejectModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Rechazar Préstamo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Motivo del Rechazo</label>
              <textarea class="form-control" [(ngModel)]="rejectReason" rows="3"
                placeholder="Indique el motivo del rechazo"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="reject()">Rechazar</button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class LoansListComponent implements OnInit {
  loans: Loan[] = [];
  employees: any[] = [];
  loading = false;
  activeTab = 'active';

  counts = { active: 0, pending: 0 };
  stats = { totalLoans: 0, totalAmount: 0, totalPaid: 0, totalPending: 0 };

  selectedLoan: Loan | null = null;
  calculatedPayment = 0;

  newLoan: Partial<Loan> = {
    employee_id: 0,
    loan_type: '',
    amount: 0,
    total_payments: 12,
    interest_rate: 0,
    start_date: '',
    description: ''
  };

  paymentData = { amount: 0, payment_date: '', notes: '' };
  rejectReason = '';

  constructor(private payrollService: PayrollService) {}

  ngOnInit() {
    this.loadLoans();
    this.loadEmployees();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.loadLoans();
  }

  loadLoans() {
    this.loading = true;
    let request;

    switch (this.activeTab) {
      case 'active':
        request = this.payrollService.getActiveLoans();
        break;
      case 'pending':
        request = this.payrollService.getPendingLoans();
        break;
      default:
        request = this.payrollService.getLoans({});
    }

    request.subscribe({
      next: (res) => {
        this.loans = res.data?.data || res.data || [];
        this.calculateStats();
        this.loading = false;
      },
      error: () => this.loading = false
    });

    // Cargar conteos
    this.payrollService.getActiveLoans().subscribe({
      next: (res) => this.counts.active = (res.data?.data || res.data || []).length
    });
    this.payrollService.getPendingLoans().subscribe({
      next: (res) => this.counts.pending = (res.data?.data || res.data || []).length
    });
  }

  loadEmployees() {
    // Asumiendo que existe un servicio para obtener empleados
    this.payrollService.getEmployees().subscribe({
      next: (res) => this.employees = res.data?.data || res.data || []
    });
  }

  calculateStats() {
    const activeLoans = this.loans.filter(l => l.status === 'active');
    this.stats.totalLoans = activeLoans.length;
    this.stats.totalAmount = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
    this.stats.totalPaid = activeLoans.reduce((sum, l) => sum + ((l.amount || 0) - (l.remaining_balance || 0)), 0);
    this.stats.totalPending = activeLoans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0);
  }

  showNewLoanModal() {
    this.newLoan = {
      employee_id: 0,
      loan_type: '',
      amount: 0,
      total_payments: 12,
      interest_rate: 0,
      start_date: new Date().toISOString().split('T')[0],
      description: ''
    };
    this.calculatedPayment = 0;
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('newLoanModal')).show();
  }

  onEmployeeChange() {
    // Cargar información del empleado si es necesario
  }

  calculatePayment() {
    if (this.newLoan.amount && this.newLoan.total_payments) {
      const interest = (this.newLoan.interest_rate || 0) / 100;
      const totalWithInterest = (this.newLoan.amount || 0) * (1 + interest);
      this.calculatedPayment = Math.ceil(totalWithInterest / this.newLoan.total_payments * 100) / 100;
    }
  }

  getTotalToPay(): number {
    return this.calculatedPayment * (this.newLoan.total_payments || 0);
  }

  createLoan() {
    this.newLoan.payment_amount = this.calculatedPayment;
    this.newLoan.remaining_balance = this.getTotalToPay();

    this.payrollService.createLoan(this.newLoan as Loan).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('newLoanModal'))?.hide();
        this.loadLoans();
      }
    });
  }

  showDetail(loan: Loan) {
    this.payrollService.getLoan(loan.id!).subscribe({
      next: (res) => {
        this.selectedLoan = res.data;
        // @ts-ignore
        new bootstrap.Modal(document.getElementById('loanDetailModal')).show();
      }
    });
  }

  approve(loan: Loan) {
    if (confirm('¿Aprobar este préstamo?')) {
      this.payrollService.approveLoan(loan.id!).subscribe({
        next: () => this.loadLoans()
      });
    }
  }

  showRejectModal(loan: Loan) {
    this.selectedLoan = loan;
    this.rejectReason = '';
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('rejectModal')).show();
  }

  reject() {
    if (!this.selectedLoan || !this.rejectReason) return;

    this.payrollService.rejectLoan(this.selectedLoan.id!, { rejection_reason: this.rejectReason }).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('rejectModal'))?.hide();
        this.loadLoans();
      }
    });
  }

  showPaymentModal(loan: Loan) {
    this.selectedLoan = loan;
    this.paymentData = {
      amount: loan.payment_amount || 0,
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
  }

  registerPayment() {
    if (!this.selectedLoan) return;

    this.payrollService.registerLoanPayment(this.selectedLoan.id!, this.paymentData).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('paymentModal'))?.hide();
        this.loadLoans();
      }
    });
  }

  getPaymentProgress(loan: Loan): number {
    if (!loan.total_payments) return 0;
    return ((loan.payments_made || 0) / loan.total_payments) * 100;
  }

  getLoanTypeClass(type?: string): string {
    const classes: { [key: string]: string } = {
      'personal': 'bg-primary',
      'fonacot': 'bg-info',
      'infonavit': 'bg-warning text-dark',
      'emergency': 'bg-danger',
      'advance': 'bg-secondary'
    };
    return classes[type || ''] || 'bg-secondary';
  }

  getLoanTypeLabel(type?: string): string {
    const labels: { [key: string]: string } = {
      'personal': 'Personal',
      'fonacot': 'FONACOT',
      'infonavit': 'INFONAVIT',
      'emergency': 'Emergencia',
      'advance': 'Adelanto'
    };
    return labels[type || ''] || type || '';
  }

  getStatusClass(status?: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-info',
      'active': 'bg-success',
      'paid': 'bg-primary',
      'rejected': 'bg-danger',
      'cancelled': 'bg-secondary'
    };
    return classes[status || ''] || 'bg-secondary';
  }

  getStatusLabel(status?: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'active': 'Activo',
      'paid': 'Liquidado',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado'
    };
    return labels[status || ''] || status || '';
  }
}
