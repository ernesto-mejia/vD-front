import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SharedService } from '../../../../servicios/shared.service';
import Swal from 'sweetalert2';

// Guard para listar/ver roles
export const RoleListGuard: CanActivateFn = (route, state) => {
  const sharedService = inject(SharedService);
  const router = inject(Router);

  // Verificar si tiene permiso de ver roles
  if (sharedService.hasPermission('roles', '', 'view')) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver roles.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalles de un rol
export const RoleViewGuard: CanActivateFn = (route, state) => {
  const sharedService = inject(SharedService);
  const router = inject(Router);

  if (sharedService.hasPermission('roles', '', 'view')) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver roles.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear roles
export const RoleCreateGuard: CanActivateFn = (route, state) => {
  const sharedService = inject(SharedService);
  const router = inject(Router);

  if (sharedService.hasPermission('roles', '', 'create')) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear roles.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar roles
export const RoleEditGuard: CanActivateFn = (route, state) => {
  const sharedService = inject(SharedService);
  const router = inject(Router);

  if (sharedService.hasPermission('roles', '', 'edit')) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar roles.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
