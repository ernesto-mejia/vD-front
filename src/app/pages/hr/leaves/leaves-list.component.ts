import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, LeaveRequest } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-leaves-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-calendar-times me-2"></i>Permisos e Incidencias</h4>
          <a routerLink="request" class="btn btn-primary">
            <i class="fa fa-plus me-1"></i> Solicitar Permiso
          </a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="filters.status" (change)="loadLeaves()">
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="filters.leave_type_id" (change)="loadLeaves()">
                <option value="">Todos los tipos</option>
                <option *ngFor="let type of leaveTypes" [value]="type.id">{{type.name}}</option>
              </select>
            </div>
            <div class="col-md-2">
              <input type="date" class="form-control" [(ngModel)]="filters.start_date" (change)="loadLeaves()">
            </div>
            <div class="col-md-2">
              <input type="date" class="form-control" [(ngModel)]="filters.end_date" (change)="loadLeaves()">
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
                  <th>Fecha/Período</th>
                  <th class="text-center">Horas</th>
                  <th>Con goce</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let leave of leaves">
                  <td>
                    <strong>{{leave.employee?.first_name}} {{leave.employee?.paternal_surname}}</strong>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{leave.leave_type?.name || 'N/A'}}</span>
                  </td>
                  <td>
                    <span *ngIf="leave.start_date === leave.end_date">
                      {{leave.start_date | date:'dd/MM/yyyy'}}
                    </span>
                    <span *ngIf="leave.start_date !== leave.end_date">
                      {{leave.start_date | date:'dd/MM'}} - {{leave.end_date | date:'dd/MM/yyyy'}}
                    </span>
                    <br *ngIf="leave.start_time">
                    <small class="text-muted" *ngIf="leave.start_time">
                      {{leave.start_time}} - {{leave.end_time}}
                    </small>
                  </td>
                  <td class="text-center">{{leave.total_hours || '-'}}</td>
                  <td>
                    <i class="fa" [class.fa-check]="leave.is_paid" [class.fa-times]="!leave.is_paid"
                      [class.text-success]="leave.is_paid" [class.text-danger]="!leave.is_paid"></i>
                  </td>
                  <td>
                    <span class="text-truncate d-inline-block" style="max-width: 150px;"
                      [title]="leave.reason">{{leave.reason || '-'}}</span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(leave.status)">
                      {{getStatusLabel(leave.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button *ngIf="leave.status === 'pending'" class="btn btn-outline-success"
                        title="Aprobar" (click)="approve(leave)">
                        <i class="fa fa-check"></i>
                      </button>
                      <button *ngIf="leave.status === 'pending'" class="btn btn-outline-danger"
                        title="Rechazar" (click)="showRejectModal(leave)">
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="leaves.length === 0 && !loading">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No hay solicitudes de permisos
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rechazar -->
    <div class="modal fade" id="rejectLeaveModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Rechazar Permiso</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Motivo del rechazo</label>
              <textarea class="form-control" rows="3" [(ngModel)]="rejectReason" required></textarea>
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
export class LeavesListComponent implements OnInit {
  leaves: LeaveRequest[] = [];
  leaveTypes: any[] = [];
  loading = false;

  filters = {
    status: '',
    leave_type_id: '',
    start_date: '',
    end_date: ''
  };

  selectedLeave: LeaveRequest | null = null;
  rejectReason = '';

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.loadLeaveTypes();
    this.loadLeaves();
  }

  loadLeaveTypes() {
    this.hrService.getLeaveTypes().subscribe({
      next: (res) => this.leaveTypes = res.data || []
    });
  }

  loadLeaves() {
    this.loading = true;
    this.hrService.getLeaveRequests(this.filters).subscribe({
      next: (res) => {
        this.leaves = res.data?.data || res.data || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  approve(leave: LeaveRequest) {
    if (confirm('¿Aprobar este permiso?')) {
      this.hrService.approveLeave(leave.id!).subscribe({
        next: () => this.loadLeaves()
      });
    }
  }

  showRejectModal(leave: LeaveRequest) {
    this.selectedLeave = leave;
    this.rejectReason = '';
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('rejectLeaveModal')).show();
  }

  reject() {
    if (!this.selectedLeave || !this.rejectReason) return;

    this.hrService.rejectLeave(this.selectedLeave.id!, { rejection_reason: this.rejectReason }).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('rejectLeaveModal'))?.hide();
        this.loadLeaves();
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-success',
      'rejected': 'bg-danger',
      'cancelled': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }
}
