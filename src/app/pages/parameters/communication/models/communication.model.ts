// ==================== INTERFACES DE CONFIGURACIÓN DE EMAIL ====================

export interface EmailConfiguration {
  id: number;
  company_id?: number;
  name: string;
  provider: EmailProvider;
  provider_label?: string;
  host?: string;
  port?: number;
  encryption?: EncryptionType;
  username?: string;
  from_address: string;
  from_name: string;
  reply_to?: string;
  api_domain?: string;
  api_region?: string;
  is_active: boolean;
  is_default: boolean;
  verified: boolean;
  last_test_at?: string;
  last_test_status?: 'success' | 'failed';
  last_test_error?: string;
  has_password?: boolean;
  has_api_key?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailConfigurationCreate {
  name: string;
  provider: EmailProvider;
  company_id?: number;
  host?: string;
  port?: number;
  encryption?: EncryptionType;
  username?: string;
  password?: string;
  from_address: string;
  from_name: string;
  reply_to?: string;
  api_key?: string;
  api_domain?: string;
  api_region?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark';
export type EncryptionType = 'tls' | 'ssl' | 'none';

export const EMAIL_PROVIDERS: { value: EmailProvider; label: string }[] = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'Amazon SES' },
  { value: 'postmark', label: 'Postmark' },
];

export const ENCRYPTION_TYPES: { value: EncryptionType; label: string }[] = [
  { value: 'tls', label: 'TLS' },
  { value: 'ssl', label: 'SSL' },
  { value: 'none', label: 'Ninguna' },
];

// ==================== INTERFACES DE ANUNCIOS ====================

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  type_label?: string;
  priority: AnnouncementPriority;
  priority_label?: string;
  scope: AnnouncementScope;
  scope_label?: string;
  target_companies?: number[];
  target_roles?: number[];
  target_departments?: number[];
  target_users?: number[];
  image_url?: string;
  action_url?: string;
  action_text?: string;
  starts_at?: string;
  expires_at?: string;
  is_pinned: boolean;
  is_modal: boolean;
  requires_acknowledgment: boolean;
  status: AnnouncementStatus;
  is_active: boolean;
  created_by: number;
  creator_name?: string;
  created_at?: string;
  updated_at?: string;
  reads_count?: number;
  is_read?: boolean;
  is_acknowledged?: boolean;
}

export interface AnnouncementCreate {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  scope: AnnouncementScope;
  target_companies?: number[];
  target_roles?: number[];
  target_departments?: number[];
  target_users?: number[];
  image_url?: string;
  action_url?: string;
  action_text?: string;
  starts_at?: string;
  expires_at?: string;
  is_pinned?: boolean;
  is_modal?: boolean;
  requires_acknowledgment?: boolean;
  status: 'draft' | 'scheduled' | 'active';
}

export type AnnouncementType = 'info' | 'warning' | 'urgent' | 'celebration';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical';
export type AnnouncementScope = 'all' | 'company' | 'role' | 'department' | 'user';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';

export const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string; color: string; icon: string }[] = [
  { value: 'info', label: 'Información', color: 'primary', icon: 'bi-info-circle' },
  { value: 'warning', label: 'Advertencia', color: 'warning', icon: 'bi-exclamation-triangle' },
  { value: 'urgent', label: 'Urgente', color: 'danger', icon: 'bi-exclamation-circle' },
  { value: 'celebration', label: 'Celebración', color: 'success', icon: 'bi-stars' },
];

export const ANNOUNCEMENT_PRIORITIES: { value: AnnouncementPriority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export const ANNOUNCEMENT_SCOPES: { value: AnnouncementScope; label: string }[] = [
  { value: 'all', label: 'Todos los usuarios' },
  { value: 'company', label: 'Por empresa' },
  { value: 'role', label: 'Por rol' },
  { value: 'department', label: 'Por departamento' },
  { value: 'user', label: 'Usuarios específicos' },
];

// ==================== INTERFACES DE CHAT ====================

export interface ChatConversation {
  id: number;
  type: 'direct' | 'group';
  name: string;
  description?: string;
  avatar_url?: string;
  participants: ChatParticipant[];
  participants_count: number;
  unread_count: number;
  latest_message?: ChatMessagePreview;
  latest_message_at?: string;
  created_at?: string;
}

export interface ChatParticipant {
  user_id: number;
  user_name: string;
  role: 'admin' | 'member';
  is_muted: boolean;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  type: 'text' | 'image' | 'file' | 'system';
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  reply_to?: {
    id: number;
    content: string;
    sender_id: number;
  };
  is_edited: boolean;
  edited_at?: string;
  is_own: boolean;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessagePreview {
  id: number;
  content?: string;
  type: string;
  sender_name: string;
  created_at: string;
}

export interface ChatMessageCreate {
  content?: string;
  type?: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  reply_to_id?: number;
}

export interface CreateConversationRequest {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  participant_ids: number[];
}

// ==================== INTERFACES DE PREFERENCIAS DE USUARIO ====================

export interface UserNotificationPreferences {
  id?: number;
  user_id: number;
  email_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  chat_enabled: boolean;
  dnd_enabled: boolean;
  dnd_start?: string;
  dnd_end?: string;
  dnd_days?: number[];
  module_preferences?: { [module: string]: { email: boolean; push: boolean } };
  digest_frequency?: 'none' | 'daily' | 'weekly';
  digest_time?: string;
}
