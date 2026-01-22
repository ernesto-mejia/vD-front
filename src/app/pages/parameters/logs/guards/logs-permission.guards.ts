import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LogsPermissionService } from '../services/logs-permission.service';
import Swal from 'sweetalert2';

// Guard para listar logs
export const LogsListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(LogsPermissionService);
  const router = inject(Router);

  if (permissionService.canListLogs()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver logs de actividad.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de log
export const LogsViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(LogsPermissionService);
  const router = inject(Router);

  if (permissionService.canViewLogs()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver logs de actividad.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para exportar logs
export const LogsExportGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(LogsPermissionService);
  const router = inject(Router);

  if (permissionService.canExportLogs()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para exportar logs.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
