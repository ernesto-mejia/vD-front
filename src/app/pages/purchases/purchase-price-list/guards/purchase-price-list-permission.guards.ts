import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PurchasePriceListPermissionService } from '../services/purchase-price-list-permission.service';
import Swal from 'sweetalert2';

// Guard para listar/ver listas de precios
export const PurchasePriceListListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchasePriceListPermissionService);
  const router = inject(Router);

  if (permissionService.canViewPriceLists()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver listas de precios de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalles de una lista de precios
export const PurchasePriceListViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchasePriceListPermissionService);
  const router = inject(Router);

  if (permissionService.canViewPriceLists()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver listas de precios de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear listas de precios
export const PurchasePriceListCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchasePriceListPermissionService);
  const router = inject(Router);

  if (permissionService.canCreatePriceLists()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear listas de precios de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar listas de precios
export const PurchasePriceListEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchasePriceListPermissionService);
  const router = inject(Router);

  if (permissionService.canEditPriceLists()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar listas de precios de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar listas de precios
export const PurchasePriceListDeleteGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchasePriceListPermissionService);
  const router = inject(Router);

  if (permissionService.canDeletePriceLists()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar listas de precios de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
