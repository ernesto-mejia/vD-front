import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de órdenes de compra
  canViewPurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'view');
  }

  canListPurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'view');
  }

  canCreatePurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'create');
  }

  canEditPurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'edit');
  }

  canDeletePurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'delete');
  }

  // Permisos de flujo de trabajo
  canApprovePurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'approve');
  }

  canRejectPurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'reject');
  }

  canCancelPurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'cancel');
  }

  // Permisos de recepción de mercancía
  canReceivePurchaseOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'receive');
  }

  canViewReceipts(): boolean {
    return this.sharedService.hasPermission('purchase-orders', 'receipts', 'view');
  }

  // Permisos de facturación
  canRegisterInvoice(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'register-invoice');
  }

  // Permisos de confirmación de compra
  canConfirmPurchase(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'confirm-purchase');
  }

  // Permiso para ver órdenes autorizadas (generar compra con proveedores)
  canViewAuthorizedOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'view') ||
           this.sharedService.hasPermission('purchase-orders', '', 'confirm-purchase') ||
           this.sharedService.hasPermission('purchase-orders', '', 'generate-provider-orders');
  }

  // Permiso para generar órdenes por proveedor
  canGenerateProviderOrders(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'generate-provider-orders') ||
           this.sharedService.hasPermission('purchase-orders', '', 'confirm-purchase');
  }

  // =====================================================
  // Permisos Flujo de 4 Fases
  // =====================================================

  /**
   * Permiso para autorizar órdenes de compra (Fase 4)
   */
  canAuthorizePO(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'authorize-po') ||
           this.sharedService.hasPermission('purchase-orders', '', 'approve');
  }

  /**
   * Permiso para devolver OC a Compras
   */
  canReturnToPurchasing(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'return-to-purchasing') ||
           this.canAuthorizePO();
  }

  /**
   * Permiso para devolver OC a Solicitud
   */
  canReturnToRequest(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'return-to-request') ||
           this.canAuthorizePO();
  }

  /**
   * Permiso para ver OCs autorizadas y listas para compra
   */
  canViewAuthorizedReadyForPurchase(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'view-authorized') ||
           this.canConfirmPurchase() ||
           this.canGenerateProviderOrders();
  }

  /**
   * Permiso para proceder con la compra
   */
  canProceedPurchase(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'proceed-purchase') ||
           this.canConfirmPurchase();
  }

  /**
   * Permiso para subir comprobantes de compra
   */
  canUploadReceipt(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'upload-receipt') ||
           this.canConfirmPurchase();
  }

  /**
   * Permiso para descargar PDF por proveedor
   */
  canDownloadProviderPdf(): boolean {
    return this.sharedService.hasPermission('purchase-orders', '', 'download-provider-pdf') ||
           this.canViewAuthorizedOrders();
  }

  // Métodos auxiliares
  hasAnyPurchaseOrderPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('purchase-orders');
  }

  canManagePurchaseOrders(): boolean {
    return this.canCreatePurchaseOrders() || this.canEditPurchaseOrders() || this.canDeletePurchaseOrders();
  }

  hasAnyApprovalPermission(): boolean {
    return this.canApprovePurchaseOrders() || this.canRejectPurchaseOrders();
  }
}
