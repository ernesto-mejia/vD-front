import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class ContractClientPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de contratos de clientes
  canViewContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients', 'view');
  }

  canListContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients', 'view');
  }

  canCreateContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients', 'create');
  }

  canEditContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients', 'edit');
  }

  canDeleteContracts(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients', 'delete');
  }

  // Permisos de ítems del contrato
  canViewContractItems(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients.items', 'view');
  }

  canEditContractItems(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients.items', 'edit');
  }

  // Permisos de direcciones del contrato
  canViewContractAddresses(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients.addresses', 'view');
  }

  canEditContractAddresses(): boolean {
    return this.sharedService.hasPermission('contracts', 'clients.addresses', 'edit');
  }

  // Métodos auxiliares
  hasAnyContractPermission(): boolean {
    return this.sharedService.hasAnyPermissionInSubmodule('contracts', 'clients');
  }

  canManageContracts(): boolean {
    return this.canCreateContracts() || this.canEditContracts() || this.canDeleteContracts();
  }
}
