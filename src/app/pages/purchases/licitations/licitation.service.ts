import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import {
  Licitation,
  LicitationCreateRequest,
  LicitationUpdateRequest,
  LicitationStatusChangeRequest,
  ConvertToContractRequest,
  LicitationFilters,
  LicitationsListResponse,
  LicitationResponse,
  ConvertToContractResponse,
  LicitationStats,
} from './licitation.model';

@Injectable({
  providedIn: 'root'
})
export class LicitationService {
  private readonly basePath = 'v2/licitations';

  constructor(private http: HttpClient) { }

  // ==================== CRUD ====================

  /**
   * Obtener lista de licitaciones con filtros y paginación
   */
  getAll(filters?: LicitationFilters): Observable<LicitationsListResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.company_id) params = params.set('company_id', filters.company_id.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.active_only) params = params.set('active_only', 'true');
      if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
      if (filters.sort_dir) params = params.set('sort_dir', filters.sort_dir);
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
    }

    return this.http.get<LicitationsListResponse>(apiEndpoint(this.basePath), { params });
  }

  /**
   * Obtener una licitación por ID
   */
  getById(id: number): Observable<LicitationResponse> {
    return this.http.get<LicitationResponse>(apiEndpoint(`${this.basePath}/${id}`));
  }

  /**
   * Crear nueva licitación
   */
  create(data: LicitationCreateRequest): Observable<LicitationResponse> {
    return this.http.post<LicitationResponse>(apiEndpoint(this.basePath), data);
  }

  /**
   * Actualizar licitación
   */
  update(id: number, data: LicitationUpdateRequest): Observable<LicitationResponse> {
    return this.http.put<LicitationResponse>(apiEndpoint(`${this.basePath}/${id}`), data);
  }

  /**
   * Eliminar licitación
   */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      apiEndpoint(`${this.basePath}/${id}`)
    );
  }

  // ==================== ACCIONES ESPECIALES ====================

  /**
   * Cambiar estado de la licitación
   */
  changeStatus(id: number, data: LicitationStatusChangeRequest): Observable<LicitationResponse> {
    return this.http.post<LicitationResponse>(
      apiEndpoint(`${this.basePath}/${id}/change-status`),
      data
    );
  }

  /**
   * Convertir licitación ganada a contrato de cliente
   */
  convertToContract(id: number, data: ConvertToContractRequest): Observable<ConvertToContractResponse> {
    return this.http.post<ConvertToContractResponse>(
      apiEndpoint(`${this.basePath}/${id}/convert-to-contract`),
      data
    );
  }

  // ==================== CONSULTAS ====================

  /**
   * Obtener estadísticas de licitaciones
   */
  getStats(companyId?: number): Observable<{ success: boolean; data: LicitationStats }> {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('company_id', companyId.toString());
    }
    return this.http.get<{ success: boolean; data: LicitationStats }>(
      apiEndpoint(`${this.basePath}/stats/summary`),
      { params }
    );
  }

  /**
   * Obtener licitaciones ganadas pendientes de conversión
   */
  getPendingConversion(companyId?: number): Observable<{ success: boolean; data: Licitation[] }> {
    let params = new HttpParams();
    if (companyId) {
      params = params.set('company_id', companyId.toString());
    }
    return this.http.get<{ success: boolean; data: Licitation[] }>(
      apiEndpoint(`${this.basePath}/pending/conversion`),
      { params }
    );
  }

  // ==================== CATÁLOGOS ====================

  /**
   * Obtener clientes para selector
   */
  getClients(): Observable<{ id: number; name: string; tax_id?: string }[]> {
    return this.http.get<any>(apiEndpoint('v2/company/clients')).pipe(
      map(response => {
        const data = response.data || response;
        return (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id,
          name: c.company || c.shortname || c.name,
          tax_id: c.tax_id,
        }));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Obtener regiones IMSS
   */
  getRegions(): Observable<{ id: number; code: string; name: string }[]> {
    return this.http.get<any>(apiEndpoint('v2/catalogs/imss-regions')).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }
}
