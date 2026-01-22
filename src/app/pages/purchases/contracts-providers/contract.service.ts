import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import {
  ProviderContract,
  ProviderContractCreateRequest,
  ProviderContractUpdateRequest,
  ProviderContractResponse,
  ProviderContractsListResponse,
  ProviderContractFilters,
  PriceListEntry,
  PriceListResponse,
  PriceListFilters,
  ProviderOption,
  ClientContractOption,
  ProviderItemsResponse,
  ProviderItemSummary
} from './contracts';

@Injectable({
  providedIn: 'root'
})
export class ProviderContractService {
  private readonly basePath = 'v2/contracts/providers';

  constructor(private http: HttpClient) { }

  // ==================== CONTRATOS DE PROVEEDOR ====================

  /**
   * Obtener lista de contratos de proveedores
   */
  getContracts(filters?: ProviderContractFilters): Observable<ProviderContractsListResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.provider_id) params = params.set('provider_id', filters.provider_id.toString());
      if (filters.client_contract_id) params = params.set('client_contract_id', filters.client_contract_id.toString());
      if (filters.has_client_contract !== undefined) params = params.set('has_client_contract', filters.has_client_contract.toString());
      if (filters.status_id) params = params.set('status_id', filters.status_id.toString());
      if (filters.search) params = params.set('search', filters.search);
    }
    return this.http.get<ProviderContractsListResponse>(apiEndpoint(this.basePath), { params });
  }

  /**
   * Obtener un contrato por ID
   */
  getContract(id: number): Observable<ProviderContractResponse> {
    return this.http.get<ProviderContractResponse>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Crear nuevo contrato de proveedor
   */
  createContract(payload: ProviderContractCreateRequest): Observable<ProviderContractResponse> {
    return this.http.post<ProviderContractResponse>(apiEndpoint(this.basePath), payload);
  }

  /**
   * Actualizar contrato existente
   */
  updateContract(id: number, payload: ProviderContractUpdateRequest): Observable<ProviderContractResponse> {
    return this.http.put<ProviderContractResponse>(apiEndpoint(`${this.basePath}/${id}`), payload);
  }

  /**
   * Eliminar contrato
   */
  deleteContract(id: number): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(apiEndpoint(`${this.basePath}/${id}`));
  }

  // ==================== LISTA DE PRECIOS ====================

  /**
   * Obtener lista de precios consolidada (para estadísticas y solicitudes de compra)
   */
  getPriceList(filters?: PriceListFilters): Observable<PriceListResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.client_id) params = params.set('client_id', filters.client_id.toString());
      if (filters.provider_id) params = params.set('provider_id', filters.provider_id.toString());
      if (filters.client_contract_id) params = params.set('client_contract_id', filters.client_contract_id.toString());
      if (filters.provider_contract_id) params = params.set('provider_contract_id', filters.provider_contract_id.toString());
      if (filters.item_id) params = params.set('item_id', filters.item_id.toString());
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.search) params = params.set('search', filters.search);
    }
    return this.http.get<PriceListResponse>(apiEndpoint('v2/contracts/price-list'), { params });
  }

  // ==================== OPCIONES PARA SELECTS ====================

  /**
   * Obtener lista de proveedores para ng-select
   */
  getProviders(): Observable<ProviderOption[]> {
    return this.http.get<{ ok: boolean; data: any[] }>(apiEndpoint('v2/company/providers')).pipe(
      map(response => (response.data || []).map(p => ({
        id: p.id,
        shortname: p.shortname,
        company: p.company,
        tax_id: p.tax_id
      })))
    );
  }

  /**
   * Obtener contratos de clientes para relacionar
   */
  getClientContracts(search?: string): Observable<ClientContractOption[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<{ ok: boolean; data: any[] }>(
      apiEndpoint('v2/contracts/clients'),
      { params }
    ).pipe(
      map(response => (response.data || []).map(c => ({
        id: c.id,
        project_name: c.project_name,
        customer_name: c.customer_name,
        start_date: c.start_date,
        end_date: c.end_date
      })))
    );
  }

  /**
   * Buscar contratos de clientes por nombre
   */
  searchClientContracts(term: string): Observable<ClientContractOption[]> {
    if (!term || term.length < 2) {
      return of([]);
    }
    return this.getClientContracts(term);
  }

  /**
   * Obtener items/pruebas disponibles
   */
  getItems(): Observable<{ id: number; name: string; code?: string; unit_price?: number }[]> {
    return this.http.get<{ ok: boolean; data: any[] }>(apiEndpoint('v2/items')).pipe(
      map(response => response.data || [])
    );
  }

  // ==================== ITEMS POR PROVEEDOR ====================

  /**
   * Obtener items/servicios que ofrece un proveedor específico
   * (desde sus contratos existentes)
   */
  getProviderItems(providerId: number): Observable<ProviderItemSummary[]> {
    return this.http.get<ProviderItemsResponse>(
      apiEndpoint(`contract-item/provider/${providerId}/items`)
    ).pipe(
      map(response => response.items || [])
    );
  }

  // ==================== ESTADOS DE CONTRATO ====================

  /**
   * Obtener estados de contrato
   */
  getContractStatuses(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ ok: boolean; data: { id: number; name: string }[] }>(
      apiEndpoint('v2/catalogs/contract-statuses')
    ).pipe(
      map(response => response.data || [])
    );
  }
}
