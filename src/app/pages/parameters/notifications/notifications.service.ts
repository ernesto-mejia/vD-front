import { Injectable } from '@angular/core';
import { NotificationCreatePayload, NotificationItem, RoleSummary, UserSummary, GroupedPermissions, GroupedPermission } from '../../../shared/models/notification.model';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  constructor(private http: HttpClient) { }

  create(payload: NotificationCreatePayload): Observable<NotificationItem> {
    return this.http.post<any>(apiEndpoint('v2/notifications'), payload).pipe(
      map(resp => resp?.data?.notification as NotificationItem),
      tap(() => this.refresh())
    );
  }
    private refresh(): void {
    this.load().subscribe();
  }

  load(): Observable<NotificationItem[]> {
    return this.http.get<any>(apiEndpoint('v2/notifications')).pipe(
      map(resp => resp?.data as NotificationItem[])
    );
  }


    fetchRoles(): Observable<RoleSummary[]> {
      return this.http.get<any>(apiEndpoint('v2/roles')).pipe(
        map(resp => {
          const data = resp?.data.data ?? [];
          const roles = Array.isArray(data) ? data.map((r: any) => ({
            id: r.id || r.roleId,
            name: r.name || r.nombre || r.roleName || `Rol ${r.id}`
          })) : [];
          return roles;
        })
      );
    }

    fetchUsers(): Observable<UserSummary[]> {
      return this.http.get<any>(apiEndpoint('v2/users')).pipe(
        map(resp => {
          const data = resp?.data ?? [];
          const users = Array.isArray(data) ? data.map((u: any) => ({
            id: u.id || u.userId,
            name: u.name || u.nombre || u.fullName || u.userName || `Usuario ${u.id}`,
            email: u.email || u.correo || undefined
          })) : [];
          return users;
        })
      );
    }

    /**
     * Fetch grouped permissions from the backend
     * Returns modules with their associated actions/permissions
     */
    fetchGroupedPermissions(): Observable<GroupedPermissions> {
      return this.http.get<any>(apiEndpoint('v2/permissions/grouped')).pipe(
        map(resp => {
          const data = resp?.data ?? {};
          // Transform to GroupedPermissions format
          const grouped: GroupedPermissions = {};
          Object.keys(data).forEach(module => {
            grouped[module] = Array.isArray(data[module])
              ? data[module].map((p: any) => typeof p === 'string' ? p : p.name || p.action)
              : [];
          });
          return grouped;
        }),
        catchError(err => {
          console.error('Error fetching grouped permissions:', err);
          // Return fallback mock data for development
          return of({
            users: ['create', 'update', 'delete', 'view'],
            customers: ['create', 'update', 'delete', 'view'],
            providers: ['create', 'update', 'delete', 'view'],
            inventory: ['create', 'update', 'delete', 'view', 'transfer'],
            orders: ['create', 'update', 'delete', 'view', 'approve'],
            reports: ['view', 'export'],
            settings: ['view', 'update']
          } as GroupedPermissions);
        })
      );
    }

    // load(filters?: NotificationFilters): Observable<NotificationListResponse> {
    //   let url = 'notifications';
    //   if (filters) {
    //     const params = new URLSearchParams(filters as any).toString();
    //     url += `?${params}`;
    //   }
    //   return this.http.get<NotificationListResponse>(apiEndpoint(url)).pipe(
    //     tap((resp) => {
    //       const list = resp?.data ?? [];
    //       this.setLists(list, resp?.meta?.unread);
    //       if (resp?.meta) {
    //         this.pagination$.next({
    //           currentPage: resp.meta.currentPage || 1,
    //           lastPage: resp.meta.lastPage || 1,
    //           perPage: resp.meta.perPage || 10,
    //           total: resp.meta.total || 0
    //         });
    //       }
    //     }),
    //     catchError(() => this.loadMock())
    //   );
    // }
}
