import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService, PayrollPeriod, PayrollReceipt } from '../../../servicios/payroll.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/hr">RRHH</a></li>
              <li class="breadcrumb-item"><a routerLink="/hr/payroll">Nómina</a></li>
              <li class="breadcrumb-item active">Período {{period?.period_number}}</li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Información del Período -->
      <div class="card mb-3" *ngIf="period">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="fa fa-calendar-alt me-2"></i>
            Período {{period.period_number}} - {{period.year}}
          </h5>
          <span class="badge" [ngClass]="getStatusClass(period.status)">
            {{getStatusLabel(period.status)}}
          </span>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <p class="mb-1"><small class="text-muted">Tipo:</small></p>
              <strong>{{getTypeLabel(period.period_type)}}</strong>
            </div>
            <div class="col-md-3">
              <p class="mb-1"><small class="text-muted">Período:</small></p>
              <strong>{{period.start_date | date:'dd/MM/yyyy'}} - {{period.end_date | date:'dd/MM/yyyy'}}</strong>
            </div>
            <div class="col-md-3">
              <p class="mb-1"><small class="text-muted">Fecha de Pago:</small></p>
              <strong>{{period.payment_date | date:'dd/MM/yyyy'}}</strong>
            </div>
            <div class="col-md-3">
              <p class="mb-1"><small class="text-muted">Empleados:</small></p>
              <strong>{{receipts.length}}</strong>
            </div>
          </div>
          <hr>
          <div class="row">
            <div class="col-md-3">
              <div class="card bg-light">
                <div class="card-body text-center py-2">
                  <small class="text-muted">Total Percepciones</small>
                  <h5 class="mb-0 text-success">{{period.total_gross | currency:'MXN'}}</h5>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-light">
                <div class="card-body text-center py-2">
                  <small class="text-muted">Total Deducciones</small>
                  <h5 class="mb-0 text-danger">{{period.total_deductions | currency:'MXN'}}</h5>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-light">
                <div class="card-body text-center py-2">
                  <small class="text-muted">ISR</small>
                  <h5 class="mb-0 text-warning">{{period.total_isr | currency:'MXN'}}</h5>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card bg-primary text-white">
                <div class="card-body text-center py-2">
                  <small>Total Neto</small>
                  <h5 class="mb-0">{{period.total_net | currency:'MXN'}}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-end gap-2">
          <button class="btn btn-outline-secondary" (click)="exportLayout()">
            <i class="fa fa-file-excel me-1"></i> Layout Bancario
          </button>
          <button class="btn btn-outline-primary" (click)="exportReport()">
            <i class="fa fa-file-pdf me-1"></i> Reporte PDF
          </button>
        </div>
      </div>

      <!-- Filtro de búsqueda -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="row g-2 align-items-center">
            <div class="col-md-4">
              <input type="text" class="form-control" placeholder="Buscar empleado..."
                [(ngModel)]="searchTerm" (input)="filterReceipts()">
            </div>
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="filterDepartment" (change)="filterReceipts()">
                <option value="">Todos los departamentos</option>
                <option *ngFor="let dept of departments" [value]="dept">{{dept}}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Recibos -->
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Empleado</th>
                  <th>Departamento</th>
                  <th class="text-end">Percepciones</th>
                  <th class="text-end">Deducciones</th>
                  <th class="text-end">ISR</th>
                  <th class="text-end">Neto</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let receipt of filteredReceipts">
                  <td>
                    <strong>{{receipt.employee?.first_name}} {{receipt.employee?.paternal_surname}}</strong>
                    <br><small class="text-muted">{{receipt.employee?.employee_number}}</small>
                  </td>
                  <td>{{receipt.employee?.department?.name || '-'}}</td>
                  <td class="text-end text-success">{{receipt.total_earnings | currency:'MXN'}}</td>
                  <td class="text-end text-danger">{{receipt.total_deductions | currency:'MXN'}}</td>
                  <td class="text-end text-warning">{{receipt.isr_amount | currency:'MXN'}}</td>
                  <td class="text-end"><strong>{{receipt.net_pay | currency:'MXN'}}</strong></td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" title="Ver recibo" (click)="showReceiptDetail(receipt)">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button class="btn btn-outline-secondary" title="Descargar PDF" (click)="downloadReceipt(receipt)">
                        <i class="fa fa-download"></i>
                      </button>
                      <button class="btn btn-outline-info" title="Enviar por correo" (click)="emailReceipt(receipt)">
                        <i class="fa fa-envelope"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredReceipts.length === 0 && !loading">
                  <td colspan="7" class="text-center py-4 text-muted">
                    No hay recibos para mostrar
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light" *ngIf="filteredReceipts.length > 0">
                <tr>
                  <td colspan="2"><strong>Totales ({{filteredReceipts.length}} empleados)</strong></td>
                  <td class="text-end text-success"><strong>{{getTotalEarnings() | currency:'MXN'}}</strong></td>
                  <td class="text-end text-danger"><strong>{{getTotalDeductions() | currency:'MXN'}}</strong></td>
                  <td class="text-end text-warning"><strong>{{getTotalISR() | currency:'MXN'}}</strong></td>
                  <td class="text-end"><strong>{{getTotalNet() | currency:'MXN'}}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle Recibo -->
    <div class="modal fade" id="receiptDetailModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" *ngIf="selectedReceipt">
          <div class="modal-header">
            <h5 class="modal-title">Recibo de Nómina</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <!-- Encabezado -->
            <div class="row mb-3">
              <div class="col-md-6">
                <p class="mb-1"><strong>Empleado:</strong> {{selectedReceipt.employee?.first_name}} {{selectedReceipt.employee?.paternal_surname}}</p>
                <p class="mb-1"><strong>No. Empleado:</strong> {{selectedReceipt.employee?.employee_number}}</p>
                <p class="mb-1"><strong>RFC:</strong> {{selectedReceipt.employee?.rfc}}</p>
                <p class="mb-1"><strong>CURP:</strong> {{selectedReceipt.employee?.curp}}</p>
              </div>
              <div class="col-md-6">
                <p class="mb-1"><strong>Período:</strong> {{period?.period_number}} / {{period?.year}}</p>
                <p class="mb-1"><strong>Fechas:</strong> {{period?.start_date | date:'dd/MM'}} - {{period?.end_date | date:'dd/MM/yyyy'}}</p>
                <p class="mb-1"><strong>Días Trabajados:</strong> {{selectedReceipt.days_worked}}</p>
                <p class="mb-1"><strong>Salario Diario:</strong> {{selectedReceipt.daily_salary | currency:'MXN'}}</p>
              </div>
            </div>

            <div class="row">
              <!-- Percepciones -->
              <div class="col-md-6">
                <h6 class="bg-success text-white p-2 rounded">Percepciones</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr *ngFor="let item of selectedReceipt.earnings_detail || []">
                      <td>{{item.concept}}</td>
                      <td class="text-end">{{item.amount | currency:'MXN'}}</td>
                    </tr>
                    <tr *ngIf="!selectedReceipt.earnings_detail?.length">
                      <td>Sueldo</td>
                      <td class="text-end">{{selectedReceipt.total_earnings | currency:'MXN'}}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-success">
                      <td><strong>Total Percepciones</strong></td>
                      <td class="text-end"><strong>{{selectedReceipt.total_earnings | currency:'MXN'}}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Deducciones -->
              <div class="col-md-6">
                <h6 class="bg-danger text-white p-2 rounded">Deducciones</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td>ISR</td>
                      <td class="text-end">{{selectedReceipt.isr_amount | currency:'MXN'}}</td>
                    </tr>
                    <tr>
                      <td>IMSS</td>
                      <td class="text-end">{{selectedReceipt.imss_employee | currency:'MXN'}}</td>
                    </tr>
                    <tr *ngIf="selectedReceipt.infonavit_amount">
                      <td>INFONAVIT</td>
                      <td class="text-end">{{selectedReceipt.infonavit_amount | currency:'MXN'}}</td>
                    </tr>
                    <tr *ngFor="let item of selectedReceipt.deductions_detail || []">
                      <td>{{item.concept}}</td>
                      <td class="text-end">{{item.amount | currency:'MXN'}}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-danger">
                      <td><strong>Total Deducciones</strong></td>
                      <td class="text-end"><strong>{{selectedReceipt.total_deductions | currency:'MXN'}}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Neto -->
            <div class="row mt-3">
              <div class="col-12">
                <div class="card bg-primary text-white">
                  <div class="card-body d-flex justify-content-between align-items-center py-2">
                    <h5 class="mb-0">NETO A PAGAR</h5>
                    <h4 class="mb-0">{{selectedReceipt.net_pay | currency:'MXN'}}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" class="btn btn-primary" (click)="downloadReceipt(selectedReceipt)">
              <i class="fa fa-download me-1"></i> Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class PayrollDetailComponent implements OnInit {
  periodId: number = 0;
  period: PayrollPeriod | null = null;
  receipts: PayrollReceipt[] = [];
  filteredReceipts: PayrollReceipt[] = [];
  departments: string[] = [];
  loading = false;

  searchTerm = '';
  filterDepartment = '';
  selectedReceipt: PayrollReceipt | null = null;

  constructor(
    private payrollService: PayrollService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.periodId = +this.route.snapshot.params['id'];
    this.loadPeriod();
    this.loadReceipts();
  }

  loadPeriod() {
    this.payrollService.getPayrollPeriod(this.periodId).subscribe({
      next: (res) => this.period = res.data
    });
  }

  loadReceipts() {
    this.loading = true;
    this.payrollService.getPeriodReceipts(this.periodId).subscribe({
      next: (res) => {
        this.receipts = res.data?.data || res.data || [];
        this.filteredReceipts = [...this.receipts];
        this.extractDepartments();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  extractDepartments() {
    const depts = new Set<string>();
    this.receipts.forEach(r => {
      if (r.employee?.department?.name) {
        depts.add(r.employee.department.name);
      }
    });
    this.departments = Array.from(depts).sort();
  }

  filterReceipts() {
    this.filteredReceipts = this.receipts.filter(r => {
      const matchSearch = !this.searchTerm ||
        `${r.employee?.first_name} ${r.employee?.paternal_surname}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        r.employee?.employee_number?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchDept = !this.filterDepartment ||
        r.employee?.department?.name === this.filterDepartment;

      return matchSearch && matchDept;
    });
  }

  showReceiptDetail(receipt: PayrollReceipt) {
    this.selectedReceipt = receipt;
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('receiptDetailModal')).show();
  }

  downloadReceipt(receipt: PayrollReceipt) {
    this.payrollService.downloadReceipt(receipt.id!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo_${receipt.employee?.employee_number}_${this.period?.period_number}.pdf`;
        a.click();
      }
    });
  }

  emailReceipt(receipt: PayrollReceipt) {
    if (confirm(`¿Enviar recibo a ${receipt.employee?.email}?`)) {
      this.payrollService.emailReceipt(receipt.id!).subscribe({
        next: () => alert('Recibo enviado exitosamente')
      });
    }
  }

  exportLayout() {
    this.payrollService.getBankLayout(this.periodId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `layout_bancario_${this.period?.period_number}_${this.period?.year}.txt`;
        a.click();
      }
    });
  }

  exportReport() {
    // Implementar exportación de reporte PDF
    alert('Generando reporte PDF...');
  }

  getTotalEarnings(): number {
    return this.filteredReceipts.reduce((sum, r) => sum + (r.total_earnings || 0), 0);
  }

  getTotalDeductions(): number {
    return this.filteredReceipts.reduce((sum, r) => sum + (r.total_deductions || 0), 0);
  }

  getTotalISR(): number {
    return this.filteredReceipts.reduce((sum, r) => sum + (r.isr_amount || 0), 0);
  }

  getTotalNet(): number {
    return this.filteredReceipts.reduce((sum, r) => sum + (r.net_pay || 0), 0);
  }

  getTypeLabel(type?: string): string {
    const labels: { [key: string]: string } = {
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'monthly': 'Mensual'
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
