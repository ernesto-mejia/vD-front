import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationalStructureService } from '../../../core/services/organizational-structure.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-departments-list',
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
              <h5 class="mb-0"><i class="fas fa-sitemap me-2"></i>Gestión de Departamentos</h5>
              <button class="btn btn-primary btn-sm" (click)="showModal = true; resetForm()">
                <i class="fas fa-plus me-1"></i>Nuevo Departamento
              </button>
            </div>
            <div class="card-body">
              <!-- Filtro por área -->
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Filtrar por Área:</label>
                  <select class="form-select" [(ngModel)]="selectedAreaFilter" (change)="loadDepartments()">
                    <option value="">Todas las áreas</option>
                    <option *ngFor="let area of areas" [value]="area.id">{{ area.area }}</option>
                  </select>
                </div>
              </div>

              <!-- Tabla de departamentos -->
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Área</th>
                      <th>Responsable</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let dept of departments">
                      <td>{{ dept.id }}</td>
                      <td>{{ dept.department }}</td>
                      <td>{{ dept.code || '-' }}</td>
                      <td>{{ dept.area?.area || '-' }}</td>
                      <td>{{ dept.responsible_name || '-' }}</td>
                      <td>
                        <span class="badge" [class.bg-success]="dept.is_active" [class.bg-secondary]="!dept.is_active">
                          {{ dept.is_active ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-1" (click)="editDepartment(dept)" title="Editar">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteDepartment(dept)" title="Eliminar">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="departments.length === 0">
                      <td colspan="7" class="text-center text-muted">No hay departamentos registrados</td>
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

    <!-- Modal para crear/editar departamento -->
    <div class="modal fade show" [class.d-block]="showModal" [style.background]="showModal ? 'rgba(0,0,0,0.5)' : 'none'" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingDepartment ? 'Editar' : 'Nuevo' }} Departamento</h5>
            <button type="button" class="btn-close" (click)="showModal = false"></button>
          </div>
          <form [formGroup]="departmentForm" (ngSubmit)="saveDepartment()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Área *</label>
                <select class="form-select" formControlName="area_id">
                  <option value="">Seleccionar área...</option>
                  <option *ngFor="let area of areas" [value]="area.id">{{ area.area }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-control" formControlName="department" placeholder="Nombre del departamento">
              </div>
              <div class="mb-3">
                <label class="form-label">Código</label>
                <input type="text" class="form-control" formControlName="code" placeholder="Código único (opcional)">
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" formControlName="description" rows="3"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Responsable</label>
                <input type="text" class="form-control" formControlName="responsible_name" placeholder="Nombre del responsable">
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" formControlName="is_active" id="deptActiveCheck">
                <label class="form-check-label" for="deptActiveCheck">Departamento Activo</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="departmentForm.invalid || saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ editingDepartment ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </main>
  `
})
export class DepartmentsListComponent implements OnInit {
  departments: any[] = [];
  areas: any[] = [];
  loading = false;
  saving = false;
  showModal = false;
  editingDepartment: any = null;
  selectedAreaFilter = '';

  departmentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationalStructureService
  ) {
    this.departmentForm = this.fb.group({
      area_id: ['', Validators.required],
      department: ['', Validators.required],
      code: [''],
      description: [''],
      responsible_name: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadAreas();
    this.loadDepartments();
  }

  loadAreas(): void {
    this.orgService.getAreas().subscribe({
      next: (response: any) => {
        this.areas = response.data || response || [];
      },
      error: (err) => console.error('Error cargando áreas:', err)
    });
  }

  loadDepartments(): void {
    this.loading = true;
    const filters = this.selectedAreaFilter ? { area_id: parseInt(this.selectedAreaFilter) } : undefined;

    this.orgService.getDepartments(filters).subscribe({
      next: (response: any) => {
        this.departments = response.data || response || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.editingDepartment = null;
    this.departmentForm.reset({ is_active: true });
  }

  editDepartment(dept: any): void {
    this.editingDepartment = dept;
    this.departmentForm.patchValue({
      area_id: dept.area_id,
      department: dept.department,
      code: dept.code,
      description: dept.description,
      responsible_name: dept.responsible_name,
      is_active: dept.is_active
    });
    this.showModal = true;
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) return;

    this.saving = true;
    const data = this.departmentForm.value;

    const request = this.editingDepartment
      ? this.orgService.updateDepartment(this.editingDepartment.id, data)
      : this.orgService.createDepartment(data);

    request.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.loadDepartments();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error guardando departamento:', err);
        this.saving = false;
        alert('Error al guardar el departamento');
      }
    });
  }

  deleteDepartment(dept: any): void {
    if (!confirm(`¿Está seguro de eliminar el departamento "${dept.department}"?`)) return;

    this.orgService.deleteDepartment(dept.id).subscribe({
      next: () => this.loadDepartments(),
      error: (err) => {
        console.error('Error eliminando departamento:', err);
        alert('Error al eliminar el departamento');
      }
    });
  }
}
