// src/app/shared/api-endpoint.util.ts

/**
 * Devuelve el endpoint base para la API según variable global o fallback local.
 * @param endpath Ruta relativa del recurso (ej: 'users/list')
 */
export function apiEndpoint(endpath: string): string {
  // Usa window._API_URL si está definida y no es '__API_URL__', si no, usa /api/ (proxy Angular en desarrollo)
  const apiUrl = (window as any)._API_URL;
  const base = !apiUrl || apiUrl === '__API_URL__' ? '/api/' : apiUrl;
  return base.replace(/\/$/, '') + '/' + endpath.replace(/^\//, '');
}

/**
 * Endpoint específico para notificaciones (usa el backend principal con API v2)
 */
export function notificationEndpoint(endpath: string): string {
  // Usa window._API_URL si está definida, si no usa proxy Angular en desarrollo
  const apiUrl = (window as any)._API_URL;
  // En desarrollo usa /api/v2 (proxy Angular), en producción usa la URL configurada
  const base = !apiUrl || apiUrl === '__API_URL__' ? '/api/v2' : apiUrl.replace(/\/api\/?$/, '/api/v2');
  return base.replace(/\/$/, '') + '/' + endpath.replace(/^\//, '');
}

