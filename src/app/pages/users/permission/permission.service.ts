import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PermissionDetail,
  PermissionResponse,
  PermissionsListResponse,
} from './permission';
 import { apiEndpoint } from '../../../shared/api-endpoint.util';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private http: HttpClient) {}

  // CRUD principal para Permisos
  getPermissions(): Observable<PermissionsListResponse> {
    return this.http.get<PermissionsListResponse>(
      apiEndpoint('v2/permissions')
    );
  }

  addPermission(permission: PermissionDetail): Observable<PermissionDetail> {
    return this.http.post<PermissionDetail>(
      apiEndpoint('v2/permissions'),
      permission
    );
  }

  updatePermission(
    id: number,
    permission: PermissionDetail
  ): Observable<PermissionDetail> {
    return this.http.put<PermissionDetail>(
      apiEndpoint(`v2/permissions/${id}`),
      permission
    );
  }

  getPermissionById(id: number): Observable<PermissionResponse> {
    return this.http.get<PermissionResponse>(
      apiEndpoint(`v2/permissions/${id}`)
    );
  }

  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(apiEndpoint(`v2/permissions/${id}`));
  }
}
