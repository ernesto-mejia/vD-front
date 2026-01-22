/**
 * Re-export notification interfaces from shared models
 * Este archivo sirve como punto de entrada para las interfaces de notificaciones
 * dentro del módulo de parámetros/notificaciones
 */
export {
  NotificationModule,
  NotificationAction,
  NotificationSeverity,
  NotificationStatus,
  NotificationType,
  NotificationRecipientRule,
  NotificationTemplate,
  NotificationItem,
  NotificationChannel,
  NotificationCreatePayload,
  NotificationUpdatePayload,
  RoleSummary,
  UserSummary,
  NotificationLog,
  NotificationListResponse,
  NotificationUserMetric,
  NotificationModuleConfig,
  GroupedPermission,
  GroupedPermissions,
  BlockingNotification
} from '../../../shared/models/notification.model';

/**
 * Interface para el filtro de notificaciones en la vista de administración
 */
export interface NotificationAdminFilter {
  module?: string;
  action?: string;
  severity?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Interface para estadísticas del dashboard de notificaciones
 */
export interface NotificationStats {
  total: number;
  pending: number;
  viewed: number;
  attended: number;
  critical: number;
  warning: number;
  info: number;
}
