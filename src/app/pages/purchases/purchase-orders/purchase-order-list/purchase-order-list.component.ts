import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderFilters,
  PRIORITIES,
  ORDER_STATUS_CODES
} from '../purchase-orders';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss']
})
export class PurchaseOrderListComponent implements OnInit {
  orders: PurchaseOrder[] = [];
  statuses: PurchaseOrderStatus[] = [];
  loading = false;

  // Math for template
  Math = Math;

  // Pagination
  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  total = 0;

  // Filters
  filters: PurchaseOrderFilters = {
    search: '',
    status_id: undefined,
    priority: undefined,
    pending_receipt: false,
    not_invoiced: false,
    my_orders: false,
    sort_by: 'created_at',
    sort_dir: 'desc'
  };

  priorities = PRIORITIES;
  showFilters = false;
  viewMode: 'table' | 'cards' = 'table';

  constructor(
    private orderService: PurchaseOrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadOrders();
  }

  loadStatuses(): void {
    this.orderService.getStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
      }
    });
  }

  loadOrders(): void {
    this.loading = true;

    const params: PurchaseOrderFilters = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.orderService.list(params).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.currentPage = response.meta.current_page;
        this.lastPage = response.meta.last_page;
        this.total = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las órdenes de compra', 'error');
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status_id: undefined,
      priority: undefined,
      pending_receipt: false,
      not_invoiced: false,
      my_orders: false,
      sort_by: 'created_at',
      sort_dir: 'desc'
    };
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearch(): void {
    this.applyFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleMyOrders(): void {
    this.filters.my_orders = !this.filters.my_orders;
    this.applyFilters();
  }

  togglePendingReceipt(): void {
    this.filters.pending_receipt = !this.filters.pending_receipt;
    this.applyFilters();
  }

  toggleNotInvoiced(): void {
    this.filters.not_invoiced = !this.filters.not_invoiced;
    this.applyFilters();
  }

  sortBy(column: string): void {
    if (this.filters.sort_by === column) {
      this.filters.sort_dir = this.filters.sort_dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort_by = column;
      this.filters.sort_dir = 'desc';
    }
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  // Actions
  viewOrder(order: PurchaseOrder): void {
    this.router.navigate(['/purchases/purchase-orders/show', order.id]);
  }

  editOrder(order: PurchaseOrder): void {
    if (this.canEdit(order)) {
      this.router.navigate(['/purchases/purchase-orders/edit', order.id]);
    }
  }

  receiveOrder(order: PurchaseOrder): void {
    if (this.canReceive(order)) {
      this.router.navigate(['/purchases/purchase-orders/receive', order.id]);
    }
  }

  async submitOrder(order: PurchaseOrder): Promise<void> {
    const result = await Swal.fire({
      title: '¿Enviar para aprobación?',
      text: `La orden ${order.order_number} será enviada para su aprobación`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.orderService.submit(order.id).subscribe({
        next: () => {
          Swal.fire('Enviada', 'La orden ha sido enviada para aprobación', 'success');
          this.loadOrders();
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo enviar la orden', 'error');
        }
      });
    }
  }

  async approveOrder(order: PurchaseOrder): Promise<void> {
    const result = await Swal.fire({
      title: '¿Aprobar orden?',
      text: `Se aprobará la orden ${order.order_number}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.orderService.approve(order.id).subscribe({
        next: () => {
          Swal.fire('Aprobada', 'La orden ha sido aprobada', 'success');
          this.loadOrders();
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo aprobar la orden', 'error');
        }
      });
    }
  }

  async sendOrder(order: PurchaseOrder): Promise<void> {
    const { value: method } = await Swal.fire({
      title: 'Enviar al proveedor',
      input: 'select',
      inputOptions: {
        'email': 'Por correo electrónico',
        'portal': 'Por portal del proveedor',
        'fax': 'Por fax',
        'phone': 'Por teléfono'
      },
      inputPlaceholder: 'Seleccione el método de envío',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar'
    });

    if (method) {
      this.orderService.send(order.id, method).subscribe({
        next: () => {
          Swal.fire('Enviada', 'La orden ha sido enviada al proveedor', 'success');
          this.loadOrders();
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo enviar la orden', 'error');
        }
      });
    }
  }

  async cancelOrder(order: PurchaseOrder): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: '¿Cancelar orden?',
      text: `Se cancelará la orden ${order.order_number}`,
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Ingrese el motivo de la cancelación...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe ingresar un motivo (mínimo 10 caracteres)';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'No, mantener'
    });

    if (reason) {
      this.orderService.cancel(order.id, reason).subscribe({
        next: () => {
          Swal.fire('Cancelada', 'La orden ha sido cancelada', 'success');
          this.loadOrders();
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo cancelar la orden', 'error');
        }
      });
    }
  }

  async deleteOrder(order: PurchaseOrder): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      text: `Se eliminará la orden ${order.order_number}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.orderService.delete(order.id).subscribe({
        next: () => {
          Swal.fire('Eliminada', 'La orden ha sido eliminada', 'success');
          this.loadOrders();
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo eliminar la orden', 'error');
        }
      });
    }
  }

  // Helpers
  canEdit(order: PurchaseOrder): boolean {
    return this.orderService.canEdit(order);
  }

  canSubmitForAuth(order: PurchaseOrder): boolean {
    // Puede enviar a autorización si está en DRAFT o PROVIDERS_ASSIGNED (devuelta)
    const allowedStatuses = ['DRAFT', 'PROVIDERS_ASSIGNED', 'ASSIGNING_PROVIDERS'];
    return allowedStatuses.includes(order.status?.code || '');
  }

  canAssignProvider(order: PurchaseOrder): boolean {
    // Puede asignar proveedor si no tiene proveedor, tiene solicitud de compra asociada y está en estados iniciales
    const allowedStatuses = ['DRAFT', 'ASSIGNING_PROVIDERS', 'PROVIDERS_ASSIGNED'];
    const hasPurchaseRequest = !!(order.purchase_request_id || order.purchase_request?.id);
    return !order.provider_id && hasPurchaseRequest && allowedStatuses.includes(order.status?.code || '');
  }

  assignProvider(order: PurchaseOrder): void {
    // Navegar a la vista de pre-autorización de la solicitud de compra para asignar proveedor
    const purchaseRequestId = order.purchase_request_id || order.purchase_request?.id;
    if (purchaseRequestId) {
      this.router.navigate(['/purchases/purchase-requests', purchaseRequestId, 'pre-authorize'], {
        queryParams: { assignProvider: 'true', orderId: order.id }
      });
    }
  }

  canApprove(order: PurchaseOrder): boolean {
    return this.orderService.canApprove(order);
  }

  canSend(order: PurchaseOrder): boolean {
    return this.orderService.canSend(order);
  }

  canReceive(order: PurchaseOrder): boolean {
    return this.orderService.canReceive(order);
  }

  canCancel(order: PurchaseOrder): boolean {
    return this.orderService.canCancel(order);
  }

  formatCurrency(value: number): string {
    return this.orderService.formatCurrency(value);
  }

  formatDate(date: string): string {
    return this.orderService.formatDate(date);
  }

  getPriorityLabel(priority: string): string {
    return this.orderService.getPriorityLabel(priority);
  }

  getPriorityColor(priority: string): string {
    return this.orderService.getPriorityColor(priority);
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.lastPage, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByOrderId(index: number, order: PurchaseOrder): number {
    return order.id;
  }
}
