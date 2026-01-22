import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de solicitudes de compra
  canViewPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'view');
  }

  canListPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'view');
  }

  canCreatePurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'create');
  }

  canEditPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'edit');
  }

  canDeletePurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'delete');
  }

  // Permisos de flujo de trabajo
  canSubmitPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'submit');
  }

  canPreauthorizePurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'pre-authorize');
  }

  canAuthorizePurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'approve');
  }

  canRejectPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'reject');
  }

  canReturnPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'return');
  }

  // Permisos de conversión
  canConvertToOrder(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'convert-to-po');
  }

  // Permiso de generar orden de compra
  canGeneratePO(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'generate-po');
  }

  // Permiso para exportar
  canExportPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'export');
  }

  // Permiso para ver todas las solicitudes
  canViewAllPurchaseRequests(): boolean {
    return this.sharedService.hasPermission('purchase-requests', '', 'view-all');
  }

  // Ver mis autorizaciones pendientes
  canViewMyAuthorizations(): boolean {
    return this.canPreauthorizePurchaseRequests() || this.canAuthorizePurchaseRequests();
  }

  // Ver seguimiento de compras
  canViewTracking(): boolean {
    return this.canViewPurchaseRequests();
  }

  // Métodos auxiliares
  hasAnyPurchaseRequestPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('purchase-requests');
  }

  canManagePurchaseRequests(): boolean {
    return this.canCreatePurchaseRequests() || this.canEditPurchaseRequests() || this.canDeletePurchaseRequests();
  }

  hasAnyAuthorizationPermission(): boolean {
    return this.canPreauthorizePurchaseRequests() || this.canAuthorizePurchaseRequests();
  }
}
