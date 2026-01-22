import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, VacationRequest } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-vacations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-umbrella-beach me-2"></i>Solicitudes de Vacaciones</h4>
          <div>
            <a routerLink="balances" class="btn btn-outline-info me-2">
              <i class="fa fa-chart-bar me-1"></i> Saldos
            </a>
            <a routerLink="request" class="btn btn-primary">
              <i class="fa fa-plus me-1"></i> Nueva Solicitud
            </a>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'all'" (click)="setTab('all')">
            Todas <span class="badge bg-secondary">{{counts.all}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'pending'" (click)="setTab('pending')">
            Pendientes <span class="badge bg-warning text-dark">{{counts.pending}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'approved'" (click)="setTab('approved')">
            Aprobadas <span class="badge bg-success">{{counts.approved}}</span>
          </a>
        </li>
      </ul>

      <!-- Tabla -->
      <div class="card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Empleado</th>
                  <th>Período Solicitado</th>
                  <th class="text-center">Días</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let vacation of vacations">
                  <td>
                    <strong>{{vacation.employee?.first_name}} {{vacation.employee?.paternal_surname}}</strong>
                    <br><small class="text-muted">{{vacation.employee?.employee_number}}</small>
                  </td>
                  <td>
                    {{vacation.start_date | date:'dd/MM/yyyy'}} - {{vacation.end_date | date:'dd/MM/yyyy'}}
                  </td>
                  <td class="text-center">
                    <span class="badge bg-primary">{{vacation.days_requested}}</span>
                  </td>
                  <td>{{vacation.reason || '-'}}</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(vacation.status)">
                      {{getStatusLabel(vacation.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" title="Ver detalle" (click)="showDetail(vacation)">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button *ngIf="vacation.status === 'pending' || vacation.status === 'supervisor_approved'"
                        class="btn btn-outline-success" title="Aprobar" (click)="approve(vacation)">
                        <i class="fa fa-check"></i>
                      </button>
                      <button *ngIf="vacation.status === 'pending' || vacation.status === 'supervisor_approved'"
                        class="btn btn-outline-danger" title="Rechazar" (click)="showRejectModal(vacation)">
                        <i class="fa fa-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="vacations.length === 0 && !loading">
                  <td colspan="6" class="text-center py-4 text-muted">
                    No hay solicitudes de vacaciones
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rechazar -->
    <div class="modal fade" id="rejectModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Rechazar Solicitud</h5>
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

    <!-- Modal Detalle -->
    <div class="modal fade" id="detailModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" *ngIf="selectedVacation">
          <div class="modal-header">
            <h5 class="modal-title">Detalle de Solicitud</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Empleado:</strong> {{selectedVacation.employee?.first_name}} {{selectedVacation.employee?.paternal_surname}}</p>
                <p><strong>Período:</strong> {{selectedVacation.start_date | date:'dd/MM/yyyy'}} - {{selectedVacation.end_date | date:'dd/MM/yyyy'}}</p>
                <p><strong>Días solicitados:</strong> {{selectedVacation.days_requested}}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Estado:</strong>
                  <span class="badge" [ngClass]="getStatusClass(selectedVacation.status)">
                    {{getStatusLabel(selectedVacation.status)}}
                  </span>
                </p>
                <p><strong>Motivo:</strong> {{selectedVacation.reason || 'No especificado'}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class VacationsListComponent implements OnInit {
  vacations: VacationRequest[] = [];
  loading = false;
  activeTab = 'all';
  counts = { all: 0, pending: 0, approved: 0 };

  selectedVacation: VacationRequest | null = null;
  rejectReason = '';

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.loadVacations();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.loadVacations();
  }

  loadVacations() {
    this.loading = true;
    const status = this.activeTab === 'all' ? '' : this.activeTab;

    this.hrService.getVacationRequests({ status }).subscribe({
      next: (res) => {
        this.vacations = res.data?.data || res.data || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });

    // Cargar conteos
    this.hrService.getPendingVacations().subscribe({
      next: (res) => this.counts.pending = res.data?.length || 0
    });
  }

  showDetail(vacation: VacationRequest) {
    this.selectedVacation = vacation;
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('detailModal')).show();
  }

  approve(vacation: VacationRequest) {
    if (confirm('¿Aprobar esta solicitud de vacaciones?')) {
      const request = vacation.status === 'pending'
        ? this.hrService.approveVacation(vacation.id!)
        : this.hrService.hrApproveVacation(vacation.id!);

      request.subscribe({
        next: () => this.loadVacations()
      });
    }
  }

  showRejectModal(vacation: VacationRequest) {
    this.selectedVacation = vacation;
    this.rejectReason = '';
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('rejectModal')).show();
  }

  reject() {
    if (!this.selectedVacation || !this.rejectReason) return;

    this.hrService.rejectVacation(this.selectedVacation.id!, { rejection_reason: this.rejectReason }).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('rejectModal'))?.hide();
        this.loadVacations();
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-warning text-dark',
      'supervisor_approved': 'bg-info',
      'approved': 'bg-success',
      'rejected': 'bg-danger',
      'cancelled': 'bg-secondary',
      'taken': 'bg-primary'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'supervisor_approved': 'Aprobado por Supervisor',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado',
      'taken': 'Tomadas'
    };
    return labels[status] || status;
  }
}
