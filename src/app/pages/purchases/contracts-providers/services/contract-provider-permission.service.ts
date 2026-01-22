import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class ContractProviderPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de contratos de proveedores
  canViewContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers', 'view');
  }

  canListContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers', 'view');
  }

  canCreateContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers', 'create');
  }

  canEditContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers', 'edit');
  }

  canDeleteContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers', 'delete');
  }

  // Permisos de ítems del contrato
  canViewContractItems(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers.items', 'view');
  }

  canEditContractItems(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers.items', 'edit');
  }

  // Permisos de precios del contrato
  canViewContractPrices(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers.prices', 'view');
  }

  canEditContractPrices(): boolean {
    return this.sharedService.hasPermission('contracts', 'providers.prices', 'edit');
  }

  // Métodos auxiliares
  hasAnyContractPermission(): boolean {
    return this.sharedService.hasAnyPermissionInSubmodule('contracts', 'providers');
  }

  canManageContracts(): boolean {
    return this.canCreateContracts() || this.canEditContracts() || this.canDeleteContracts();
  }
}
