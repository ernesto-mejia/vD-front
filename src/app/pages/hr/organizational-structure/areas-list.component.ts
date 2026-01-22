import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationalStructureService, Area, Department, JobPosition } from '../../../core/services/organizational-structure.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-areas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  template: `
    <div>
      <app-sidebar></app-sidebar>
    </div>
    <main id="content" class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-1">
            <i class="fas fa-sitemap me-2"></i>
            Estructura Organizacional
          </h4>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item"><a href="#">RRHH</a></li>
              <li class="breadcrumb-item active">Áreas y Departamentos</li>
            </ol>
          </nav>
        </div>
        <button class="btn btn-primary" (click)="openAreaModal()">
          <i class="fas fa-plus me-2"></i>Nueva Área
        </button>
      </div>

      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Buscar</label>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar área..."
                [(ngModel)]="searchTerm"
                (input)="filterAreas()">
            </div>
            <div class="col-md-3">
              <label class="form-label">Estado</label>
              <select class="form-select" [(ngModel)]="statusFilter" (change)="filterAreas()">
                <option value="all">Todos</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Puede recibir compras</label>
              <select class="form-select" [(ngModel)]="purchaseFilter" (change)="filterAreas()">
                <option value="all">Todos</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      }

      <!-- Lista de Áreas (Acordeón) -->
      @if (!loading()) {
        <div class="accordion" id="areasAccordion">
          @for (area of filteredAreas(); track area.id) {
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button
                  class="accordion-button"
                  [class.collapsed]="!expandedAreas.has(area.id)"
                  type="button"
                  (click)="toggleArea(area.id)">
                  <div class="d-flex align-items-center w-100">
                    <span class="badge me-2" [class.bg-success]="area.is_active" [class.bg-secondary]="!area.is_active">
                      {{ area.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                    <strong class="me-2">{{ area.area }}</strong>
                    @if (area.code) {
                      <span class="text-muted">({{ area.code }})</span>
                    }
                    <div class="ms-auto me-3 d-flex gap-2">
                      @if (area.can_receive_purchase_requests) {
                        <span class="badge bg-info" title="Puede recibir solicitudes de compra">
                          <i class="fas fa-shopping-cart"></i>
                        </span>
                      }
                      @if (area.approval_required_for_purchases) {
                        <span class="badge bg-warning text-dark" title="Requiere aprobación para compras">
                          <i class="fas fa-check-double"></i>
                        </span>
                      }
                      <span class="badge bg-secondary">
                        {{ area.departments?.length || 0 }} departamentos
                      </span>
                    </div>
                  </div>
                </button>
              </h2>
              <div
                class="accordion-collapse collapse"
                [class.show]="expandedAreas.has(area.id)">
                <div class="accordion-body">
                  <!-- Acciones del área -->
                  <div class="d-flex justify-content-end mb-3">
                    <button class="btn btn-sm btn-outline-primary me-2" (click)="openAreaModal(area)">
                      <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-success me-2" (click)="openDepartmentModal(area.id)">
                      <i class="fas fa-plus"></i> Agregar Departamento
                    </button>
                    <button class="btn btn-sm btn-outline-info me-2" (click)="openAuthorizersModal(area)">
                      <i class="fas fa-user-shield"></i> Autorizadores
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      (click)="confirmDeleteArea(area)"
                      [disabled]="area.departments && area.departments.length > 0">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>

                  <!-- Descripción -->
                  @if (area.description) {
                    <p class="text-muted mb-3">{{ area.description }}</p>
                  }

                  <!-- Tabla de Departamentos -->
                  @if (area.departments && area.departments.length > 0) {
                    <div class="table-responsive">
                      <table class="table table-hover table-sm">
                        <thead class="table-light">
                          <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Centro de Costo</th>
                            <th>Estado</th>
                            <th>Puestos</th>
                            <th class="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (dept of area.departments; track dept.id) {
                            <tr>
                              <td>{{ dept.code || '-' }}</td>
                              <td>{{ dept.department }}</td>
                              <td>{{ dept.budget_center || '-' }}</td>
                              <td>
                                <span class="badge" [class.bg-success]="dept.is_active" [class.bg-secondary]="!dept.is_active">
                                  {{ dept.is_active ? 'Activo' : 'Inactivo' }}
                                </span>
                              </td>
                              <td>
                                <span class="badge bg-info">
                                  {{ dept.jobPositions?.length || 0 }}
                                </span>
                              </td>
                              <td class="text-end">
                                <button class="btn btn-sm btn-link" (click)="openDepartmentModal(area.id, dept)">
                                  <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-link text-success" (click)="openPositionModal(dept.id)">
                                  <i class="fas fa-plus"></i>
                                </button>
                                <button
                                  class="btn btn-sm btn-link text-danger"
                                  (click)="confirmDeleteDepartment(dept)"
                                  [disabled]="dept.jobPositions && dept.jobPositions.length > 0">
                                  <i class="fas fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                            <!-- Puestos del departamento -->
                            @if (dept.jobPositions && dept.jobPositions.length > 0) {
                              <tr>
                                <td colspan="6" class="p-0">
                                  <div class="bg-light p-2 ps-5">
                                    <small class="text-muted">Puestos:</small>
                                    <div class="d-flex flex-wrap gap-2 mt-1">
                                      @for (pos of dept.jobPositions; track pos.id) {
                                        <span
                                          class="badge"
                                          [class.bg-primary]="pos.is_active"
                                          [class.bg-secondary]="!pos.is_active"
                                          [title]="getPositionTooltip(pos)"
                                          style="cursor: pointer;"
                                          (click)="openPositionModal(dept.id, pos)">
                                          @if (pos.is_supervisor) {
                                            <i class="fas fa-star me-1"></i>
                                          }
                                          @if (pos.can_authorize_purchases) {
                                            <i class="fas fa-check-circle me-1"></i>
                                          }
                                          {{ pos.job_position }}
                                        </span>
                                      }
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            }
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <div class="alert alert-info mb-0">
                      <i class="fas fa-info-circle me-2"></i>
                      No hay departamentos en esta área.
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        @if (filteredAreas().length === 0) {
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            No se encontraron áreas con los filtros seleccionados.
          </div>
        }
      }

    <!-- Modal Área -->
    @if (showAreaModal) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ editingArea ? 'Editar Área' : 'Nueva Área' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeAreaModal()"></button>
            </div>
            <form [formGroup]="areaForm" (ngSubmit)="saveArea()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre *</label>
                  <input type="text" class="form-control" formControlName="area">
                </div>
                <div class="mb-3">
                  <label class="form-label">Código</label>
                  <input type="text" class="form-control" formControlName="code" maxlength="20">
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" formControlName="description" rows="3"></textarea>
                </div>
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="is_active" id="areaActive">
                      <label class="form-check-label" for="areaActive">Activo</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="can_receive_purchase_requests" id="areaReceivePurchases">
                      <label class="form-check-label" for="areaReceivePurchases">Puede recibir compras</label>
                    </div>
                  </div>
                </div>
                <div class="form-check mb-2">
                  <input type="checkbox" class="form-check-input" formControlName="approval_required_for_purchases" id="areaApproval">
                  <label class="form-check-label" for="areaApproval">Requiere aprobación para compras</label>
                </div>
                <div class="mb-3">
                  <label class="form-label">Orden de visualización</label>
                  <input type="number" class="form-control" formControlName="display_order" min="0">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeAreaModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="areaForm.invalid || saving()">
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Modal Departamento -->
    @if (showDepartmentModal) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeDepartmentModal()"></button>
            </div>
            <form [formGroup]="departmentForm" (ngSubmit)="saveDepartment()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre *</label>
                  <input type="text" class="form-control" formControlName="department">
                </div>
                <div class="mb-3">
                  <label class="form-label">Código</label>
                  <input type="text" class="form-control" formControlName="code" maxlength="20">
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" formControlName="description" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Centro de costo</label>
                  <input type="text" class="form-control" formControlName="budget_center" maxlength="50">
                </div>
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="is_active" id="deptActive">
                      <label class="form-check-label" for="deptActive">Activo</label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="can_create_purchase_requests" id="deptCreatePurchases">
                      <label class="form-check-label" for="deptCreatePurchases">Puede crear compras</label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeDepartmentModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="departmentForm.invalid || saving()">
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Modal Puesto -->
    @if (showPositionModal) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ editingPosition ? 'Editar Puesto' : 'Nuevo Puesto' }}
              </h5>
              <button type="button" class="btn-close" (click)="closePositionModal()"></button>
            </div>
            <form [formGroup]="positionForm" (ngSubmit)="savePosition()">
              <div class="modal-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Nombre *</label>
                    <input type="text" class="form-control" formControlName="job_position">
                  </div>
                  <div class="col-md-3 mb-3">
                    <label class="form-label">Código</label>
                    <input type="text" class="form-control" formControlName="code" maxlength="20">
                  </div>
                  <div class="col-md-3 mb-3">
                    <label class="form-label">Nivel</label>
                    <input type="number" class="form-control" formControlName="level" min="1" max="10">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" formControlName="description" rows="2"></textarea>
                </div>
                <div class="row">
                  <div class="col-md-4">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="is_active" id="posActive">
                      <label class="form-check-label" for="posActive">Activo</label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="is_supervisor" id="posSupervisor">
                      <label class="form-check-label" for="posSupervisor">Es supervisor</label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-check mb-2">
                      <input type="checkbox" class="form-check-input" formControlName="can_authorize_purchases" id="posAuthorize">
                      <label class="form-check-label" for="posAuthorize">Puede autorizar compras</label>
                    </div>
                  </div>
                </div>
                @if (positionForm.get('can_authorize_purchases')?.value) {
                  <div class="card bg-light mt-3">
                    <div class="card-body">
                      <h6 class="card-title">Configuración de autorización</h6>
                      <div class="row">
                        <div class="col-md-4 mb-3">
                          <label class="form-label">Monto máximo</label>
                          <input type="number" class="form-control" formControlName="max_purchase_amount" min="0" step="0.01">
                          <small class="text-muted">Dejar vacío para sin límite</small>
                        </div>
                        <div class="col-md-4">
                          <div class="form-check mb-2 mt-4">
                            <input type="checkbox" class="form-check-input" formControlName="can_pre_authorize" id="posPreAuth">
                            <label class="form-check-label" for="posPreAuth">Pre-autorización</label>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="form-check mb-2 mt-4">
                            <input type="checkbox" class="form-check-input" formControlName="can_final_authorize" id="posFinalAuth">
                            <label class="form-check-label" for="posFinalAuth">Autorización final</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closePositionModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="positionForm.invalid || saving()">
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
    </main>
  `
})
export class AreasListComponent implements OnInit {
  private orgService = inject(OrganizationalStructureService);
  private fb = inject(FormBuilder);

  // Estado
  loading = signal(false);
  saving = signal(false);
  areas = signal<Area[]>([]);
  filteredAreas = signal<Area[]>([]);
  expandedAreas = new Set<number>();

  // Filtros
  searchTerm = '';
  statusFilter = 'all';
  purchaseFilter = 'all';

  // Modales
  showAreaModal = false;
  showDepartmentModal = false;
  showPositionModal = false;
  editingArea: Area | null = null;
  editingDepartment: Department | null = null;
  editingPosition: JobPosition | null = null;
  currentAreaId: number | null = null;
  currentDepartmentId: number | null = null;

  // Formularios
  areaForm!: FormGroup;
  departmentForm!: FormGroup;
  positionForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.loadAreas();
  }

  initForms() {
    this.areaForm = this.fb.group({
      area: ['', [Validators.required, Validators.maxLength(150)]],
      code: ['', Validators.maxLength(20)],
      description: ['', Validators.maxLength(500)],
      is_active: [true],
      can_receive_purchase_requests: [true],
      approval_required_for_purchases: [false],
      display_order: [null]
    });

    this.departmentForm = this.fb.group({
      department: ['', [Validators.required, Validators.maxLength(150)]],
      code: ['', Validators.maxLength(20)],
      description: ['', Validators.maxLength(500)],
      budget_center: ['', Validators.maxLength(50)],
      is_active: [true],
      can_create_purchase_requests: [true],
      display_order: [null]
    });

    this.positionForm = this.fb.group({
      job_position: ['', [Validators.required, Validators.maxLength(150)]],
      code: ['', Validators.maxLength(20)],
      description: ['', Validators.maxLength(500)],
      level: [null],
      is_supervisor: [false],
      is_active: [true],
      can_authorize_purchases: [false],
      max_purchase_amount: [null],
      can_pre_authorize: [false],
      can_final_authorize: [false],
      display_order: [null]
    });
  }

  loadAreas() {
    this.loading.set(true);
    this.orgService.getHierarchy().subscribe({
      next: (response) => {
        this.areas.set(response.data);
        this.filterAreas();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando áreas:', error);
        this.loading.set(false);
      }
    });
  }

  filterAreas() {
    let filtered = this.areas();

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.area.toLowerCase().includes(term) ||
        (a.code && a.code.toLowerCase().includes(term))
      );
    }

    // Filtro por estado
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(a => a.is_active);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(a => !a.is_active);
    }

    // Filtro por compras
    if (this.purchaseFilter === 'yes') {
      filtered = filtered.filter(a => a.can_receive_purchase_requests);
    } else if (this.purchaseFilter === 'no') {
      filtered = filtered.filter(a => !a.can_receive_purchase_requests);
    }

    this.filteredAreas.set(filtered);
  }

  toggleArea(areaId: number) {
    if (this.expandedAreas.has(areaId)) {
      this.expandedAreas.delete(areaId);
    } else {
      this.expandedAreas.add(areaId);
    }
  }

  // ==================== ÁREA ====================

  openAreaModal(area?: Area) {
    this.editingArea = area || null;
    if (area) {
      this.areaForm.patchValue(area);
    } else {
      this.areaForm.reset({
        is_active: true,
        can_receive_purchase_requests: true,
        approval_required_for_purchases: false
      });
    }
    this.showAreaModal = true;
  }

  closeAreaModal() {
    this.showAreaModal = false;
    this.editingArea = null;
    this.areaForm.reset();
  }

  saveArea() {
    if (this.areaForm.invalid) return;

    this.saving.set(true);
    const data = this.areaForm.value;

    const request = this.editingArea
      ? this.orgService.updateArea(this.editingArea.id, data)
      : this.orgService.createArea(data);

    request.subscribe({
      next: () => {
        this.closeAreaModal();
        this.loadAreas();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error guardando área:', error);
        this.saving.set(false);
      }
    });
  }

  confirmDeleteArea(area: Area) {
    if (confirm(`¿Está seguro de eliminar el área "${area.area}"?`)) {
      this.orgService.deleteArea(area.id).subscribe({
        next: () => this.loadAreas(),
        error: (error) => console.error('Error eliminando área:', error)
      });
    }
  }

  // ==================== DEPARTAMENTO ====================

  openDepartmentModal(areaId: number, department?: Department) {
    this.currentAreaId = areaId;
    this.editingDepartment = department || null;
    if (department) {
      this.departmentForm.patchValue(department);
    } else {
      this.departmentForm.reset({
        is_active: true,
        can_create_purchase_requests: true
      });
    }
    this.showDepartmentModal = true;
  }

  closeDepartmentModal() {
    this.showDepartmentModal = false;
    this.editingDepartment = null;
    this.currentAreaId = null;
    this.departmentForm.reset();
  }

  saveDepartment() {
    if (this.departmentForm.invalid || !this.currentAreaId) return;

    this.saving.set(true);
    const data = { ...this.departmentForm.value, area_id: this.currentAreaId };

    const request = this.editingDepartment
      ? this.orgService.updateDepartment(this.editingDepartment.id, data)
      : this.orgService.createDepartment(data);

    request.subscribe({
      next: () => {
        this.closeDepartmentModal();
        this.loadAreas();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error guardando departamento:', error);
        this.saving.set(false);
      }
    });
  }

  confirmDeleteDepartment(department: Department) {
    if (confirm(`¿Está seguro de eliminar el departamento "${department.department}"?`)) {
      this.orgService.deleteDepartment(department.id).subscribe({
        next: () => this.loadAreas(),
        error: (error) => console.error('Error eliminando departamento:', error)
      });
    }
  }

  // ==================== PUESTO ====================

  openPositionModal(departmentId: number, position?: JobPosition) {
    this.currentDepartmentId = departmentId;
    this.editingPosition = position || null;
    if (position) {
      this.positionForm.patchValue(position);
    } else {
      this.positionForm.reset({
        job_position: '',
        code: '',
        description: '',
        level: null,
        is_active: true,
        is_supervisor: false,
        can_authorize_purchases: false,
        max_purchase_amount: null,
        can_pre_authorize: false,
        can_final_authorize: false,
        display_order: null
      });
    }
    this.showPositionModal = true;
  }

  closePositionModal() {
    this.showPositionModal = false;
    this.editingPosition = null;
    this.currentDepartmentId = null;
    this.positionForm.reset();
  }

  savePosition() {
    if (this.positionForm.invalid || !this.currentDepartmentId) return;

    this.saving.set(true);
    const data = { ...this.positionForm.value, department_id: this.currentDepartmentId };

    const request = this.editingPosition
      ? this.orgService.updateJobPosition(this.editingPosition.id, data)
      : this.orgService.createJobPosition(data);

    request.subscribe({
      next: () => {
        this.closePositionModal();
        this.loadAreas();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error guardando puesto:', error);
        this.saving.set(false);
      }
    });
  }

  openAuthorizersModal(area: Area) {
    // TODO: Implementar modal de autorizadores
    console.log('Abrir autorizadores para área:', area);
    alert('Funcionalidad de autorizadores próximamente');
  }

  getPositionTooltip(position: JobPosition): string {
    const parts = [];
    if (position.is_supervisor) parts.push('Supervisor');
    if (position.can_authorize_purchases) {
      let auth = 'Puede autorizar';
      if (position.max_purchase_amount) {
        auth += ` hasta $${position.max_purchase_amount.toLocaleString()}`;
      }
      parts.push(auth);
    }
    if (position.description) parts.push(position.description);
    return parts.join(' | ') || position.job_position;
  }
}
