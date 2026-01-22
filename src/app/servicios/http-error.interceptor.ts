import { HttpEvent, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, retryWhen, scan, delay, switchMap, filter, take } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

// Estado global para manejar refresh de token
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// URLs que no deben redirigir en caso de 401 (peticiones de background)
const SILENT_401_URLS = [
  'notifications/blocking',
  'notifications/pending-authorizations',
  'notifications/unread-count',
  'chat/unread-count',
  'announcements/unread-count'
];

export function httpErrorInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 segundo
  const router = inject(Router);

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        scan((retryCount, error) => {
          if (retryCount >= maxRetries || !(error instanceof HttpErrorResponse) || error.status !== 429) {
            throw error;
          }
          return retryCount + 1;
        }, 0),
        delay(retryDelay)
      )
    ),
    catchError((error: HttpErrorResponse) => {
      // Manejar error 401 - Token expirado o inválido
      if (error.status === 401) {
        return handle401Error(req, error, router);
      }

      // Manejar error 403 - Sin permisos
      if (error.status === 403) {
        console.warn('Sin permisos para esta acción:', req.url);
        // No redirigir, solo loguear - el componente manejará el error
      }

      // Error 429 - Rate limiting
      if (error.status === 429) {
        console.error('Error 429: Too Many Requests');
      }

      return throwError(() => error);
    })
  );
}

function handle401Error(
  req: HttpRequest<any>,
  error: HttpErrorResponse,
  router: Router
): Observable<HttpEvent<any>> {
  // Verificar si es una URL que debe fallar silenciosamente
  const isSilentUrl = SILENT_401_URLS.some(url => req.url.includes(url));

  if (isSilentUrl) {
    // Para peticiones de background, simplemente devolver el error sin redirigir
    console.debug('401 silencioso para:', req.url);
    return throwError(() => error);
  }

  // Verificar si hay un token actual
  const token = localStorage.getItem('authToken');

  if (!token) {
    // No hay token, redirigir a login
    cleanupAndRedirect(router);
    return EMPTY;
  }

  // Verificar si el token está expirado
  if (isTokenExpired(token)) {
    console.warn('Token JWT expirado, redirigiendo a login...');
    cleanupAndRedirect(router);
    return EMPTY;
  }

  // Si ya estamos refrescando, esperar
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(() => {
        // El token fue refrescado, pero en este caso simplemente fallamos
        // porque no tenemos endpoint de refresh implementado
        return throwError(() => error);
      })
    );
  }

  // Token inválido por otra razón
  console.warn('Token JWT inválido, redirigiendo a login...');
  cleanupAndRedirect(router);
  return EMPTY;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir a milliseconds
    const now = Date.now();
    const buffer = 60 * 1000; // 1 minuto de buffer
    return now >= (exp - buffer);
  } catch {
    return true; // Si no podemos parsear el token, considerarlo expirado
  }
}

function cleanupAndRedirect(router: Router): void {
  // Limpiar datos de sesión
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('permissions');
  localStorage.removeItem('roles');

  // Redirigir a login
  router.navigate(['/login'], {
    queryParams: {
      expired: 'true',
      returnUrl: router.url
    }
  });
}
