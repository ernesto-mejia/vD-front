import { Injectable } from '@angular/core';
import { SharedService } from '../../../servicios/shared.service';

@Injectable({
  providedIn: 'root',
})
export class UserPermissionService {
  constructor(private sharedService: SharedService) {}

  // Permisos específicos para el módulo de usuarios
  // Los permisos vienen con formato 'module.action' (ej: 'users.view', 'users.create')
  // Se pasa string vacío como submódulo para que construya 'users.action' en lugar de 'users.users.action'

  // Para listar usuarios, usamos el permiso 'view' ya que el backend no tiene 'list' separado
  canListUsers(): boolean {
    return this.sharedService.hasPermission('users', 'users', 'list');
  }

  canViewUsers(): boolean {
    return this.sharedService.hasPermission('users', 'users', 'view');
  }

  canCreateUsers(): boolean {
    return this.sharedService.hasPermission('users', '', 'create');
  }

  canEditUsers(): boolean {
    return this.sharedService.hasPermission('users', '', 'edit');
  }

  canDeleteUsers(): boolean {
    return this.sharedService.hasPermission('users', '', 'delete');
  }

  canManageRoles(): boolean {
    return this.sharedService.hasPermission('users', '', 'manage-roles');
  }

  canManagePermissions(): boolean {
    return this.sharedService.hasPermission('users', '', 'manage-permissions');
  }

  // Método auxiliar para verificar si tiene algún permiso en el módulo de usuarios
  hasAnyUserPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('users');
  }

  // Método para verificar múltiples permisos a la vez
  hasPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => {
      switch (permission) {
        case 'view':
          return this.canViewUsers();
        case 'create':
          return this.canCreateUsers();
        case 'edit':
          return this.canEditUsers();
        case 'delete':
          return this.canDeleteUsers();
        case 'list':
          return this.canListUsers();
        case 'manage-roles':
          return this.canManageRoles();
        case 'manage-permissions':
          return this.canManagePermissions();
        default:
          return false;
      }
    });
  }

  // Método para obtener los permisos que el usuario actual tiene
  getUserPermissions(): string[] {
    const permissions: string[] = [];

    if (this.canViewUsers()) permissions.push('view');
    if (this.canCreateUsers()) permissions.push('create');
    if (this.canEditUsers()) permissions.push('edit');
    if (this.canDeleteUsers()) permissions.push('delete');
    if (this.canListUsers()) permissions.push('list');
    if (this.canManageRoles()) permissions.push('manage-roles');
    if (this.canManagePermissions()) permissions.push('manage-permissions');

    return permissions;
  }
}
