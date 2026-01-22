import { Injectable } from '@angular/core';
import { SharedService } from '../../../servicios/shared.service';

@Injectable({
  providedIn: 'root',
})
export class PruebaPermissionService {
  constructor(private sharedService: SharedService) {}

  // Permisos principales de pruebas
  canViewPruebas(): boolean {
    return this.sharedService.hasPermission('pruebas', '', 'view');
  }

  canCreatePruebas(): boolean {
    return this.sharedService.hasPermission('pruebas', '', 'create');
  }

  canEditPruebas(): boolean {
    return this.sharedService.hasPermission('pruebas', '', 'edit');
  }

  canDeletePruebas(): boolean {
    return this.sharedService.hasPermission('pruebas', '', 'delete');
  }

  // Métodos auxiliares
  hasAnyPruebaPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('pruebas');
  }

  hasFullAccess(): boolean {
    return (
      this.canViewPruebas() &&
      this.canCreatePruebas() &&
      this.canEditPruebas() &&
      this.canDeletePruebas()
    );
  }
}
