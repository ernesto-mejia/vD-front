/**
 * Interfaz para un registro de Activity Log
 */
export interface ActivityLog {
  id: number;
  log_name: string;        // Módulo (companies, items, users, etc.)
  description: string;     // Descripción de la acción
  subject_type: string;    // Tipo del modelo afectado
  subject_id: number;      // ID del registro afectado
  causer_type: string;     // Tipo del causante (App\Models\User)
  causer_id: number;       // ID del usuario que ejecutó la acción
  properties: any;         // Datos adicionales (old, new values, etc.)
  event: string;           // Tipo de evento (created, updated, deleted)
  batch_uuid?: string;     // UUID del batch (opcional)
  created_at: string;      // Fecha de creación
  updated_at: string;      // Fecha de actualización
  causer?: {               // Información del usuario (si se incluye)
    id: number;
    name: string;
    email?: string;
  };
}

/**
 * Interfaz para los filtros de búsqueda de Activity Logs
 */
export interface ActivityLogFilters {
  event?: string;          // created, updated, deleted
  log_name?: string;       // companies, items, users, etc.
  user_id?: number;        // ID del usuario (mantener para compatibilidad)
  user_search?: string;    // Búsqueda por nombre o email del usuario
  from?: string;           // Fecha inicial (YYYY-MM-DD)
  to?: string;             // Fecha final (YYYY-MM-DD)
  sort_by?: string;        // Campo para ordenar (created_at por defecto)
  sort_dir?: 'asc' | 'desc'; // Dirección del ordenamiento
  per_page?: number;       // Cantidad por página
  page?: number;           // Número de página
}

/**
 * Interfaz para la respuesta paginada de Activity Logs
 */
export interface ActivityLogsResponse {
  data: ActivityLog[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

/**
 * Opciones para los selectores de filtros
 */
export interface LogFilterOptions {
  events: { value: string; label: string }[];
  modules: { value: string; label: string }[];
  sortFields: { value: string; label: string }[];
  sortDirections: { value: string; label: string }[];
  perPageOptions: number[];
}
