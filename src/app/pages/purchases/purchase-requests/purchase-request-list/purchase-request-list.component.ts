import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { PurchaseRequestService } from '../purchase-request.service';
import { SharedService } from '../../../../servicios/shared.service';
import {
  PurchaseRequest,
  PurchaseRequestStatus,
  PurchaseRequestFilters,
  PRIORITIES,
  STATUS_CODES
} from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-request-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-request-list.component.html',
  styleUrls: ['./purchase-request-list.component.css']
})
export class PurchaseRequestListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private sharedService = inject(SharedService);

  purchaseRequests: PurchaseRequest[] = [];
  statuses: PurchaseRequestStatus[] = [];
  priorities = PRIORITIES;

  loading = false;
  error: string | null = null;

  // Modo de vista (normal o pending-preauthorization)
  listMode: 'normal' | 'pending-preauthorization' = 'normal';

  // Filtros
  filters: PurchaseRequestFilters = {
    sort_by: 'created_at',
    sort_dir: 'desc',
    per_page: 15
  };

  // Paginación
  currentPage = 1;
  totalPages = 1;
  total = 0;

  // Vista
  viewMode: 'table' | 'cards' = 'table';

  constructor(
    private purchaseRequestService: PurchaseRequestService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si estamos en modo pending-preauthorization
    this.route.data.subscribe(data => {
      if (data['mode'] === 'pending-preauthorization') {
        this.listMode = 'pending-preauthorization';
      }
    });

    this.loadStatuses();
    this.loadPurchaseRequests();

    // Configurar debounce para búsqueda
    this.searchSubject.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadPurchaseRequests();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatuses(): void {
    this.purchaseRequestService.getStatuses().subscribe({
      next: (response) => {
        this.statuses = response.data || [];
      }
    });
  }

  loadPurchaseRequests(): void {
    this.loading = true;
    this.error = null;

    const params: PurchaseRequestFilters = {
      ...this.filters,
      page: this.currentPage
    };

    // Si estamos en modo pending-preauthorization, usar endpoint especial
    if (this.listMode === 'pending-preauthorization') {
      this.purchaseRequestService.getPendingPreAuthorization(params).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.purchaseRequests = response.data || [];
          this.totalPages = response.meta?.last_page || 1;
          this.total = response.meta?.total || 0;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar las solicitudes pendientes';
          this.loading = false;
          console.error('Error:', err);
        }
      });
      return;
    }

    this.purchaseRequestService.list(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.purchaseRequests = response.data || [];
        this.totalPages = response.meta?.last_page || 1;
        this.total = response.meta?.total || 0;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las solicitudes de compra';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filters.search = value;
    this.searchSubject.next(value);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadPurchaseRequests();
  }

  clearFilters(): void {
    this.filters = {
      sort_by: 'created_at',
      sort_dir: 'desc',
      per_page: 15
    };
    this.currentPage = 1;
    this.loadPurchaseRequests();
  }

  toggleMyRequests(): void {
    this.filters.my_requests = !this.filters.my_requests;
    this.applyFilters();
  }

  togglePendingApproval(): void {
    this.filters.pending_approval = !this.filters.pending_approval;
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPurchaseRequests();
    }
  }

  // Navegación
  addNew(): void {
    this.router.navigate(['/purchases/purchase-requests/add']);
  }

  addNewWithPricing(): void {
    // Navegar al formulario con modo de precios/proveedor directo
    this.router.navigate(['/purchases/purchase-requests/add'], { queryParams: { withPricing: true } });
  }

  viewRequest(request: PurchaseRequest): void {
    this.router.navigate(['/purchases/purchase-requests/show', request.id]);
  }

  editRequest(request: PurchaseRequest): void {
    this.router.navigate(['/purchases/purchase-requests/edit', request.id]);
  }

  preauthorizeRequest(request: PurchaseRequest): void {
    this.router.navigate(['/purchases/purchase-requests/preauthorize', request.id]);
  }

  // Acciones
  async submitRequest(request: PurchaseRequest): Promise<void> {
    const result = await Swal.fire({
      title: 'Enviar para Aprobación',
      text: '¿Está seguro de enviar esta solicitud para aprobación?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd'
    });

    if (result.isConfirmed) {
      this.purchaseRequestService.submit(request.id).subscribe({
        next: () => {
          Swal.fire('Enviada', 'La solicitud ha sido enviada para aprobación', 'success');
          this.loadPurchaseRequests();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo enviar la solicitud', 'error');
        }
      });
    }
  }

  async approveRequest(request: PurchaseRequest): Promise<void> {
    const { value: notes } = await Swal.fire({
      title: 'Aprobar Solicitud',
      input: 'textarea',
      inputLabel: 'Notas de aprobación (opcional)',
      inputPlaceholder: 'Escriba aquí sus notas...',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754'
    });

    if (notes !== undefined) {
      this.purchaseRequestService.approve(request.id, notes).subscribe({
        next: () => {
          Swal.fire('Aprobada', 'La solicitud ha sido aprobada', 'success');
          this.loadPurchaseRequests();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo aprobar la solicitud', 'error');
        }
      });
    }
  }

  async rejectRequest(request: PurchaseRequest): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Rechazar Solicitud',
      input: 'textarea',
      inputLabel: 'Motivo de rechazo',
      inputPlaceholder: 'Escriba el motivo del rechazo...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (reason) {
      this.purchaseRequestService.reject(request.id, reason).subscribe({
        next: () => {
          Swal.fire('Rechazada', 'La solicitud ha sido rechazada', 'success');
          this.loadPurchaseRequests();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo rechazar la solicitud', 'error');
        }
      });
    }
  }

  async cancelRequest(request: PurchaseRequest): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Cancelar Solicitud',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Escriba el motivo de la cancelación...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Cancelar Solicitud',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545'
    });

    if (reason) {
      this.purchaseRequestService.cancel(request.id, reason).subscribe({
        next: () => {
          Swal.fire('Cancelada', 'La solicitud ha sido cancelada', 'success');
          this.loadPurchaseRequests();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo cancelar la solicitud', 'error');
        }
      });
    }
  }

  async deleteRequest(request: PurchaseRequest): Promise<void> {
    const result = await Swal.fire({
      title: 'Eliminar Solicitud',
      text: '¿Está seguro de eliminar esta solicitud? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      this.purchaseRequestService.delete(request.id).subscribe({
        next: () => {
          Swal.fire('Eliminada', 'La solicitud ha sido eliminada', 'success');
          this.loadPurchaseRequests();
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo eliminar la solicitud', 'error');
        }
      });
    }
  }

  // Helpers
  canEdit(request: PurchaseRequest): boolean {
    return this.purchaseRequestService.canEdit(request);
  }

  canSubmit(request: PurchaseRequest): boolean {
    return this.purchaseRequestService.canSubmit(request);
  }

  canApprove(request: PurchaseRequest): boolean {
    return this.purchaseRequestService.canApprove(request);
  }

  canCancel(request: PurchaseRequest): boolean {
    return this.purchaseRequestService.canCancel(request);
  }

  canPreauthorize(request: PurchaseRequest): boolean {
    // Verificar que tiene el permiso de pre-autorización
    const hasPreauthorizePermission = this.sharedService.hasPermission('purchase-requests', '', 'pre-authorize');
    if (!hasPreauthorizePermission) return false;

    // Si es el creador, solo puede pre-autorizar si es super-admin
    const isCreator = this.purchaseRequestService.isCurrentUserCreator(request);
    if (isCreator && !this.sharedService.isSuperAdmin()) return false;

    const code = request.status?.code?.toUpperCase();
    // Aceptar SUBMITTED, RELEASED (nuevo), y REVIEW
    return code === STATUS_CODES.SUBMITTED ||
           code === STATUS_CODES.RELEASED ||
           code === 'RELEASED' ||
           code === STATUS_CODES.REVIEW;
  }

  canConvertToPO(request: PurchaseRequest): boolean {
    // Verificar permiso
    const hasPreauthorizePermission = this.sharedService.hasPermission('purchase-requests', '', 'pre-authorize');
    if (!hasPreauthorizePermission) return false;

    // Si es el creador, solo puede convertir si es super-admin
    const isCreator = this.purchaseRequestService.isCurrentUserCreator(request);
    if (isCreator && !this.sharedService.isSuperAdmin()) return false;

    return request.status?.code === STATUS_CODES.PRE_AUTHORIZED;
  }

  getListTitle(): string {
    return this.listMode === 'pending-preauthorization'
      ? 'Solicitudes de Orden de Compra Pendientes de Autorización'
      : 'Solicitudes de Compra';
  }

  formatCurrency(value: number): string {
    return this.purchaseRequestService.formatCurrency(value);
  }

  formatDate(date: string): string {
    return this.purchaseRequestService.formatDate(date);
  }

  getPriorityColor(priority: string): string {
    return this.purchaseRequestService.getPriorityColor(priority);
  }

  getPriorityLabel(priority: string): string {
    return this.purchaseRequestService.getPriorityLabel(priority);
  }

  getPriorityIcon(priority: string): string {
    return this.purchaseRequestService.getPriorityIcon(priority);
  }

  /**
   * Obtener lista de proveedores únicos de los items de la solicitud
   */
  getItemProviders(request: PurchaseRequest): string[] {
    if (!request.items || request.items.length === 0) return [];

    const providers = new Set<string>();
    request.items.forEach(item => {
      if (item.provider_name) {
        providers.add(item.provider_name);
      }
    });
    return Array.from(providers);
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
