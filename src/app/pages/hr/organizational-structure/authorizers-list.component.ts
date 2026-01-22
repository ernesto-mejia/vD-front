import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationalStructureService } from '../../../core/services/organizational-structure.service';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-authorizers-list',
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
              <h5 class="mb-0"><i class="fas fa-user-check me-2"></i>Autorizadores de Compra por Área</h5>
              <button class="btn btn-primary btn-sm" (click)="showModal = true; resetForm()">
                <i class="fas fa-plus me-1"></i>Nuevo Autorizador
              </button>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Los autorizadores son usuarios que pueden pre-autorizar solicitudes de compra para un área específica.
              </div>

              <!-- Filtro por área -->
              <div class="row mb-3">
                <div class="col-md-4">
                  <label class="form-label">Filtrar por Área:</label>
                  <select class="form-select" [(ngModel)]="selectedAreaFilter" (change)="loadAuthorizers()">
                    <option value="">Todas las áreas</option>
                    <option *ngFor="let area of areas" [value]="area.id">{{ area.area }}</option>
                  </select>
                </div>
              </div>

              <!-- Tabla de autorizadores -->
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Área</th>
                      <th>Usuario Autorizador</th>
                      <th>Tipo de Autorización</th>
                      <th>Límite de Monto</th>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let auth of authorizers">
                      <td>{{ auth.id }}</td>
                      <td>{{ auth.area?.area || '-' }}</td>
                      <td>{{ auth.user?.user_name || auth.user?.email || '-' }}</td>
                      <td>{{ getAuthorizationTypeLabel(auth.authorization_type) }}</td>
                      <td>{{ auth.max_amount ? ('$' + auth.max_amount | number:'1.2-2') : 'Sin límite' }}</td>
                      <td>{{ auth.priority_order || 1 }}</td>
                      <td>
                        <span class="badge" [class.bg-success]="auth.is_active" [class.bg-secondary]="!auth.is_active">
                          {{ auth.is_active ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-1" (click)="editAuthorizer(auth)" title="Editar">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="deleteAuthorizer(auth)" title="Eliminar">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="authorizers.length === 0">
                      <td colspan="8" class="text-center text-muted">No hay autorizadores configurados</td>
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

    <!-- Modal para crear/editar autorizador -->
    <div class="modal fade show" [class.d-block]="showModal" [style.background]="showModal ? 'rgba(0,0,0,0.5)' : 'none'" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingAuthorizer ? 'Editar' : 'Nuevo' }} Autorizador</h5>
            <button type="button" class="btn-close" (click)="showModal = false"></button>
          </div>
          <form [formGroup]="authorizerForm" (ngSubmit)="saveAuthorizer()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Área *</label>
                <select class="form-select" formControlName="area_id">
                  <option value="">Seleccionar área...</option>
                  <option *ngFor="let area of areas" [value]="area.id">{{ area.area }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Usuario Autorizador *</label>
                <select class="form-select" formControlName="user_id">
                  <option value="">Seleccionar usuario...</option>
                  <option *ngFor="let user of users" [value]="user.id">{{ user.user_name }} ({{ user.email }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Tipo de Autorización *</label>
                <select class="form-select" formControlName="authorization_type">
                  <option value="">Seleccionar tipo...</option>
                  <option value="pre_authorization">Autorización de Solicitud</option>
                  <option value="final_authorization">Autorización de Orden de Compra</option>
                  <option value="both">Ambas</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Límite de Monto (opcional)</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" formControlName="max_amount" placeholder="Sin límite" min="0" step="0.01">
                </div>
                <small class="text-muted">Dejar vacío para autorizar cualquier monto</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Prioridad</label>
                <input type="number" class="form-control" formControlName="priority_order" min="1" max="10">
                <small class="text-muted">1 = más alta prioridad (autoriza primero)</small>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" formControlName="is_active" id="authActiveCheck">
                <label class="form-check-label" for="authActiveCheck">Autorizador Activo</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="authorizerForm.invalid || saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-1"></span>
                {{ editingAuthorizer ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </main>
  `
})
export class AuthorizersListComponent implements OnInit {
  authorizers: any[] = [];
  areas: any[] = [];
  users: any[] = [];
  loading = false;
  saving = false;
  showModal = false;
  editingAuthorizer: any = null;
  selectedAreaFilter = '';

  authorizerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationalStructureService
  ) {
    this.authorizerForm = this.fb.group({
      area_id: ['', Validators.required],
      user_id: ['', Validators.required],
      authorization_type: ['both', Validators.required],
      max_amount: [null],
      priority_order: [1],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadAreas();
    this.loadUsers();
    this.loadAuthorizers();
  }

  loadAreas(): void {
    this.orgService.getAreas().subscribe({
      next: (response: any) => {
        this.areas = response.data || response || [];
      },
      error: (err) => console.error('Error cargando áreas:', err)
    });
  }

  loadUsers(): void {
    this.orgService.getUsers().subscribe({
      next: (response: any) => {
        this.users = response.data || response || [];
      },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  loadAuthorizers(): void {
    this.loading = true;
    const filters = this.selectedAreaFilter ? { area_id: parseInt(this.selectedAreaFilter) } : undefined;

    this.orgService.getAreaAuthorizers(filters).subscribe({
      next: (response: any) => {
        this.authorizers = response.data || response || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando autorizadores:', err);
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.editingAuthorizer = null;
    this.authorizerForm.reset({ is_active: true, priority_order: 1, authorization_type: 'both' });
  }

  editAuthorizer(auth: any): void {
    this.editingAuthorizer = auth;
    this.authorizerForm.patchValue({
      area_id: auth.area_id,
      user_id: auth.user_id,
      authorization_type: auth.authorization_type,
      max_amount: auth.max_amount,
      priority_order: auth.priority_order,
      is_active: auth.is_active
    });
    this.showModal = true;
  }

  saveAuthorizer(): void {
    if (this.authorizerForm.invalid) return;

    this.saving = true;
    const data = this.authorizerForm.value;

    const request = this.editingAuthorizer
      ? this.orgService.updateAreaAuthorizer(this.editingAuthorizer.id, data)
      : this.orgService.createAreaAuthorizer(data);

    request.subscribe({
      next: () => {
        this.showModal = false;
        this.saving = false;
        this.loadAuthorizers();
        this.resetForm();
      },
      error: (err) => {
        console.error('Error guardando autorizador:', err);
        this.saving = false;
        alert('Error al guardar el autorizador');
      }
    });
  }

  deleteAuthorizer(auth: any): void {
    if (!confirm(`¿Está seguro de eliminar este autorizador?`)) return;

    this.orgService.deleteAreaAuthorizer(auth.id).subscribe({
      next: () => this.loadAuthorizers(),
      error: (err) => {
        console.error('Error eliminando autorizador:', err);
        alert('Error al eliminar el autorizador');
      }
    });
  }

  getAuthorizationTypeLabel(type: string): string {
    switch (type) {
      case 'pre_authorization': return 'Autorización de Solicitud';
      case 'final_authorization': return 'Autorización de Orden de Compra';
      case 'both': return 'Ambas';
      default: return type || '-';
    }
  }
}
