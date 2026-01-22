import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderHistory,
  PurchaseOrderReceipt,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderFilters,
  PaginatedResponse,
  TotalsCalculation,
  ReceiveOrderDTO,
  RegisterInvoiceDTO,
  ConfirmPurchaseDTO,
  ConfirmPurchaseResponse,
  ProviderPurchasesResponse,
  ConfirmProviderPurchaseResponse,
  ORDER_STATUS_CODES,
  PRIORITIES,
  PAYMENT_METHODS,
} from './purchase-orders';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface StatusesResponse {
  success: boolean;
  data: PurchaseOrderStatus[];
}

interface HistoryResponse {
  success: boolean;
  data: PurchaseOrderHistory[];
}

interface ReceiptsResponse {
  success: boolean;
  data: PurchaseOrderReceipt[];
}

interface TotalsResponse {
  success: boolean;
  data: TotalsCalculation;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private readonly basePath = 'v2/purchase-orders';

  constructor(private http: HttpClient) {}

  // =====================================================
  // CRUD Operations
  // =====================================================

  /**
   * Listar órdenes de compra con filtros
   */
  list(filters?: PurchaseOrderFilters): Observable<PaginatedResponse<PurchaseOrder>> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<PaginatedResponse<PurchaseOrder>>(apiEndpoint(this.basePath), { params });
  }

  /**
   * Obtener detalle de una orden
   */
  get(id: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.get<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Crear nueva orden de compra
   */
  create(data: CreatePurchaseOrderDTO): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(this.basePath), data);
  }

  /**
   * Actualizar orden de compra
   */
  update(id: number, data: UpdatePurchaseOrderDTO): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.put<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}`), data);
  }

  /**
   * Eliminar orden de compra (solo borrador)
   */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(apiEndpoint(`${this.basePath}/${id}`));
  }

  // =====================================================
  // Workflow Operations
  // =====================================================

  /**
   * Enviar orden para aprobación
   */
  submit(id: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/submit`), {});
  }

  /**
   * Aprobar orden
   */
  approve(id: number, comments?: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/approve`), { comments });
  }

  /**
   * Rechazar orden
   */
  reject(id: number, reason?: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/reject`), { reason });
  }

  /**
   * Enviar orden al proveedor
   */
  send(id: number, sentMethod?: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/send`), { sent_method: sentMethod });
  }

  /**
   * Confirmar orden por proveedor
   */
  confirm(id: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/confirm`), {});
  }

  /**
   * Confirmar compra realizada (por el comprador)
   * Permite subir comprobante y establecer fecha de entrega
   */
  confirmPurchase(id: number, data: ConfirmPurchaseDTO): Observable<ConfirmPurchaseResponse> {
    const formData = new FormData();

    if (data.receipt) {
      formData.append('receipt', data.receipt);
    }
    if (data.estimated_delivery_date) {
      formData.append('estimated_delivery_date', data.estimated_delivery_date);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }

    return this.http.post<ConfirmPurchaseResponse>(apiEndpoint(`${this.basePath}/${id}/confirm-purchase`), formData);
  }

  /**
   * Generar compra con proveedores
   * Genera PDFs independientes para cada proveedor de la orden
   */
  generateProviderOrders(id: number): Observable<ApiResponse<{
    documents_generated: number;
    providers: { id: number; name: string; pdf_url: string }[];
  }>> {
    return this.http.post<ApiResponse<{
      documents_generated: number;
      providers: { id: number; name: string; pdf_url: string }[];
    }>>(apiEndpoint(`${this.basePath}/${id}/generate-provider-orders`), {});
  }

  /**
   * Descargar PDF de la orden de compra
   */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(
      apiEndpoint(`${this.basePath}/${id}/pdf`),
      { responseType: 'blob' }
    );
  }

  /**
   * Descargar PDF de orden para un proveedor específico
   */
  downloadProviderPdf(orderId: number, providerId: number): Observable<Blob> {
    return this.http.get(
      apiEndpoint(`${this.basePath}/${orderId}/provider/${providerId}/pdf`),
      { responseType: 'blob' }
    );
  }

  /**
   * Obtener detalle de compras por proveedor para una orden
   */
  getProviderPurchases(orderId: number): Observable<ProviderPurchasesResponse> {
    return this.http.get<ProviderPurchasesResponse>(
      apiEndpoint(`${this.basePath}/${orderId}/provider-purchases`)
    );
  }

  /**
   * Confirmar compra con un proveedor específico
   * Soporta subida de comprobante y fecha/hora de entrega
   */
  confirmProviderPurchase(orderId: number, providerId: number, data: ConfirmPurchaseDTO): Observable<ConfirmProviderPurchaseResponse> {
    const formData = new FormData();

    if (data.receipt) {
      formData.append('receipt', data.receipt);
    }
    if (data.estimated_delivery_date) {
      formData.append('estimated_delivery_date', data.estimated_delivery_date);
    }
    if (data.estimated_delivery_time) {
      formData.append('estimated_delivery_time', data.estimated_delivery_time);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }

    return this.http.post<ConfirmProviderPurchaseResponse>(
      apiEndpoint(`${this.basePath}/${orderId}/provider/${providerId}/confirm`),
      formData
    );
  }

  /**
   * @deprecated Use confirmProviderPurchase instead
   * Confirmar orden para un proveedor específico (cuando hay múltiples proveedores)
   */
  confirmProviderOrder(orderId: number, providerId: number, data: {
    estimated_delivery_date?: string;
    notes?: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      apiEndpoint(`${this.basePath}/${orderId}/provider/${providerId}/confirm`),
      data
    );
  }

  /**
   * Recibir mercancía
   */
  receive(id: number, data: ReceiveOrderDTO): Observable<ApiResponse<{ order: PurchaseOrder; receipts: PurchaseOrderReceipt[] }>> {
    return this.http.post<ApiResponse<{ order: PurchaseOrder; receipts: PurchaseOrderReceipt[] }>>(
      apiEndpoint(`${this.basePath}/${id}/receive`),
      data
    );
  }

  /**
   * Registrar factura
   */
  registerInvoice(id: number, data: RegisterInvoiceDTO): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/invoice`), data);
  }

  /**
   * Cancelar orden
   */
  cancel(id: number, reason: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/cancel`), { reason });
  }

  /**
   * Cerrar orden
   */
  close(id: number, notes?: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(apiEndpoint(`${this.basePath}/${id}/close`), { notes });
  }

  // =====================================================
  // Flujo de 4 Fases - Autorización de OC
  // =====================================================

  /**
   * Obtener resumen de autorizaciones de OC pendientes
   */
  getMyAuthorizationSummary(): Observable<{ success: boolean; data: POAuthorizationSummary }> {
    return this.http.get<{ success: boolean; data: POAuthorizationSummary }>(
      apiEndpoint(`${this.basePath}/my-authorization-summary`)
    );
  }

  /**
   * Listar OCs pendientes de autorización (Fase 4)
   */
  listPendingPOAuthorization(filters?: PurchaseOrderFilters): Observable<PaginatedResponse<PurchaseOrder>> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<PaginatedResponse<PurchaseOrder>>(
      apiEndpoint(`${this.basePath}/pending-po-authorization`),
      { params }
    );
  }

  /**
   * Listar OCs autorizadas y listas para compra (Módulo "Por Comprar")
   */
  listReadyForPurchase(filters?: PurchaseOrderFilters): Observable<PaginatedResponse<PurchaseOrder>> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<PaginatedResponse<PurchaseOrder>>(
      apiEndpoint(`${this.basePath}/ready-for-purchase`),
      { params }
    );
  }

  /**
   * Autorizar Orden de Compra (Fase 4)
   */
  authorizePO(id: number, notes?: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(
      apiEndpoint(`${this.basePath}/${id}/authorize-po`),
      { notes }
    );
  }

  /**
   * Devolver OC a Compras (para modificar proveedores/precios)
   */
  returnToPurchasing(id: number, reason: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(
      apiEndpoint(`${this.basePath}/${id}/return-to-purchasing`),
      { reason }
    );
  }

  /**
   * Devolver OC hasta la Solicitud (para correcciones mayores)
   */
  returnToRequest(id: number, reason: string): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(
      apiEndpoint(`${this.basePath}/${id}/return-to-request`),
      { reason }
    );
  }

  // =====================================================
  // Catalog & Utility Operations
  // =====================================================

  /**
   * Obtener estados disponibles
   */
  getStatuses(): Observable<PurchaseOrderStatus[]> {
    return this.http.get<StatusesResponse>(apiEndpoint(`${this.basePath}/statuses`)).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtener historial de una orden
   */
  getHistory(id: number): Observable<PurchaseOrderHistory[]> {
    return this.http.get<HistoryResponse>(apiEndpoint(`${this.basePath}/${id}/history`)).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtener recepciones de una orden
   */
  getReceipts(id: number): Observable<PurchaseOrderReceipt[]> {
    return this.http.get<ReceiptsResponse>(apiEndpoint(`${this.basePath}/${id}/receipts`)).pipe(
      map(response => response.data)
    );
  }

  /**
   * Calcular totales (preview)
   */
  calculateTotals(data: {
    provider_id: number;
    items: { quantity_ordered: number; unit_price: number; discount_percent?: number; is_tax_exempt?: boolean }[];
    shipping_cost?: number;
  }): Observable<TotalsCalculation> {
    return this.http.post<TotalsResponse>(apiEndpoint(`${this.basePath}/calculate-totals`), data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Generar orden desde solicitud de compra
   */
  createFromRequest(purchaseRequestId: number): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(
      apiEndpoint(`v2/purchase-requests/${purchaseRequestId}/generate-order`),
      {}
    );
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Formatear moneda
   */
  formatCurrency(value: number, currency: string = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Formatear fecha
   */
  formatDate(date: string | Date, includeTime: boolean = false): string {
    if (!date) return '';
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return d.toLocaleDateString('es-MX', options);
  }

  /**
   * Obtener etiqueta de prioridad
   */
  getPriorityLabel(priority: string): string {
    const found = PRIORITIES.find(p => p.value === priority);
    return found?.label || priority;
  }

  /**
   * Obtener color de prioridad
   */
  getPriorityColor(priority: string): string {
    const found = PRIORITIES.find(p => p.value === priority);
    return found?.color || 'secondary';
  }

  /**
   * Obtener etiqueta de método de pago
   */
  getPaymentMethodLabel(method: string): string {
    const found = PAYMENT_METHODS.find(m => m.value === method);
    return found?.label || method;
  }

  /**
   * Verificar si se puede editar
   */
  canEdit(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    // Estados editables: Borrador, Pendiente Aprobación, Proveedores Asignados (devuelta)
    const editableStatuses = [
      ORDER_STATUS_CODES.DRAFT,
      ORDER_STATUS_CODES.PENDING_APPROVAL,
      'PROVIDERS_ASSIGNED',    // Flujo 5 fases - devuelta de autorización
      'ASSIGNING_PROVIDERS'    // Flujo 5 fases - en proceso de asignación
    ];
    return editableStatuses.includes(statusCode as any);
  }

  /**
   * Verificar si se puede enviar para aprobación/autorización
   */
  canSubmit(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    // Puede enviar desde borrador o después de correcciones
    const submitableStatuses = ['DRAFT', 'PROVIDERS_ASSIGNED', 'ASSIGNING_PROVIDERS'];
    return submitableStatuses.includes(statusCode || '');
  }

  /**
   * Verificar si se puede aprobar
   */
  canApprove(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    return statusCode === ORDER_STATUS_CODES.PENDING_APPROVAL;
  }

  /**
   * Verificar si se puede enviar al proveedor
   */
  canSend(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    return statusCode === ORDER_STATUS_CODES.APPROVED;
  }

  /**
   * Verificar si se puede confirmar (por proveedor)
   */
  canConfirm(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    return statusCode === ORDER_STATUS_CODES.SENT;
  }

  /**
   * Verificar si se puede confirmar la compra (por el comprador)
   * Disponible cuando la OC está aprobada o enviada y no tiene comprobante
   */
  canConfirmPurchase(order: PurchaseOrder): boolean {
    const statusCode = order.status?.code;
    const validStatuses = [
      ORDER_STATUS_CODES.APPROVED,
      ORDER_STATUS_CODES.SENT,
    ];
    return validStatuses.includes(statusCode as any) && !order.purchased_at;
  }

  /**
   * Verificar si se puede recibir mercancía
   */
  canReceive(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    const validStatuses = [
      ORDER_STATUS_CODES.SENT,
      ORDER_STATUS_CODES.CONFIRMED,
      ORDER_STATUS_CODES.PARTIAL_RECEIVED
    ];
    if (typeof orderOrStatus !== 'string' && orderOrStatus.is_fully_received) {
      return false;
    }
    return validStatuses.includes(statusCode as any);
  }

  /**
   * Verificar si se puede registrar factura
   */
  canInvoice(order: PurchaseOrder): boolean {
    return order.is_fully_received && !order.is_invoiced;
  }

  /**
   * Verificar si se puede cancelar
   */
  canCancel(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    const finalStatuses = [
      ORDER_STATUS_CODES.RECEIVED,
      ORDER_STATUS_CODES.INVOICED,
      ORDER_STATUS_CODES.CLOSED,
      ORDER_STATUS_CODES.CANCELLED
    ];
    return !finalStatuses.includes(statusCode as any);
  }

  /**
   * Verificar si se puede cerrar
   */
  canClose(orderOrStatus: PurchaseOrder | string): boolean {
    const statusCode = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status?.code;
    return [ORDER_STATUS_CODES.RECEIVED, ORDER_STATUS_CODES.INVOICED].includes(
      statusCode as any
    );
  }

  /**
   * Obtener clase CSS para el badge del estado
   */
  getStatusBadge(statusCode: string): string {
    const badgeMap: { [key: string]: string } = {
      [ORDER_STATUS_CODES.DRAFT]: 'bg-secondary',
      [ORDER_STATUS_CODES.PENDING_APPROVAL]: 'bg-warning text-dark',
      [ORDER_STATUS_CODES.APPROVED]: 'bg-info',
      [ORDER_STATUS_CODES.REJECTED]: 'bg-danger',
      [ORDER_STATUS_CODES.SENT]: 'bg-primary',
      [ORDER_STATUS_CODES.CONFIRMED]: 'bg-info',
      [ORDER_STATUS_CODES.PARTIAL_RECEIVED]: 'bg-warning',
      [ORDER_STATUS_CODES.RECEIVED]: 'bg-success',
      [ORDER_STATUS_CODES.INVOICED]: 'bg-success',
      [ORDER_STATUS_CODES.CLOSED]: 'bg-dark',
      [ORDER_STATUS_CODES.CANCELLED]: 'bg-danger',
    };
    return badgeMap[statusCode] || 'bg-secondary';
  }

  /**
   * Calcular porcentaje recibido de un item
   */
  getItemReceivedPercentage(item: { quantity_ordered: number; quantity_received: number }): number {
    if (item.quantity_ordered <= 0) return 0;
    return Math.min(100, (item.quantity_received / item.quantity_ordered) * 100);
  }

  /**
   * Obtener cantidad pendiente de un item
   */
  getItemPendingQuantity(item: { quantity_ordered: number; quantity_received: number }): number {
    return Math.max(0, item.quantity_ordered - item.quantity_received);
  }
}

/**
 * Interfaz para el resumen de autorizaciones de OC
 */
export interface POAuthorizationSummary {
  pending_po_authorization: number;
  ready_for_purchase: number;
  in_purchase_process: number;
  total_pending: number;
  pending_amount: number;
  has_global_permission: boolean;
}
