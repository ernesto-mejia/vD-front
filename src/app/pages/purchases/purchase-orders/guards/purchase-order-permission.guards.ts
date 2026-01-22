import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PurchaseOrderPermissionService } from '../services/purchase-order-permission.service';
import Swal from 'sweetalert2';

// Guard para listar órdenes de compra
export const PurchaseOrderListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canListPurchaseOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver órdenes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de orden
export const PurchaseOrderViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canViewPurchaseOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver órdenes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear órdenes
export const PurchaseOrderCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canCreatePurchaseOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear órdenes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar órdenes
export const PurchaseOrderEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canEditPurchaseOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar órdenes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para recibir mercancía
export const PurchaseOrderReceiveGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canReceivePurchaseOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para recibir mercancía.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para aprobar órdenes
export const PurchaseOrderApproveGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canApprovePurchaseOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para aprobar órdenes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver órdenes autorizadas (generar compra con proveedores)
export const PurchaseOrderAuthorizedGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canViewAuthorizedOrders()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver órdenes de compra autorizadas.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para OCs pendientes de autorización (Fase 4)
export const PurchaseOrderPendingAuthGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseOrderPermissionService);
  const router = inject(Router);

  if (permissionService.canAuthorizePO()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para autorizar órdenes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
