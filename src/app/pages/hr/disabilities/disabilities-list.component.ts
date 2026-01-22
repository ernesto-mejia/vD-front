import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService, DisabilityRecord } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-disabilities-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-hospital me-2"></i>Incapacidades</h4>
          <a routerLink="new" class="btn btn-primary">
            <i class="fa fa-plus me-1"></i> Registrar Incapacidad
          </a>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'active'" (click)="setTab('active')">
            Activas <span class="badge bg-success">{{counts.active}}</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" [class.active]="activeTab === 'all'" (click)="setTab('all')">
            Todas
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
                  <th>Tipo</th>
                  <th>Folio IMSS</th>
                  <th>Período</th>
                  <th class="text-center">Días</th>
                  <th>Subsidio</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let disability of disabilities">
                  <td>
                    <strong>{{disability.employee?.first_name}} {{disability.employee?.paternal_surname}}</strong>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getTypeClass(disability.disability_type)">
                      {{getTypeLabel(disability.disability_type)}}
                    </span>
                    <span class="badge bg-danger ms-1" *ngIf="disability.is_work_related">
                      Riesgo Trabajo
                    </span>
                  </td>
                  <td>{{disability.imss_folio || '-'}}</td>
                  <td>
                    {{disability.start_date | date:'dd/MM/yyyy'}} - {{disability.end_date | date:'dd/MM/yyyy'}}
                  </td>
                  <td class="text-center">
                    <span class="badge bg-primary">{{disability.total_days}}</span>
                  </td>
                  <td>
                    <span *ngIf="disability.total_subsidy">
                      {{disability.total_subsidy | currency:'MXN'}}
                    </span>
                    <span *ngIf="!disability.total_subsidy">-</span>
                    <br>
                    <small class="text-muted">{{disability.percentage_payable}}% pagable</small>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(disability.status)">
                      {{getStatusLabel(disability.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" title="Ver detalle" (click)="showDetail(disability)">
                        <i class="fa fa-eye"></i>
                      </button>
                      <button *ngIf="disability.status === 'active'" class="btn btn-outline-info"
                        title="Extender" (click)="showExtendModal(disability)">
                        <i class="fa fa-calendar-plus"></i>
                      </button>
                      <button *ngIf="disability.status === 'active'" class="btn btn-outline-success"
                        title="Completar" (click)="complete(disability)">
                        <i class="fa fa-check"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="disabilities.length === 0 && !loading">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No hay incapacidades registradas
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <div class="modal fade" id="detailDisabilityModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" *ngIf="selectedDisability">
          <div class="modal-header">
            <h5 class="modal-title">Detalle de Incapacidad</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Empleado:</strong> {{selectedDisability.employee?.first_name}} {{selectedDisability.employee?.paternal_surname}}</p>
                <p><strong>Tipo:</strong> {{getTypeLabel(selectedDisability.disability_type)}}</p>
                <p><strong>Folio IMSS:</strong> {{selectedDisability.imss_folio || 'No registrado'}}</p>
                <p><strong>Período:</strong> {{selectedDisability.start_date | date:'dd/MM/yyyy'}} - {{selectedDisability.end_date | date:'dd/MM/yyyy'}}</p>
                <p><strong>Días totales:</strong> {{selectedDisability.total_days}}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Diagnóstico:</strong> {{selectedDisability.diagnosis || 'No especificado'}}</p>
                <p><strong>Unidad médica:</strong> {{selectedDisability.medical_unit || 'No especificado'}}</p>
                <p><strong>Médico:</strong> {{selectedDisability.doctor_name || 'No especificado'}}</p>
                <p><strong>% Pagable:</strong> {{selectedDisability.percentage_payable}}%</p>
                <p><strong>Subsidio total:</strong> {{selectedDisability.total_subsidy | currency:'MXN'}}</p>
              </div>
            </div>
            <div *ngIf="selectedDisability.notes">
              <hr>
              <p><strong>Notas:</strong></p>
              <p class="text-muted">{{selectedDisability.notes}}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Extender -->
    <div class="modal fade" id="extendModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Extender Incapacidad</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nueva fecha de término</label>
              <input type="date" class="form-control" [(ngModel)]="extendData.new_end_date">
            </div>
            <div class="mb-3">
              <label class="form-label">Folio de extensión</label>
              <input type="text" class="form-control" [(ngModel)]="extendData.extension_folio">
            </div>
            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea class="form-control" rows="2" [(ngModel)]="extendData.notes"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" (click)="extend()">Extender</button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class DisabilitiesListComponent implements OnInit {
  disabilities: DisabilityRecord[] = [];
  loading = false;
  activeTab = 'active';
  counts = { active: 0 };

  selectedDisability: DisabilityRecord | null = null;
  extendData = { new_end_date: '', extension_folio: '', notes: '' };

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.loadDisabilities();
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.loadDisabilities();
  }

  loadDisabilities() {
    this.loading = true;

    const request = this.activeTab === 'active'
      ? this.hrService.getActiveDisabilities()
      : this.hrService.getDisabilities({});

    request.subscribe({
      next: (res) => {
        this.disabilities = res.data?.data || res.data || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });

    this.hrService.getActiveDisabilities().subscribe({
      next: (res) => this.counts.active = res.data?.length || 0
    });
  }

  showDetail(disability: DisabilityRecord) {
    this.selectedDisability = disability;
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('detailDisabilityModal')).show();
  }

  showExtendModal(disability: DisabilityRecord) {
    this.selectedDisability = disability;
    this.extendData = { new_end_date: '', extension_folio: '', notes: '' };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('extendModal')).show();
  }

  extend() {
    if (!this.selectedDisability || !this.extendData.new_end_date) return;

    this.hrService.extendDisability(this.selectedDisability.id!, this.extendData).subscribe({
      next: () => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('extendModal'))?.hide();
        this.loadDisabilities();
      }
    });
  }

  complete(disability: DisabilityRecord) {
    if (confirm('¿Marcar esta incapacidad como completada?')) {
      this.hrService.completeDisability(disability.id!).subscribe({
        next: () => this.loadDisabilities()
      });
    }
  }

  getTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'general_illness': 'bg-warning text-dark',
      'work_risk': 'bg-danger',
      'maternity': 'bg-info'
    };
    return classes[type] || 'bg-secondary';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'general_illness': 'Enfermedad General',
      'work_risk': 'Riesgo de Trabajo',
      'maternity': 'Maternidad'
    };
    return labels[type] || type;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-secondary',
      'active': 'bg-success',
      'completed': 'bg-primary',
      'extended': 'bg-info',
      'cancelled': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'active': 'Activa',
      'completed': 'Completada',
      'extended': 'Extendida',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }
}
