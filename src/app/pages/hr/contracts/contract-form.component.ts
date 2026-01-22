import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, EmploymentContract } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-contract-form',
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
              <li class="breadcrumb-item"><a routerLink="/hr/contracts">Contratos</a></li>
              <li class="breadcrumb-item active">{{isEdit ? 'Editar' : 'Nuevo'}} Contrato</li>
            </ol>
          </nav>
        </div>
      </div>

      <form (ngSubmit)="saveContract()">
        <div class="row">
          <!-- Datos del Empleado -->
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header bg-primary text-white">
                <i class="fa fa-user me-2"></i>Datos del Empleado
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label required-field">Empleado</label>
                  <select class="form-select" [(ngModel)]="contract.employee_id" name="employee_id" required
                    [disabled]="isEdit">
                    <option value="">Seleccionar empleado...</option>
                    <option *ngFor="let emp of employees" [value]="emp.id">
                      {{emp.employee_number}} - {{emp.first_name}} {{emp.paternal_surname}}
                    </option>
                  </select>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" [(ngModel)]="contract.department" name="department">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Puesto</label>
                    <input type="text" class="form-control" [(ngModel)]="contract.job_position" name="job_position">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Ubicación de trabajo</label>
                  <input type="text" class="form-control" [(ngModel)]="contract.work_location" name="work_location">
                </div>
              </div>
            </div>
          </div>

          <!-- Tipo de Contrato -->
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header bg-info text-white">
                <i class="fa fa-file-contract me-2"></i>Tipo de Contrato (SAT)
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label required-field">Tipo de Contrato (c_TipoContrato)</label>
                  <select class="form-select" [(ngModel)]="contract.contract_type" name="contract_type" required>
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let type of catalogs.contract_types | keyvalue" [value]="type.key">
                      {{type.key}} - {{type.value}}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label required-field">Régimen (c_TipoRegimen)</label>
                  <select class="form-select" [(ngModel)]="contract.work_regime" name="work_regime" required>
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let type of catalogs.work_regimes | keyvalue" [value]="type.key">
                      {{type.key}} - {{type.value}}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label required-field">Tipo de Jornada (c_TipoJornada)</label>
                  <select class="form-select" [(ngModel)]="contract.working_day_type" name="working_day_type" required>
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let type of catalogs.working_day_types | keyvalue" [value]="type.key">
                      {{type.key}} - {{type.value}}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label required-field">Periodicidad de Pago (c_PeriodicidadPago)</label>
                  <select class="form-select" [(ngModel)]="contract.payment_periodicity" name="payment_periodicity" required>
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let type of catalogs.payment_periodicities | keyvalue" [value]="type.key">
                      {{type.key}} - {{type.value}}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Fechas -->
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header bg-warning text-dark">
                <i class="fa fa-calendar me-2"></i>Vigencia
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Fecha de Inicio</label>
                    <input type="date" class="form-control" [(ngModel)]="contract.start_date" name="start_date" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Fecha de Fin</label>
                    <input type="date" class="form-control" [(ngModel)]="contract.end_date" name="end_date">
                    <small class="text-muted">Dejar vacío para indefinido</small>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Días de Prueba</label>
                    <input type="number" class="form-control" [(ngModel)]="contract.trial_period_days"
                      name="trial_period_days" min="0" max="180">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Días de Capacitación</label>
                    <input type="number" class="form-control" [(ngModel)]="contract.training_period_days"
                      name="training_period_days" min="0" max="180">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Salario -->
          <div class="col-md-6">
            <div class="card mb-3">
              <div class="card-header bg-success text-white">
                <i class="fa fa-dollar-sign me-2"></i>Salario
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Salario Diario</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control" [(ngModel)]="contract.base_salary_daily"
                        name="base_salary_daily" required min="0" step="0.01" (change)="calculateMonthlySalary()">
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Salario Mensual</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input type="number" class="form-control" [(ngModel)]="contract.base_salary_monthly"
                        name="base_salary_monthly" readonly>
                    </div>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Salario Diario Integrado (SDI)</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control" [(ngModel)]="contract.integrated_daily_wage"
                      name="integrated_daily_wage" step="0.01">
                  </div>
                  <small class="text-muted">Factor de integración: 1.0493 (mínimo)</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Horario -->
          <div class="col-md-12">
            <div class="card mb-3">
              <div class="card-header bg-secondary text-white">
                <i class="fa fa-clock me-2"></i>Horario de Trabajo
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-12 mb-3">
                    <label class="form-label">Descripción del Horario</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="contract.work_schedule"
                      name="work_schedule" placeholder="Ej: Lunes a Viernes 9:00 - 18:00 hrs"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="row">
          <div class="col-12 d-flex justify-content-end gap-2">
            <a routerLink="/hr/contracts" class="btn btn-secondary">
              <i class="fa fa-times me-1"></i> Cancelar
            </a>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              <i class="fa fa-save me-1"></i> {{saving ? 'Guardando...' : 'Guardar Contrato'}}
            </button>
          </div>
        </div>
      </form>
    </div>
    </main>
  `,
  styles: [`
    .required-field::after {
      content: ' *';
      color: red;
    }
  `]
})
export class ContractFormComponent implements OnInit {
  isEdit = false;
  saving = false;
  contractId: number | null = null;

  contract: Partial<EmploymentContract> = {
    employee_id: 0,
    contract_type: '',
    work_regime: '',
    working_day_type: '',
    payment_periodicity: '',
    start_date: '',
    base_salary_daily: 0,
    status: 'draft'
  };

  employees: any[] = [];
  catalogs: any = {
    contract_types: {},
    work_regimes: {},
    working_day_types: {},
    payment_periodicities: {}
  };

  constructor(
    private hrService: HumanResourcesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCatalogs();
    this.loadEmployees();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.contractId = +id;
      this.loadContract();
    }
  }

  loadCatalogs() {
    this.hrService.getContractCatalogs().subscribe({
      next: (res) => {
        this.catalogs = res.data || {};
        // Los empleados vienen incluidos en los catálogos
        if (res.data?.employees) {
          this.employees = res.data.employees;
        }
      }
    });
  }

  loadEmployees() {
    // Los empleados se cargan desde getCatalogs
  }

  loadContract() {
    if (!this.contractId) return;
    this.hrService.getContract(this.contractId).subscribe({
      next: (res) => {
        this.contract = res.data || {};
      }
    });
  }

  calculateMonthlySalary() {
    if (this.contract.base_salary_daily) {
      this.contract.base_salary_monthly = this.contract.base_salary_daily * 30;
      if (!this.contract.integrated_daily_wage) {
        this.contract.integrated_daily_wage = this.contract.base_salary_daily * 1.0493;
      }
    }
  }

  saveContract() {
    this.saving = true;

    const request = this.isEdit
      ? this.hrService.updateContract(this.contractId!, this.contract)
      : this.hrService.createContract(this.contract as EmploymentContract);

    request.subscribe({
      next: () => {
        this.router.navigate(['/hr/contracts']);
      },
      error: () => this.saving = false
    });
  }
}
