import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PurchaseRequestService, DestinationArea } from '../purchase-request.service';
import { PurchaseRequest } from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SidebarComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
      <div class="container-fluid py-4">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col-12">
            <h4 class="mb-1">
              <i class="fa fa-shopping-bag text-primary me-2"></i>
              Seguimiento de Compras
            </h4>
            <p class="text-muted mb-0">Gestión del proceso de compra y recepción de solicitudes aprobadas</p>
          </div>
        </div>

        <!-- Tabs de estado -->
        <ul class="nav nav-tabs mb-4">
          <li class="nav-item">
            <button
              class="nav-link"
              [class.active]="activeTab === 'pending'"
              (click)="changeTab('pending')">
              <i class="fa fa-clock me-1"></i>
              Pendientes de Compra
              @if (pendingCount() > 0) {
                <span class="badge bg-warning ms-1">{{ pendingCount() }}</span>
              }
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link"
              [class.active]="activeTab === 'purchased'"
              (click)="changeTab('purchased')">
              <i class="fa fa-shopping-cart me-1"></i>
              Compradas (En Tránsito)
              @if (purchasedCount() > 0) {
                <span class="badge bg-info ms-1">{{ purchasedCount() }}</span>
              }
            </button>
          </li>
        </ul>

        <!-- Filtros -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-md-4">
                <label class="form-label">Área de destino</label>
                <select class="form-select" [(ngModel)]="selectedAreaId" (change)="loadData()">
                  <option [ngValue]="null">Todas las áreas</option>
                  @for (area of destinationAreas(); track area.id) {
                    <option [value]="area.id">{{ area.name }}</option>
                  }
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Buscar</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="Número, título..."
                  [(ngModel)]="searchTerm"
                  (input)="filterRequests()">
              </div>
              <div class="col-md-4 text-end">
                <button class="btn btn-outline-primary" (click)="loadData()">
                  <i class="fa fa-sync me-1"></i>Actualizar
                </button>
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

        <!-- Lista de Solicitudes -->
        @if (!loading()) {
          <div class="card">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>No. Solicitud</th>
                    <th>Título</th>
                    <th>Destino</th>
                    <th>Proveedor</th>
                    <th>Total</th>
                    <th>{{ activeTab === 'pending' ? 'Fecha Requerida' : 'Fecha Est. Entrega' }}</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (request of filteredRequests(); track request.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/purchases/purchase-requests/show', request.id]">
                          <strong>{{ request.request_number }}</strong>
                        </a>
                      </td>
                      <td>{{ request.title }}</td>
                      <td>
                        @if (request.destination_area) {
                          <span class="badge bg-light text-dark">
                            {{ request.destination_area.name }}
                            @if (request.destination_department) {
                              - {{ request.destination_department.name }}
                            }
                          </span>
                        } @else {
                          {{ request.manual_destination || '-' }}
                        }
                      </td>
                      <td>{{ request.provider?.shortname || request.provider?.company || '-' }}</td>
                      <td>{{ formatCurrency(request.total) }}</td>
                      <td>
                        @if (activeTab === 'pending') {
                          <span [class.text-danger]="isOverdue(request.required_date)">
                            {{ formatDate(request.required_date) }}
                          </span>
                        } @else {
                          {{ formatDate(request.estimated_delivery_date) || 'No especificada' }}
                        }
                      </td>
                      <td>
                        @if (activeTab === 'pending') {
                          <span class="badge bg-warning text-dark">
                            <i class="fa fa-clock me-1"></i>Pendiente
                          </span>
                        } @else {
                          <span class="badge bg-info">
                            <i class="fa fa-truck me-1"></i>En Tránsito
                          </span>
                        }
                      </td>
                      <td class="text-end">
                        @if (activeTab === 'pending') {
                          <button
                            class="btn btn-sm btn-success"
                            (click)="openMarkPurchasedModal(request)"
                            title="Marcar como comprado">
                            <i class="fa fa-shopping-cart me-1"></i>Comprar
                          </button>
                        } @else {
                          <button
                            class="btn btn-sm btn-primary"
                            (click)="confirmMarkReceived(request)"
                            title="Marcar como recibido">
                            <i class="fa fa-check me-1"></i>Recibido
                          </button>
                        }
                        <button
                          class="btn btn-sm btn-outline-secondary ms-1"
                          [routerLink]="['/purchases/purchase-requests/show', request.id]"
                          title="Ver detalle">
                          <i class="fa fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="text-center py-5 text-muted">
                        <i class="fa fa-inbox fa-3x mb-3 d-block"></i>
                        @if (activeTab === 'pending') {
                          No hay solicitudes pendientes de compra
                        } @else {
                          No hay solicitudes en tránsito
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </main>

    <!-- Modal Marcar como Comprado -->
    @if (showPurchasedModal) {
      <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title">
                <i class="fa fa-shopping-cart me-2"></i>
                Marcar como Comprado
              </h5>
              <button type="button" class="btn-close btn-close-white" (click)="closePurchasedModal()"></button>
            </div>
            <form [formGroup]="purchasedForm" (ngSubmit)="submitMarkPurchased()">
              <div class="modal-body">
                <div class="alert alert-info mb-3">
                  <strong>Solicitud:</strong> {{ selectedRequest?.request_number }}<br>
                  <strong>Título:</strong> {{ selectedRequest?.title }}
                </div>

                <div class="mb-3">
                  <label class="form-label">Fecha estimada de entrega</label>
                  <input
                    type="date"
                    class="form-control"
                    formControlName="estimated_delivery_date"
                    [min]="today">
                </div>

                <div class="mb-3">
                  <label class="form-label">URL de imagen del recibo (opcional)</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="receipt_image_url"
                    placeholder="https://...">
                  <small class="text-muted">Puede agregar una URL con imagen del comprobante de compra</small>
                </div>

                <div class="mb-3">
                  <label class="form-label">Notas</label>
                  <textarea
                    class="form-control"
                    formControlName="notes"
                    rows="2"
                    placeholder="Notas sobre la compra (opcional)"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closePurchasedModal()">Cancelar</button>
                <button type="submit" class="btn btn-success" [disabled]="saving()">
                  @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  <i class="fa fa-check me-1"></i>Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .table td { vertical-align: middle; }
  `]
})
export class PurchaseTrackingComponent implements OnInit {
  private purchaseService = inject(PurchaseRequestService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Estado
  loading = signal(false);
  saving = signal(false);
  activeTab: 'pending' | 'purchased' = 'pending';

  // Datos
  pendingRequests = signal<PurchaseRequest[]>([]);
  purchasedRequests = signal<PurchaseRequest[]>([]);
  filteredRequests = signal<PurchaseRequest[]>([]);
  destinationAreas = signal<DestinationArea[]>([]);

  pendingCount = signal(0);
  purchasedCount = signal(0);

  // Filtros
  selectedAreaId: number | null = null;
  searchTerm = '';

  // Modal
  showPurchasedModal = false;
  selectedRequest: PurchaseRequest | null = null;
  purchasedForm!: FormGroup;

  today = new Date().toISOString().split('T')[0];

  ngOnInit() {
    this.initForm();
    this.loadDestinationAreas();
    this.loadData();
  }

  initForm() {
    this.purchasedForm = this.fb.group({
      estimated_delivery_date: [null],
      receipt_image_url: [''],
      notes: ['']
    });
  }

  loadDestinationAreas() {
    this.purchaseService.getDestinationOptions().subscribe({
      next: (response) => {
        if (response.success) {
          this.destinationAreas.set(response.data);
        }
      }
    });
  }

  loadData() {
    this.loading.set(true);
    const filters: any = {};
    if (this.selectedAreaId) {
      filters.destination_area_id = this.selectedAreaId;
    }

    if (this.activeTab === 'pending') {
      this.purchaseService.getPendingPurchase(filters).subscribe({
        next: (response) => {
          this.pendingRequests.set(response.data || []);
          this.pendingCount.set(response.meta?.total || response.data?.length || 0);
          this.filterRequests();
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else {
      this.purchaseService.getPurchasedNotReceived(filters).subscribe({
        next: (response) => {
          this.purchasedRequests.set(response.data || []);
          this.purchasedCount.set(response.meta?.total || response.data?.length || 0);
          this.filterRequests();
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }

    // Cargar contadores del otro tab
    if (this.activeTab === 'pending') {
      this.purchaseService.getPurchasedNotReceived({}).subscribe({
        next: (r) => this.purchasedCount.set(r.meta?.total || r.data?.length || 0)
      });
    } else {
      this.purchaseService.getPendingPurchase({}).subscribe({
        next: (r) => this.pendingCount.set(r.meta?.total || r.data?.length || 0)
      });
    }
  }

  changeTab(tab: 'pending' | 'purchased') {
    this.activeTab = tab;
    this.loadData();
  }

  filterRequests() {
    const source = this.activeTab === 'pending' ? this.pendingRequests() : this.purchasedRequests();

    if (!this.searchTerm) {
      this.filteredRequests.set(source);
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredRequests.set(
      source.filter(r =>
        r.request_number?.toLowerCase().includes(term) ||
        r.title?.toLowerCase().includes(term)
      )
    );
  }

  // ==================== ACCIONES ====================

  openMarkPurchasedModal(request: PurchaseRequest) {
    this.selectedRequest = request;
    this.purchasedForm.reset();
    this.showPurchasedModal = true;
  }

  closePurchasedModal() {
    this.showPurchasedModal = false;
    this.selectedRequest = null;
  }

  submitMarkPurchased() {
    if (!this.selectedRequest) return;

    this.saving.set(true);
    const data = this.purchasedForm.value;

    this.purchaseService.markAsPurchased(this.selectedRequest.id, data).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Compra registrada',
          text: 'La solicitud ha sido marcada como comprada',
          timer: 2000,
          showConfirmButton: false
        });
        this.closePurchasedModal();
        this.loadData();
        this.saving.set(false);
      },
      error: (error) => {
        Swal.fire('Error', error.error?.message || 'Error al registrar la compra', 'error');
        this.saving.set(false);
      }
    });
  }

  confirmMarkReceived(request: PurchaseRequest) {
    Swal.fire({
      title: '¿Confirmar recepción?',
      html: `
        <p>Está por marcar como recibida la solicitud:</p>
        <p><strong>${request.request_number}</strong></p>
        <p>${request.title}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-check me-1"></i>Sí, recibido',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        this.markAsReceived(request);
      }
    });
  }

  markAsReceived(request: PurchaseRequest) {
    this.loading.set(true);
    this.purchaseService.markAsReceived(request.id).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Recepción confirmada',
          text: 'La solicitud ha sido marcada como recibida',
          timer: 2000,
          showConfirmButton: false
        });
        this.loadData();
      },
      error: (error) => {
        Swal.fire('Error', error.error?.message || 'Error al confirmar recepción', 'error');
        this.loading.set(false);
      }
    });
  }

  // ==================== UTILIDADES ====================

  formatCurrency(value: number | null | undefined): string {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX');
    } catch {
      return dateStr;
    }
  }

  isOverdue(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }
}
