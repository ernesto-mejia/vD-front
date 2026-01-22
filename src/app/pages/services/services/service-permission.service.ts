import { Injectable } from '@angular/core';
import { SharedService } from '../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class ServicePermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de servicios
  canViewServices(): boolean {
    return this.sharedService.hasPermission('services', '', 'view');
  }

  canCreateServices(): boolean {
    return this.sharedService.hasPermission('services', '', 'create');
  }

  canEditServices(): boolean {
    return this.sharedService.hasPermission('services', '', 'edit');
  }

  canDeleteServices(): boolean {
    return this.sharedService.hasPermission('services', '', 'delete');
  }

  // Métodos auxiliares
  hasAnyServicePermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('services');
  }

  hasFullAccess(): boolean {
    return this.canViewServices() && this.canCreateServices() &&
           this.canEditServices() && this.canDeleteServices();
  }
}
