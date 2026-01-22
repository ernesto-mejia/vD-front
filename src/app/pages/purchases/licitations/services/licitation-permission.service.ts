import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

/**
 * Servicio de permisos para el módulo de Licitaciones
 * Sigue el patrón de permisos: module.submodule.action
 * Para licitaciones: licitations.[submodule].action
 */
@Injectable({
  providedIn: 'root'
})
export class LicitationPermissionService {

  private readonly MODULE = 'licitations';
  private readonly SUBMODULE = ''; // Sin submódulo para permisos principales

  constructor(private sharedService: SharedService) {}

  // ==================== PERMISOS INDIVIDUALES ====================

  canView(): boolean {
    return this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'view');
  }

  canCreate(): boolean {
    return this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'create');
  }

  canEdit(): boolean {
    return this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'edit');
  }

  canDelete(): boolean {
    return this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'delete');
  }

  canConvert(): boolean {
    return this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'convert');
  }

  canChangeStatus(): boolean {
    return this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'change-status') ||
           this.sharedService.hasPermission(this.MODULE, this.SUBMODULE, 'edit');
  }

  // ==================== VERIFICACIONES COMBINADAS ====================

  hasAnyPermission(): boolean {
    return this.canView() || this.canCreate() || this.canEdit() ||
           this.canDelete() || this.canConvert() || this.canChangeStatus();
  }

  hasFullAccess(): boolean {
    return this.canView() && this.canCreate() && this.canEdit() &&
           this.canDelete() && this.canConvert() && this.canChangeStatus();
  }

  /**
   * Verifica si el usuario tiene al menos permiso de lectura
   */
  canAccessModule(): boolean {
    return this.canView();
  }

  /**
   * Verifica si tiene permisos de gestión (crear, editar o eliminar)
   */
  canManage(): boolean {
    return this.canCreate() || this.canEdit() || this.canDelete();
  }
}
