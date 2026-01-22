import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderFilters,
  ProviderItemGroup,
  PRIORITIES,
  ORDER_STATUS_CODES,

} from '../purchase-orders';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { PurchaseOrderPermissionService } from '../services/purchase-order-permission.service';
import Swal from 'sweetalert2';
declare var bootstrap: any;

interface PurchaseFormData {
  estimated_delivery_date: string;
  estimated_delivery_time: string;
  notes: string;
  receipt?: File;
}

/**
 * Componente para gestionar OCs Por Comprar (Fase 5)
 *
 * FLUJO DE 5 FASES:
 * 1. Solicitud de Compra (SC)
 * 2. Autorización de Solicitud
 * 3. Orden de Compra (OC) - Asignación de proveedores
 * 4. Autorización de OC
 * 5. [ESTE MÓDULO] Por Comprar - Ejecutar compras con proveedores
 *
 * Funcionalidades:
 * - Mostrar OCs autorizadas en formato de tabla
 * - Proceder a compra por cada proveedor individual
 * - Subir comprobante/recibo
 * - Establecer fecha y hora de entrega estimada
 * - Mostrar progreso de compras (% completado)
 */
@Component({
  selector: 'app-purchase-order-authorized',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-order-authorized.component.html',
  styleUrls: ['./purchase-order-authorized.component.scss']
})
export class PurchaseOrderAuthorizedComponent implements OnInit {
  orders: PurchaseOrder[] = [];
  statuses: PurchaseOrderStatus[] = [];
  loading = false;

  // Math for template
  Math = Math;

  // Datos de proveedores por orden
  orderProviders: { [orderId: number]: ProviderItemGroup[] } = {};
  loadingProviders: { [orderId: number]: boolean } = {};
  completionPercentages: { [orderId: number]: number } = {};

  // Estado de procesamiento
  processingPurchase = false;

  // Modal y formulario de compra
  selectedOrder: PurchaseOrder | null = null;
  purchaseFormData: { [providerId: number]: PurchaseFormData } = {};
  expandedProviders: { [providerId: number]: boolean } = {};
  today = new Date().toISOString().split('T')[0];
  private purchaseModal: any;

  // Pagination
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  total = 0;

  // Filters
  filters: PurchaseOrderFilters = {
    search: '',
    status_code: ORDER_STATUS_CODES.AUTHORIZED,
    priority: undefined,
    sort_by: 'created_at',
    sort_dir: 'desc'
  };

  priorities = PRIORITIES;

  constructor(
    private orderService: PurchaseOrderService,
    private permissionService: PurchaseOrderPermissionService,
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

    this.orderService.listReadyForPurchase(params).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.currentPage = response.meta.current_page;
        this.lastPage = response.meta.last_page;
        this.total = response.meta.total;
        this.loading = false;

        // Cargar automáticamente los proveedores de cada orden
        this.orders.forEach(order => {
          this.loadProviderPurchases(order.id);
        });
      },
      error: (error) => {
        console.error('Error loading authorized orders:', error);
        this.loadOrdersFallback(params);
      }
    });
  }

  loadOrdersFallback(params: PurchaseOrderFilters): void {
    params.status_code = ORDER_STATUS_CODES.AUTHORIZED;

    this.orderService.list(params).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.currentPage = response.meta.current_page;
        this.lastPage = response.meta.last_page;
        this.total = response.meta.total;
        this.loading = false;

        this.orders.forEach(order => {
          this.loadProviderPurchases(order.id);
        });
      },
      error: (error) => {
        console.error('Error loading orders (fallback):', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las órdenes de compra', 'error');
      }
    });
  }

  /**
   * Cargar los proveedores y estado de compras para una orden
   */
  loadProviderPurchases(orderId: number): void {
    this.loadingProviders[orderId] = true;

    this.orderService.getProviderPurchases(orderId).subscribe({
      next: (response) => {
        this.orderProviders[orderId] = response.data.providers;
        this.completionPercentages[orderId] = response.data.completion_percentage;
        this.loadingProviders[orderId] = false;

        // Inicializar formularios para proveedores
        this.initPurchaseFormData(orderId);
      },
      error: (error) => {
        console.error('Error loading provider purchases:', error);
        this.loadingProviders[orderId] = false;

        // Fallback: crear estructura básica con el proveedor principal
        const order = this.orders.find(o => o.id === orderId);
        if (order && order.provider) {
          this.orderProviders[orderId] = [{
            provider_id: order.provider.id,
            provider_name: order.provider.company || order.provider.name || 'Sin nombre',
            provider: order.provider,
            items: order.items || [],
            subtotal: order.subtotal || 0,
            vat_amount: order.vat_amount || 0,
            total: order.total || 0,
            is_purchased: !!order.purchased_at,
            purchased_at: order.purchased_at
          }];
          this.completionPercentages[orderId] = order.purchased_at ? 100 : 0;
        }

        // Inicializar formularios para proveedores
        this.initPurchaseFormData(orderId);
      }
    });
  }

  /**
   * Inicializar datos del formulario para cada proveedor
   */
  private initPurchaseFormData(orderId: number): void {
    const providers = this.orderProviders[orderId] || [];
    providers.forEach(provider => {
      if (!this.purchaseFormData[provider.provider_id]) {
        this.purchaseFormData[provider.provider_id] = {
          estimated_delivery_date: '',
          estimated_delivery_time: '',
          notes: ''
        };
      }
    });
  }

  /**
   * Obtener nombres de proveedores concatenados
   */
  getProviderNames(orderId: number): string {
    const providers = this.orderProviders[orderId] || [];
    return providers.map(p => p.provider_name).join(', ');
  }

  /**
   * Obtener porcentaje de completado para una orden
   */
  getCompletionPercentage(orderId: number): number {
    return this.completionPercentages[orderId] || 0;
  }

  /**
   * Ordenar por columna
   */
  sortBy(column: string): void {
    if (this.filters.sort_by === column) {
      this.filters.sort_dir = this.filters.sort_dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort_by = column;
      this.filters.sort_dir = 'asc';
    }
    this.loadOrders();
  }

  /**
   * Abrir vista de compra para una orden
   */
  openPurchaseView(order: PurchaseOrder): void {
    this.selectedOrder = order;

    // Asegurar que los proveedores estén cargados
    if (!this.orderProviders[order.id]) {
      this.loadProviderPurchases(order.id);
    } else {
      this.initPurchaseFormData(order.id);
    }

    // Abrir modal
    const modalElement = document.getElementById('purchaseModal');
    if (modalElement) {
      this.purchaseModal = new bootstrap.Modal(modalElement);
      this.purchaseModal.show();
    }
  }

  /**
   * Toggle para mostrar/ocultar items de un proveedor
   */
  toggleProviderItems(providerId: number): void {
    this.expandedProviders[providerId] = !this.expandedProviders[providerId];
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: Event, providerId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.purchaseFormData[providerId].receipt = input.files[0];
    }
  }

  /**
   * Confirmar compra con un proveedor
   */
  confirmPurchase(order: PurchaseOrder, provider: ProviderItemGroup): void {
    const formData = this.purchaseFormData[provider.provider_id];

    if (!formData?.estimated_delivery_date) {
      Swal.fire('Error', 'La fecha estimada de entrega es requerida', 'warning');
      return;
    }

    this.processingPurchase = true;

    Swal.fire({
      title: 'Procesando...',
      text: 'Registrando la compra',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.orderService.confirmProviderPurchase(order.id, provider.provider_id, {
      estimated_delivery_date: formData.estimated_delivery_date,
      estimated_delivery_time: formData.estimated_delivery_time || undefined,
      notes: formData.notes || undefined,
      receipt: formData.receipt
    }).subscribe({
      next: (response) => {
        this.processingPurchase = false;
        Swal.close();

        const completionMsg = response.data.all_providers_completed
          ? '¡Todas las compras de esta OC han sido completadas!'
          : `Progreso: ${response.data.completion_percentage.toFixed(0)}%`;

        Swal.fire({
          title: '¡Compra Registrada!',
          html: `
            <p>La compra con <strong>${provider.provider_name}</strong> ha sido registrada exitosamente.</p>
            <p class="text-success fw-bold">${completionMsg}</p>
          `,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

        // Recargar datos
        this.loadProviderPurchases(order.id);
        this.loadOrders();
      },
      error: (error) => {
        this.processingPurchase = false;
        Swal.fire('Error', error.error?.message || 'No se pudo registrar la compra', 'error');
      }
    });
  }

  /**
   * Formatear fecha y hora
   */
  formatDateTime(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Mostrar modal con items del proveedor (legacy - mantener para compatibilidad)
   */
  async showProviderItems(order: PurchaseOrder, provider: ProviderItemGroup): Promise<void> {
    const itemsHtml = provider.items.map(item => `
      <tr>
        <td class="small">${item.item_code || '-'}</td>
        <td>${item.item_name}</td>
        <td class="text-center">${item.quantity_ordered} ${item.unit_of_measurement}</td>
        <td class="text-end">${this.formatCurrency(item.unit_price)}</td>
        <td class="text-end fw-bold">${this.formatCurrency(item.line_total || 0)}</td>
      </tr>
    `).join('');

    await Swal.fire({
      title: `Items de ${provider.provider_name}`,
      html: `
        <div class="table-responsive">
          <table class="table table-sm table-striped mb-0">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th class="text-center">Cantidad</th>
                <th class="text-end">P. Unit.</th>
                <th class="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot class="table-light">
              <tr>
                <td colspan="4" class="text-end fw-bold">Subtotal:</td>
                <td class="text-end">${this.formatCurrency(provider.subtotal)}</td>
              </tr>
              <tr>
                <td colspan="4" class="text-end fw-bold">IVA:</td>
                <td class="text-end">${this.formatCurrency(provider.vat_amount)}</td>
              </tr>
              <tr>
                <td colspan="4" class="text-end fw-bold">Total:</td>
                <td class="text-end fw-bold text-success">${this.formatCurrency(provider.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `,
      width: '800px',
      showConfirmButton: true,
      confirmButtonText: 'Cerrar'
    });
  }

  /**
   * Descargar PDF de la orden de compra completa
   */
  downloadPdf(order: PurchaseOrder): void {
    this.orderService.downloadPdf(order.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${order.order_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        Swal.fire({
          icon: 'success',
          title: 'PDF Descargado',
          text: `Orden ${order.order_number} descargada correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        Swal.fire('Error', 'No se pudo descargar el PDF', 'error');
      }
    });
  }

  /**
   * Descargar PDF de la orden para un proveedor específico
   */
  downloadProviderPdf(orderId: number, providerId: number): void {
    this.orderService.downloadProviderPdf(orderId, providerId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OC-${orderId}-PROV-${providerId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        Swal.fire('Error', 'No se pudo descargar el PDF', 'error');
      }
    });
  }

  /**
   * Abrir modal para confirmar compra con un proveedor
   */
  async openPurchaseModal(order: PurchaseOrder, provider: ProviderItemGroup): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const result = await Swal.fire({
      title: 'Confirmar Compra',
      html: `
        <div class="text-start">
          <div class="alert alert-info mb-3">
            <strong>OC:</strong> ${order.order_number}<br>
            <strong>Proveedor:</strong> ${provider.provider_name}<br>
            <strong>Total:</strong> ${this.formatCurrency(provider.total)}
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Fecha de entrega estimada *</label>
            <input type="date" id="swal-delivery-date" class="form-control"
                   min="${today}" required>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Hora de entrega (opcional)</label>
            <input type="time" id="swal-delivery-time" class="form-control">
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Comprobante/Recibo (opcional)</label>
            <input type="file" id="swal-receipt" class="form-control"
                   accept=".jpg,.jpeg,.png,.pdf">
            <small class="text-muted">JPG, PNG o PDF. Máx 5MB</small>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Observaciones</label>
            <textarea id="swal-notes" class="form-control" rows="2"
                      placeholder="Notas sobre la compra..."></textarea>
          </div>
        </div>
      `,
      width: '500px',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cart-check me-1"></i> Confirmar Compra',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const deliveryDate = (document.getElementById('swal-delivery-date') as HTMLInputElement).value;

        if (!deliveryDate) {
          Swal.showValidationMessage('La fecha de entrega es requerida');
          return false;
        }

        const deliveryTime = (document.getElementById('swal-delivery-time') as HTMLInputElement).value;
        const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement).value;
        const receiptInput = document.getElementById('swal-receipt') as HTMLInputElement;
        const receipt = receiptInput.files?.[0];

        return { deliveryDate, deliveryTime, notes, receipt };
      }
    });

    if (result.isConfirmed && result.value) {
      this.confirmProviderPurchase(order, provider, result.value);
    }
  }

  /**
   * Confirmar la compra con un proveedor
   */
  private confirmProviderPurchase(
    order: PurchaseOrder,
    provider: ProviderItemGroup,
    data: { deliveryDate: string; deliveryTime: string; notes: string; receipt?: File }
  ): void {
    this.processingPurchase = true;

    Swal.fire({
      title: 'Procesando...',
      text: 'Registrando la compra',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.orderService.confirmProviderPurchase(order.id, provider.provider_id, {
      estimated_delivery_date: data.deliveryDate,
      estimated_delivery_time: data.deliveryTime || undefined,
      notes: data.notes || undefined,
      receipt: data.receipt
    }).subscribe({
      next: (response) => {
        this.processingPurchase = false;
        Swal.close();

        const completionMsg = response.data.all_providers_completed
          ? '¡Todas las compras de esta OC han sido completadas!'
          : `Progreso: ${response.data.completion_percentage.toFixed(0)}%`;

        Swal.fire({
          title: '¡Compra Registrada!',
          html: `
            <p>La compra con <strong>${provider.provider_name}</strong> ha sido registrada exitosamente.</p>
            <p class="text-success fw-bold">${completionMsg}</p>
          `,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });

        // Recargar datos del proveedor
        this.loadProviderPurchases(order.id);
      },
      error: (error) => {
        this.processingPurchase = false;
        Swal.fire('Error', error.error?.message || 'No se pudo registrar la compra', 'error');
      }
    });
  }

  // ==================== Filtros y Paginación ====================

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status_code: ORDER_STATUS_CODES.AUTHORIZED,
      priority: undefined,
      sort_by: 'created_at',
      sort_dir: 'desc'
    };
    this.currentPage = 1;
    this.loadOrders();
  }

  onSearch(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  // ==================== Permisos ====================

  canConfirmPurchase(): boolean {
    return this.permissionService.canConfirmPurchase();
  }

  // ==================== Helpers ====================

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
