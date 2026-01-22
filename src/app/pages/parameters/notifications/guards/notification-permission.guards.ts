import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NotificationPermissionService } from '../services/notification-permission.service';
import Swal from 'sweetalert2';

// Guard para listar notificaciones (admin)
export const NotificationListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(NotificationPermissionService);
  const router = inject(Router);

  if (permissionService.canListNotifications()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver notificaciones.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de notificación
export const NotificationViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(NotificationPermissionService);
  const router = inject(Router);

  if (permissionService.canViewNotifications()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver notificaciones.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear notificaciones
export const NotificationCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(NotificationPermissionService);
  const router = inject(Router);

  if (permissionService.canCreateNotifications()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear notificaciones.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar notificaciones
export const NotificationEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(NotificationPermissionService);
  const router = inject(Router);

  if (permissionService.canEditNotifications()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar notificaciones.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para administración de notificaciones
export const NotificationAdminGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(NotificationPermissionService);
  const router = inject(Router);

  if (permissionService.canAdminNotifications()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para administrar notificaciones.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para inbox (cualquier usuario autenticado puede ver su inbox)
export const NotificationInboxGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(NotificationPermissionService);
  // El inbox es personal, siempre permitido para usuarios autenticados
  return permissionService.canViewInbox();
};
