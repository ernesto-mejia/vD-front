import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  OrganizationalStructureService,
  UserEmployeeLink,
  Employee,
  User
} from '../../../core/services/organizational-structure.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-user-employee-links',
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
            <i class="fas fa-link me-2"></i>
            Vínculos Usuario-Empleado
          </h4>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item"><a href="#">RRHH</a></li>
              <li class="breadcrumb-item active">Vínculos</li>
            </ol>
          </nav>
        </div>
        <button class="btn btn-primary" (click)="openLinkModal()">
          <i class="fas fa-plus me-2"></i>Nuevo Vínculo
        </button>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card text-bg-primary">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Vínculos Activos</h6>
                  <h2>{{ activeLinks().length }}</h2>
                </div>
                <i class="fas fa-link fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-bg-warning">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Usuarios sin Empleado</h6>
                  <h2>{{ usersWithoutEmployee().length }}</h2>
                </div>
                <i class="fas fa-user-slash fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-bg-info">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Empleados sin Usuario</h6>
                  <h2>{{ employeesWithoutUser().length }}</h2>
                </div>
                <i class="fas fa-user-plus fa-2x opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button
            class="nav-link"
            [class.active]="activeTab === 'links'"
            (click)="activeTab = 'links'">
            <i class="fas fa-link me-1"></i>
            Vínculos Activos
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link"
            [class.active]="activeTab === 'users'"
            (click)="activeTab = 'users'; loadUsersWithoutEmployee()">
            <i class="fas fa-user-slash me-1"></i>
            Usuarios sin Empleado
            @if (usersWithoutEmployee().length > 0) {
              <span class="badge bg-warning ms-1">{{ usersWithoutEmployee().length }}</span>
            }
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link"
            [class.active]="activeTab === 'employees'"
            (click)="activeTab = 'employees'; loadEmployeesWithoutUser()">
            <i class="fas fa-user-plus me-1"></i>
            Empleados sin Usuario
            @if (employeesWithoutUser().length > 0) {
              <span class="badge bg-info ms-1">{{ employeesWithoutUser().length }}</span>
            }
          </button>
        </li>
      </ul>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      }

      <!-- Tab: Vínculos Activos -->
      @if (!loading() && activeTab === 'links') {
        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Empleado</th>
                  <th>Área</th>
                  <th>Departamento</th>
                  <th>Puesto</th>
                  <th>Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (link of activeLinks(); track link.id) {
                  <tr>
                    <td>
                      <strong>{{ link.user?.user_name }}</strong>
                      @if (link.is_primary) {
                        <span class="badge bg-primary ms-1">Principal</span>
                      }
                    </td>
                    <td>{{ link.user?.email }}</td>
                    <td>{{ link.employee?.employee_number || 'Sin número' }}</td>
                    <td>{{ link.employee?.area?.area || '-' }}</td>
                    <td>{{ link.employee?.department?.department || '-' }}</td>
                    <td>{{ link.employee?.jobPosition?.job_position || '-' }}</td>
                    <td>
                      <span class="badge" [class.bg-success]="link.is_active" [class.bg-secondary]="!link.is_active">
                        {{ link.is_active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-link" (click)="editLink(link)" title="Editar">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-sm btn-link text-danger" (click)="confirmDeleteLink(link)" title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                      <i class="fas fa-link fa-2x mb-2 d-block"></i>
                      No hay vínculos registrados
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab: Usuarios sin Empleado -->
      @if (!loading() && activeTab === 'users') {
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="fas fa-user-slash me-2"></i>
              Usuarios del sistema que no tienen empleado vinculado
            </h6>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th class="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (user of usersWithoutEmployee(); track user.id) {
                  <tr>
                    <td><strong>{{ user.user_name }}</strong></td>
                    <td>{{ user.email }}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" (click)="openQuickLinkModal(user, null)">
                        <i class="fas fa-link me-1"></i>Vincular
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="text-center py-4 text-muted">
                      <i class="fas fa-check-circle fa-2x mb-2 d-block text-success"></i>
                      Todos los usuarios tienen empleado vinculado
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Tab: Empleados sin Usuario -->
      @if (!loading() && activeTab === 'employees') {
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="fas fa-user-plus me-2"></i>
              Empleados que no tienen usuario del sistema vinculado
            </h6>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>No. Empleado</th>
                  <th>Área</th>
                  <th>Departamento</th>
                  <th>Puesto</th>
                  <th class="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (employee of employeesWithoutUser(); track employee.id) {
                  <tr>
                    <td><strong>{{ employee.employee_number || 'Sin número' }}</strong></td>
                    <td>{{ employee.area?.area || '-' }}</td>
                    <td>{{ employee.department?.department || '-' }}</td>
                    <td>{{ employee.jobPosition?.job_position || '-' }}</td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-primary" (click)="openQuickLinkModal(null, employee)">
                        <i class="fas fa-link me-1"></i>Vincular
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                      <i class="fas fa-check-circle fa-2x mb-2 d-block text-success"></i>
                      Todos los empleados tienen usuario vinculado
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    <!-- Modal de Vínculo -->
    @if (showLinkModal) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isEditing ? 'Editar Vínculo' : 'Nuevo Vínculo' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeLinkModal()"></button>
            </div>
            <form [formGroup]="linkForm" (ngSubmit)="saveLink()">
              <div class="modal-body">
                @if (!isEditing) {
                  <div class="mb-3">
                    <label class="form-label">Usuario *</label>
                    <select class="form-select" formControlName="user_id" [disabled]="preselectedUser !== null">
                      <option value="">Seleccionar usuario...</option>
                      @for (user of usersWithoutEmployee(); track user.id) {
                        <option [value]="user.id">{{ user.user_name }} ({{ user.email }})</option>
                      }
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Empleado *</label>
                    <select class="form-select" formControlName="employee_id" [disabled]="preselectedEmployee !== null">
                      <option value="">Seleccionar empleado...</option>
                      @for (emp of employeesWithoutUser(); track emp.id) {
                        <option [value]="emp.id">
                          {{ emp.employee_number || 'Sin número' }} -
                          {{ emp.jobPosition?.job_position || 'Sin puesto' }}
                          ({{ emp.area?.area || 'Sin área' }})
                        </option>
                      }
                    </select>
                  </div>
                }
                <div class="form-check mb-3">
                  <input type="checkbox" class="form-check-input" formControlName="is_primary" id="linkPrimary">
                  <label class="form-check-label" for="linkPrimary">Vínculo principal</label>
                </div>
                <div class="form-check mb-3">
                  <input type="checkbox" class="form-check-input" formControlName="is_active" id="linkActive">
                  <label class="form-check-label" for="linkActive">Activo</label>
                </div>
                <div class="mb-3">
                  <label class="form-label">Notas</label>
                  <textarea class="form-control" formControlName="notes" rows="2"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeLinkModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="linkForm.invalid || saving()">
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  {{ isEditing ? 'Actualizar' : 'Vincular' }}
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
export class UserEmployeeLinksComponent implements OnInit {
  private orgService = inject(OrganizationalStructureService);
  private fb = inject(FormBuilder);

  // Estado
  loading = signal(false);
  saving = signal(false);
  activeLinks = signal<UserEmployeeLink[]>([]);
  usersWithoutEmployee = signal<User[]>([]);
  employeesWithoutUser = signal<Employee[]>([]);
  activeTab = 'links';

  // Modal
  showLinkModal = false;
  isEditing = false;
  editingLink: UserEmployeeLink | null = null;
  preselectedUser: User | null = null;
  preselectedEmployee: Employee | null = null;

  // Formulario
  linkForm!: FormGroup;

  ngOnInit() {
    this.initForm();
    this.loadLinks();
    this.loadUsersWithoutEmployee();
    this.loadEmployeesWithoutUser();
  }

  initForm() {
    this.linkForm = this.fb.group({
      user_id: ['', Validators.required],
      employee_id: ['', Validators.required],
      is_primary: [true],
      is_active: [true],
      notes: ['']
    });
  }

  loadLinks() {
    this.loading.set(true);
    this.orgService.getUserEmployeeLinks({ active_only: false }).subscribe({
      next: (response) => {
        this.activeLinks.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando vínculos:', error);
        this.loading.set(false);
      }
    });
  }

  loadUsersWithoutEmployee() {
    this.orgService.getUsersWithoutEmployee().subscribe({
      next: (response) => this.usersWithoutEmployee.set(response.data),
      error: (error) => console.error('Error cargando usuarios:', error)
    });
  }

  loadEmployeesWithoutUser() {
    this.orgService.getEmployeesWithoutUser().subscribe({
      next: (response) => this.employeesWithoutUser.set(response.data),
      error: (error) => console.error('Error cargando empleados:', error)
    });
  }

  openLinkModal() {
    this.isEditing = false;
    this.editingLink = null;
    this.preselectedUser = null;
    this.preselectedEmployee = null;
    this.linkForm.reset({ is_primary: true, is_active: true });
    this.linkForm.get('user_id')?.enable();
    this.linkForm.get('employee_id')?.enable();
    this.showLinkModal = true;
  }

  openQuickLinkModal(user: User | null, employee: Employee | null) {
    this.isEditing = false;
    this.editingLink = null;
    this.preselectedUser = user;
    this.preselectedEmployee = employee;

    this.linkForm.reset({ is_primary: true, is_active: true });

    if (user) {
      this.linkForm.patchValue({ user_id: user.id });
      this.linkForm.get('user_id')?.disable();
    }
    if (employee) {
      this.linkForm.patchValue({ employee_id: employee.id });
      this.linkForm.get('employee_id')?.disable();
    }

    this.showLinkModal = true;
  }

  editLink(link: UserEmployeeLink) {
    this.isEditing = true;
    this.editingLink = link;
    this.linkForm.patchValue({
      user_id: link.user_id,
      employee_id: link.employee_id,
      is_primary: link.is_primary,
      is_active: link.is_active,
      notes: link.notes
    });
    this.linkForm.get('user_id')?.disable();
    this.linkForm.get('employee_id')?.disable();
    this.showLinkModal = true;
  }

  closeLinkModal() {
    this.showLinkModal = false;
    this.isEditing = false;
    this.editingLink = null;
    this.preselectedUser = null;
    this.preselectedEmployee = null;
    this.linkForm.reset();
    this.linkForm.get('user_id')?.enable();
    this.linkForm.get('employee_id')?.enable();
  }

  saveLink() {
    if (this.linkForm.invalid) return;

    this.saving.set(true);
    const formValue = this.linkForm.getRawValue();

    if (this.isEditing && this.editingLink) {
      this.orgService.updateUserEmployeeLink(this.editingLink.id, {
        is_primary: formValue.is_primary,
        is_active: formValue.is_active,
        notes: formValue.notes
      }).subscribe({
        next: () => {
          this.closeLinkModal();
          this.loadLinks();
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error actualizando vínculo:', error);
          this.saving.set(false);
        }
      });
    } else {
      // Usar el método rápido de vinculación
      this.orgService.linkUserToEmployee(formValue.user_id, formValue.employee_id).subscribe({
        next: () => {
          this.closeLinkModal();
          this.loadLinks();
          this.loadUsersWithoutEmployee();
          this.loadEmployeesWithoutUser();
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error creando vínculo:', error);
          this.saving.set(false);
        }
      });
    }
  }

  confirmDeleteLink(link: UserEmployeeLink) {
    if (confirm(`¿Está seguro de eliminar el vínculo entre "${link.user?.user_name}" y el empleado?`)) {
      this.orgService.deleteUserEmployeeLink(link.id).subscribe({
        next: () => {
          this.loadLinks();
          this.loadUsersWithoutEmployee();
          this.loadEmployeesWithoutUser();
        },
        error: (error) => console.error('Error eliminando vínculo:', error)
      });
    }
  }
}
