import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de notificaciones
  canViewNotifications(): boolean {
    return this.sharedService.hasPermission('notifications', '', 'view');
  }

  canListNotifications(): boolean {
    return this.sharedService.hasPermission('notifications', '', 'view');
  }

  canCreateNotifications(): boolean {
    return this.sharedService.hasPermission('notifications', '', 'create');
  }

  canEditNotifications(): boolean {
    return this.sharedService.hasPermission('notifications', '', 'edit');
  }

  canDeleteNotifications(): boolean {
    return this.sharedService.hasPermission('notifications', '', 'delete');
  }

  // Permiso de administración de notificaciones
  canAdminNotifications(): boolean {
    return this.sharedService.hasPermission('notifications', 'admin', 'view');
  }

  // Permiso para ver inbox (cualquier usuario autenticado)
  canViewInbox(): boolean {
    // El inbox es personal, cualquier usuario autenticado puede verlo
    return true;
  }

  // Métodos auxiliares
  hasAnyNotificationPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('notifications');
  }

  // Verificar si puede administrar (crear/editar/eliminar)
  canManageNotifications(): boolean {
    return this.canCreateNotifications() || this.canEditNotifications() || this.canDeleteNotifications();
  }
}
