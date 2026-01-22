import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ReceptionOrderPermissionService } from '../services/reception-order-permission.service';
import Swal from 'sweetalert2';

// Guard para listar órdenes de recepción
export const ReceptionOrderListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ReceptionOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canListReceptionOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver órdenes de recepción.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de orden
export const ReceptionOrderViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ReceptionOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canViewReceptionOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver órdenes de recepción.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para registrar recepción
export const ReceptionOrderReceiveGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ReceptionOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canReceiveOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para registrar recepción de mercancía.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para cancelar órdenes
export const ReceptionOrderCancelGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(ReceptionOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canCancelOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para cancelar órdenes de recepción.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
