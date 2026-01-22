import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ContractClientPermissionService } from '../services/contract-client-permission.service';
import Swal from 'sweetalert2';

// Guard para listar contratos de clientes
export const ContractClientListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractClientPermissionService);
  const router = inject(Router);

  if (permissionService.canListContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver contratos de clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de contrato
export const ContractClientViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractClientPermissionService);
  const router = inject(Router);

  if (permissionService.canViewContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver contratos de clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear contratos
export const ContractClientCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractClientPermissionService);
  const router = inject(Router);

  if (permissionService.canCreateContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear contratos de clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar contratos
export const ContractClientEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractClientPermissionService);
  const router = inject(Router);

  if (permissionService.canEditContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar contratos de clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar contratos
export const ContractClientDeleteGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ContractClientPermissionService);
  const router = inject(Router);

  if (permissionService.canDeleteContracts()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar contratos de clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
