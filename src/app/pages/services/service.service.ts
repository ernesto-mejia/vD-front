import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Service,
  ServicesListResponse,
  ServiceDetailResponse,
  ServiceCreateRequest,
  ServiceCreateResponse,
  ServiceUpdateRequest,
  ServiceDeleteResponse,
  ProviderOption,
} from './services';
import { apiEndpoint } from '../../shared/api-endpoint.util';
import { NotificationGatewayService } from '../../core/services/notification-gateway.service';

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private readonly servicesBasePath = 'v2/services';

  constructor(
    private http: HttpClient,
    private notifications: NotificationGatewayService
  ) {}

  /**
   * Obtener lista de todos los servicios
   */
  getServices(): Observable<Service[]> {
    return this.http
      .get<ServicesListResponse>(apiEndpoint(this.servicesBasePath))
      .pipe(map((response) => response?.data ?? []));
  }

  /**
   * Obtener un servicio por ID
   */
  getService(id: number): Observable<ServiceDetailResponse> {
    return this.http.get<ServiceDetailResponse>(
      apiEndpoint(`${this.servicesBasePath}/${id}`)
    );
  }

  /**
   * Crear un nuevo servicio
   */
  createService(
    payload: ServiceCreateRequest
  ): Observable<ServiceCreateResponse> {
    return this.http
      .post<ServiceCreateResponse>(apiEndpoint(this.servicesBasePath), payload)
      .pipe(
        tap((resp: any) => {
          const id = resp?.id;
          if (id) {
            this.notifications
              .emitEvent('services', 'create', Number(id), {
                request: payload,
                response: resp,
              })
              .subscribe();
          }
        })
      );
  }

  /**
   * Actualizar un servicio existente
   */
  updateService(
    id: number,
    payload: ServiceUpdateRequest
  ): Observable<ServiceCreateResponse> {
    return this.http
      .put<ServiceCreateResponse>(
        apiEndpoint(`${this.servicesBasePath}/${id}`),
        payload
      )
      .pipe(
        tap((resp) => {
          this.notifications
            .emitEvent('services', 'update', id, {
              request: payload,
              response: resp,
            })
            .subscribe();
        })
      );
  }

  /**
   * Eliminar un servicio
   */
  deleteService(id: number): Observable<ServiceDeleteResponse> {
    return this.http
      .delete<ServiceDeleteResponse>(
        apiEndpoint(`${this.servicesBasePath}/${id}`)
      )
      .pipe(
        tap((resp) => {
          this.notifications
            .emitEvent('services', 'delete', id, { response: resp })
            .subscribe();
        })
      );
  }

  /**
   * Obtener impuestos disponibles
   */
  getServiceTaxes(): Observable<any[]> {
    return this.http
      .get<any>(apiEndpoint('v2/tax-rules/select-options'))
      .pipe(map((response) => response?.data ?? response ?? []));
  }

  /**
   * Obtener unidades de medida
   */
  getServiceUnits(): Observable<any[]> {
    return this.http
      .get<any>(apiEndpoint('v2/company/meta/service-units'))
      .pipe(map((response) => response?.data ?? response ?? []));
  }

  /**
   * Obtener catálogo de proveedores
   */
  getProvidersCatalog(): Observable<ProviderOption[]> {
    return this.http
      .get<any>(apiEndpoint('v2/providers/options'))
      .pipe(map((response) => response?.data ?? response ?? []));
  }
}
