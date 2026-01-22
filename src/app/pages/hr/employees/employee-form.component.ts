import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HumanResourcesService } from '../../../servicios/human-resources.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import Swal from 'sweetalert2';

interface Role {
  id: number;
  name: string;
  guard_name?: string;
}

interface Permission {
  id: number;
  name: string;
  guard_name?: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, NgSelectModule],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a routerLink="/hr">RRHH</a></li>
              <li class="breadcrumb-item"><a routerLink="/hr/employees">Empleados</a></li>
              <li class="breadcrumb-item active">{{isEdit ? 'Editar' : 'Nuevo'}}</li>
            </ol>
          </nav>
        </div>
      </div>

      <form (ngSubmit)="save()">
        <!-- Datos Personales -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0"><i class="fa fa-user me-2"></i>Datos Personales</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">No. Empleado <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.employee_number"
                  name="employee_number" required [readonly]="isEdit">
              </div>
              <div class="col-md-3">
                <label class="form-label">Nombre(s) <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.first_name"
                  name="first_name" required>
              </div>
              <div class="col-md-3">
                <label class="form-label">Apellido Paterno <span class="text-danger">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.paternal_surname"
                  name="paternal_surname" required>
              </div>
              <div class="col-md-3">
                <label class="form-label">Apellido Materno</label>
                <input type="text" class="form-control" [(ngModel)]="form.maternal_surname"
                  name="maternal_surname">
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">Fecha de Nacimiento</label>
                <input type="date" class="form-control" [(ngModel)]="form.birth_date" name="birth_date">
              </div>
              <div class="col-md-3">
                <label class="form-label">Género</label>
                <select class="form-select" [(ngModel)]="form.gender" name="gender">
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Estado Civil</label>
                <select class="form-select" [(ngModel)]="form.marital_status" name="marital_status">
                  <option value="">Seleccionar...</option>
                  <option value="single">Soltero(a)</option>
                  <option value="married">Casado(a)</option>
                  <option value="divorced">Divorciado(a)</option>
                  <option value="widowed">Viudo(a)</option>
                  <option value="cohabiting">Unión Libre</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Nacionalidad</label>
                <input type="text" class="form-control" [(ngModel)]="form.nationality"
                  name="nationality" value="Mexicana">
              </div>
            </div>
          </div>
        </div>

        <!-- Datos de Contacto -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0"><i class="fa fa-phone me-2"></i>Datos de Contacto</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <input type="email" class="form-control" [(ngModel)]="form.email" name="email" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Teléfono</label>
                <input type="tel" class="form-control" [(ngModel)]="form.phone" name="phone">
              </div>
              <div class="col-md-4">
                <label class="form-label">Teléfono Emergencia</label>
                <input type="tel" class="form-control" [(ngModel)]="form.emergency_phone" name="emergency_phone">
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Contacto de Emergencia</label>
                <input type="text" class="form-control" [(ngModel)]="form.emergency_contact"
                  name="emergency_contact" placeholder="Nombre del contacto">
              </div>
              <div class="col-md-6">
                <label class="form-label">Parentesco</label>
                <input type="text" class="form-control" [(ngModel)]="form.emergency_relationship"
                  name="emergency_relationship" placeholder="Ej: Esposo(a), Padre, Madre">
              </div>
            </div>
          </div>
        </div>

        <!-- Datos Laborales -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0"><i class="fa fa-briefcase me-2"></i>Datos Laborales</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">Fecha de Ingreso <span class="text-danger">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="form.hire_date" name="hire_date" required>
              </div>
              <div class="col-md-3">
                <label class="form-label">Departamento <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.department_id" name="department_id" required>
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let dept of departments" [value]="dept.id">{{dept.name}}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Puesto <span class="text-danger">*</span></label>
                <select class="form-select" [(ngModel)]="form.job_position_id" name="job_position_id" required>
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let pos of jobPositions" [value]="pos.id">{{pos.name}}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Área</label>
                <select class="form-select" [(ngModel)]="form.area_id" name="area_id">
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let area of areas" [value]="area.id">{{area.name}}</option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">Supervisor Directo</label>
                <select class="form-select" [(ngModel)]="form.supervisor_id" name="supervisor_id">
                  <option value="">Sin supervisor</option>
                  <option *ngFor="let sup of supervisors" [value]="sup.id">
                    {{sup.first_name}} {{sup.paternal_surname}}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Horario de Trabajo</label>
                <select class="form-select" [(ngModel)]="form.work_schedule_id" name="work_schedule_id">
                  <option value="">Seleccionar...</option>
                  <option *ngFor="let sch of workSchedules" [value]="sch.id">{{sch.name}}</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Ubicación de Trabajo</label>
                <input type="text" class="form-control" [(ngModel)]="form.work_location"
                  name="work_location" placeholder="Ej: Oficina Central">
              </div>
              <div class="col-md-3">
                <label class="form-label">Estado</label>
                <select class="form-select" [(ngModel)]="form.status" name="status">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="on_leave">Con Permiso</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Datos Fiscales Básicos -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0"><i class="fa fa-file-invoice me-2"></i>Datos Fiscales</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <label class="form-label">RFC</label>
                <input type="text" class="form-control text-uppercase" [(ngModel)]="form.rfc"
                  name="rfc" maxlength="13">
              </div>
              <div class="col-md-4">
                <label class="form-label">CURP</label>
                <input type="text" class="form-control text-uppercase" [(ngModel)]="form.curp"
                  name="curp" maxlength="18">
              </div>
              <div class="col-md-4">
                <label class="form-label">NSS</label>
                <input type="text" class="form-control" [(ngModel)]="form.nss"
                  name="nss" maxlength="11">
              </div>
            </div>
            <div class="alert alert-info">
              <i class="fa fa-info-circle me-2"></i>
              Los datos fiscales completos (dirección, banco, documentos) se pueden editar en la sección
              <a routerLink="/hr/employees/fiscal-data" class="alert-link">Datos Fiscales</a>.
            </div>
          </div>
        </div>

        <!-- Salario -->
        <div class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0"><i class="fa fa-money-bill-wave me-2"></i>Información Salarial</h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">Salario Diario</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [(ngModel)]="form.daily_salary"
                    name="daily_salary" step="0.01" (change)="calculateSalaries()">
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label">Salario Mensual</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [value]="monthlySalary" readonly>
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label">SDI (Salario Diario Integrado)</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" [(ngModel)]="form.integrated_daily_wage"
                    name="integrated_daily_wage" step="0.01">
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label">Periodicidad de Pago</label>
                <select class="form-select" [(ngModel)]="form.payment_periodicity" name="payment_periodicity">
                  <option value="01">Diario</option>
                  <option value="02">Semanal</option>
                  <option value="03">Catorcenal</option>
                  <option value="04">Quincenal</option>
                  <option value="05">Mensual</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- ========== SECCIÓN DE USUARIO DEL SISTEMA ========== -->
        <div class="card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fa fa-user-shield me-2"></i>Usuario del Sistema</h5>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" role="switch"
                [(ngModel)]="createSystemUser" name="createSystemUser"
                id="createSystemUser" (change)="onCreateUserChange()"
                style="width: 3em; height: 1.5em;">
              <label class="form-check-label" for="createSystemUser">
                Crear usuario de acceso al sistema
              </label>
            </div>
          </div>

          <div class="card-body" *ngIf="createSystemUser">
            <!-- Mensaje informativo -->
            <div class="alert alert-info mb-4">
              <i class="fa fa-info-circle me-2"></i>
              Al activar esta opción, se creará un usuario que permitirá al empleado acceder al sistema.
              El nombre de usuario será generado automáticamente a partir del email.
            </div>

            <!-- Credenciales -->
            <div class="row mb-4">
              <div class="col-md-4">
                <label class="form-label">Nombre de Usuario</label>
                <input type="text" class="form-control" [value]="generatedUsername" readonly
                  placeholder="Se generará del email">
                <small class="text-muted">Generado automáticamente del email</small>
              </div>
              <div class="col-md-4">
                <label class="form-label">Contraseña <span class="text-danger">*</span></label>
                <input type="password" class="form-control" [(ngModel)]="userForm.password"
                  name="user_password" [required]="createSystemUser"
                  placeholder="Ingrese contraseña">
              </div>
              <div class="col-md-4">
                <label class="form-label">Confirmar Contraseña <span class="text-danger">*</span></label>
                <input type="password" class="form-control" [(ngModel)]="userForm.password_confirmation"
                  name="user_password_confirmation" [required]="createSystemUser"
                  placeholder="Confirme la contraseña">
              </div>
            </div>

            <!-- Tabs para Roles y Permisos -->
            <ul class="nav nav-tabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-roles"
                  type="button" role="tab">
                  <i class="fa fa-user-tag me-1"></i>Roles y Estado
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-permissions"
                  type="button" role="tab">
                  <i class="fa fa-shield-alt me-1"></i>Permisos Directos
                </button>
              </li>
            </ul>

            <div class="tab-content border border-top-0 rounded-bottom p-3">
              <!-- Tab Roles -->
              <div class="tab-pane fade show active" id="tab-roles" role="tabpanel">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Roles Asignados <span class="text-danger">*</span></label>
                    <ng-select
                      [items]="roles"
                      bindLabel="name"
                      bindValue="name"
                      [multiple]="true"
                      [(ngModel)]="userForm.roles"
                      name="user_roles"
                      placeholder="Seleccione uno o más roles"
                      [searchable]="true"
                      [clearable]="true"
                      [closeOnSelect]="false"
                      notFoundText="No se encontraron roles"
                      [loading]="loadingRoles">
                      <ng-template ng-option-tmp let-item="item">
                        <strong>{{ item.name }}</strong>
                      </ng-template>
                    </ng-select>
                    <div *ngIf="createSystemUser && (!userForm.roles || userForm.roles.length === 0)"
                      class="text-danger small mt-1">
                      Debe seleccionar al menos un rol
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Estado del Usuario <span class="text-danger">*</span></label>
                    <select class="form-select" [(ngModel)]="userForm.status" name="user_status">
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Tab Permisos -->
              <div class="tab-pane fade" id="tab-permissions" role="tabpanel">
                <div class="mb-3">
                  <small class="text-muted">
                    <i class="fa fa-info-circle me-1"></i>
                    Seleccione permisos adicionales (además de los que vienen con los roles asignados)
                  </small>
                </div>

                <div *ngIf="loadingPermissions" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </div>
                  <p class="mt-2 text-muted">Cargando permisos...</p>
                </div>

                <div *ngIf="!loadingPermissions" class="permissions-grid">
                  <div *ngFor="let category of permissionCategories" class="permission-card">
                    <div class="permission-card-header">
                      <h6 class="mb-0">
                        <i class="fa fa-folder-open me-2"></i>{{ category.name }}
                      </h6>
                    </div>
                    <div class="permission-card-body">
                      <div *ngFor="let permission of category.permissions" class="form-check mb-2">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          [id]="'perm-' + permission.id"
                          [checked]="isPermissionSelected(permission)"
                          (change)="onPermissionChange($event, permission)">
                        <label class="form-check-label" [for]="'perm-' + permission.id">
                          {{ permission.name }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-body" *ngIf="!createSystemUser">
            <div class="text-center text-muted py-3">
              <i class="fa fa-user-slash fa-2x mb-2"></i>
              <p class="mb-0">Este empleado no tendrá acceso al sistema</p>
              <small>Active el switch para crear credenciales de acceso</small>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="d-flex justify-content-end gap-2 mb-4">
          <a routerLink="/hr/employees" class="btn btn-secondary">
            <i class="fa fa-times me-1"></i> Cancelar
          </a>
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <i class="fa fa-save me-1"></i> {{saving ? 'Guardando...' : 'Guardar'}}
          </button>
        </div>
      </form>
    </div>
    </main>
  `,
  styles: [`
    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .permission-card {
      border: 1px solid #dee2e6;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .permission-card-header {
      background-color: #0d6efd;
      color: white;
      padding: 0.5rem 1rem;
    }

    .permission-card-header h6 {
      font-size: 0.875rem;
      margin: 0;
    }

    .permission-card-body {
      padding: 0.75rem 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .permission-card-body .form-check {
      font-size: 0.85rem;
    }

    .nav-tabs .nav-link {
      color: #495057;
    }

    .nav-tabs .nav-link.active {
      font-weight: 500;
    }
  `]
})
export class EmployeeFormComponent implements OnInit {
  isEdit = false;
  saving = false;
  monthlySalary = 0;

  // Catálogos empleados
  departments: any[] = [];
  jobPositions: any[] = [];
  areas: any[] = [];
  supervisors: any[] = [];
  workSchedules: any[] = [];

  // Datos de usuario del sistema
  createSystemUser = false;
  roles: Role[] = [];
  permissionCategories: PermissionCategory[] = [];
  loadingRoles = false;
  loadingPermissions = false;

  form: any = {
    employee_number: '',
    first_name: '',
    paternal_surname: '',
    maternal_surname: '',
    birth_date: '',
    gender: '',
    marital_status: '',
    nationality: 'Mexicana',
    email: '',
    phone: '',
    emergency_phone: '',
    emergency_contact: '',
    emergency_relationship: '',
    hire_date: '',
    department_id: '',
    job_position_id: '',
    area_id: '',
    supervisor_id: '',
    work_schedule_id: '',
    work_location: '',
    status: 'active',
    rfc: '',
    curp: '',
    nss: '',
    daily_salary: 0,
    integrated_daily_wage: 0,
    payment_periodicity: '04'
  };

  // Formulario de usuario
  userForm = {
    password: '',
    password_confirmation: '',
    roles: [] as string[],
    permissions: [] as string[],
    status: 'Activo'
  };

  constructor(
    private hrService: HumanResourcesService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadCatalogs();

    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEdit = true;
      this.loadEmployee(id);
    }
  }

  loadCatalogs() {
    this.hrService.getDepartments().subscribe({
      next: (res) => this.departments = res.data?.data || res.data || []
    });
    this.hrService.getJobPositions().subscribe({
      next: (res) => this.jobPositions = res.data?.data || res.data || []
    });
    this.hrService.getAreas().subscribe({
      next: (res) => this.areas = res.data?.data || res.data || []
    });
    this.hrService.getEmployees({ status: 'active' }).subscribe({
      next: (res) => this.supervisors = res.data?.data || res.data || []
    });
    this.hrService.getWorkSchedules().subscribe({
      next: (res) => this.workSchedules = res.data?.data || res.data || []
    });
  }

  loadEmployee(id: number) {
    this.hrService.getEmployee(id).subscribe({
      next: (res) => {
        this.form = res.data;
        this.calculateSalaries();
        // TODO: Si el empleado ya tiene usuario, cargar los datos
      }
    });
  }

  // Getter para generar username del email
  get generatedUsername(): string {
    if (this.form.email) {
      return this.form.email.split('@')[0];
    }
    return '';
  }

  // Cuando se activa/desactiva crear usuario
  onCreateUserChange() {
    if (this.createSystemUser) {
      this.loadRoles();
      this.loadPermissions();
    }
  }

  // Cargar roles disponibles
  loadRoles() {
    this.loadingRoles = true;
    this.http.get<any>(apiEndpoint('v2/roles')).subscribe({
      next: (res) => {
        this.roles = res.data?.data || res.data || [];
        this.loadingRoles = false;
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.loadingRoles = false;
      }
    });
  }

  // Cargar permisos agrupados por categoría
  loadPermissions() {
    this.loadingPermissions = true;
    this.http.get<any>(apiEndpoint('v2/permissions/grouped')).subscribe({
      next: (res) => {
        if (res.data) {
          this.permissionCategories = Object.entries(res.data).map(
            ([categoryName, permissions]) => ({
              name: categoryName,
              permissions: permissions as Permission[]
            })
          );
        }
        this.loadingPermissions = false;
      },
      error: (err) => {
        console.error('Error al cargar permisos:', err);
        this.loadingPermissions = false;
      }
    });
  }

  // Verificar si un permiso está seleccionado
  isPermissionSelected(permission: Permission): boolean {
    return this.userForm.permissions.includes(permission.name);
  }

  // Manejar cambio en checkbox de permiso
  onPermissionChange(event: any, permission: Permission) {
    if (event.target.checked) {
      if (!this.userForm.permissions.includes(permission.name)) {
        this.userForm.permissions.push(permission.name);
      }
    } else {
      this.userForm.permissions = this.userForm.permissions.filter(
        p => p !== permission.name
      );
    }
  }

  calculateSalaries() {
    this.monthlySalary = Math.round((this.form.daily_salary || 0) * 30 * 100) / 100;

    // Calcular SDI aproximado (factor 1.0452 para empleados nuevos)
    if (!this.form.integrated_daily_wage && this.form.daily_salary) {
      this.form.integrated_daily_wage = Math.round(this.form.daily_salary * 1.0452 * 100) / 100;
    }
  }

  // Validar formulario de usuario
  validateUserForm(): boolean {
    if (!this.createSystemUser) return true;

    if (!this.form.email) {
      Swal.fire({
        icon: 'warning',
        title: 'Email requerido',
        text: 'Debe ingresar un email para crear el usuario del sistema'
      });
      return false;
    }

    if (!this.userForm.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña requerida',
        text: 'Debe ingresar una contraseña para el usuario'
      });
      return false;
    }

    if (this.userForm.password !== this.userForm.password_confirmation) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'La contraseña y su confirmación deben ser iguales'
      });
      return false;
    }

    if (!this.userForm.roles || this.userForm.roles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Rol requerido',
        text: 'Debe seleccionar al menos un rol para el usuario'
      });
      return false;
    }

    return true;
  }

  save() {
    if (!this.validateUserForm()) {
      return;
    }

    this.saving = true;

    // Preparar datos del empleado
    const employeeData = { ...this.form };

    // Si se va a crear usuario, agregar los datos
    if (this.createSystemUser) {
      employeeData.create_user = true;
      employeeData.user_data = {
        user_name: this.generatedUsername,
        email: this.form.email,
        password: this.userForm.password,
        password_confirmation: this.userForm.password_confirmation,
        roles: this.userForm.roles,
        permissions: this.userForm.permissions,
        status: this.userForm.status
      };
    }

    const request = this.isEdit
      ? this.hrService.updateEmployee(this.form.id, employeeData)
      : this.hrService.createEmployee(employeeData);

    request.subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: this.isEdit ? 'Empleado actualizado' : 'Empleado creado',
          text: this.createSystemUser
            ? 'El empleado y su usuario de sistema fueron creados exitosamente'
            : 'El empleado fue guardado exitosamente',
          timer: 3000,
          showConfirmButton: false
        });
        this.router.navigate(['/hr/employees']);
      },
      error: (err) => {
        this.saving = false;
        console.error('Error al guardar:', err);

        let errorMessage = 'Error al guardar el empleado';
        if (err.error?.errores) {
          const errors = Object.values(err.error.errores).flat();
          errorMessage = (errors as string[]).join('\n');
        } else if (err.error?.mensaje) {
          errorMessage = err.error.mensaje;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage
        });
      }
    });
  }
}
