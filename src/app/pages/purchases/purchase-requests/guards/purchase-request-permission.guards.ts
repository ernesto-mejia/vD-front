import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PurchaseRequestPermissionService } from '../services/purchase-request-permission.service';
import Swal from 'sweetalert2';

// Guard para listar solicitudes de compra
export const PurchaseRequestListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canListPurchaseRequests()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver solicitudes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de solicitud
export const PurchaseRequestViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canViewPurchaseRequests()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver solicitudes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear solicitudes
export const PurchaseRequestCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canCreatePurchaseRequests()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear solicitudes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar solicitudes
export const PurchaseRequestEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canEditPurchaseRequests()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar solicitudes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para pre-autorizar solicitudes
export const PurchaseRequestPreauthorizeGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canPreauthorizePurchaseRequests()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para pre-autorizar solicitudes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para autorizar solicitudes
export const PurchaseRequestAuthorizeGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canAuthorizePurchaseRequests()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para autorizar solicitudes de compra.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver mis autorizaciones pendientes
export const MyAuthorizationsGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canViewMyAuthorizations()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver autorizaciones.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver seguimiento de compras
export const PurchaseTrackingGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PurchaseRequestPermissionService);
  const router = inject(Router);

  if (permissionService.canViewTracking()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver seguimiento de compras.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
