import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationalStructureService } from '../../../core/services/organizational-structure.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-job-positions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  template: `
    <div>
      <app-sidebar></app-sidebar>
    </div>
    <main id="content" class="container-fluid mt-4">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-id-badge me-2"></i>Gestión de Puestos de Trabajo</h5>
              <button class="btn btn-primary btn-sm" (click)="showModal = true; resetForm()">
                <i class="fas fa-plus me-1"></i>Nuevo Puesto
              </button>
            </div>
            <div class="card-body">
              <!-- Filtros -->
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Filtrar por Departamento:</label>
                  <select class="form-select" [(ngModel)]="selectedDeptFilter" (change)="loadJobPositions()">
                    <option value="">Todos los departamentos</option>
                    <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.department }}</option>
                  </select>
                </div>
              </div>

              <!-- Tabla de puestos -->
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Departamento</th>
                      <th>Nivel</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let pos of jobPositions">
                      <td>{{ pos.id }}</td>
                      <td>{{ pos.job_position }}</td>
                      <td>{{ pos.code || '-' }}</td>
                      <td>{{ pos.department?.department || '-' }}</td>
                      <td>{{ pos.level || '-' }}</td>
                      <td>
                        <span class="badge" [class.bg-success]="pos.is_active" [class.bg-secondary]="!pos.is_active">
                          {{ pos.is_active ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-1" (click)="editPosition(pos)" title="Editar">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deletePosition(pos)" title="Eliminar">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="jobPositions.length === 0">
                      <td colspan="7" class="text-center text-muted">No hay puestos registrados</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div *ngIf="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Modal para crear/editar puesto -->
    <div class="modal fade show" [class.d-block]="showModal" [style.background]="showModal ? 'rgba(0,0,0,0.5)' : 'none'" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingPosition ? 'Editar' : 'Nuevo' }} Puesto de Trabajo</h5>
            <button type="button" class="btn-close" (click)="showModal = false"></button>
          </div>
          <form [formGroup]="positionForm" (ngSubmit)="savePosition()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Departamento *</label>
                <select class="form-select" formControlName="department_id">
                  <option value="">Seleccionar departamento...</option>
                  <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.department }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Nombre del Puesto *</label>
                <input type="text" class="form-control" formControlName="job_position" placeholder="Ej: Gerente de Operaciones">
              </div>
              <div class="mb-3">
                <label class="form-label">Código</label>
                <input type="text" class="form-control" formControlName="code" placeholder="Código único (opcional)">
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" formControlName="description" rows="3" placeholder="Descripción del puesto"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Nivel Jerárquico</label>
                <input type="number" class="form-control" formControlName="level" min="1" max="10" placeholder="1-10">
                <small class="text-muted">1 = más alto, 10 = más bajo</small>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" formControlName="is_active" id="posActiveCheck">
                <label class="form-check-label" for="posActiveCheck">Puesto Activo</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="positionForm.invalid || saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ editingPosition ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </main>
  `
})
export class JobPositionsListComponent implements OnInit {
  jobPositions: any[] = [];
  departments: any[] = [];
  loading = false;
  saving = false;
  showModal = false;
  editingPosition: any = null;
  selectedDeptFilter = '';

  positionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationalStructureService
  ) {
    this.positionForm = this.fb.group({
      department_id: ['', Validators.required],
      job_position: ['', Validators.required],
      code: [''],
      description: [''],
      level: [5],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadJobPositions();
  }

  loadDepartments(): void {
    this.orgService.getDepartments().subscribe({
      next: (response: any) => {
        this.departments = response.data || response || [];
      },
      error: (err) => console.error('Error cargando departamentos:', err)
    });
  }

  loadJobPositions(): void {
    this.loading = true;
    const filters = this.selectedDeptFilter ? { department_id: parseInt(this.selectedDeptFilter) } : undefined;

    this.orgService.getJobPositions(filters).subscribe({
      next: (response: any) => {
        this.jobPositions = response.data || response || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando puestos:', err);
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.editingPosition = null;
    this.positionForm.reset({ is_active: true, level: 5 });
  }

  editPosition(pos: any): void {
    this.editingPosition = pos;
    this.positionForm.patchValue({
      department_id: pos.department_id,
      job_position: pos.job_position,
      code: pos.code,
      description: pos.description,
      level: pos.level,
      is_active: pos.is_active
    });
    this.showModal = true;
  }

  savePosition(): void {
    if (this.positionForm.invalid) return;

    this.saving = true;
    const data = this.positionForm.value;

    const request = this.editingPosition
      ? this.orgService.updateJobPosition(this.editingPosition.id, data)
      : this.orgService.createJobPosition(data);

    request.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.loadJobPositions();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error guardando puesto:', err);
        this.saving = false;
        alert('Error al guardar el puesto');
      }
    });
  }

  deletePosition(pos: any): void {
    if (!confirm(`¿Está seguro de eliminar el puesto "${pos.job_position}"?`)) return;

    this.orgService.deleteJobPosition(pos.id).subscribe({
      next: () => this.loadJobPositions(),
      error: (err) => {
        console.error('Error eliminando puesto:', err);
        alert('Error al eliminar el puesto');
      }
    });
  }
}
