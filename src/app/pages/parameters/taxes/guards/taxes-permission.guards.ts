import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TaxesPermissionService } from '../services/taxes-permission.service';
import Swal from 'sweetalert2';

// Guard para listar reglas de impuestos
export const TaxRulesListGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(TaxesPermissionService);
  const router = inject(Router);

  if (permissionService.canListTaxRules()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver reglas de impuestos.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para ver detalle de regla
export const TaxRulesViewGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(TaxesPermissionService);
  const router = inject(Router);

  if (permissionService.canViewTaxRules()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para ver reglas de impuestos.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para crear reglas
export const TaxRulesCreateGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(TaxesPermissionService);
  const router = inject(Router);

  if (permissionService.canCreateTaxRules()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para crear reglas de impuestos.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para editar reglas
export const TaxRulesEditGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(TaxesPermissionService);
  const router = inject(Router);

  if (permissionService.canEditTaxRules()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para editar reglas de impuestos.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para eliminar reglas
export const TaxRulesDeleteGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(TaxesPermissionService);
  const router = inject(Router);

  if (permissionService.canDeleteTaxRules()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para eliminar reglas de impuestos.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};

// Guard para calculadora de impuestos
export const TaxCalculatorGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(TaxesPermissionService);
  const router = inject(Router);

  if (permissionService.canUseCalculator()) {
    return true;
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para usar la calculadora de impuestos.',
      confirmButtonText: 'OK'
    }).then(() => {
      router.navigate(['/dashboard']);
    });
    return false;
  }
};
