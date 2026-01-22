import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, LeaveRequest } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-leave-request',
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
              <li class="breadcrumb-item"><a routerLink="/hr/leaves">Permisos</a></li>
              <li class="breadcrumb-item active">Solicitar Permiso</li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <i class="fa fa-calendar-plus me-2"></i>Nueva Solicitud de Permiso
            </div>
            <div class="card-body">
              <form (ngSubmit)="submitRequest()">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Empleado</label>
                    <select class="form-select" [(ngModel)]="request.employee_id" name="employee_id" required>
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let emp of employees" [value]="emp.id">
                        {{emp.employee_number}} - {{emp.first_name}} {{emp.paternal_surname}}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Tipo de Permiso</label>
                    <select class="form-select" [(ngModel)]="request.leave_type_id" name="leave_type_id"
                      required (change)="onLeaveTypeChange()">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let type of leaveTypes" [value]="type.id">
                        {{type.name}}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Fecha Inicio</label>
                    <input type="date" class="form-control" [(ngModel)]="request.start_date"
                      name="start_date" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Fecha Fin</label>
                    <input type="date" class="form-control" [(ngModel)]="request.end_date"
                      name="end_date" required>
                  </div>
                </div>

                <div class="row" *ngIf="showTimeFields">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Hora Inicio</label>
                    <input type="time" class="form-control" [(ngModel)]="request.start_time" name="start_time">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Hora Fin</label>
                    <input type="time" class="form-control" [(ngModel)]="request.end_time" name="end_time">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Total Horas</label>
                    <input type="number" class="form-control" [(ngModel)]="request.total_hours"
                      name="total_hours" step="0.5" min="0.5">
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <div class="form-check">
                      <input type="checkbox" class="form-check-input" [(ngModel)]="request.is_paid"
                        name="is_paid" id="isPaid">
                      <label class="form-check-label" for="isPaid">Con goce de sueldo</label>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Motivo</label>
                  <textarea class="form-control" rows="3" [(ngModel)]="request.reason"
                    name="reason" placeholder="Describa el motivo del permiso..."></textarea>
                </div>

                <div class="alert alert-info" *ngIf="selectedType?.requires_evidence">
                  <i class="fa fa-info-circle me-2"></i>
                  Este tipo de permiso requiere evidencia/comprobante.
                </div>

                <div class="d-flex justify-content-end gap-2">
                  <a routerLink="/hr/leaves" class="btn btn-secondary">Cancelar</a>
                  <button type="submit" class="btn btn-primary" [disabled]="saving">
                    <i class="fa fa-paper-plane me-1"></i> Enviar Solicitud
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <i class="fa fa-list me-2"></i>Tipos de Permiso
            </div>
            <div class="card-body p-0">
              <ul class="list-group list-group-flush">
                <li class="list-group-item" *ngFor="let type of leaveTypes">
                  <div class="d-flex justify-content-between">
                    <span>{{type.name}}</span>
                    <span class="badge" [class.bg-success]="type.default_paid" [class.bg-secondary]="!type.default_paid">
                      {{type.default_paid ? 'Con goce' : 'Sin goce'}}
                    </span>
                  </div>
                  <small class="text-muted" *ngIf="type.max_days_per_year">
                    Máx: {{type.max_days_per_year}} días/año
                  </small>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  `,
  styles: [`
    .required-field::after { content: ' *'; color: red; }
  `]
})
export class LeaveRequestComponent implements OnInit {
  request: Partial<LeaveRequest> = {
    employee_id: 0,
    leave_type_id: 0,
    start_date: '',
    end_date: '',
    is_paid: true,
    reason: '',
    status: 'pending'
  };

  employees: any[] = [];
  leaveTypes: any[] = [];
  selectedType: any = null;
  showTimeFields = false;
  saving = false;

  constructor(
    private hrService: HumanResourcesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadLeaveTypes();
    this.loadEmployees();
  }

  loadEmployees() {
    this.hrService.getEmployees({ status: 1 }).subscribe({
      next: (res) => this.employees = res.data?.data || res.data || []
    });
  }

  loadLeaveTypes() {
    this.hrService.getLeaveTypes().subscribe({
      next: (res) => this.leaveTypes = res.data || []
    });
  }

  onLeaveTypeChange() {
    this.selectedType = this.leaveTypes.find(t => t.id == this.request.leave_type_id);
    if (this.selectedType) {
      this.request.is_paid = this.selectedType.default_paid;
    }
  }

  submitRequest() {
    this.saving = true;

    this.hrService.createLeaveRequest(this.request as LeaveRequest).subscribe({
      next: () => this.router.navigate(['/hr/leaves']),
      error: () => this.saving = false
    });
  }
}
