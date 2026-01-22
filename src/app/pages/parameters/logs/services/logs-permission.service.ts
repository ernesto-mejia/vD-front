import { Injectable } from '@angular/core';
import { SharedService } from '../../../../servicios/shared.service';

@Injectable({
  providedIn: 'root'
})
export class LogsPermissionService {

  constructor(private sharedService: SharedService) {}

  // Permisos principales de logs de actividad
  canViewLogs(): boolean {
    return this.sharedService.hasPermission('activity-logs', '', 'view');
  }

  canListLogs(): boolean {
    return this.sharedService.hasPermission('activity-logs', '', 'view');
  }

  // Los logs generalmente son solo lectura, no se crean/editan/eliminan manualmente
  // pero incluimos estos métodos por consistencia

  canExportLogs(): boolean {
    return this.sharedService.hasPermission('activity-logs', '', 'export');
  }

  // Métodos auxiliares
  hasAnyLogsPermission(): boolean {
    return this.sharedService.hasAnyPermissionInModule('activity-logs');
  }
}
