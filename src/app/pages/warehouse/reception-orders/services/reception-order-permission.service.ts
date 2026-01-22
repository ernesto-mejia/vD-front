import { Injectable, inject } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class ReceptionOrderPermissionService {
  private sharedService = inject(SharedService);

  // Módulo para permisos planos (reception-orders.view, etc.)
  private readonly MODULE = 'reception-orders';

  /**
   * Verificar si tiene permiso específico usando el sistema de permisos planos
   */
  private hasPermission(action: string): boolean {
    // Primero verificar si es super-admin
    if (this.sharedService.isSuperAdmin()) {
      return true;
    }
    // Verificar permiso plano: reception-orders.{action}
    return this.sharedService.hasPermission(this.MODULE, '', action);
  }

  /**
   * Puede ver listado de órdenes de recepción
   */
  canListReceptionOrders(): boolean {
    return this.hasPermission('view');
  }

  /**
   * Puede ver detalle de orden de recepción
   */
  canViewReceptionOrders(): boolean {
    return this.hasPermission('view');
  }

  /**
   * Puede registrar recepción de mercancía
   */
  canReceiveOrders(): boolean {
    return this.hasPermission('receive') || this.hasPermission('edit');
  }

  /**
   * Puede cancelar órdenes de recepción
   */
  canCancelOrders(): boolean {
    return this.hasPermission('cancel') || this.hasPermission('delete');
  }

  /**
   * Puede exportar órdenes de recepción
   */
  canExportOrders(): boolean {
    return this.hasPermission('export') || this.hasPermission('view');
  }
}
