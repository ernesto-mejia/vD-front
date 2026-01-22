import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class PurchasePriceListPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de listas de precios de compra
  canViewPriceLists(): boolean {
    return this.sharedService.hasPermission('purchase-price-lists', '', 'view');
  }

  canCreatePriceLists(): boolean {
    return this.sharedService.hasPermission('purchase-price-lists', '', 'create');
  }

  canEditPriceLists(): boolean {
    return this.sharedService.hasPermission('purchase-price-lists', '', 'edit');
  }

  canDeletePriceLists(): boolean {
    return this.sharedService.hasPermission('purchase-price-lists', '', 'delete');
  }

  // Métodos auxiliares
  hasAnyPriceListPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('purchase-price-lists');
  }

  hasFullAccess(): boolean {
    return this.canViewPriceLists() && this.canCreatePriceLists() &&
           this.canEditPriceLists() && this.canDeletePriceLists();
  }
}
