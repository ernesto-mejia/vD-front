import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { PurchaseRequestService, AuthorizationSummary } from '../purchase-request.service';
import { PurchaseRequest, PRIORITIES } from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-pending-authorizations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  template: `
    <div class="d-flex" id="wrapper">
      <app-sidebar></app-sidebar>
      <div id="page-content-wrapper" class="w-100">
        <div class="container-fluid py-4">
          <!-- Header -->
          <div class="row mb-4">
            <div class="col">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h2 class="mb-1">
                    <i class="bi bi-clipboard-check me-2"></i>
                    Mis Autorizaciones Pendientes
                  </h2>
                  <p class="text-muted mb-0">
                    Solicitudes de compra pendientes de tu autorización
                  </p>
                </div>
                <button class="btn btn-outline-secondary" (click)="loadData()">
                  <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
                </button>
              </div>
            </div>
          </div>

          <!-- Summary Cards -->
          <div class="row mb-4" *ngIf="summary()">
            <div class="col-md-4">
              <div class="card bg-warning bg-opacity-10 border-warning">
                <div class="card-body text-center">
                  <h3 class="text-warning mb-1">{{ summary()!.pending_pre_authorization }}</h3>
                  <small class="text-muted">Solicitudes por Autorizar</small>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-primary bg-opacity-10 border-primary">
                <div class="card-body text-center">
                  <h3 class="text-primary mb-1">{{ summary()!.pending_approval }}</h3>
                  <small class="text-muted">OC por Autorizar</small>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-info bg-opacity-10 border-info">
                <div class="card-body text-center">
                  <h3 class="text-info mb-1">{{ summary()!.total_pending }}</h3>
                  <small class="text-muted">Total Pendiente</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <ul class="nav nav-tabs mb-4">
            <li class="nav-item">
              <a class="nav-link" [class.active]="activeTab() === 'preauth'"
                 (click)="setActiveTab('preauth')" style="cursor: pointer;">
                <i class="bi bi-hourglass-split me-1"></i>
                Autorizar Solicitudes
                <span class="badge bg-warning ms-1" *ngIf="preAuthRequests().length > 0">
                  {{ preAuthRequests().length }}
                </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="activeTab() === 'readyForPO'"
                 (click)="setActiveTab('readyForPO')" style="cursor: pointer;">
                <i class="bi bi-file-earmark-plus me-1"></i>
                Listas para OC
                <span class="badge bg-success ms-1" *ngIf="readyForPORequests().length > 0">
                  {{ readyForPORequests().length }}
                </span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" [class.active]="activeTab() === 'approval'"
                 (click)="setActiveTab('approval')" style="cursor: pointer;">
                <i class="bi bi-check2-circle me-1"></i>
                Aprobación Final
                <span class="badge bg-primary ms-1" *ngIf="approvalRequests().length > 0">
                  {{ approvalRequests().length }}
                </span>
              </a>
            </li>
          </ul>

          <!-- Authorized Areas -->
          <div class="mb-3" *ngIf="authorizedAreas().length > 0">
            <small class="text-muted">
              Áreas donde puedes {{ activeTab() === 'preauth' ? 'pre-autorizar' : 'aprobar' }}:
              <span *ngFor="let area of authorizedAreas(); let last = last" class="badge bg-light text-dark ms-1">
                {{ area.name }}
              </span>
            </small>
          </div>

          <!-- Loading -->
          <div *ngIf="loading()" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-muted">Cargando solicitudes...</p>
          </div>

          <!-- Pre-authorization Tab -->
          <div *ngIf="activeTab() === 'preauth' && !loading()">
            <div *ngIf="preAuthRequests().length === 0" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No tienes solicitudes pendientes de pre-autorización.
            </div>

            <div class="card" *ngIf="preAuthRequests().length > 0">
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Folio</th>
                        <th>Título</th>
                        <th>Solicitante</th>
                        <th>Área Destino</th>
                        <th>Prioridad</th>
                        <th>Fecha Req.</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let request of preAuthRequests()">
                        <td>
                          <a [routerLink]="['/purchases/purchase-requests', request.id]" class="text-decoration-none">
                            {{ request.request_number }}
                          </a>
                        </td>
                        <td>{{ request.title }}</td>
                        <td>{{ request.requester?.user_name }}</td>
                        <td>
                          <span class="badge bg-secondary">{{ request.destination_area?.area || request.destination_area?.name || '-' }}</span>
                        </td>
                        <td>
                          <span class="badge" [ngClass]="getPriorityClass(request.priority)">
                            {{ getPriorityLabel(request.priority) }}
                          </span>
                        </td>
                        <td>{{ request.required_date | date:'dd/MM/yyyy' }}</td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary"
                                    [routerLink]="['/purchases/purchase-requests', request.id]"
                                    title="Ver detalle">
                              <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-success"
                                    (click)="goToPreAuthorize(request)"
                                    title="Autorizar Solicitud de Compra">
                              <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-outline-warning"
                                    (click)="returnRequest(request)"
                                    title="Devolver">
                              <i class="bi bi-arrow-return-left"></i>
                            </button>
                            <button class="btn btn-outline-danger"
                                    (click)="rejectRequest(request)"
                                    title="Rechazar">
                              <i class="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <!-- Ready for PO Tab -->
          <div *ngIf="activeTab() === 'readyForPO' && !loading()">
            <div *ngIf="readyForPORequests().length === 0" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No hay solicitudes listas para generar Orden de Compra.
            </div>

            <div class="card" *ngIf="readyForPORequests().length > 0">
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Folio</th>
                        <th>Título</th>
                        <th>Solicitante</th>
                        <th>Proveedor</th>
                        <th>Área Destino</th>
                        <th>Total</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let request of readyForPORequests()">
                        <td>
                          <a [routerLink]="['/purchases/purchase-requests', request.id]" class="text-decoration-none">
                            {{ request.request_number }}
                          </a>
                        </td>
                        <td>{{ request.title }}</td>
                        <td>{{ request.requester?.user_name }}</td>
                        <td>
                          <span *ngIf="request.provider" class="text-primary">{{ request.provider.shortname || request.provider.company }}</span>
                          <span *ngIf="!request.provider" class="text-muted">Sin proveedor</span>
                        </td>
                        <td>
                          <span class="badge bg-secondary">{{ request.destination_area?.area || request.destination_area?.name || '-' }}</span>
                        </td>
                        <td>{{ request.total | currency:'MXN' }}</td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary"
                                    [routerLink]="['/purchases/purchase-requests', request.id]"
                                    title="Ver detalle">
                              <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-success"
                                    (click)="goToGeneratePO(request)"
                                    title="Generar Orden de Compra">
                              <i class="bi bi-file-earmark-plus me-1"></i> Generar OC
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <!-- Approval Tab -->
          <div *ngIf="activeTab() === 'approval' && !loading()">
            <div *ngIf="approvalRequests().length === 0" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No tienes solicitudes pendientes de aprobación final.
            </div>

            <div class="card" *ngIf="approvalRequests().length > 0">
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Folio</th>
                        <th>Título</th>
                        <th>Solicitante</th>
                        <th>Pre-autorizado por</th>
                        <th>Área Destino</th>
                        <th>Total</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let request of approvalRequests()">
                        <td>
                          <a [routerLink]="['/purchases/purchase-requests', request.id]" class="text-decoration-none">
                            {{ request.request_number }}
                          </a>
                        </td>
                        <td>{{ request.title }}</td>
                        <td>{{ request.requester?.user_name }}</td>
                        <td>{{ request.pre_authorized_by_user?.user_name || '-' }}</td>
                        <td>
                          <span class="badge bg-secondary">{{ request.destination_area?.area || request.destination_area?.name || '-' }}</span>
                        </td>
                        <td>{{ request.total | currency:'MXN' }}</td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary"
                                    [routerLink]="['/purchases/purchase-requests', request.id]"
                                    title="Ver detalle">
                              <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-success"
                                    (click)="approveRequest(request)"
                                    title="Aprobar">
                              <i class="bi bi-check-lg"></i> Aprobar
                            </button>
                            <button class="btn btn-outline-warning"
                                    (click)="returnRequest(request)"
                                    title="Devolver">
                              <i class="bi bi-arrow-return-left"></i>
                            </button>
                            <button class="btn btn-outline-danger"
                                    (click)="rejectRequest(request)"
                                    title="Rechazar">
                              <i class="bi bi-x-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-tabs .nav-link {
      color: #6c757d;
    }
    .nav-tabs .nav-link.active {
      font-weight: 600;
    }
  `]
})
export class MyPendingAuthorizationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = signal(false);
  activeTab = signal<'preauth' | 'readyForPO' | 'approval'>('preauth');

  summary = signal<AuthorizationSummary | null>(null);
  preAuthRequests = signal<PurchaseRequest[]>([]);
  readyForPORequests = signal<PurchaseRequest[]>([]);
  approvalRequests = signal<PurchaseRequest[]>([]);

  preAuthAreas = signal<{ id: number; name: string }[]>([]);
  approvalAreas = signal<{ id: number; name: string }[]>([]);

  authorizedAreas = computed(() => {
    return this.activeTab() === 'preauth' ? this.preAuthAreas() : this.approvalAreas();
  });

  constructor(
    private purchaseRequestService: PurchaseRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading.set(true);

    forkJoin({
      summary: this.purchaseRequestService.getMyAuthorizationSummary(),
      preAuth: this.purchaseRequestService.getMyPendingPreAuthorization(),
      readyForPO: this.purchaseRequestService.getMyReadyForPO(),
      approval: this.purchaseRequestService.getMyPendingApproval()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        if (results.summary.success) {
          this.summary.set(results.summary.data);
          this.preAuthAreas.set(results.summary.data.pre_auth_areas || []);
          this.approvalAreas.set(results.summary.data.final_auth_areas || []);
        }

        this.preAuthRequests.set(results.preAuth.data || []);
        this.readyForPORequests.set(results.readyForPO.data || []);
        this.approvalRequests.set(results.approval.data || []);

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cargando autorizaciones:', error);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudieron cargar las autorizaciones pendientes', 'error');
      }
    });
  }

  setActiveTab(tab: 'preauth' | 'readyForPO' | 'approval'): void {
    this.activeTab.set(tab);
  }

  goToPreAuthorize(request: PurchaseRequest): void {
    Swal.fire({
      title: '¿Autorizar Solicitud de Compra?',
      html: `
        <p>Estás a punto de autorizar la solicitud <strong>${request.request_number}</strong></p>
        <p><strong>${request.title}</strong></p>
        ${request.provider ? `<p>Proveedor: <strong>${request.provider.shortname || request.provider.company}</strong></p>` : ''}
        <p class="text-muted">Al autorizar esta solicitud, se generará automáticamente una Orden de Compra (OC) ligada a este folio.</p>
        <div class="alert alert-info mt-3 text-start">
          <i class="bi bi-info-circle me-2"></i>
          <small>La OC generada tendrá un folio con formato <strong>OC-${new Date().getFullYear()}-XXXX</strong> y quedará vinculada a la solicitud <strong>${request.request_number}</strong></small>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Sí, autorizar y generar OC',
      cancelButtonText: 'Cancelar',
      input: 'textarea',
      inputLabel: 'Notas de autorización (opcional)',
      inputPlaceholder: 'Comentarios adicionales...',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authorizeAndCreatePO(request, result.value);
      }
    });
  }

  authorizeAndCreatePO(request: PurchaseRequest, notes?: string): void {
    // Mostrar loading
    Swal.fire({
      title: 'Procesando...',
      html: 'Autorizando solicitud y generando Orden de Compra',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Preparar datos de pre-autorización
    const preAuthData: any = {
      notes: notes || 'Autorizada desde panel de autorizaciones'
    };

    // Incluir provider_id si existe
    if (request.provider_id) {
      preAuthData.provider_id = request.provider_id;
    }

    // Primero pre-autorizar
    this.purchaseRequestService.preAuthorize(request.id, preAuthData).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (preAuthResult) => {
        // Luego convertir a Orden de Compra
        this.purchaseRequestService.convertToPurchaseOrder(request.id, notes).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (convertResult) => {
            const poNumber = convertResult.data?.purchase_order?.order_number || 'OC generada';
            Swal.fire({
              icon: 'success',
              title: '¡Autorización exitosa!',
              html: `
                <p>La solicitud <strong>${request.request_number}</strong> ha sido autorizada.</p>
                <div class="alert alert-success mt-3">
                  <i class="bi bi-file-earmark-check me-2"></i>
                  Orden de Compra generada: <strong>${poNumber}</strong>
                </div>
                <p class="text-muted mt-2">La OC está vinculada a la solicitud original.</p>
              `,
              confirmButtonText: 'Ver Orden de Compra',
              showCancelButton: true,
              cancelButtonText: 'Continuar aquí'
            }).then((alertResult) => {
              if (alertResult.isConfirmed && convertResult.data?.purchase_order?.id) {
                this.router.navigate(['/purchases/purchase-orders/show', convertResult.data.purchase_order.id]);
              } else {
                this.loadData();
              }
            });
          },
          error: (error) => {
            // La pre-autorización fue exitosa pero la conversión a OC falló
            Swal.fire({
              icon: 'warning',
              title: 'Autorización parcial',
              html: `
                <p>La solicitud fue pre-autorizada pero hubo un problema al generar la Orden de Compra.</p>
                <p class="text-danger">${error.error?.message || 'Error al generar OC'}</p>
                <p class="text-muted mt-2">Puede generar la OC manualmente desde el detalle de la solicitud.</p>
              `,
              confirmButtonText: 'Entendido'
            });
            this.loadData();
          }
        });
      },
      error: (error) => {
        Swal.fire('Error', error.error?.message || 'No se pudo autorizar la solicitud', 'error');
      }
    });
  }

  goToGeneratePO(request: PurchaseRequest): void {
    // Navegar directamente a la página de pre-autorización donde se puede generar la OC
    this.router.navigate(['/purchases/purchase-requests', request.id, 'pre-authorize']);
  }

  approveRequest(request: PurchaseRequest): void {
    Swal.fire({
      title: '¿Aprobar solicitud?',
      html: `
        <p>Estás a punto de aprobar la solicitud <strong>${request.request_number}</strong></p>
        <p><strong>${request.title}</strong></p>
        <p class="text-muted">Total: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(request.total || 0)}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      input: 'textarea',
      inputLabel: 'Notas (opcional)',
      inputPlaceholder: 'Comentarios adicionales...',
    }).then((result) => {
      if (result.isConfirmed) {
        this.purchaseRequestService.approve(request.id, result.value).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire('¡Aprobada!', 'La solicitud ha sido aprobada exitosamente.', 'success');
            this.loadData();
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo aprobar la solicitud', 'error');
          }
        });
      }
    });
  }

  rejectRequest(request: PurchaseRequest): void {
    Swal.fire({
      title: '¿Rechazar solicitud?',
      html: `
        <p>Estás a punto de rechazar la solicitud <strong>${request.request_number}</strong></p>
        <p><strong>${request.title}</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Explica por qué rechazas esta solicitud...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debes proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.purchaseRequestService.reject(request.id, result.value).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire('Rechazada', 'La solicitud ha sido rechazada.', 'info');
            this.loadData();
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo rechazar la solicitud', 'error');
          }
        });
      }
    });
  }

  returnRequest(request: PurchaseRequest): void {
    Swal.fire({
      title: '¿Devolver solicitud?',
      html: `
        <p>La solicitud <strong>${request.request_number}</strong> será devuelta al solicitante para correcciones.</p>
        <p><strong>${request.title}</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, devolver',
      cancelButtonText: 'Cancelar',
      input: 'textarea',
      inputLabel: 'Motivo de devolución',
      inputPlaceholder: 'Explica las correcciones necesarias (mínimo 10 caracteres)...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debes proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.purchaseRequestService.returnRequest(request.id, result.value).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            Swal.fire('Devuelta', 'La solicitud ha sido devuelta al solicitante.', 'info');
            this.loadData();
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo devolver la solicitud', 'error');
          }
        });
      }
    });
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning text-dark';
      case 'normal': return 'bg-primary';
      case 'low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getPriorityLabel(priority: string): string {
    const found = PRIORITIES.find(p => p.value === priority);
    return found?.label || priority;
  }
}
