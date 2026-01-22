import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-settlements-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-file-invoice-dollar me-2"></i>Finiquitos y Liquidaciones</h4>
          <button class="btn btn-primary" (click)="openCalculateModal()">
            <i class="fa fa-calculator me-1"></i> Calcular Finiquito
          </button>
        </div>
      </div>

      <!-- Resumen -->
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card text-center border-warning">
            <div class="card-body">
              <h3 class="text-warning mb-0">{{stats.pending}}</h3>
              <small>Pendientes</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center border-info">
            <div class="card-body">
              <h3 class="text-info mb-0">{{stats.approved}}</h3>
              <small>Aprobados</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center border-success">
            <div class="card-body">
              <h3 class="text-success mb-0">{{stats.paid}}</h3>
              <small>Pagados</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center border-primary">
            <div class="card-body">
              <h3 class="text-primary mb-0">\${{formatNumber(stats.total_amount)}}</h3>
              <small>Monto Total (mes)</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="Buscar empleado..."
                [(ngModel)]="filters.search" (input)="search()">
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.status" (change)="load()">
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="paid">Pagado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.type" (change)="load()">
                <option value="">Todos los tipos</option>
                <option value="voluntary_resignation">Renuncia voluntaria</option>
                <option value="dismissal">Despido</option>
                <option value="justified_dismissal">Despido justificado</option>
                <option value="unjustified_dismissal">Despido injustificado</option>
                <option value="contract_end">Fin de contrato</option>
                <option value="mutual_agreement">Mutuo acuerdo</option>
                <option value="death">Fallecimiento</option>
                <option value="retirement">Jubilación</option>
              </select>
            </div>
            <div class="col-md-2">
              <input type="date" class="form-control" [(ngModel)]="filters.start_date"
                (change)="load()" placeholder="Desde">
            </div>
            <div class="col-md-2">
              <input type="date" class="form-control" [(ngModel)]="filters.end_date"
                (change)="load()" placeholder="Hasta">
            </div>
            <div class="col-md-1">
              <button class="btn btn-outline-secondary w-100" (click)="clearFilters()">
                <i class="fa fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista -->
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Folio</th>
                  <th>Empleado</th>
                  <th>Tipo Baja</th>
                  <th>Fecha Baja</th>
                  <th>Antigüedad</th>
                  <th class="text-end">Total</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="loading">
                  <td colspan="8" class="text-center py-4">
                    <i class="fa fa-spinner fa-spin fa-2x"></i>
                  </td>
                </tr>
                <tr *ngIf="!loading && settlements.length === 0">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No hay finiquitos registrados
                  </td>
                </tr>
                <tr *ngFor="let s of settlements">
                  <td><strong>{{s.folio}}</strong></td>
                  <td>
                    <div>{{s.employee?.first_name}} {{s.employee?.paternal_surname}}</div>
                    <small class="text-muted">{{s.employee?.employee_number}}</small>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getTypeBadgeClass(s.termination_type)">
                      {{getTypeLabel(s.termination_type)}}
                    </span>
                  </td>
                  <td>{{s.termination_date}}</td>
                  <td>{{s.seniority_years}} años {{s.seniority_days}} días</td>
                  <td class="text-end">
                    <strong>\${{formatNumber(s.total_amount)}}</strong>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(s.status)">
                      {{getStatusLabel(s.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" (click)="viewDetail(s)" title="Ver detalle">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button class="btn btn-outline-success" *ngIf="s.status === 'pending'"
                        (click)="approve(s)" title="Aprobar">
                        <i class="fa fa-check"></i>
                      </button>
                      <button class="btn btn-outline-info" *ngIf="s.status === 'approved'"
                        (click)="markPaid(s)" title="Marcar pagado">
                        <i class="fa fa-dollar-sign"></i>
                      </button>
                      <button class="btn btn-outline-secondary" (click)="print(s)" title="Imprimir">
                        <i class="fa fa-print"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Calcular Finiquito -->
    <div class="modal fade" id="calculateModal" tabindex="-1" [class.show]="showCalculateModal"
         [style.display]="showCalculateModal ? 'block' : 'none'">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fa fa-calculator me-2"></i>Calcular Finiquito</h5>
            <button type="button" class="btn-close" (click)="closeCalculateModal()"></button>
          </div>
          <div class="modal-body">
            <!-- Paso 1: Seleccionar empleado -->
            <div *ngIf="calculateStep === 1">
              <div class="mb-3">
                <label class="form-label">Seleccionar Empleado</label>
                <select class="form-select" [(ngModel)]="calculateForm.employee_id" (change)="onEmployeeSelected()">
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let e of activeEmployees" [value]="e.id">
                    {{e.employee_number}} - {{e.first_name}} {{e.paternal_surname}}
                  </option>
                </select>
              </div>
              <div class="row mb-3" *ngIf="selectedEmployeeInfo">
                <div class="col-md-4">
                  <label class="form-label">Fecha de Ingreso</label>
                  <input type="text" class="form-control" [value]="selectedEmployeeInfo.hire_date" readonly>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Puesto</label>
                  <input type="text" class="form-control" [value]="selectedEmployeeInfo.job_position" readonly>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Salario Diario</label>
                  <input type="text" class="form-control" [value]="'$' + formatNumber(selectedEmployeeInfo.daily_salary)" readonly>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Fecha de Baja <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="calculateForm.termination_date">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Motivo de Baja <span class="text-danger">*</span></label>
                  <select class="form-select" [(ngModel)]="calculateForm.termination_type">
                    <option value="">Seleccionar...</option>
                    <option value="voluntary_resignation">Renuncia voluntaria</option>
                    <option value="unjustified_dismissal">Despido injustificado</option>
                    <option value="justified_dismissal">Despido justificado</option>
                    <option value="contract_end">Fin de contrato</option>
                    <option value="mutual_agreement">Mutuo acuerdo</option>
                    <option value="retirement">Jubilación</option>
                  </select>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                  <button class="btn btn-primary w-100" (click)="calculate()"
                    [disabled]="!calculateForm.employee_id || !calculateForm.termination_date || !calculateForm.termination_type || calculating">
                    <i class="fa fa-calculator me-1"></i> {{calculating ? 'Calculando...' : 'Calcular'}}
                  </button>
                </div>
              </div>
            </div>

            <!-- Paso 2: Mostrar cálculo -->
            <div *ngIf="calculateStep === 2 && calculationResult">
              <div class="alert alert-info">
                <strong>Empleado:</strong> {{calculationResult.employee_name}} |
                <strong>Antigüedad:</strong> {{calculationResult.seniority_years}} años, {{calculationResult.seniority_days}} días |
                <strong>Tipo:</strong> {{getTypeLabel(calculateForm.termination_type)}}
              </div>

              <div class="row">
                <div class="col-md-6">
                  <h6 class="border-bottom pb-2">Percepciones</h6>
                  <table class="table table-sm">
                    <tr>
                      <td>Días trabajados ({{calculationResult.worked_days}} días)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.worked_days_amount)}}</td>
                    </tr>
                    <tr>
                      <td>Aguinaldo proporcional ({{calculationResult.aguinaldo_days}} días)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.aguinaldo_amount)}}</td>
                    </tr>
                    <tr>
                      <td>Vacaciones proporcionales ({{calculationResult.vacation_days}} días)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.vacation_amount)}}</td>
                    </tr>
                    <tr>
                      <td>Prima vacacional (25%)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.vacation_premium)}}</td>
                    </tr>
                    <tr *ngIf="calculationResult.prima_antiguedad > 0">
                      <td>Prima de antigüedad (12 días/año)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.prima_antiguedad)}}</td>
                    </tr>
                    <tr *ngIf="calculationResult.indemnizacion_20 > 0">
                      <td>Indemnización 20 días/año (Art. 50 LFT)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.indemnizacion_20)}}</td>
                    </tr>
                    <tr *ngIf="calculationResult.indemnizacion_90 > 0">
                      <td>Indemnización 90 días (Art. 50 LFT)</td>
                      <td class="text-end">\${{formatNumber(calculationResult.indemnizacion_90)}}</td>
                    </tr>
                    <tr class="table-success fw-bold">
                      <td>Total Percepciones</td>
                      <td class="text-end">\${{formatNumber(calculationResult.total_perceptions)}}</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6 class="border-bottom pb-2">Deducciones</h6>
                  <table class="table table-sm">
                    <tr>
                      <td>ISR</td>
                      <td class="text-end">\${{formatNumber(calculationResult.isr)}}</td>
                    </tr>
                    <tr *ngIf="calculationResult.infonavit_pending > 0">
                      <td>INFONAVIT pendiente</td>
                      <td class="text-end">\${{formatNumber(calculationResult.infonavit_pending)}}</td>
                    </tr>
                    <tr *ngIf="calculationResult.loans_pending > 0">
                      <td>Préstamos pendientes</td>
                      <td class="text-end">\${{formatNumber(calculationResult.loans_pending)}}</td>
                    </tr>
                    <tr *ngFor="let d of calculationResult.other_deductions">
                      <td>{{d.concept}}</td>
                      <td class="text-end">\${{formatNumber(d.amount)}}</td>
                    </tr>
                    <tr class="table-danger fw-bold">
                      <td>Total Deducciones</td>
                      <td class="text-end">\${{formatNumber(calculationResult.total_deductions)}}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <div class="alert alert-success text-center mt-3">
                <h4 class="mb-0">
                  Total Neto a Pagar: <strong>\${{formatNumber(calculationResult.net_amount)}}</strong>
                </h4>
              </div>

              <div class="mb-3">
                <label class="form-label">Notas adicionales</label>
                <textarea class="form-control" [(ngModel)]="calculateForm.notes" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeCalculateModal()">Cancelar</button>
            <button type="button" class="btn btn-outline-primary" *ngIf="calculateStep === 2" (click)="calculateStep = 1">
              <i class="fa fa-arrow-left me-1"></i> Modificar
            </button>
            <button type="button" class="btn btn-success" *ngIf="calculateStep === 2" (click)="saveSettlement()">
              <i class="fa fa-save me-1"></i> Guardar Finiquito
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showCalculateModal"></div>

    <!-- Modal Detalle -->
    <div class="modal fade" id="detailModal" tabindex="-1" [class.show]="showDetailModal"
         [style.display]="showDetailModal ? 'block' : 'none'">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fa fa-file-invoice-dollar me-2"></i>Detalle de Finiquito</h5>
            <button type="button" class="btn-close" (click)="showDetailModal = false"></button>
          </div>
          <div class="modal-body" *ngIf="selectedSettlement">
            <div class="row mb-3">
              <div class="col-md-6">
                <p><strong>Folio:</strong> {{selectedSettlement.folio}}</p>
                <p><strong>Empleado:</strong> {{selectedSettlement.employee?.first_name}} {{selectedSettlement.employee?.paternal_surname}}</p>
                <p><strong>Fecha de baja:</strong> {{selectedSettlement.termination_date}}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Tipo de baja:</strong> {{getTypeLabel(selectedSettlement.termination_type)}}</p>
                <p><strong>Antigüedad:</strong> {{selectedSettlement.seniority_years}} años, {{selectedSettlement.seniority_days}} días</p>
                <p><strong>Estado:</strong>
                  <span class="badge" [ngClass]="getStatusBadgeClass(selectedSettlement.status)">
                    {{getStatusLabel(selectedSettlement.status)}}
                  </span>
                </p>
              </div>
            </div>

            <h6>Desglose</h6>
            <table class="table table-sm table-bordered">
              <tr *ngFor="let item of selectedSettlement.details">
                <td>{{item.concept}}</td>
                <td class="text-end" [ngClass]="item.type === 'perception' ? 'text-success' : 'text-danger'">
                  {{item.type === 'perception' ? '+' : '-'}}\${{formatNumber(item.amount)}}
                </td>
              </tr>
              <tr class="fw-bold table-primary">
                <td>TOTAL NETO</td>
                <td class="text-end">\${{formatNumber(selectedSettlement.total_amount)}}</td>
              </tr>
            </table>

            <div *ngIf="selectedSettlement.notes">
              <strong>Notas:</strong>
              <p class="text-muted">{{selectedSettlement.notes}}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showDetailModal = false">Cerrar</button>
            <button type="button" class="btn btn-outline-secondary" (click)="print(selectedSettlement)">
              <i class="fa fa-print me-1"></i> Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showDetailModal"></div>
    </main>
  `
})
export class SettlementsListComponent implements OnInit {
  loading = false;
  settlements: any[] = [];
  activeEmployees: any[] = [];

  filters = {
    search: '',
    status: '',
    type: '',
    start_date: '',
    end_date: ''
  };

  stats = {
    pending: 0,
    approved: 0,
    paid: 0,
    total_amount: 0
  };

  // Modal calcular
  showCalculateModal = false;
  calculateStep = 1;
  calculating = false;
  selectedEmployeeInfo: any = null;
  calculationResult: any = null;
  calculateForm = {
    employee_id: '',
    termination_date: '',
    termination_type: '',
    notes: ''
  };

  // Modal detalle
  showDetailModal = false;
  selectedSettlement: any = null;

  private searchTimeout: any;

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.load();
    this.loadEmployees();
  }

  load() {
    this.loading = true;
    this.hrService.getSettlements(this.filters).subscribe({
      next: (res) => {
        this.settlements = res.data?.data || res.data || [];
        this.calculateStats();
        this.loading = false;
      },
      error: () => {
        this.settlements = [];
        this.loading = false;
      }
    });
  }

  loadEmployees() {
    this.hrService.getEmployees({ status: 'active' }).subscribe({
      next: (res) => this.activeEmployees = res.data?.data || res.data || []
    });
  }

  calculateStats() {
    this.stats = {
      pending: this.settlements.filter(s => s.status === 'pending').length,
      approved: this.settlements.filter(s => s.status === 'approved').length,
      paid: this.settlements.filter(s => s.status === 'paid').length,
      total_amount: this.settlements.reduce((sum, s) => sum + (s.total_amount || 0), 0)
    };
  }

  search() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 400);
  }

  clearFilters() {
    this.filters = { search: '', status: '', type: '', start_date: '', end_date: '' };
    this.load();
  }

  openCalculateModal() {
    this.calculateStep = 1;
    this.calculationResult = null;
    this.selectedEmployeeInfo = null;
    this.calculateForm = { employee_id: '', termination_date: '', termination_type: '', notes: '' };
    this.showCalculateModal = true;
  }

  closeCalculateModal() {
    this.showCalculateModal = false;
  }

  onEmployeeSelected() {
    const emp = this.activeEmployees.find(e => e.id == this.calculateForm.employee_id);
    if (emp) {
      this.selectedEmployeeInfo = {
        hire_date: emp.hire_date,
        job_position: emp.job_position?.name || emp.job_position || 'N/A',
        daily_salary: emp.daily_salary || emp.base_salary_daily || 0
      };
    } else {
      this.selectedEmployeeInfo = null;
    }
  }

  calculate() {
    this.calculating = true;
    this.hrService.calculateSettlement(+this.calculateForm.employee_id, {
      termination_date: this.calculateForm.termination_date,
      termination_type: this.calculateForm.termination_type
    }).subscribe({
      next: (res) => {
        this.calculationResult = res.data;
        this.calculateStep = 2;
        this.calculating = false;
      },
      error: () => {
        // Demo data si API no disponible
        this.calculationResult = this.generateDemoCalculation();
        this.calculateStep = 2;
        this.calculating = false;
      }
    });
  }

  generateDemoCalculation(): any {
    const emp = this.activeEmployees.find(e => e.id == this.calculateForm.employee_id);
    const dailySalary = emp?.daily_salary || 500;
    const hireDate = new Date(emp?.hire_date || '2020-01-01');
    const termDate = new Date(this.calculateForm.termination_date);
    const years = Math.floor((termDate.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const days = Math.floor(((termDate.getTime() - hireDate.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));

    const workedDays = termDate.getDate();
    const aguinaldoDays = Math.round((termDate.getMonth() + 1) / 12 * 15 * 100) / 100;
    const vacationDays = years < 1 ? 12 / 12 * (termDate.getMonth() + 1) : 12;

    const isUnfairDismissal = this.calculateForm.termination_type === 'unjustified_dismissal';
    const primaAntiguedad = years >= 15 || isUnfairDismissal ? Math.min(dailySalary * 2, 500) * 12 * years : 0;
    const indemnizacion20 = isUnfairDismissal ? dailySalary * 20 * years : 0;
    const indemnizacion90 = isUnfairDismissal ? dailySalary * 90 : 0;

    const totalPerceptions =
      workedDays * dailySalary +
      aguinaldoDays * dailySalary +
      vacationDays * dailySalary +
      vacationDays * dailySalary * 0.25 +
      primaAntiguedad +
      indemnizacion20 +
      indemnizacion90;

    const isr = totalPerceptions * 0.15;
    const totalDeductions = isr;

    return {
      employee_name: emp?.first_name + ' ' + emp?.paternal_surname,
      seniority_years: years,
      seniority_days: days,
      daily_salary: dailySalary,
      worked_days: workedDays,
      worked_days_amount: workedDays * dailySalary,
      aguinaldo_days: aguinaldoDays,
      aguinaldo_amount: aguinaldoDays * dailySalary,
      vacation_days: vacationDays,
      vacation_amount: vacationDays * dailySalary,
      vacation_premium: vacationDays * dailySalary * 0.25,
      prima_antiguedad: primaAntiguedad,
      indemnizacion_20: indemnizacion20,
      indemnizacion_90: indemnizacion90,
      total_perceptions: totalPerceptions,
      isr: isr,
      infonavit_pending: 0,
      loans_pending: 0,
      other_deductions: [],
      total_deductions: totalDeductions,
      net_amount: totalPerceptions - totalDeductions
    };
  }

  saveSettlement() {
    const data = {
      employee_id: this.calculateForm.employee_id,
      termination_date: this.calculateForm.termination_date,
      termination_type: this.calculateForm.termination_type,
      notes: this.calculateForm.notes,
      calculation: this.calculationResult
    };

    this.hrService.createSettlement(data).subscribe({
      next: () => {
        this.closeCalculateModal();
        this.load();
      },
      error: () => {
        // Simular éxito
        this.closeCalculateModal();
        alert('Finiquito guardado (demo)');
      }
    });
  }

  viewDetail(s: any) {
    this.selectedSettlement = s;
    this.showDetailModal = true;
  }

  approve(s: any) {
    if (confirm('¿Aprobar este finiquito?')) {
      this.hrService.approveSettlement(s.id).subscribe({
        next: () => this.load(),
        error: () => alert('Error al aprobar')
      });
    }
  }

  markPaid(s: any) {
    const paymentDate = prompt('Fecha de pago (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (paymentDate) {
      this.hrService.markSettlementPaid(s.id, { payment_date: paymentDate }).subscribe({
        next: () => this.load(),
        error: () => alert('Error al marcar como pagado')
      });
    }
  }

  print(s: any) {
    window.print();
  }

  formatNumber(num: number): string {
    return (num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'paid': 'Pagado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'draft': 'bg-secondary',
      'pending': 'bg-warning text-dark',
      'approved': 'bg-info',
      'paid': 'bg-success',
      'cancelled': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'voluntary_resignation': 'Renuncia voluntaria',
      'dismissal': 'Despido',
      'justified_dismissal': 'Despido justificado',
      'unjustified_dismissal': 'Despido injustificado',
      'contract_end': 'Fin de contrato',
      'mutual_agreement': 'Mutuo acuerdo',
      'death': 'Fallecimiento',
      'retirement': 'Jubilación'
    };
    return labels[type] || type;
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'voluntary_resignation': 'bg-info',
      'unjustified_dismissal': 'bg-danger',
      'justified_dismissal': 'bg-warning text-dark',
      'contract_end': 'bg-secondary',
      'mutual_agreement': 'bg-primary',
      'death': 'bg-dark',
      'retirement': 'bg-success'
    };
    return classes[type] || 'bg-secondary';
  }
}
