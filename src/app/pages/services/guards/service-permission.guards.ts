import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicePermissionService } from '../services/service-permission.service';
import Swal from 'sweetalert2';

// Guard para listar/ver servicios
export const ServiceListGuard: CanActivateFn = (route, state) => {
  const servicePermissionService = inject(ServicePermissionService);
  const router = inject(Router);

  if (servicePermissionService.canViewServices()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver servicios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalles de un servicio
export const ServiceViewGuard: CanActivateFn = (route, state) => {
  const servicePermissionService = inject(ServicePermissionService);
  const router = inject(Router);

  if (servicePermissionService.canViewServices()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver servicios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear servicios
export const ServiceCreateGuard: CanActivateFn = (route, state) => {
  const servicePermissionService = inject(ServicePermissionService);
  const router = inject(Router);

  if (servicePermissionService.canCreateServices()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear servicios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar servicios
export const ServiceEditGuard: CanActivateFn = (route, state) => {
  const servicePermissionService = inject(ServicePermissionService);
  const router = inject(Router);

  if (servicePermissionService.canEditServices()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar servicios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar servicios
export const ServiceDeleteGuard: CanActivateFn = (route, state) => {
  const servicePermissionService = inject(ServicePermissionService);
  const router = inject(Router);

  if (servicePermissionService.canDeleteServices()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar servicios.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
