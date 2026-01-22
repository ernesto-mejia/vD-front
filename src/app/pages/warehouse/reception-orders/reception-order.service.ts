import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { notificationEndpoint } from '../../../shared/api-endpoint.util';

export interface ReceptionOrder {
  id: number;
  reception_number: string;
  purchase_order_id: number;
  provider_id: number;
  provider_purchase_id?: number;
  warehouse_id?: number;
  expected_delivery_date?: string;
  expected_delivery_time?: string;
  actual_received_at?: string;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  received_by?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;

  // Relaciones
  purchase_order?: any;
  provider?: any;
  warehouse?: any;
  items?: ReceptionOrderItem[];
  received_by_user?: any;
  created_by_user?: any;

  // Calculados
  received_percentage?: number;
  status_label?: string;
  status_color?: string;
  expected_delivery_datetime?: string;
}

export interface ReceptionOrderItem {
  id: number;
  reception_order_id: number;
  purchase_order_item_id?: number;
  quantity_expected: number;
  quantity_received: number;
  quantity_rejected: number;
  item_code?: string;
  item_name?: string;
  unit_of_measurement?: string;
  unit_price?: number;
  status: 'pending' | 'partial' | 'received' | 'rejected';
  rejection_reason?: string;
  reception_notes?: string;

  // Calculados
  received_percentage?: number;
  status_label?: string;
}

export interface ReceptionOrderSummary {
  pending_total: number;
  partial_total: number;
  expected_today: number;
  expected_this_week: number;
  received_today: number;
}

export interface ReceptionOrderFilter {
  status?: string;
  provider_id?: number;
  purchase_order_id?: number;
  warehouse_id?: number;
  expected_from?: string;
  expected_to?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface ReceiveItemData {
  id: number;
  quantity_received: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  reception_notes?: string;
}

export interface ReceiveOrderData {
  items: ReceiveItemData[];
  reception_notes?: string;
  warehouse_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReceptionOrderService {
  private http = inject(HttpClient);

  private getBaseUrl(): string {
    return notificationEndpoint('reception-orders');
  }

  /**
   * Obtener listado de órdenes de recepción con filtros
   */
  getOrders(filters?: ReceptionOrderFilter): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<any>(this.getBaseUrl(), { params });
  }

  /**
   * Obtener órdenes pendientes de recepción
   */
  getPendingOrders(): Observable<any> {
    return this.http.get<any>(`${this.getBaseUrl()}/pending`);
  }

  /**
   * Obtener detalle de una orden de recepción
   */
  getOrder(id: number): Observable<any> {
    return this.http.get<any>(`${this.getBaseUrl()}/${id}`);
  }

  /**
   * Registrar recepción de mercancía
   */
  receiveOrder(id: number, data: ReceiveOrderData): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/${id}/receive`, data);
  }

  /**
   * Cancelar orden de recepción
   */
  cancelOrder(id: number, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.getBaseUrl()}/${id}/cancel`, { reason });
  }

  /**
   * Obtener resumen para dashboard
   */
  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.getBaseUrl()}/summary`);
  }

  /**
   * Descargar PDF de orden de recepción
   */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.getBaseUrl()}/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Obtener color de estado
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'partial': 'info',
      'received': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Obtener etiqueta de estado
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'partial': 'Parcial',
      'received': 'Recibido',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }
}
