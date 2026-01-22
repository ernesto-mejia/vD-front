import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProviderPermissionService } from '../services/provider-permission.service';
import Swal from 'sweetalert2';

// Guard para listar/ver proveedores
export const ProviderListGuard: CanActivateFn = (route, state) => {
  const providerPermissionService = inject(ProviderPermissionService);
  const router = inject(Router);

  if (providerPermissionService.canViewProviders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalles de un proveedor
export const ProviderViewGuard: CanActivateFn = (route, state) => {
  const providerPermissionService = inject(ProviderPermissionService);
  const router = inject(Router);

  if (providerPermissionService.canViewProviders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear proveedores
export const ProviderCreateGuard: CanActivateFn = (route, state) => {
  const providerPermissionService = inject(ProviderPermissionService);
  const router = inject(Router);

  if (providerPermissionService.canCreateProviders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar proveedores
export const ProviderEditGuard: CanActivateFn = (route, state) => {
  const providerPermissionService = inject(ProviderPermissionService);
  const router = inject(Router);

  if (providerPermissionService.canEditProviders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar proveedores
export const ProviderDeleteGuard: CanActivateFn = (route, state) => {
  const providerPermissionService = inject(ProviderPermissionService);
  const router = inject(Router);

  if (providerPermissionService.canDeleteProviders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
