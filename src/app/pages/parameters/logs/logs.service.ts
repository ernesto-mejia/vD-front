import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import { ActivityLog, ActivityLogFilters, ActivityLogsResponse, LogFilterOptions } from './logs';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private readonly basePath = 'v2/activity-logs';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de Activity Logs con filtros y paginación
   */
  getActivityLogs(filters: ActivityLogFilters = {}): Observable<ActivityLogsResponse> {
    let params = new HttpParams();

    // Agregar filtros a los parámetros de la URL
    if (filters.event && filters.event.trim() !== '') {
      params = params.set('event', filters.event);
    }
    if (filters.log_name && filters.log_name.trim() !== '') {
      params = params.set('log_name', filters.log_name);
    }
    if (filters.user_id) {
      params = params.set('user_id', filters.user_id.toString());
    }
    if (filters.user_search && filters.user_search.trim() !== '') {
      params = params.set('user_search', filters.user_search.trim());
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.sort_by) {
      params = params.set('sort_by', filters.sort_by);
    }
    if (filters.sort_dir) {
      params = params.set('sort_dir', filters.sort_dir);
    }
    if (filters.per_page) {
      params = params.set('per_page', filters.per_page.toString());
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    return this.http.get<ActivityLogsResponse>(apiEndpoint(this.basePath), { params });
  }

  /**
   * Obtiene un Activity Log específico por ID
   */
  getActivityLog(id: number): Observable<ActivityLog> {
    return this.http.get<{ data: ActivityLog }>(apiEndpoint(`${this.basePath}/${id}`)).pipe(
      map(response => response.data)
    );
  }

  /**
   * Retorna las opciones por defecto para los filtros
   */
  getFilterOptions(): LogFilterOptions {
    return {
      events: [
        { value: '', label: '-- Todos --' },
        { value: 'created', label: 'Creación' },
        { value: 'updated', label: 'Actualización' },
        { value: 'deleted', label: 'Eliminación' }
      ],
      modules: [
        { value: '', label: '-- Todos --' },
        { value: 'companies', label: 'Empresas' },
        { value: 'customers', label: 'Clientes' },
        { value: 'providers', label: 'Proveedores' },
        { value: 'contracts', label: 'Contratos' },
        { value: 'items', label: 'Artículos' },
        { value: 'users', label: 'Usuarios' },
        { value: 'inventories', label: 'Inventarios' },
        { value: 'documents', label: 'Documentos' },
        { value: 'roles', label: 'Roles' },
        { value: 'permissions', label: 'Permisos' }
      ],
      sortFields: [
        { value: 'created_at', label: 'Fecha de creación' },
        { value: 'updated_at', label: 'Fecha de actualización' },
        { value: 'log_name', label: 'Módulo' },
        { value: 'event', label: 'Evento' }
      ],
      sortDirections: [
        { value: 'desc', label: 'Descendente (más reciente primero)' },
        { value: 'asc', label: 'Ascendente (más antiguo primero)' }
      ],
      perPageOptions: [10, 15, 25, 50, 100]
    };
  }

  /**
   * Obtiene el label de un evento
   */
  getEventLabel(event: string): string {
    const labels: { [key: string]: string } = {
      'created': 'Creación',
      'updated': 'Actualización',
      'deleted': 'Eliminación'
    };
    return labels[event] || event;
  }

  /**
   * Obtiene la clase CSS para un evento (para badges)
   */
  getEventClass(event: string): string {
    const classes: { [key: string]: string } = {
      'created': 'badge-success',
      'updated': 'badge-warning',
      'deleted': 'badge-danger'
    };
    return classes[event] || 'badge-secondary';
  }
}
