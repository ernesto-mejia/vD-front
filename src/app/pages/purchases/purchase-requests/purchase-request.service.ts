import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import {
  PurchaseRequest,
  PurchaseRequestCreateRequest,
  PurchaseRequestUpdateRequest,
  PurchaseRequestFilters,
  PurchaseRequestListResponse,
  PurchaseRequestResponse,
  PurchaseRequestStatus,
  PurchaseRequestApproval,
  TaxCalculationResult,
  StatusesResponse,
  PreAuthorizeRequest,
  ConvertToPOResponse,
  ConvertToMultiplePOsResponse,
  ProductSearchResponse,
  ContractsResponse
} from './purchase-requests';

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {
  private readonly basePath = 'v2/purchase-requests';

  constructor(private http: HttpClient) {}

  /**
   * Listar solicitudes de compra con filtros
   */
  list(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<PurchaseRequestListResponse>(apiEndpoint(this.basePath), { params });
  }

  /**
   * Obtener detalle de una solicitud
   */
  get(id: number): Observable<PurchaseRequestResponse> {
    return this.http.get<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Crear nueva solicitud de compra
   */
  create(data: PurchaseRequestCreateRequest): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(this.basePath), data);
  }

  /**
   * Actualizar solicitud de compra
   */
  update(id: number, data: PurchaseRequestUpdateRequest): Observable<PurchaseRequestResponse> {
    return this.http.put<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}`), data);
  }

  /**
   * Eliminar solicitud de compra
   */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Enviar solicitud para pre-autorización (Fase 1 → Fase 2)
   */
  submit(id: number, comments?: string): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/submit`), { comments });
  }

  /**
   * Pre-autorizar solicitud (Fase 2)
   */
  preAuthorize(id: number, data: PreAuthorizeRequest): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/pre-authorize`), data);
  }

  /**
   * Poner en revisión (Fase 2)
   */
  putInReview(id: number): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/review`), {});
  }

  /**
   * Solicitar integración de producto/proveedor
   */
  requestIntegration(id: number, notes: string, itemIds?: number[]): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/request-integration`), {
      notes,
      item_ids: itemIds
    });
  }

  /**
   * Convertir a Orden de Compra
   */
  convertToPurchaseOrder(id: number, notes?: string): Observable<ConvertToPOResponse> {
    return this.http.post<ConvertToPOResponse>(apiEndpoint(`${this.basePath}/${id}/convert-to-po`), { notes });
  }

  /**
   * Convertir a múltiples Órdenes de Compra (una por proveedor)
   * Agrupa los items por su proveedor sugerido y crea una OC por cada uno
   */
  convertToMultiplePurchaseOrders(id: number, notes?: string): Observable<ConvertToMultiplePOsResponse> {
    return this.http.post<ConvertToMultiplePOsResponse>(apiEndpoint(`${this.basePath}/${id}/convert-to-pos`), { notes });
  }

  /**
   * Enviar solicitud para autorización final (saltando pre-autorización)
   * Usado cuando el pre-autorizador crea una solicitud con precios/proveedores asignados
   */
  submitForFinalAuthorization(id: number): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/submit-final`), {});
  }

  /**
   * Obtener solicitudes pendientes de pre-autorización
   */
  getPendingPreAuthorization(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PurchaseRequestListResponse>(apiEndpoint(`${this.basePath}/pending-preauthorization`), { params });
  }

  /**
   * Buscar productos en catálogo general usando API de items
   */
  searchProducts(search: string, options?: { categoryId?: number; providerId?: number; limit?: number }): Observable<ProductSearchResponse> {
    let params = new HttpParams().set('search', search);
    if (options?.categoryId) params = params.set('category_id', options.categoryId.toString());
    if (options?.limit) params = params.set('per_page', options.limit.toString());

    return this.http.get<ProductSearchResponse>(apiEndpoint('v2/items'), { params });
  }

  /**
   * Obtener contratos de proveedor del usuario
   */
  getUserContracts(search?: string): Observable<ContractsResponse> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ContractsResponse>(apiEndpoint(`${this.basePath}/user-contracts`), { params });
  }

  /**
   * Obtener contratos de cliente
   */
  getClientContracts(search?: string): Observable<ContractsResponse> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ContractsResponse>(apiEndpoint(`${this.basePath}/client-contracts`), { params });
  }

  /**
   * Obtener contratos de proveedor relacionados a un contrato de cliente
   */
  getClientContractProviders(clientContractId: number): Observable<ContractsResponse> {
    return this.http.get<ContractsResponse>(apiEndpoint(`${this.basePath}/client-contract/${clientContractId}/providers`));
  }

  /**
   * Obtener todos los items de los contratos de proveedor relacionados a un contrato de cliente
   */
  getClientContractAllItems(clientContractId: number): Observable<ProductSearchResponse> {
    return this.http.get<ProductSearchResponse>(apiEndpoint(`${this.basePath}/client-contract/${clientContractId}/all-items`));
  }

  /**
   * Obtener productos de un contrato
   */
  getContractProducts(contractId: number): Observable<ProductSearchResponse> {
    return this.http.get<ProductSearchResponse>(apiEndpoint(`${this.basePath}/contract-products/${contractId}`));
  }

  /**
   * Aprobar solicitud
   */
  approve(id: number, notes?: string): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/approve`), { notes });
  }

  /**
   * Rechazar solicitud
   */
  reject(id: number, reason: string): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/reject`), { reason });
  }

  /**
   * Devolver solicitud para correcciones
   */
  return(id: number, comments: string): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/return`), { comments });
  }

  /**
   * Alias para devolver solicitud (returnRequest)
   */
  returnRequest(id: number, comments: string): Observable<PurchaseRequestResponse> {
    return this.return(id, comments);
  }

  /**
   * Cancelar solicitud
   */
  cancel(id: number, reason: string): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(apiEndpoint(`${this.basePath}/${id}/cancel`), { reason });
  }

  /**
   * Obtener historial de aprobaciones
   */
  getHistory(id: number): Observable<{ success: boolean; data: PurchaseRequestApproval[] }> {
    return this.http.get<{ success: boolean; data: PurchaseRequestApproval[] }>(apiEndpoint(`${this.basePath}/${id}/history`));
  }

  /**
   * Obtener estados disponibles
   */
  getStatuses(): Observable<StatusesResponse> {
    return this.http.get<StatusesResponse>(apiEndpoint(`${this.basePath}/statuses`));
  }

  /**
   * Calcular totales con impuestos
   */
  calculateTotals(providerId: number, items: any[]): Observable<{ success: boolean; data: TaxCalculationResult }> {
    return this.http.post<{ success: boolean; data: TaxCalculationResult }>(apiEndpoint(`${this.basePath}/calculate-totals`), {
      provider_id: providerId,
      items
    });
  }

  /**
   * Obtener tasas de impuesto del proveedor
   * Usa el endpoint existente de tax-configuration y extrae las tasas
   */
  getProviderTaxRates(providerId: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ ok: boolean; data: any }>(apiEndpoint(`v2/providers/${providerId}/tax-configuration`)).pipe(
      map(response => {
        const effectiveRates = response.data?.effective_rates || {};
        return {
          success: response.ok,
          data: {
            iva_rate: effectiveRates.vat_rate || 16,
            isr_rate: 0, // ISR generalmente no se agrega al total
            iva_retention_rate: effectiveRates.vat_retention_applies ? (effectiveRates.vat_retention_rate || 0) : 0,
            isr_retention_rate: effectiveRates.isr_retention_applies ? (effectiveRates.isr_retention_rate || 0) : 0,
            person_type: response.data?.person_type || 'moral'
          }
        };
      })
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener color de badge para prioridad
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return 'secondary';
      case 'normal': return 'primary';
      case 'high': return 'warning';
      case 'urgent': return 'danger';
      default: return 'secondary';
    }
  }

  /**
   * Obtener label de prioridad
   */
  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'low': return 'Baja';
      case 'normal': return 'Normal';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  }

  /**
   * Obtener icono de prioridad
   */
  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'low': return 'fa-arrow-down';
      case 'normal': return 'fa-minus';
      case 'high': return 'fa-arrow-up';
      case 'urgent': return 'fa-exclamation-triangle';
      default: return 'fa-minus';
    }
  }

  /**
   * Formatear moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  /**
   * Formatear fecha
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX');
    } catch {
      return dateStr;
    }
  }

  /**
   * Formatear fecha y hora
   */
  formatDateTime(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('es-MX');
    } catch {
      return dateStr;
    }
  }

  /**
   * Obtener ID del usuario actual
   */
  private getCurrentUserId(): number | null {
    try {
      const userId = localStorage.getItem('user_id');
      if (userId) return Number(userId);

      const userDataString = localStorage.getItem('user_permissions') || localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        if (userData.user?.id) return userData.user.id;
        if (userData.id) return userData.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verificar si el usuario actual es el creador de la solicitud
   */
  isCurrentUserCreator(request: PurchaseRequest): boolean {
    const currentUserId = this.getCurrentUserId();
    return currentUserId !== null && request.requested_by === currentUserId;
  }

  /**
   * Verificar si una solicitud puede ser editada
   * Solo el creador puede editar y solo en estado DRAFT o RETURNED
   */
  canEdit(request: PurchaseRequest): boolean {
    const isCreator = this.isCurrentUserCreator(request);
    const validStatus = ['DRAFT', 'RETURNED'].includes(request.status?.code || '');
    return isCreator && validStatus;
  }

  /**
   * Verificar si una solicitud puede ser enviada
   * Solo el creador puede enviar
   */
  canSubmit(request: PurchaseRequest): boolean {
    const isCreator = this.isCurrentUserCreator(request);
    const code = request.status?.code?.toUpperCase() || '';
    // Estados válidos: DRAFT, OPEN (nuevo), RETURNED
    const validStatus = ['DRAFT', 'OPEN', 'RETURNED'].includes(code);
    return isCreator && validStatus;
  }

  /**
   * Verificar si una solicitud puede ser aprobada/rechazada
   * Solo autorizadores (NO el creador)
   */
  canApprove(request: PurchaseRequest): boolean {
    const isCreator = this.isCurrentUserCreator(request);
    const code = request.status?.code?.toUpperCase() || '';
    // Estados válidos: PENDING, REVIEW, RELEASED (nuevo), SUBMITTED
    const validStatus = ['PENDING', 'REVIEW', 'RELEASED', 'SUBMITTED'].includes(code);
    // El creador NO puede aprobar su propia solicitud
    return !isCreator && validStatus;
  }

  /**
   * Verificar si una solicitud puede ser cancelada
   * Solo el creador puede cancelar (y solo si no está en estado final)
   */
  canCancel(request: PurchaseRequest): boolean {
    const isCreator = this.isCurrentUserCreator(request);
    const notFinalStatus = !['APPROVED', 'PO_GENERATED', 'REJECTED', 'CANCELLED'].includes(request.status?.code || '');
    return isCreator && notFinalStatus;
  }

  /**
   * Verificar si una solicitud está en estado final
   */
  isFinalStatus(request: PurchaseRequest): boolean {
    return request.status?.is_final || false;
  }

  // ==================== DESTINO POR ÁREA/DEPARTAMENTO ====================

  /**
   * Obtener opciones de destino (áreas y departamentos)
   */
  getDestinationOptions(): Observable<{ success: boolean; data: DestinationArea[] }> {
    return this.http.get<{ success: boolean; data: DestinationArea[] }>(
      apiEndpoint(`${this.basePath}/destination-options`)
    );
  }

  /**
   * Marcar solicitud como comprada
   */
  markAsPurchased(id: number, data: MarkAsPurchasedRequest): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(
      apiEndpoint(`${this.basePath}/${id}/mark-purchased`),
      data
    );
  }

  /**
   * Marcar solicitud como recibida
   */
  markAsReceived(id: number): Observable<PurchaseRequestResponse> {
    return this.http.post<PurchaseRequestResponse>(
      apiEndpoint(`${this.basePath}/${id}/mark-received`),
      {}
    );
  }

  /**
   * Obtener solicitudes pendientes de compra
   */
  getPendingPurchase(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PurchaseRequestListResponse>(
      apiEndpoint(`${this.basePath}/pending-purchase`),
      { params }
    );
  }

  /**
   * Obtener solicitudes compradas pero no recibidas
   */
  getPurchasedNotReceived(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PurchaseRequestListResponse>(
      apiEndpoint(`${this.basePath}/purchased-not-received`),
      { params }
    );
  }

  /**
   * Verificar si puede marcar como comprado
   */
  canMarkAsPurchased(request: PurchaseRequest): boolean {
    return request.status?.code === 'APPROVED' && !request.marked_as_purchased_at;
  }

  /**
   * Verificar si puede marcar como recibido
   */
  canMarkAsReceived(request: PurchaseRequest): boolean {
    return !!request.marked_as_purchased_at && !request.marked_as_received_at;
  }

  /**
   * Obtener estado del proceso de compra
   */
  getPurchaseStatusInfo(request: PurchaseRequest): { status: string; label: string; color: string } {
    if (request.marked_as_received_at) {
      return { status: 'received', label: 'Recibido', color: 'success' };
    }
    if (request.marked_as_purchased_at) {
      return { status: 'purchased', label: 'Comprado', color: 'info' };
    }
    return { status: 'pending', label: 'Pendiente', color: 'warning' };
  }

  // ==================== AUTORIZACIÓN POR ÁREA ====================

  /**
   * Obtener solicitudes pendientes de pre-autorización para el usuario actual
   * (filtradas por área donde el usuario es autorizador)
   */
  getMyPendingPreAuthorization(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse & { authorized_areas?: number[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PurchaseRequestListResponse & { authorized_areas?: number[] }>(
      apiEndpoint(`${this.basePath}/my-pending-preauthorization`),
      { params }
    );
  }

  /**
   * Obtener solicitudes pendientes de aprobación final para el usuario actual
   * (filtradas por área donde el usuario es autorizador final)
   */
  getMyPendingApproval(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse & { authorized_areas?: number[] }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PurchaseRequestListResponse & { authorized_areas?: number[] }>(
      apiEndpoint(`${this.basePath}/my-pending-approval`),
      { params }
    );
  }

  /**
   * Obtener solicitudes listas para generar Orden de Compra
   * (PRE_AUTHORIZED o AUTHORIZED sin OC generada)
   */
  getMyReadyForPO(filters?: PurchaseRequestFilters): Observable<PurchaseRequestListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PurchaseRequestListResponse>(
      apiEndpoint(`${this.basePath}/my-ready-for-po`),
      { params }
    );
  }

  /**
   * Obtener resumen de autorizaciones pendientes del usuario
   */
  getMyAuthorizationSummary(): Observable<{ success: boolean; data: AuthorizationSummary }> {
    return this.http.get<{ success: boolean; data: AuthorizationSummary }>(
      apiEndpoint(`${this.basePath}/my-authorization-summary`)
    );
  }

  /**
   * Verificar si puede autorizar una solicitud específica
   */
  canAuthorize(id: number): Observable<{ success: boolean; data: CanAuthorizeResponse }> {
    return this.http.get<{ success: boolean; data: CanAuthorizeResponse }>(
      apiEndpoint(`${this.basePath}/${id}/can-authorize`)
    );
  }
}

// ==================== INTERFACES ADICIONALES ====================

export interface DestinationArea {
  id: number;
  name: string;
  code: string | null;
  approval_required: boolean;
  departments: DestinationDepartment[];
}

export interface DestinationDepartment {
  id: number;
  name: string;
  code: string | null;
  budget_center: string | null;
}

export interface MarkAsPurchasedRequest {
  receipt_image_url?: string;
  estimated_delivery_date?: string;
  notes?: string;
}

export interface AuthorizationSummary {
  pending_pre_authorization: number;
  pending_approval: number;
  total_pending: number;
  pre_auth_areas: { id: number; name: string }[];
  final_auth_areas: { id: number; name: string }[];
}

export interface CanAuthorizeResponse {
  can_pre_authorize: boolean;
  can_final_authorize: boolean;
  can_reject: boolean;
  current_phase: string;
  status_code: string;
}
