import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12 d-flex justify-content-between align-items-center">
          <h4><i class="fa fa-users me-2"></i>Empleados</h4>
          <a routerLink="new" class="btn btn-primary">
            <i class="fa fa-plus me-1"></i> Nuevo Empleado
          </a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-3">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-3">
              <input type="text" class="form-control" placeholder="Buscar..."
                [(ngModel)]="filters.search" (input)="loadEmployees()">
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.department_id" (change)="loadEmployees()">
                <option value="">Todos los departamentos</option>
                <option *ngFor="let dept of departments" [value]="dept.id">{{dept.name}}</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.status" (change)="loadEmployees()">
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="on_leave">Con Permiso</option>
                <option value="terminated">Dados de Baja</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" [(ngModel)]="filters.contract_type" (change)="loadEmployees()">
                <option value="">Tipo de Contrato</option>
                <option value="01">Indefinido</option>
                <option value="02">Por Obra</option>
                <option value="03">Por Tiempo</option>
                <option value="04">Por Temporada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body text-center py-2">
              <h4 class="mb-0">{{stats.active}}</h4>
              <small>Activos</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body text-center py-2">
              <h4 class="mb-0">{{stats.onLeave}}</h4>
              <small>Con Permiso</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body text-center py-2">
              <h4 class="mb-0">{{stats.newThisMonth}}</h4>
              <small>Nuevos este mes</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-danger text-white">
            <div class="card-body text-center py-2">
              <h4 class="mb-0">{{stats.terminated}}</h4>
              <small>Bajas este mes</small>
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
                  <th>No. Empleado</th>
                  <th>Nombre Completo</th>
                  <th>RFC</th>
                  <th>Departamento</th>
                  <th>Puesto</th>
                  <th>Fecha Ingreso</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let emp of employees">
                  <td><strong>{{emp.employee_number}}</strong></td>
                  <td>
                    {{emp.first_name}} {{emp.paternal_surname}} {{emp.maternal_surname}}
                    <br>
                    <small class="text-muted">{{emp.email}}</small>
                  </td>
                  <td>{{emp.rfc || '-'}}</td>
                  <td>{{emp.department?.name || '-'}}</td>
                  <td>{{emp.job_position?.name || '-'}}</td>
                  <td>{{emp.hire_date | date:'dd/MM/yyyy'}}</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusClass(emp.status)">
                      {{getStatusLabel(emp.status)}}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <a [routerLink]="[emp.id]" class="btn btn-outline-primary" title="Ver/Editar">
                        <i class="fa fa-edit"></i>
                      </a>
                      <a [routerLink]="[emp.id, 'fiscal-data']" class="btn btn-outline-info" title="Datos Fiscales">
                        <i class="fa fa-file-invoice"></i>
                      </a>
                      <button *ngIf="emp.status === 'active'" class="btn btn-outline-danger"
                        title="Dar de Baja" (click)="showTerminateModal(emp)">
                        <i class="fa fa-user-minus"></i>
                      </button>
                      <button *ngIf="emp.status === 'inactive'" class="btn btn-outline-success"
                        title="Reactivar" (click)="reactivate(emp)">
                        <i class="fa fa-user-plus"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="employees.length === 0 && !loading">
                  <td colspan="8" class="text-center py-4 text-muted">
                    No hay empleados registrados
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card-footer d-flex justify-content-between align-items-center">
          <span class="text-muted">Mostrando {{employees.length}} de {{pagination.total}} empleados</span>
          <nav>
            <ul class="pagination pagination-sm mb-0">
              <li class="page-item" [class.disabled]="pagination.current_page === 1">
                <a class="page-link" (click)="goToPage(pagination.current_page - 1)">Anterior</a>
              </li>
              <li class="page-item" *ngFor="let page of getPages()" [class.active]="page === pagination.current_page">
                <a class="page-link" (click)="goToPage(page)">{{page}}</a>
              </li>
              <li class="page-item" [class.disabled]="pagination.current_page === pagination.last_page">
                <a class="page-link" (click)="goToPage(pagination.current_page + 1)">Siguiente</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal Dar de Baja -->
    <div class="modal fade" id="terminateModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Dar de Baja a Empleado</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" *ngIf="selectedEmployee">
            <div class="alert alert-warning">
              <i class="fa fa-exclamation-triangle me-2"></i>
              <strong>Atención:</strong> Esta acción dará de baja al empleado
              <strong>{{selectedEmployee.first_name}} {{selectedEmployee.paternal_surname}}</strong>
            </div>
            <div class="mb-3">
              <label class="form-label">Fecha de Baja</label>
              <input type="date" class="form-control" [(ngModel)]="terminateData.termination_date">
            </div>
            <div class="mb-3">
              <label class="form-label">Motivo de Baja</label>
              <select class="form-select" [(ngModel)]="terminateData.termination_reason">
                <option value="">Seleccionar...</option>
                <option value="voluntary_resignation">Renuncia Voluntaria</option>
                <option value="dismissal_justified">Despido Justificado</option>
                <option value="dismissal_unjustified">Despido Injustificado</option>
                <option value="contract_end">Término de Contrato</option>
                <option value="retirement">Jubilación</option>
                <option value="death">Fallecimiento</option>
                <option value="disability">Incapacidad Permanente</option>
                <option value="mutual_agreement">Mutuo Acuerdo</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea class="form-control" [(ngModel)]="terminateData.notes" rows="2"></textarea>
            </div>
            <div class="form-check">
              <input type="checkbox" class="form-check-input" [(ngModel)]="terminateData.calculate_settlement" id="calcSettlement">
              <label class="form-check-label" for="calcSettlement">
                Calcular finiquito/liquidación
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="terminate()">
              <i class="fa fa-user-minus me-1"></i> Dar de Baja
            </button>
          </div>
        </div>
      </div>
    </div>
    </main>
  `
})
export class EmployeesListComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  loading = false;

  filters = {
    search: '',
    department_id: '',
    status: '',
    contract_type: ''
  };

  stats = {
    active: 0,
    onLeave: 0,
    newThisMonth: 0,
    terminated: 0
  };

  pagination = {
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15
  };

  selectedEmployee: any = null;
  terminateData = {
    termination_date: '',
    termination_reason: '',
    notes: '',
    calculate_settlement: true
  };

  constructor(private hrService: HumanResourcesService) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadDepartments();
    this.loadStats();
  }

  loadEmployees() {
    this.loading = true;
    const params = {
      ...this.filters,
      page: this.pagination.current_page,
      per_page: this.pagination.per_page
    };

    this.hrService.getEmployees(params).subscribe({
      next: (res) => {
        this.employees = res.data?.data || res.data || [];
        if (res.data?.meta) {
          this.pagination = {
            current_page: res.data.meta.current_page,
            last_page: res.data.meta.last_page,
            total: res.data.meta.total,
            per_page: res.data.meta.per_page
          };
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadDepartments() {
    this.hrService.getDepartments().subscribe({
      next: (res) => this.departments = res.data?.data || res.data || []
    });
  }

  loadStats() {
    this.hrService.getEmployeeStats().subscribe({
      next: (res) => {
        this.stats = res.data || this.stats;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.pagination.last_page) return;
    this.pagination.current_page = page;
    this.loadEmployees();
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.pagination.current_page - 2);
    const end = Math.min(this.pagination.last_page, this.pagination.current_page + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  showTerminateModal(employee: any) {
    this.selectedEmployee = employee;
    this.terminateData = {
      termination_date: new Date().toISOString().split('T')[0],
      termination_reason: '',
      notes: '',
      calculate_settlement: true
    };
    // @ts-ignore
    new bootstrap.Modal(document.getElementById('terminateModal')).show();
  }

  terminate() {
    if (!this.selectedEmployee || !this.terminateData.termination_reason) {
      alert('Seleccione el motivo de baja');
      return;
    }

    this.hrService.terminateEmployee(this.selectedEmployee.id, this.terminateData).subscribe({
      next: (res) => {
        // @ts-ignore
        bootstrap.Modal.getInstance(document.getElementById('terminateModal'))?.hide();
        this.loadEmployees();
        this.loadStats();

        if (res.data?.settlement) {
          alert(`Empleado dado de baja. Finiquito calculado: ${res.data.settlement.total}`);
        }
      }
    });
  }

  reactivate(employee: any) {
    if (confirm(`¿Reactivar al empleado ${employee.first_name} ${employee.paternal_surname}?`)) {
      this.hrService.reactivateEmployee(employee.id).subscribe({
        next: () => {
          this.loadEmployees();
          this.loadStats();
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'active': 'bg-success',
      'inactive': 'bg-secondary',
      'on_leave': 'bg-warning text-dark',
      'terminated': 'bg-danger',
      'suspended': 'bg-dark'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Activo',
      'inactive': 'Inactivo',
      'on_leave': 'Con Permiso',
      'terminated': 'Baja',
      'suspended': 'Suspendido'
    };
    return labels[status] || status;
  }
}
