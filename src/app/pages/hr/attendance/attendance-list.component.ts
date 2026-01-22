import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, AttendanceRecord } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-clock me-2"></i>Control de Asistencia</h4>
          <a routerLink="check" class="btn btn-primary">
            <i class="fa fa-fingerprint me-1"></i> Registrar Asistencia
          </a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3">
              <label class="form-label">Fecha Inicio</label>
              <input type="date" class="form-control" [(ngModel)]="filters.start_date">
            </div>
            <div class="col-md-3">
              <label class="form-label">Fecha Fin</label>
              <input type="date" class="form-control" [(ngModel)]="filters.end_date">
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="filters.status">
                <option value="">Todos</option>
                <option value="complete">Completo</option>
                <option value="incomplete">Incompleto</option>
                <option value="absent">Falta</option>
                <option value="late">Retardo</option>
              </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <button class="btn btn-outline-primary w-100" (click)="loadAttendance()">
                <i class="fa fa-search me-1"></i> Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <h3>{{stats.complete}}</h3>
              <small>Asistencias Completas</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body text-center">
              <h3>{{stats.late}}</h3>
              <small>Retardos</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body text-center">
              <h3>{{stats.absent}}</h3>
              <small>Faltas</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <h3>{{stats.overtime | number:'1.1-1'}} hrs</h3>
              <small>Tiempo Extra</small>
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
                  <th>Fecha</th>
                  <th class="text-center">Entrada</th>
                  <th class="text-center">Salida</th>
                  <th class="text-center">Horas</th>
                  <th class="text-center">Retardo</th>
                  <th class="text-center">T. Extra</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of records">
                  <td>
                    <strong>{{record.employee?.first_name}} {{record.employee?.paternal_surname}}</strong>
                  </td>
                  <td>{{record.date | date:'dd/MM/yyyy'}}</td>
                  <td class="text-center">
                    <span *ngIf="record.check_in">{{record.check_in}}</span>
                    <span *ngIf="!record.check_in" class="text-muted">-</span>
                  </td>
                  <td class="text-center">
                    <span *ngIf="record.check_out">{{record.check_out}}</span>
                    <span *ngIf="!record.check_out" class="text-muted">-</span>
                  </td>
                  <td class="text-center">{{record.worked_hours | number:'1.1-1'}}</td>
                  <td class="text-center">
                    <span *ngIf="(record.late_minutes || 0) > 0" class="text-danger">
                      {{record.late_minutes}} min
                    </span>
                    <span *ngIf="!record.late_minutes || record.late_minutes === 0" class="text-success">-</span>
                  </td>
                  <td class="text-center">
                    <span *ngIf="(record.overtime_minutes || 0) > 0" class="text-info">
                      {{record.overtime_minutes}} min
                    </span>
                    <span *ngIf="!record.overtime_minutes || record.overtime_minutes === 0">-</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(record.status)">
                      {{getStatusLabel(record.status)}}
                    </span>
                    <span class="badge bg-info ms-1" *ngIf="record.is_holiday">Festivo</span>
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" (click)="editRecord(record)">
                      <i class="fa fa-edit"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="records.length === 0 && !loading">
                  <td colspan="9" class="text-center py-4 text-muted">
                    No hay registros de asistencia
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Editar -->
    <div class="modal fade" id="editAttendanceModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar Registro</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" *ngIf="selectedRecord">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Hora Entrada</label>
                <input type="time" class="form-control" [(ngModel)]="selectedRecord.check_in">
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Hora Salida</label>
                <input type="time" class="form-control" [(ngModel)]="selectedRecord.check_out">
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea class="form-control" rows="2" [(ngModel)]="selectedRecord.notes"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="saveRecord()">Guardar</button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class AttendanceListComponent implements OnInit {
  records: AttendanceRecord[] = [];
  loading = false;

  filters = {
    start_date: '',
    end_date: '',
    status: '',
    employee_id: ''
  };

  stats = {
    complete: 0,
    late: 0,
    absent: 0,
    overtime: 0
  };

  selectedRecord: AttendanceRecord | null = null;

  constructor(private hrService: HumanResourcesService) {
    // Fechas por defecto: última semana
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    this.filters.end_date = today.toISOString().split('T')[0];
    this.filters.start_date = weekAgo.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadAttendance();
  }

  loadAttendance() {
    this.loading = true;
    this.hrService.getAttendanceRecords(this.filters).subscribe({
      next: (res) => {
        this.records = res.data?.data || res.data || [];
        this.calculateStats();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  calculateStats() {
    this.stats = {
      complete: this.records.filter(r => r.status === 'complete').length,
      late: this.records.filter(r => r.late_minutes && r.late_minutes > 0).length,
      absent: this.records.filter(r => r.status === 'absent').length,
      overtime: this.records.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0) / 60
    };
  }

  editRecord(record: AttendanceRecord) {
    this.selectedRecord = { ...record };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('editAttendanceModal')).show();
  }

  saveRecord() {
    if (!this.selectedRecord) return;

    this.hrService.updateAttendance(this.selectedRecord.id!, this.selectedRecord).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'))?.hide();
        this.loadAttendance();
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'complete': 'bg-success',
      'incomplete': 'bg-warning text-dark',
      'absent': 'bg-danger',
      'late': 'bg-warning text-dark',
      'rest_day': 'bg-secondary',
      'holiday': 'bg-info'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'complete': 'Completo',
      'incomplete': 'Incompleto',
      'absent': 'Falta',
      'late': 'Retardo',
      'rest_day': 'Descanso',
      'holiday': 'Festivo'
    };
    return labels[status] || status;
  }
}
