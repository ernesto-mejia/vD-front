import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, VacationRequest } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-vacation-request',
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
              <li class="breadcrumb-item"><a routerLink="/hr/vacations">Vacaciones</a></li>
              <li class="breadcrumb-item active">Solicitar Vacaciones</li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <i class="fa fa-umbrella-beach me-2"></i>Nueva Solicitud de Vacaciones
            </div>
            <div class="card-body">
              <form (ngSubmit)="submitRequest()">
                <div class="row">
                  <div class="col-md-12 mb-3">
                    <label class="form-label required-field">Empleado</label>
                    <select class="form-select" [(ngModel)]="request.employee_id" name="employee_id"
                      required (change)="loadBalance()">
                      <option value="">Seleccionar empleado...</option>
                      <option *ngFor="let emp of employees" [value]="emp.id">
                        {{emp.employee_number}} - {{emp.first_name}} {{emp.paternal_surname}}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Fecha de Inicio</label>
                    <input type="date" class="form-control" [(ngModel)]="request.start_date"
                      name="start_date" required (change)="calculateDays()">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label required-field">Fecha de Fin</label>
                    <input type="date" class="form-control" [(ngModel)]="request.end_date"
                      name="end_date" required (change)="calculateDays()">
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Días Solicitados</label>
                    <input type="number" class="form-control" [(ngModel)]="request.days_requested"
                      name="days_requested" readonly>
                    <small class="text-muted">Calculado automáticamente (días hábiles)</small>
                  </div>
                  <div class="col-md-6 mb-3" *ngIf="balance">
                    <label class="form-label">Saldo Disponible</label>
                    <div class="input-group">
                      <input type="text" class="form-control" [value]="balance.pending_days" readonly>
                      <span class="input-group-text">días</span>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Motivo / Comentarios</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="request.reason" name="reason"></textarea>
                </div>

                <div class="alert alert-warning" *ngIf="balance && request.days_requested && request.days_requested > (balance.pending_days || 0)">
                  <i class="fa fa-exclamation-triangle me-2"></i>
                  Los días solicitados exceden el saldo disponible.
                </div>

                <div class="d-flex justify-content-end gap-2">
                  <a routerLink="/hr/vacations" class="btn btn-secondary">Cancelar</a>
                  <button type="submit" class="btn btn-primary" [disabled]="saving">
                    <i class="fa fa-paper-plane me-1"></i> Enviar Solicitud
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card" *ngIf="balance">
            <div class="card-header bg-info text-white">
              <i class="fa fa-chart-pie me-2"></i>Resumen de Saldo
            </div>
            <div class="card-body">
              <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between">
                  <span>Año</span>
                  <strong>{{balance.year}}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span>Días correspondientes</span>
                  <strong>{{balance.entitled_days}}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span>Días tomados</span>
                  <strong class="text-danger">{{balance.used_days}}</strong>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span>Días pendientes</span>
                  <strong class="text-success">{{balance.pending_days}}</strong>
                </li>
              </ul>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header">
              <i class="fa fa-info-circle me-2"></i>Información
            </div>
            <div class="card-body">
              <small class="text-muted">
                <p><strong>Días de vacaciones según LFT 2023:</strong></p>
                <ul>
                  <li>1 año: 12 días</li>
                  <li>2 años: 14 días</li>
                  <li>3 años: 16 días</li>
                  <li>4 años: 18 días</li>
                  <li>5 años: 20 días</li>
                  <li>6-10 años: +2 días por año</li>
                  <li>11+ años: +2 días cada 5 años</li>
                </ul>
              </small>
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
export class VacationRequestComponent implements OnInit {
  request: Partial<VacationRequest> = {
    employee_id: 0,
    start_date: '',
    end_date: '',
    days_requested: 0,
    reason: '',
    status: 'pending'
  };

  employees: any[] = [];
  balance: any = null;
  saving = false;

  constructor(
    private hrService: HumanResourcesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.hrService.getEmployees({ status: 1 }).subscribe({
      next: (res) => this.employees = res.data?.data || res.data || []
    });
  }

  loadBalance() {
    if (!this.request.employee_id) return;

    this.hrService.getVacationBalance(this.request.employee_id).subscribe({
      next: (res) => this.balance = res.data
    });
  }

  calculateDays() {
    if (!this.request.start_date || !this.request.end_date) return;

    const start = new Date(this.request.start_date);
    const end = new Date(this.request.end_date);

    if (end < start) {
      this.request.days_requested = 0;
      return;
    }

    // Calcular días hábiles (simplificado)
    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Excluir sábados y domingos
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    this.request.days_requested = days;
  }

  submitRequest() {
    this.saving = true;

    this.hrService.createVacationRequest(this.request as VacationRequest).subscribe({
      next: () => this.router.navigate(['/hr/vacations']),
      error: () => this.saving = false
    });
  }
}
