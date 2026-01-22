import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserViewResponse, UsersListResponse, RolesListResponse } from './user';
import { NotificationGatewayService } from '../../../core/services/notification-gateway.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly usersBasePath = 'v2/users';
  private readonly rolesBasePath = 'v2/roles';
  private readonly permissionsBasePath = 'v2/permissions';

  constructor(private http: HttpClient, private router: Router, private notifications: NotificationGatewayService) {}

  editUser(userId: string): void {
    this.router.navigate(['/users/edit', userId]);
  }

  userView(userId: string): void {
    this.router.navigate(['/users/view', userId]);
  }

  getUsers(
    page: number = 1,
    perPage: number = 15,
    search: string = ''
  ): Observable<UsersListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }

    return this.http.get<UsersListResponse>(apiEndpoint(this.usersBasePath), {
      params,
    });
  }

  softDeleteUser(userId: string): void {
    const url = apiEndpoint(`${this.usersBasePath}/${userId}`);
    this.http.delete(url).subscribe({
      next: (resp) => {
        this.notifications.emitEvent('users', 'delete', Number(userId), { response: resp }).subscribe();
      },
      error: (error) => console.error('Error al eliminar usuario:', error),
    });
  }

  // Obtener data de Usuario por ID
  getUser(id: number): Observable<UserViewResponse> {
    return this.http.get<UserViewResponse>(
      apiEndpoint(`${this.usersBasePath}/${id}`)
    );
  }

  // Obtener lista de roles
  getRoles(): Observable<RolesListResponse> {
    return this.http.get<RolesListResponse>(apiEndpoint(this.rolesBasePath));
  }

  // Obtener lista de permisos
  getPermissions(): Observable<any> {
    return this.http.get<any>(apiEndpoint(this.permissionsBasePath));
  }

  // Crear usuario
  createUser(userData: any): Observable<any> {
    return this.http.post<any>(apiEndpoint(this.usersBasePath), userData).pipe(
      tap((resp: any) => {
        const id = resp?.id ?? resp?.data?.id;
        if (id) {
          this.notifications.emitEvent('users', 'create', Number(id), { request: userData, response: resp }).subscribe();
        }
      })
    );
  }

  // Actualizar usuario
  updateUser(userId: string, userData: any): Observable<any> {
    return this.http.put<any>(
      apiEndpoint(`${this.usersBasePath}/${userId}`),
      userData
    ).pipe(
      tap((resp: any) => {
        this.notifications.emitEvent('users', 'update', Number(userId), { request: userData, response: resp }).subscribe();
      })
    );
  }
}
