import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import {
  ClientContract,
  ClientContractCreateRequest,
  ClientContractUpdateRequest,
  ClientContractResponse,
  ClientContractsListResponse,
  IMSSRegion,
  IMSSRegionsResponse,
  CustomerAddress,
  CustomerAddressesResponse,
  Item,
  ItemsResponse,
  ContractFilters,
  RegionSystem,
  RegionSystemsResponse,
  SystemRegion,
  SystemRegionsResponse,
  RegionsByCustomerResponse,
  ContractDocumentType,
  ContractDocumentTypesResponse,
  ContractDocument,
  ContractDocumentsResponse,
  ContractDocumentResponse,
  ContractDocumentDownloadResponse,
  ContractExtension,
  ContractExtensionsResponse,
  ContractExtensionResponse,
  BondingCompany,
  BondingCompaniesResponse,
  ContractUnitItem,
  ContractUnitItemsResponse,
  ExpiringContractsResponse
} from './contracts';

@Injectable({
  providedIn: 'root'
})
export class ClientContractService {
  private readonly basePath = 'v2/contracts/clients';
  private regionsCache: IMSSRegion[] | null = null;
  private itemsCache: Item[] | null = null;
  private regionSystemsCache: RegionSystem[] | null = null;
  private documentTypesCache: ContractDocumentType[] | null = null;

  constructor(private http: HttpClient) { }

  // ==================== CONTRATOS ====================

  /**
   * Obtener lista de contratos de clientes
   */
  getContracts(filters?: ContractFilters): Observable<ClientContractsListResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.customer_id) params = params.set('customer_id', filters.customer_id.toString());
      if (filters.region_id) params = params.set('region_id', filters.region_id.toString());
      if (filters.status_id) params = params.set('status_id', filters.status_id.toString());
      if (filters.start_date_from) params = params.set('start_date_from', filters.start_date_from);
      if (filters.start_date_to) params = params.set('start_date_to', filters.start_date_to);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.has_bonding !== undefined) params = params.set('has_bonding', filters.has_bonding.toString());
      if (filters.expiring_within_days) params = params.set('expiring_within_days', filters.expiring_within_days.toString());
      if (filters.is_draft !== undefined) params = params.set('is_draft', filters.is_draft.toString());
    }
    return this.http.get<ClientContractsListResponse>(apiEndpoint(this.basePath), { params });
  }

  /**
   * Obtener un contrato por ID
   */
  getContract(id: number): Observable<ClientContractResponse> {
    return this.http.get<ClientContractResponse>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Crear nuevo contrato de cliente
   */
  createContract(payload: ClientContractCreateRequest): Observable<ClientContractResponse> {
    return this.http.post<ClientContractResponse>(apiEndpoint(this.basePath), payload);
  }

  /**
   * Actualizar contrato existente
   */
  updateContract(id: number, payload: ClientContractUpdateRequest): Observable<ClientContractResponse> {
    return this.http.put<ClientContractResponse>(apiEndpoint(`${this.basePath}/${id}`), payload);
  }

  /**
   * Eliminar contrato
   */
  deleteContract(id: number): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Obtener contratos próximos a vencer
   */
  getExpiringContracts(days: number = 30): Observable<ExpiringContractsResponse> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ExpiringContractsResponse>(apiEndpoint(`${this.basePath}/expiring`), { params });
  }

  // ==================== SISTEMAS DE REGIONES ====================

  /**
   * Obtener todos los sistemas de regionalización (IMSS, Pemex, ISSSTE, Nacional)
   */
  getRegionSystems(): Observable<RegionSystem[]> {
    if (this.regionSystemsCache) {
      return of(this.regionSystemsCache);
    }
    return this.http.get<RegionSystemsResponse>(apiEndpoint('v2/contracts/region-systems')).pipe(
      map(response => response.data || []),
      tap(data => this.regionSystemsCache = data)
    );
  }

  /**
   * Obtener regiones de un sistema específico
   */
  getRegionsBySystem(systemId: number): Observable<SystemRegion[]> {
    return this.http.get<SystemRegionsResponse>(
      apiEndpoint(`v2/contracts/region-systems/${systemId}/regions`)
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Obtener regiones disponibles según el cliente (IMSS usa delegaciones IMSS, Pemex usa zonas Pemex, etc.)
   */
  getRegionsByCustomer(customerId: number): Observable<{ system: RegionSystem; regions: SystemRegion[] }> {
    return this.http.get<RegionsByCustomerResponse>(
      apiEndpoint(`v2/contracts/regions-by-customer/${customerId}`)
    ).pipe(
      map(response => response.data || { system: {} as RegionSystem, regions: [] })
    );
  }

  // ==================== REGIONES IMSS (Legacy) ====================

  /**
   * Obtener regiones IMSS (legacy - mantener compatibilidad)
   */
  getIMSSRegions(): Observable<IMSSRegion[]> {
    if (this.regionsCache) {
      return of(this.regionsCache);
    }
    return this.http.get<IMSSRegionsResponse>(apiEndpoint('v2/catalogs/imss-regions')).pipe(
      map(response => response.data || []),
      tap(data => this.regionsCache = data)
    );
  }

  // ==================== DIRECCIONES DEL CLIENTE ====================

  /**
   * Obtener direcciones de un cliente filtradas por región
   */
  getCustomerAddressesByRegion(customerId: number, regionId: number): Observable<CustomerAddress[]> {
    const params = new HttpParams()
      .set('customer_id', customerId.toString())
      .set('region_id', regionId.toString());

    return this.http.get<CustomerAddressesResponse>(
      apiEndpoint('v2/company/clients/addresses-by-region'),
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Obtener direcciones de un cliente filtradas por múltiples regiones
   * Usa el nuevo endpoint que filtra por estados de las regiones
   */
  getCustomerAddressesByRegions(customerId: number, regionIds: number[]): Observable<CustomerAddress[]> {
    let params = new HttpParams().set('customer_id', customerId.toString());
    regionIds.forEach(id => {
      params = params.append('region_ids[]', id.toString());
    });

    return this.http.get<{ ok: boolean; data: CustomerAddress[]; meta?: { is_nationwide: boolean } }>(
      apiEndpoint('v2/contracts/addresses-by-regions'),
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Obtener todas las direcciones de un cliente
   */
  getCustomerAddresses(customerId: number): Observable<CustomerAddress[]> {
    return this.http.get<CustomerAddressesResponse>(
      apiEndpoint(`v2/company/clients/${customerId}/addresses`)
    ).pipe(
      map(response => response.data || [])
    );
  }

  // ==================== PRUEBAS/ESTUDIOS ====================

  /**
   * Obtener catálogo de pruebas/estudios disponibles
   */
  getItems(): Observable<Item[]> {
    if (this.itemsCache) {
      return of(this.itemsCache);
    }
    return this.http.get<ItemsResponse>(apiEndpoint('v2/items')).pipe(
      map(response => response.data || []),
      tap(data => this.itemsCache = data)
    );
  }

  /**
   * Buscar pruebas por término
   */
  searchItems(term: string): Observable<Item[]> {
    const params = new HttpParams().set('search', term);
    return this.http.get<ItemsResponse>(apiEndpoint('v2/items'), { params }).pipe(
      map(response => response.data || [])
    );
  }

  // ==================== DOCUMENTOS DE CONTRATO ====================

  /**
   * Obtener tipos de documentos de contrato
   */
  getDocumentTypes(): Observable<ContractDocumentType[]> {
    if (this.documentTypesCache) {
      return of(this.documentTypesCache);
    }
    return this.http.get<ContractDocumentTypesResponse>(
      apiEndpoint('v2/contracts/document-types')
    ).pipe(
      map(response => response.data || []),
      tap(data => this.documentTypesCache = data)
    );
  }

  /**
   * Obtener documentos de un contrato
   */
  getContractDocuments(contractId: number): Observable<ContractDocument[]> {
    return this.http.get<ContractDocumentsResponse>(
      apiEndpoint(`${this.basePath}/${contractId}/documents`)
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Subir documento a un contrato
   */
  uploadDocument(contractId: number, documentTypeId: number, file: File, observations?: string): Observable<ContractDocumentResponse> {
    const formData = new FormData();
    formData.append('document_type_id', documentTypeId.toString());
    formData.append('file', file);
    if (observations) {
      formData.append('observations', observations);
    }

    return this.http.post<ContractDocumentResponse>(
      apiEndpoint(`${this.basePath}/${contractId}/documents`),
      formData
    );
  }

  /**
   * Descargar documento por nombre de archivo
   */
  downloadDocument(contractId: number, filename: string): Observable<Blob> {
    return this.http.get(
      apiEndpoint(`${this.basePath}/${contractId}/documents/${filename}`),
      { responseType: 'blob' }
    );
  }

  /**
   * Descargar documento por ID (legacy)
   */
  downloadDocumentById(contractId: number, documentId: number): Observable<ContractDocumentDownloadResponse> {
    return this.http.get<ContractDocumentDownloadResponse>(
      apiEndpoint(`${this.basePath}/${contractId}/documents/${documentId}/download`)
    );
  }

  /**
   * Eliminar documento por ID
   */
  deleteDocument(contractId: number, documentId: number): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(
      apiEndpoint(`${this.basePath}/${contractId}/documents/${documentId}`)
    );
  }

  /**
   * Eliminar documento por nombre de archivo
   */
  deleteDocumentByFilename(contractId: number, filename: string): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(
      apiEndpoint(`${this.basePath}/${contractId}/documents/file/${filename}`)
    );
  }

  // ==================== PRÓRROGAS/EXTENSIONES ====================

  /**
   * Obtener prórrogas de un contrato
   */
  getContractExtensions(contractId: number): Observable<ContractExtension[]> {
    return this.http.get<ContractExtensionsResponse>(
      apiEndpoint(`${this.basePath}/${contractId}/extensions`)
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Crear prórroga para un contrato
   */
  createExtension(contractId: number, payload: {
    new_end_date: string;
    extension_days?: number;
    reason?: string;
    document_reference?: string;
  }): Observable<ContractExtensionResponse> {
    return this.http.post<ContractExtensionResponse>(
      apiEndpoint(`${this.basePath}/${contractId}/extensions`),
      payload
    );
  }

  // ==================== ASIGNACIÓN POR UNIDAD MÉDICA ====================

  /**
   * Obtener asignación de items por unidad médica
   */
  getUnitItems(contractId: number): Observable<ContractUnitItemsResponse> {
    return this.http.get<ContractUnitItemsResponse>(
      apiEndpoint(`${this.basePath}/${contractId}/unit-items`)
    );
  }

  /**
   * Actualizar asignación de items por unidad médica
   */
  updateUnitItems(contractId: number, unitItems: {
    address_id: number;
    item_id: number;
    min_quantity?: number;
    max_quantity?: number;
    unit_price?: number;
    observations?: string;
  }[]): Observable<{ ok: boolean; message?: string; data?: ContractUnitItem[] }> {
    return this.http.put<{ ok: boolean; message?: string; data?: ContractUnitItem[] }>(
      apiEndpoint(`${this.basePath}/${contractId}/unit-items`),
      { unit_items: unitItems }
    );
  }

  // ==================== AFIANZADORAS ====================

  /**
   * Obtener proveedores tipo afianzadora
   */
  getBondingCompanies(): Observable<BondingCompany[]> {
    const params = new HttpParams().set('type', 'afianzadora');
    return this.http.get<BondingCompaniesResponse>(
      apiEndpoint('v2/company/providers'),
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpiar caches
   */
  clearCache(): void {
    this.regionsCache = null;
    this.itemsCache = null;
    this.regionSystemsCache = null;
    this.documentTypesCache = null;
  }

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
