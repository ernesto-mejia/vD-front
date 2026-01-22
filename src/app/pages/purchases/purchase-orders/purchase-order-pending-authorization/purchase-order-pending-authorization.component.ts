import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService, POAuthorizationSummary } from '../purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderFilters,
  PRIORITIES
} from '../purchase-orders';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { PurchaseOrderPermissionService } from '../services/purchase-order-permission.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

/**
 * Componente para autorizar OCs (Fase 4 del flujo de 4 fases)
 *
 * FLUJO DE 4 FASES:
 * 1. Solicitud de Compra (SC)
 * 2. Autorización de Solicitud
 * 3. Orden de Compra (OC) - Asignación de proveedores/precios
 * 4. [ESTE MÓDULO] Autorización de OC - Finanzas/Administración autoriza
 * 5. Por Comprar - Ejecutar compras con proveedores
 */
@Component({
  selector: 'app-purchase-order-pending-authorization',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-order-pending-authorization.component.html',
  styleUrls: ['./purchase-order-pending-authorization.component.scss']
})
export class PurchaseOrderPendingAuthorizationComponent implements OnInit {
  orders: PurchaseOrder[] = [];
  statuses: PurchaseOrderStatus[] = [];
  loading = false;
  processingOrder: number | null = null;

  // Summary data
  summary: POAuthorizationSummary | null = null;

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
    priority: undefined,
    sort_by: 'created_at',
    sort_dir: 'asc'
  };

  priorities = PRIORITIES;
  showFilters = false;
  viewMode: 'table' | 'cards' = 'table';

  constructor(
    private orderService: PurchaseOrderService,
    private permissionService: PurchaseOrderPermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      summary: this.orderService.getMyAuthorizationSummary(),
      orders: this.orderService.listPendingPOAuthorization({
        ...this.filters,
        page: this.currentPage,
        per_page: this.perPage
      })
    }).subscribe({
      next: (results) => {
        if (results.summary.success) {
          this.summary = results.summary.data;
        }

        this.orders = results.orders.data;
        this.currentPage = results.orders.meta.current_page;
        this.lastPage = results.orders.meta.last_page;
        this.total = results.orders.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
      }
    });
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
    this.loadData();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      priority: undefined,
      sort_by: 'created_at',
      sort_dir: 'asc'
    };
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearch(): void {
    this.applyFilters();
  }

  goToNewOrder(): void {
    this.router.navigate(['/purchases/purchase-orders/add']);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
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

  /**
   * Autorizar Orden de Compra
   */
  async authorizePO(order: PurchaseOrder): Promise<void> {
    const { value: notes } = await Swal.fire({
      title: 'Autorizar Orden de Compra',
      html: `
        <p>¿Autorizar la orden <strong>${order.order_number}</strong> para proceder a compra?</p>
        <p class="text-muted">Proveedor: ${order.provider?.company || 'No especificado'}</p>
        <p class="text-muted">Total: ${this.formatCurrency(order.total || 0)}</p>
      `,
      input: 'textarea',
      inputLabel: 'Notas (opcional)',
      inputPlaceholder: 'Agregar notas de autorización...',
      showCancelButton: true,
      confirmButtonText: 'Autorizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      icon: 'question'
    });

    if (notes !== undefined) {
      this.processingOrder = order.id;

      this.orderService.authorizePO(order.id, notes || undefined).subscribe({
        next: () => {
          this.processingOrder = null;
          Swal.fire('Autorizada', 'La orden de compra ha sido autorizada. Lista para proceder a compra.', 'success');
          this.loadOrders();
        },
        error: (error) => {
          this.processingOrder = null;
          Swal.fire('Error', error.error?.message || 'No se pudo autorizar la orden', 'error');
        }
      });
    }
  }

  /**
   * Devolver OC a Compras para modificar proveedores/precios
   */
  async returnToPurchasing(order: PurchaseOrder): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Devolver a Compras',
      html: `
        <p>La orden <strong>${order.order_number}</strong> será devuelta al área de compras para modificar proveedores o precios.</p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de devolución',
      inputPlaceholder: 'Escriba el motivo de la devolución...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
      icon: 'warning'
    });

    if (reason) {
      this.processingOrder = order.id;

      this.orderService.returnToPurchasing(order.id, reason).subscribe({
        next: () => {
          this.processingOrder = null;
          Swal.fire('Devuelta', 'La orden ha sido devuelta al área de compras', 'success');
          this.loadOrders();
        },
        error: (error) => {
          this.processingOrder = null;
          Swal.fire('Error', error.error?.message || 'No se pudo devolver la orden', 'error');
        }
      });
    }
  }

  /**
   * Devolver OC hasta la Solicitud original
   */
  async returnToRequest(order: PurchaseOrder): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Devolver a Solicitud',
      html: `
        <p><strong>⚠️ Acción mayor:</strong> La orden <strong>${order.order_number}</strong> será devuelta hasta la solicitud de compra original.</p>
        <p class="text-muted">El solicitante deberá corregir y volver a enviar la solicitud.</p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de devolución',
      inputPlaceholder: 'Escriba el motivo detallado de la devolución...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Devolver a Solicitud',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      icon: 'warning'
    });

    if (reason) {
      this.processingOrder = order.id;

      this.orderService.returnToRequest(order.id, reason).subscribe({
        next: () => {
          this.processingOrder = null;
          Swal.fire('Devuelta', 'La orden ha sido devuelta hasta la solicitud original', 'success');
          this.loadOrders();
        },
        error: (error) => {
          this.processingOrder = null;
          Swal.fire('Error', error.error?.message || 'No se pudo devolver la orden', 'error');
        }
      });
    }
  }

  /**
   * Cancelar Orden de Compra
   */
  async cancelOrder(order: PurchaseOrder): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Cancelar Orden de Compra',
      html: `
        <p><strong>⚠️ Esta acción no se puede deshacer.</strong></p>
        <p>La orden <strong>${order.order_number}</strong> será cancelada permanentemente.</p>
        <p class="text-muted">Proveedor: ${order.provider?.company || 'No especificado'}</p>
        <p class="text-muted">Total: ${this.formatCurrency(order.total || 0)}</p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de cancelación (obligatorio)',
      inputPlaceholder: 'Escriba el motivo detallado de la cancelación...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar orden',
      cancelButtonText: 'No, mantener',
      confirmButtonColor: '#dc3545',
      icon: 'warning'
    });

    if (reason) {
      this.processingOrder = order.id;

      this.orderService.cancel(order.id, reason).subscribe({
        next: () => {
          this.processingOrder = null;
          Swal.fire({
            title: 'Cancelada',
            text: 'La orden de compra ha sido cancelada',
            icon: 'success'
          });
          this.loadOrders();
        },
        error: (error) => {
          this.processingOrder = null;
          Swal.fire('Error', error.error?.message || 'No se pudo cancelar la orden', 'error');
        }
      });
    }
  }

  // Helpers
  canAuthorizePO(): boolean {
    return this.permissionService.canAuthorizePO();
  }

  canReturnOrder(): boolean {
    return this.permissionService.canReturnToPurchasing() || this.permissionService.canReturnToRequest();
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
