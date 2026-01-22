import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ClientOption,
  Prueba,
  PruebasListResponse,
  PruebaDetailResponse,
  PruebaCreateRequest,
  PruebaCreateResponse,
  PruebaUpdateRequest,
  PruebaDeleteResponse,
  SpecialtyOption,
  TaxRuleOption,
  MedicalTestOption,
} from './pruebas';
import { apiEndpoint } from '../../shared/api-endpoint.util';
import { NotificationGatewayService } from '../../core/services/notification-gateway.service';

@Injectable({
  providedIn: 'root',
})
export class PruebaService {
  private readonly pruebasBasePath = 'v2/medical-tests';

  constructor(
    private http: HttpClient,
    private notifications: NotificationGatewayService
  ) {}

  // ==================== MÉTODOS CRUD ====================

  /**
   * Obtener lista de todos los estudios
   */
  getPruebas(): Observable<Prueba[]> {
    return this.http
      .get<PruebasListResponse>(apiEndpoint(this.pruebasBasePath))
      .pipe(map((response) => response?.data ?? []));
  }

  /**
   * Obtener un estudio por ID
   */
  getPrueba(id: number): Observable<PruebaDetailResponse> {
    return this.http.get<PruebaDetailResponse>(
      apiEndpoint(`${this.pruebasBasePath}/${id}`)
    );
  }

  /**
   * Crear un nuevo estudio
   */
  createPrueba(payload: PruebaCreateRequest): Observable<PruebaCreateResponse> {
    return this.http
      .post<PruebaCreateResponse>(apiEndpoint(this.pruebasBasePath), payload)
      .pipe(
        tap((resp: any) => {
          const id = resp?.id;
          if (id) {
            this.notifications
              .emitEvent('pruebas', 'create', Number(id), {
                request: payload,
                response: resp,
              })
              .subscribe();
          }
        })
      );
  }

  /**
   * Actualizar un estudio existente
   */
  updatePrueba(
    id: number,
    payload: PruebaUpdateRequest
  ): Observable<PruebaCreateResponse> {
    return this.http
      .put<PruebaCreateResponse>(
        apiEndpoint(`${this.pruebasBasePath}/${id}`),
        payload
      )
      .pipe(
        tap((resp) => {
          this.notifications
            .emitEvent('pruebas', 'update', id, {
              request: payload,
              response: resp,
            })
            .subscribe();
        })
      );
  }

  /**
   * Eliminar un estudio
   */
  deletePrueba(id: number): Observable<PruebaDeleteResponse> {
    return this.http
      .delete<PruebaDeleteResponse>(
        apiEndpoint(`${this.pruebasBasePath}/${id}`)
      )
      .pipe(
        tap((resp) => {
          this.notifications
            .emitEvent('pruebas', 'delete', id, { response: resp })
            .subscribe();
        })
      );
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtener catálogo de clientes
   */
  getClientsCatalog(): Observable<ClientOption[]> {
    return this.http
      .get<any>(apiEndpoint('v2/clients/options'))
      .pipe(map((response) => response?.data ?? response ?? []));
  }

  /**
   * Obtener catálogo de especialidades
   */
  getSpecialties(): Observable<SpecialtyOption[]> {
    return this.http
      .get<any>(apiEndpoint('v2/specialties'))
      .pipe(map((response) => response?.data ?? response ?? []));
  }

  /**
   * Obtener reglas de impuesto
   */
  getTaxRules(): Observable<TaxRuleOption[]> {
    return this.http
      .get<any>(apiEndpoint('v2/tax-rules/select-options'))
      .pipe(map((response) => response?.data ?? response ?? []));
  }

  /**
   * Buscar opciones de estudios (para grupo)
   */
  getMedicalTestOptions(search: string): Observable<MedicalTestOption[]> {
    return this.http
      .get<any>(
        apiEndpoint(
          `v2/medical-tests/options?search=${encodeURIComponent(search)}`
        )
      )
      .pipe(map((response) => response?.data ?? response ?? []));
  }

  /**
   * Crear estudio rapido (para alta de grupo)
   */
  quickCreateMedicalTest(payload: {
    name: string;
    group_name?: string | null;
  }): Observable<PruebaCreateResponse> {
    return this.http.post<PruebaCreateResponse>(
      apiEndpoint('v2/medical-tests/quick-create'),
      payload
    );
  }
}
