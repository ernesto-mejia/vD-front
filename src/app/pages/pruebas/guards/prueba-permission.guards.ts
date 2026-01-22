import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PruebaPermissionService } from '../services/prueba-permission.service';
import Swal from 'sweetalert2';

// Guard para listar/ver pruebas
export const PruebaListGuard: CanActivateFn = (route, state) => {
  const pruebaPermissionService = inject(PruebaPermissionService);
  const router = inject(Router);

  if (pruebaPermissionService.canViewPruebas()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver pruebas.',
      confirmButtonText: 'OK',
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalles de una prueba
export const PruebaViewGuard: CanActivateFn = (route, state) => {
  const pruebaPermissionService = inject(PruebaPermissionService);
  const router = inject(Router);

  if (pruebaPermissionService.canViewPruebas()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver pruebas.',
      confirmButtonText: 'OK',
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear pruebas
export const PruebaCreateGuard: CanActivateFn = (route, state) => {
  const pruebaPermissionService = inject(PruebaPermissionService);
  const router = inject(Router);

  if (pruebaPermissionService.canCreatePruebas()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear pruebas.',
      confirmButtonText: 'OK',
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar pruebas
export const PruebaEditGuard: CanActivateFn = (route, state) => {
  const pruebaPermissionService = inject(PruebaPermissionService);
  const router = inject(Router);

  if (pruebaPermissionService.canEditPruebas()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar pruebas.',
      confirmButtonText: 'OK',
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar pruebas
export const PruebaDeleteGuard: CanActivateFn = (route, state) => {
  const pruebaPermissionService = inject(PruebaPermissionService);
  const router = inject(Router);

  if (pruebaPermissionService.canDeletePruebas()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar pruebas.',
      confirmButtonText: 'OK',
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
