import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RoleCreateRequest,
  RoleDetail,
  RoleResponse,
  RolesListResponse,
  permission,
  permissionsByCategoryResponse,
} from './role';
 import { apiEndpoint } from '../../../shared/api-endpoint.util';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private http: HttpClient) {}

  // CRUD principal para Roles
  getRoles(): Observable<RolesListResponse> {
    return this.http.get<RolesListResponse>(apiEndpoint('v2/roles'));
  }

  addRole(role: RoleCreateRequest): Observable<RoleCreateRequest> {
    return this.http.post<RoleCreateRequest>(apiEndpoint('v2/roles'), role);
  }

  updateRole(
    id: number,
    role: RoleCreateRequest
  ): Observable<RoleCreateRequest> {
    return this.http.put<RoleCreateRequest>(
      apiEndpoint(`v2/roles/${id}`),
      role
    );
  }

  getRoleById(id: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(apiEndpoint(`v2/roles/${id}`));
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(apiEndpoint(`v2/roles/${id}`));
  }

  permissionsByCategory(): Observable<permissionsByCategoryResponse> {
    return this.http.get<permissionsByCategoryResponse>(
      apiEndpoint('v2/permissions/grouped')
    );
  }
}
