import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class TaxesPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de reglas de impuestos
  canViewTaxRules(): boolean {
    return this.sharedService.hasPermission('taxes', '', 'view');
  }

  canListTaxRules(): boolean {
    return this.sharedService.hasPermission('taxes', '', 'view');
  }

  canCreateTaxRules(): boolean {
    return this.sharedService.hasPermission('taxes', '', 'create');
  }

  canEditTaxRules(): boolean {
    return this.sharedService.hasPermission('taxes', '', 'edit');
  }

  canDeleteTaxRules(): boolean {
    return this.sharedService.hasPermission('taxes', '', 'delete');
  }

  // Permiso para usar la calculadora de impuestos
  canUseCalculator(): boolean {
    return this.sharedService.hasPermission('taxes', 'calculator', 'view');
  }

  // Permisos de configuración de impuestos por empresa
  canViewCompanyTaxConfig(): boolean {
    return this.sharedService.hasPermission('taxes', 'company-config', 'view');
  }

  canEditCompanyTaxConfig(): boolean {
    return this.sharedService.hasPermission('taxes', 'company-config', 'edit');
  }

  // Métodos auxiliares
  hasAnyTaxesPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('taxes');
  }

  canManageTaxRules(): boolean {
    return this.canCreateTaxRules() || this.canEditTaxRules() || this.canDeleteTaxRules();
  }
}
