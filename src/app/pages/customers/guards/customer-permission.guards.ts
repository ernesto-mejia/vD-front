import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerPermissionService } from '../services/customer-permission.service';
import Swal from 'sweetalert2';

// Guard para listar clientes (usa canViewCustomers ya que es el permiso "view" del módulo)
export const CustomerListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(CustomerPermissionService);
  const router = inject(Router);

  if (permissionService.canViewCustomers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de cliente
export const CustomerViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(CustomerPermissionService);
  const router = inject(Router);

  if (permissionService.canViewCustomers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear clientes
export const CustomerCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(CustomerPermissionService);
  const router = inject(Router);

  if (permissionService.canCreateCustomers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar clientes
export const CustomerEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(CustomerPermissionService);
  const router = inject(Router);

  if (permissionService.canEditCustomers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar clientes
export const CustomerDeleteGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(CustomerPermissionService);
  const router = inject(Router);

  if (permissionService.canDeleteCustomers()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar clientes.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
