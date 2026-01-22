import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ContractProviderPermissionService } from '../services/contract-provider-permission.service';
import Swal from 'sweetalert2';

// Guard para listar contratos de proveedores
export const ContractProviderListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractProviderPermissionService);
  const router = inject(Router);

  if (permissionService.canListContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver contratos de proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de contrato
export const ContractProviderViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractProviderPermissionService);
  const router = inject(Router);

  if (permissionService.canViewContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver contratos de proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear contratos
export const ContractProviderCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractProviderPermissionService);
  const router = inject(Router);

  if (permissionService.canCreateContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear contratos de proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar contratos
export const ContractProviderEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractProviderPermissionService);
  const router = inject(Router);

  if (permissionService.canEditContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar contratos de proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar contratos
export const ContractProviderDeleteGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractProviderPermissionService);
  const router = inject(Router);

  if (permissionService.canDeleteContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar contratos de proveedores.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
