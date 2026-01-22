export type NotificationModule = 'users' | 'customers' | 'providers' | string;
export type NotificationAction = 'create' | 'update' | 'delete' | 'authorize' | string;
export type NotificationSeverity = 'info' | 'warning' | 'critical';
export type NotificationStatus = 'pending' | 'sent' | 'viewed' | 'attended' | 'accepted' | 'rejected';
export type NotificationType = 'simple' | 'authorization';

export interface NotificationRecipientRule {
  recipientsType: 'role' | 'user';
  recipientsRef: number[]; // ids de roles o usuarios
}

export interface NotificationTemplate {
  id?: number;
  module: NotificationModule;
  action: NotificationAction;
  titleTemplate: string;
  bodyTemplate: string;
  enabled: boolean;
}

export interface NotificationItem {
  id: number;
  module: NotificationModule;
  action: NotificationAction;
  type: NotificationType;
  entityId: number;
  title: string;
  body: string;
  severity: NotificationSeverity;
  originalSeverity?: NotificationSeverity;
  status: NotificationStatus;
  // Per-user status from NotificationLog (independent for each user)
  user_status?: NotificationStatus;
  user_viewed_at?: string;
  user_attended_at?: string;
  active: boolean;
  escalationHours?: number;
  escalationCount?: number;
  lastEscalationAt?: string;
  requiresBlocking?: boolean;
  isBlockingActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  channels?: NotificationChannel[];
  userIds?: number[];
  roleIds?: number[];
  // Authorization fields
  authorizableType?: string;
  authorizableId?: number;
  authorizationField?: string;
  approveValue?: string;
  rejectValue?: string;
  authorizedBy?: number;
  authorizedAt?: string;
  authorizationComment?: string;
}

export type NotificationChannel = 'email' | 'push';

export interface NotificationCreatePayload {
  module: NotificationModule;
  action: NotificationAction;
  type?: NotificationType;
  entity_id?: number;
  title: string;
  body?: string;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
  user_ids?: number[];
  role_ids?: number[];
  active?: boolean;
  escalation_hours?: number;
  requires_blocking?: boolean;
  // Authorization fields (only for type='authorization')
  authorizable_type?: string;
  authorizable_id?: number;
  authorization_field?: string;
  approve_value?: string;
  reject_value?: string;
}

export interface NotificationUpdatePayload extends Partial<NotificationCreatePayload> {
  status?: NotificationStatus;
}

export interface RoleSummary {
  id: number;
  name: string;
}

export interface UserSummary {
  id: number;
  name: string;
  email?: string;
}

export interface NotificationLog {
  id: number;
  notificationId: number;
  userId: number;
  userName: string;
  action: string; // 'viewed' | 'edited' | 'deleted' | 'status_changed'
  details: string;
  timestamp: string; // ISO
}

export interface NotificationListResponse {
  ok: boolean;
  data: NotificationItem[];
  meta?: {
    total: number;
    unread: number;
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
  };
}

// Métricas por usuario-notificación
export interface NotificationUserMetric {
  id: number;
  notificationId: number;
  userId: number;
  receivedAt?: string;
  viewedAt?: string;
  attendedAt?: string;
  finalizedAt?: string;
  timeToViewMinutes?: number;
  timeToAttendMinutes?: number;
  timeToFinalizeMinutes?: number;
  totalTimeMinutes?: number;
  userStatus: 'pending' | 'received' | 'viewed' | 'attending' | 'finalized' | 'dismissed';
  receivedVia?: 'push' | 'email' | 'system';
}

// Configuración de módulo para notificaciones
export interface NotificationModuleConfig {
  id: number;
  module: string;
  action: string;
  permissionName?: string;
  defaultTitleTemplate: string;
  defaultBodyTemplate?: string;
  defaultSeverity: NotificationSeverity;
  defaultEscalationHours: number;
  defaultRequiresBlocking: boolean;
  defaultChannels: NotificationChannel[];
  defaultRoleIds: number[];
  isActive: boolean;
}

// Permisos agrupados del backend principal
export interface GroupedPermission {
  id: number;
  name: string;
  guard_name: string;
  group?: string;
}

// Can be either full objects or simple strings
export interface GroupedPermissions {
  [module: string]: GroupedPermission[] | string[];
}

// Notificación con bloqueo activo
export interface BlockingNotification {
  id: number;
  title: string;
  body: string;
  severity: 'critical';
  createdAt: string;
  escalationCount: number;
  requiresAction: boolean;
}

// Autorización pendiente
export interface PendingAuthorization {
  id: number;
  title: string;
  body: string;
  module: string;
  action: string;
  severity: NotificationSeverity;
  authorizableType: string;
  authorizableId: number;
  authorizationField: string;
  approveValue: string;
  rejectValue: string;
  createdAt: string;
  createdBy?: number;
  createdByName?: string;
}

// Respuesta de aprobar/rechazar autorización
export interface AuthorizationResponse {
  ok: boolean;
  message: string;
  data?: {
    notification: NotificationItem;
    model?: any;
    approved: boolean;
  };
}
