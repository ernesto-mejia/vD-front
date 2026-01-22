import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { notificationEndpoint } from '../../shared/api-endpoint.util';
import { NotificationItem, NotificationListResponse, NotificationModule, NotificationAction, NotificationCreatePayload, NotificationUpdatePayload, RoleSummary, UserSummary } from '../../shared/models/notification.model';

export interface NotificationFilters {
  module?: string;
  severity?: string;
  status?: string;
  exclude_status?: string;
  page?: number;
  perPage?: number;
  search?: string;
  userId?: number;
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationGatewayService {
  private notifications$ = new BehaviorSubject<NotificationItem[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private pagination$ = new BehaviorSubject<PaginationMeta>({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  });

  constructor(private http: HttpClient) {}

  /**
   * Get current user ID from localStorage
   */
  private getCurrentUserId(): number | null {
    try {
      // Primero intentar obtener directamente de 'user_id' (como lo guarda auth.service)
      const directUserId = localStorage.getItem('user_id');
      if (directUserId) {
        const parsed = parseInt(directUserId, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }

      // Intentar obtener de user_permissions
      const permissionsString = localStorage.getItem('user_permissions');
      if (permissionsString) {
        const permissions = JSON.parse(permissionsString);
        if (permissions.user_id) return permissions.user_id;
        if (permissions.user?.id) return permissions.user.id;
        if (permissions.id) return permissions.id;
      }

      // Intentar obtener de userData
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        if (userData.user_id) return userData.user_id;
        if (userData.user?.id) return userData.user.id;
        if (userData.id) return userData.id;
      }

      // Intentar obtener de currentUser
      const currentUserString = localStorage.getItem('currentUser');
      if (currentUserString) {
        const currentUser = JSON.parse(currentUserString);
        if (currentUser.user_id) return currentUser.user_id;
        if (currentUser.id) return currentUser.id;
      }

      // Fallback: intentar obtener del token JWT
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('access_token');
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.sub) return parseInt(payload.sub, 10);
            if (payload.user_id) return payload.user_id;
            if (payload.id) return payload.id;
          }
        } catch (e) {
          console.error('[NotificationGateway] Error decoding JWT:', e);
        }
      }

      console.warn('[NotificationGateway] Could not find user ID in localStorage');
      return null;
    } catch (error) {
      console.error('[NotificationGateway] Error getting user ID:', error);
      return null;
    }
  }

  stream(): Observable<NotificationItem[]> {
    return this.notifications$.asObservable();
  }

  unread(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  load(filters?: NotificationFilters): Observable<NotificationListResponse> {
    // Por defecto cargar todo para DataTables client-side
    const baseFilters: NotificationFilters = { perPage: -1, ...filters };
    let url = 'notifications';
    if (baseFilters) {
      const params = new URLSearchParams(baseFilters as any).toString();
      url += `?${params}`;
    }
    return this.http.get<any>(notificationEndpoint(url)).pipe(
      map((resp) => {

        // La API devuelve { ok: true, data: [...], meta: {...} }
        const list = Array.isArray(resp?.data) ? resp.data : [];
        const meta = resp?.meta || {};

        return {
          ok: resp?.ok ?? true,
          data: list,
          meta: {
            total: meta.total || 0,
            unread: meta.unread || 0,
            currentPage: meta.currentPage || 1,
            lastPage: meta.lastPage || 1,
            perPage: meta.perPage || 10
          }
        };
      }),
      tap((resp) => {
        const list = resp.data;
        this.setLists(list, resp.meta?.unread);
        if (resp.meta) {
          this.pagination$.next({
            currentPage: resp.meta.currentPage || 1,
            lastPage: resp.meta.lastPage || 1,
            perPage: resp.meta.perPage || 10,
            total: resp.meta.total || 0
          });
        }
      }),
      catchError((error) => {
        console.error('Error loading notifications, trying mock:', error);
        return this.loadMock();
      })
    );
  }

  /**
   * Load user inbox - notification instances with resolved placeholders.
   * Use this for the user's notification inbox view.
   */
  loadInbox(filters?: NotificationFilters): Observable<NotificationListResponse> {
    const userId = this.getCurrentUserId();
    const baseFilters: NotificationFilters = { perPage: -1, ...filters };
    let url = 'notifications/inbox';
    const params = new URLSearchParams();

    // Agregar user_id si está disponible
    if (userId) {
      params.append('user_id', userId.toString());
    }

    if (baseFilters) {
      Object.entries(baseFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(notificationEndpoint(url)).pipe(
      map((resp) => {

        const list = Array.isArray(resp?.data) ? resp.data : [];
        const meta = resp?.meta || {};

        return {
          ok: resp?.ok ?? true,
          data: list,
          meta: {
            total: meta.total || 0,
            unread: meta.unread || 0,
            currentPage: meta.currentPage || 1,
            lastPage: meta.lastPage || 1,
            perPage: meta.perPage || 10
          }
        };
      }),
      tap((resp) => {
        const list = resp.data;
        this.setLists(list, resp.meta?.unread);
        if (resp.meta) {
          this.pagination$.next({
            currentPage: resp.meta.currentPage || 1,
            lastPage: resp.meta.lastPage || 1,
            perPage: resp.meta.perPage || 10,
            total: resp.meta.total || 0
          });
        }
      }),
      catchError((error) => {
        console.error('Error loading inbox, trying mock:', error);
        return this.loadMock();
      })
    );
  }

  /**
   * Load notification templates for admin view.
   * Use this for the admin notification template management view.
   */
  loadTemplates(filters?: NotificationFilters): Observable<NotificationListResponse> {
    const baseFilters: NotificationFilters = { perPage: -1, ...filters };
    let url = 'notifications/templates';
    if (baseFilters) {
      const params = new URLSearchParams(baseFilters as any).toString();
      url += `?${params}`;
    }
    return this.http.get<any>(notificationEndpoint(url)).pipe(
      map((resp) => {

        const list = Array.isArray(resp?.data) ? resp.data : [];
        const meta = resp?.meta || {};

        return {
          ok: resp?.ok ?? true,
          data: list,
          meta: {
            total: meta.total || 0,
            unread: 0,
            currentPage: meta.currentPage || 1,
            lastPage: meta.lastPage || 1,
            perPage: meta.perPage || 10
          }
        };
      }),
      catchError((error) => {
        console.error('Error loading templates:', error);
        return this.loadMock();
      })
    );
  }

  private loadMock(): Observable<NotificationListResponse> {
    return this.http.get<NotificationItem[]>('/mocks/notifications.json').pipe(
      tap((raw: NotificationItem[]) => {
        const list = Array.isArray(raw) ? raw : [];
        this.setLists(list);
      }),
      map((raw: NotificationItem[]) => ({ ok: true, data: Array.isArray(raw) ? raw : [] }))
    );
  }

  private setLists(list: NotificationItem[], unreadOverride?: number): void {
    this.notifications$.next(list);
    const unread = unreadOverride ?? list.filter(n => n.status !== 'viewed' && n.status !== 'attended' && n.status !== 'accepted').length;
    this.unreadCount$.next(unread);
  }

  /**
   * Mark inbox notification instance as viewed.
   * Uses the notification ID.
   */
  markViewed(id: number): Observable<any> {
    return this.http.post(notificationEndpoint(`notifications/${id}/mark-viewed`), {}).pipe(
      tap(() => this.refreshInbox())
    );
  }

  /**
   * Mark inbox notification instance as attended.
   * Uses the notification ID.
   */
  markAttended(id: number): Observable<any> {
    return this.http.post(notificationEndpoint(`notifications/${id}/mark-attended`), {}).pipe(
      tap(() => this.refreshInbox())
    );
  }

  /**
   * Mark ALL notifications as viewed for current user.
   */
  markAllAsViewed(): Observable<any> {
    return this.http.post(notificationEndpoint('notifications/mark-all-read'), {}).pipe(
      tap(() => this.refreshInbox())
    );
  }

  /**
   * Mark ALL notifications as attended for current user.
   */
  markAllAsAttended(): Observable<any> {
    return this.http.post(notificationEndpoint('notifications/mark-all-attended'), {}).pipe(
      tap(() => this.refreshInbox())
    );
  }

  // Mock update when backend not available
  updateLocal(id: number, partial: Partial<NotificationItem>): void {
    const list = this.notifications$.value.map(n => n.id === id ? { ...n, ...partial } : n);
    this.setLists(list);
  }

  deleteLocal(id: number): void {
    const list = this.notifications$.value.filter(n => n.id !== id);
    this.setLists(list);
  }

  /**
   * Emit event - now just refreshes inbox since backend handles notification creation automatically
   * @deprecated Backend now creates notifications automatically via NotificationTriggerService
   */
  emitEvent(module: NotificationModule, action: NotificationAction, entityId: number, payload?: any): Observable<any> {
    // Backend now handles notification creation automatically
    // Just refresh the inbox to show new notifications
    this.refreshInbox();
    return new Observable(observer => {
      observer.next({ ok: true, message: 'Notifications are now handled by backend' });
      observer.complete();
    });
  }

  private refresh(): void {
    this.load().subscribe();
  }

  private refreshInbox(): void {
    this.loadInbox().subscribe();
    this.loadUnreadCount().subscribe();
  }

  /**
   * Get a notification template by ID (admin use)
   */
  getById(id: number): Observable<NotificationItem | undefined> {
    return this.http.get<any>(notificationEndpoint(`notifications/${id}`)).pipe(
      map(resp => {
        // La API devuelve { ok: true, data: { notification: {...}, logs: [...] } }
        const notification = resp?.data?.notification || resp?.data;
        return notification as NotificationItem;
      })
    );
  }

  /**
   * Get an inbox notification item by log ID (user inbox use)
   */
  getInboxItemById(logId: number): Observable<NotificationItem | undefined> {
    return this.http.get<any>(notificationEndpoint(`notifications/inbox/${logId}`)).pipe(
      map(resp => resp?.data as NotificationItem)
    );
  }

  loadUnreadCount(): Observable<number> {
    const userId = this.getCurrentUserId();
    let url = 'notifications/unread-count';
    if (userId) {
      url += `?user_id=${userId}`;
    }
    return this.http.get<any>(notificationEndpoint(url)).pipe(
      map(resp => resp?.data?.count ?? 0),
      tap(count => this.unreadCount$.next(count))
    );
  }

  update(id: number, data: Partial<NotificationItem>): Observable<NotificationItem> {
    return this.http.put<any>(notificationEndpoint(`notifications/${id}`), data).pipe(
      map(resp => resp?.data as NotificationItem),
      tap(() => this.refresh())
    );
  }

  delete(id: number): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<any>(notificationEndpoint(`notifications/${id}`)).pipe(
      tap(() => this.refresh())
    );
  }

  getPagination(): Observable<PaginationMeta> {
    return this.pagination$.asObservable();
  }

  create(payload: NotificationCreatePayload): Observable<NotificationItem> {
    return this.http.post<any>(notificationEndpoint('notifications'), payload).pipe(
      map(resp => resp?.data as NotificationItem),
      tap(() => this.refresh())
    );
  }

  fetchRoles(): Observable<RoleSummary[]> {
    return this.http.get<any>(notificationEndpoint('notification-roles')).pipe(
      map(resp => resp?.data ?? [])
    );
  }

  fetchUsers(): Observable<UserSummary[]> {
    return this.http.get<any>(notificationEndpoint('notification-users')).pipe(
      map(resp => resp?.data ?? [])
    );
  }

  /**
   * Get user notification metrics
   */
  getUserMetrics(userId: number, days: number = 30): Observable<any> {
    return this.http.get<any>(notificationEndpoint(`notification-analytics/user/${userId}?days=${days}`)).pipe(
      map(resp => resp?.data ?? null)
    );
  }

  /**
   * Get user radar data (by module)
   */
  getUserRadar(userId: number): Observable<any[]> {
    return this.http.get<any>(notificationEndpoint(`notification-analytics/user/${userId}/radar`)).pipe(
      map(resp => resp?.data ?? [])
    );
  }

  /**
   * Get user full statistics (includes last login, last action, suggestions, etc.)
   */
  getUserFullStats(userId: number, days: number = 30): Observable<any> {
    return this.http.get<any>(notificationEndpoint(`notifications/analytics/user/${userId}/full-stats?days=${days}`)).pipe(
      map(resp => resp?.data ?? null)
    );
  }
}
