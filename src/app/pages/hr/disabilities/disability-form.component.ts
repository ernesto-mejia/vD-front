import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, DisabilityRecord } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-disability-form',
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
              <li class="breadcrumb-item"><a routerLink="/hr/disabilities">Incapacidades</a></li>
              <li class="breadcrumb-item active">{{isEdit ? 'Editar' : 'Registrar'}}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fa fa-hospital me-2"></i>
            {{isEdit ? 'Editar Incapacidad' : 'Registrar Incapacidad'}}
          </h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="save()">
            <!-- Empleado y Tipo -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Empleado <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.employee_id" name="employee_id" required>
                  <option value="">Seleccionar empleado</option>
                  <option *ngFor="let emp of employees" [value]="emp.id">
                    {{emp.first_name}} {{emp.paternal_surname}} - {{emp.nss || 'Sin NSS'}}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo de Incapacidad <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.disability_type" name="disability_type"
                  (change)="onTypeChange()" required>
                  <option value="">Seleccionar tipo</option>
                  <option value="general_illness">Enfermedad General</option>
                  <option value="work_risk">Riesgo de Trabajo</option>
                  <option value="maternity">Maternidad</option>
                </select>
              </div>
            </div>

            <!-- Riesgo de trabajo -->
            <div class="row mb-3" *ngIf="form.disability_type === 'work_risk'">
              <div class="col-md-12">
                <div class="alert alert-warning">
                  <i class="fa fa-exclamation-triangle me-2"></i>
                  <strong>Riesgo de Trabajo:</strong> Subsidio del 100% del salario desde el primer día.
                </div>
              </div>
            </div>

            <!-- Enfermedad General Info -->
            <div class="row mb-3" *ngIf="form.disability_type === 'general_illness'">
              <div class="col-md-12">
                <div class="alert alert-info">
                  <i class="fa fa-info-circle me-2"></i>
                  <strong>Enfermedad General:</strong>
                  Subsidio del 60% a partir del 4° día. Los primeros 3 días no generan subsidio IMSS.
                </div>
              </div>
            </div>

            <!-- Maternidad Info -->
            <div class="row mb-3" *ngIf="form.disability_type === 'maternity'">
              <div class="col-md-12">
                <div class="alert alert-success">
                  <i class="fa fa-baby me-2"></i>
                  <strong>Maternidad:</strong>
                  Subsidio del 100% durante 84 días (42 antes y 42 después del parto).
                </div>
              </div>
            </div>

            <!-- Folio y Unidad Médica -->
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Folio IMSS <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.imss_folio"
                  name="imss_folio" placeholder="Ej: 12345678" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Unidad Médica Familiar</label>
                <input type="text" class="form-control" [(ngModel)]="form.medical_unit"
                  name="medical_unit" placeholder="Ej: UMF 24">
              </div>
              <div class="col-md-4">
                <label class="form-label">Nombre del Médico</label>
                <input type="text" class="form-control" [(ngModel)]="form.doctor_name"
                  name="doctor_name" placeholder="Dr. Juan Pérez">
              </div>
            </div>

            <!-- Fechas -->
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Fecha de Inicio <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="form.start_date"
                  name="start_date" (change)="calculateDays()" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Fecha de Término <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="form.end_date"
                  name="end_date" (change)="calculateDays()" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Días Totales</label>
                <input type="number" class="form-control" [value]="calculatedDays" readonly>
              </div>
            </div>

            <!-- Diagnóstico -->
            <div class="row mb-3">
              <div class="col-md-12">
                <label class="form-label">Diagnóstico</label>
                <textarea class="form-control" [(ngModel)]="form.diagnosis" name="diagnosis"
                  rows="2" placeholder="Descripción del diagnóstico médico"></textarea>
              </div>
            </div>

            <!-- Subsidio -->
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">% Pagable IMSS</label>
                <div class="input-group">
                  <input type="number" class="form-control" [(ngModel)]="form.percentage_payable"
                    name="percentage_payable" min="0" max="100" readonly>
                  <span class="input-group-text">%</span>
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Salario Diario Integrado</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [(ngModel)]="form.daily_wage"
                    name="daily_wage" step="0.01" (change)="calculateSubsidy()">
                </div>
              </div>
              <div class="col-md-4">
                <label class="form-label">Subsidio Estimado</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [value]="estimatedSubsidy" readonly>
                </div>
              </div>
            </div>

            <!-- Documentos -->
            <div class="row mb-3">
              <div class="col-md-6">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" [(ngModel)]="form.document_received"
                    name="document_received" id="docReceived">
                  <label class="form-check-label" for="docReceived">
                    Documento físico recibido
                  </label>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" [(ngModel)]="form.is_work_related"
                    name="is_work_related" id="workRelated">
                  <label class="form-check-label" for="workRelated">
                    Relacionado con accidente de trabajo
                  </label>
                </div>
              </div>
            </div>

            <!-- Notas -->
            <div class="row mb-3">
              <div class="col-md-12">
                <label class="form-label">Notas Adicionales</label>
                <textarea class="form-control" [(ngModel)]="form.notes" name="notes"
                  rows="2" placeholder="Observaciones adicionales"></textarea>
              </div>
            </div>

            <!-- Resumen -->
            <div class="row mb-3" *ngIf="form.disability_type">
              <div class="col-md-12">
                <div class="card bg-light">
                  <div class="card-body">
                    <h6><i class="fa fa-calculator me-2"></i>Resumen del Cálculo</h6>
                    <div class="row">
                      <div class="col-md-3">
                        <p class="mb-0"><small class="text-muted">Tipo:</small></p>
                        <strong>{{getTypeLabel(form.disability_type)}}</strong>
                      </div>
                      <div class="col-md-3">
                        <p class="mb-0"><small class="text-muted">Días:</small></p>
                        <strong>{{calculatedDays}}</strong>
                      </div>
                      <div class="col-md-3">
                        <p class="mb-0"><small class="text-muted">% Subsidio:</small></p>
                        <strong>{{form.percentage_payable}}%</strong>
                      </div>
                      <div class="col-md-3">
                        <p class="mb-0"><small class="text-muted">Subsidio Estimado:</small></p>
                        <strong class="text-success">{{estimatedSubsidy | currency:'MXN'}}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones -->
            <div class="row">
              <div class="col-12 d-flex justify-content-end gap-2">
                <a routerLink="/hr/disabilities" class="btn btn-secondary">
                  <i class="fa fa-times me-1"></i> Cancelar
                </a>
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  <i class="fa fa-save me-1"></i> {{saving ? 'Guardando...' : 'Guardar'}}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    </main>
  `
})
export class DisabilityFormComponent implements OnInit {
  isEdit = false;
  saving = false;
  employees: any[] = [];
  calculatedDays = 0;
  estimatedSubsidy = 0;

  form: DisabilityRecord = {
    employee_id: 0,
    disability_type: '',
    imss_folio: '',
    start_date: '',
    end_date: '',
    total_days: 0,
    diagnosis: '',
    medical_unit: '',
    doctor_name: '',
    percentage_payable: 0,
    daily_wage: 0,
    document_received: false,
    is_work_related: false,
    status: 'active',
    notes: ''
  };

  constructor(
    private hrService: HumanResourcesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadEmployees();

    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEdit = true;
      this.loadDisability(id);
    }
  }

  loadEmployees() {
    this.hrService.getEmployees().subscribe({
      next: (res) => this.employees = res.data?.data || res.data || []
    });
  }

  loadDisability(id: number) {
    this.hrService.getDisability(id).subscribe({
      next: (res) => {
        this.form = res.data;
        this.calculateDays();
        this.calculateSubsidy();
      }
    });
  }

  onTypeChange() {
    switch (this.form.disability_type) {
      case 'general_illness':
        this.form.percentage_payable = 60;
        break;
      case 'work_risk':
        this.form.percentage_payable = 100;
        break;
      case 'maternity':
        this.form.percentage_payable = 100;
        break;
      default:
        this.form.percentage_payable = 0;
    }
    this.calculateSubsidy();
  }

  calculateDays() {
    if (this.form.start_date && this.form.end_date) {
      const start = new Date(this.form.start_date);
      const end = new Date(this.form.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      this.calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      this.calculateSubsidy();
    }
  }

  calculateSubsidy() {
    if (!this.form.daily_wage || !this.calculatedDays) {
      this.estimatedSubsidy = 0;
      return;
    }

    let subsidyDays = this.calculatedDays;

    // Para enfermedad general, los primeros 3 días no generan subsidio
    if (this.form.disability_type === 'general_illness' && subsidyDays > 3) {
      subsidyDays = subsidyDays - 3;
    } else if (this.form.disability_type === 'general_illness') {
      subsidyDays = 0;
    }

    this.estimatedSubsidy = Math.round(
      (this.form.daily_wage || 0) * subsidyDays * ((this.form.percentage_payable || 0) / 100) * 100
    ) / 100;
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'general_illness': 'Enfermedad General',
      'work_risk': 'Riesgo de Trabajo',
      'maternity': 'Maternidad'
    };
    return labels[type] || type;
  }

  save() {
    this.saving = true;
    this.form.total_days = this.calculatedDays;
    this.form.total_subsidy = this.estimatedSubsidy;

    const request = this.isEdit
      ? this.hrService.updateDisability(this.form.id!, this.form)
      : this.hrService.createDisability(this.form);

    request.subscribe({
      next: () => {
        this.router.navigate(['/hr/disabilities']);
      },
      error: () => this.saving = false
    });
  }
}
