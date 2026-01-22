// Interfaces para Solicitudes de Compra

export interface PurchaseRequestStatus {
  id: number;
  name: string;
  code: string;
  description?: string;
  color: string;
  icon?: string;
  is_final: boolean;
  is_active: boolean;
  order: number;
}

// Interfaz para progreso de solicitud (SC → OC → RO → Entregado)
export interface PurchaseRequestProgressSummary {
  has_purchase_orders: boolean;
  purchase_orders_count: number;
  purchase_orders?: Array<{
    id: number;
    order_number: string;
    status?: string;
    status_code?: string;
    status_color?: string;
    received_percentage?: number;
  }>;
  providers: Array<{
    id: number;
    name: string;
  }>;
  providers_count?: number;
  total_received_percentage: number;
  delivery_status: 'pending' | 'partial' | 'delivered' | 'cancelled';
  delivery_status_label: string;
  delivery_status_color: string;
}

export interface PurchaseRequestItem {
  id?: number;
  purchase_request_id?: number;
  item_id?: number;
  item_code?: string;
  item_name: string;
  item_description?: string;
  is_manual_item?: boolean;
  provider_code?: string;
  provider_sku?: string;
  quantity: number;
  unit: string;
  unit_of_measurement?: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  line_subtotal: number;
  is_tax_exempt: boolean;
  vat_amount: number;
  total: number;
  line_total: number;
  notes?: string;
  line_number: number;
  // Campos de proveedor del contrato
  suggested_provider_id?: number;
  provider_name?: string;
  contract_price?: number;
  source_contract_id?: number;
  review_notes?: string;
  // Para UI
  item?: {
    id: number;
    name: string;
    sku: string;
    description?: string;
  };
  // Relaciones cargadas
  suggestedProvider?: {
    id: number;
    company_name: string;
    trade_name?: string;
  };
  sourceContract?: {
    id: number;
    contract_number: string;
  };
}

export interface PurchaseRequestApproval {
  id: number;
  purchase_request_id: number;
  user_id: number;
  action: 'created' | 'submitted' | 'approved' | 'rejected' | 'returned' | 'cancelled' | 'modified' | 'updated' | 'po_generated';
  from_status_id?: number;
  to_status_id?: number;
  comments?: string;
  notes?: string;
  approval_level: number;
  ip_address?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  user?: {
    id: number;
    name: string;
    email: string;
  };
  from_status?: PurchaseRequestStatus;
  to_status?: PurchaseRequestStatus;
}

export interface PurchaseRequest {
  id: number;
  folio?: string;
  request_number: string;
  provider_id: number;
  contract_id?: number;
  is_contract_related?: boolean;
  manual_destination?: string;
  // Campos de destino por área/departamento
  destination_area_id?: number;
  destination_department_id?: number;
  requester_area_id?: number;
  destination_area?: {
    id: number;
    name?: string;
    area?: string;
    code?: string;
  };
  destination_department?: {
    id: number;
    name: string;
    code?: string;
  };
  // Campos de compra realizada
  receipt_image_url?: string;
  estimated_delivery_date?: string;
  marked_as_purchased_by?: number;
  marked_as_purchased_at?: string;
  marked_as_received_by?: number;
  marked_as_received_at?: string;
  purchased_by?: {
    id: number;
    user_name: string;
    email: string;
  };
  received_by?: {
    id: number;
    user_name: string;
    email: string;
  };
  purchase_status?: 'pending' | 'purchased' | 'received';
  requested_by: number;
  request_date: string;
  required_date?: string;
  status_id: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  description?: string;
  notes?: string;
  internal_notes?: string;
  delivery_address_id?: number;
  subtotal: number;
  iva: number;
  isr: number;
  iva_retention: number;
  isr_retention: number;
  vat_amount: number;
  vat_retention_amount: number;
  isr_retention_amount: number;
  total: number;
  vat_rate: number;
  vat_retention_rate: number;
  isr_retention_rate: number;
  currency: string;
  exchange_rate: number;
  purchase_order_number?: string;
  purchase_order_date?: string;
  approved_by?: {
    id: number;
    name: string;
    email?: string;
  };
  approved_at?: string;
  approval_notes?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejection_reason?: string;
  cancelled_by?: number;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Pre-autorización
  pre_authorized_by?: number;
  pre_authorized_at?: string;
  pre_authorization_notes?: string;
  pre_authorized_by_user?: {
    id: number;
    user_name: string;
    email: string;
  };
  // Workflow
  workflow_phase?: 'phase1_request' | 'phase2_preauth' | 'completed';
  // Relaciones
  provider?: {
    id: number;
    name?: string;
    company?: string;
    shortname?: string;
    rfc?: string;
  };
  contract?: {
    id: number;
    contract_number: string;
    description?: string;
  };
  status?: PurchaseRequestStatus;
  requester?: {
    id: number;
    user_name?: string;
    name?: string;
    email: string;
  };
  approver?: {
    id: number;
    user_name?: string;
    name?: string;
    email: string;
  };
  rejector?: {
    id: number;
    user_name?: string;
    name?: string;
    email: string;
  };
  delivery_address?: any;
  items?: PurchaseRequestItem[];
  approvals?: PurchaseRequestApproval[];
  // Progreso de entrega (SC → OC → RO)
  progress_summary?: PurchaseRequestProgressSummary;
}

export interface PurchaseRequestCreateRequest {
  provider_id?: number;
  contract_id?: number;
  title: string;
  description?: string;
  internal_notes?: string;
  request_date: string;
  required_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  delivery_address_id?: number;
  is_contract_related?: boolean;
  manual_destination?: string;
  destination_area_id?: number;
  destination_department_id?: number;
  skip_preauthorization?: boolean; // Saltar pre-autorización, ir directo a autorización final
  items: PurchaseRequestItemInput[];
}

// Alias para compatibilidad
export type CreatePurchaseRequestDTO = PurchaseRequestCreateRequest;

// Alias para compatibilidad
export type PurchaseRequestItemDTO = PurchaseRequestItemInput;

export interface PurchaseRequestUpdateRequest {
  provider_id?: number;
  contract_id?: number | null;
  is_contract_related?: boolean;
  manual_destination?: string | null;
  title?: string;
  description?: string;
  notes?: string;
  required_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  delivery_address_id?: number;
  internal_notes?: string;
  items?: PurchaseRequestItemInput[];
}

// Alias para compatibilidad
export type UpdatePurchaseRequestDTO = PurchaseRequestUpdateRequest;

export interface PurchaseRequestFilters {
  status_id?: number;
  status_code?: string;
  provider_id?: number;
  priority?: string;
  requested_by?: number;
  my_requests?: boolean;
  pending_approval?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface PurchaseRequestListResponse {
  success: boolean;
  data: PurchaseRequest[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PurchaseRequestResponse {
  success: boolean;
  data: PurchaseRequest;
  message?: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  vat_retention_rate: number;
  vat_retention_amount: number;
  isr_retention_rate: number;
  isr_retention_amount: number;
  total: number;
}

export interface StatusesResponse {
  success: boolean;
  data: PurchaseRequestStatus[];
}

// Constantes de prioridad
export const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'secondary', icon: 'fa-arrow-down' },
  { value: 'normal', label: 'Normal', color: 'primary', icon: 'fa-minus' },
  { value: 'high', label: 'Alta', color: 'warning', icon: 'fa-arrow-up' },
  { value: 'urgent', label: 'Urgente', color: 'danger', icon: 'fa-exclamation-triangle' }
];

// Constantes de estados
export const STATUS_CODES = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',           // Nuevo: Abierto (después de guardar)
  PENDING: 'PENDING',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  AUTHORIZED: 'AUTHORIZED', // Nuevo: Autorizado (según diseño PDF)
  PO_GENERATED: 'PO_GENERATED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  // Estados para flujo en dos fases
  SUBMITTED: 'SUBMITTED',
  RELEASED: 'RELEASED',   // Nuevo: Liberado (enviado para autorización)
  PRE_AUTHORIZED: 'PRE_AUTHORIZED',
  NEEDS_INTEGRATION: 'NEEDS_INTEGRATION'
};

// Fases del flujo de trabajo
export const WORKFLOW_PHASES = {
  PHASE1_REQUEST: 'phase1_request',
  PHASE2_PREAUTH: 'phase2_preauth',
  COMPLETED: 'completed'
};

// ==================== INTERFACES PARA FLUJO EN DOS FASES ====================

export interface PurchaseRequestItemInput {
  item_id?: number;
  item_code?: string;
  item_name: string;
  item_description?: string;
  provider_id?: number; // Proveedor asignado al item (para modo withPricing o contrato)
  provider_name?: string; // Nombre del proveedor (desnormalizado)
  provider_code?: string;
  provider_sku?: string;
  quantity: number;
  unit_price?: number;
  contract_price?: number; // Precio del contrato
  source_contract_id?: number; // ID del contrato de origen
  unit?: string;
  unit_of_measurement?: string;
  discount_percent?: number;
  is_tax_exempt?: boolean;
  notes?: string;
  is_manual_item?: boolean;
  suggested_category?: string;
}

export interface PreAuthorizeRequest {
  provider_id?: number;
  notes?: string;
  items?: PreAuthorizeItemUpdate[];
}

export interface PreAuthorizeItemUpdate {
  id: number;
  unit_price: number;
  estimated_price?: number;
  review_status?: 'approved' | 'rejected' | 'needs_integration';
  review_notes?: string;
}

export interface ConvertToPOResponse {
  success: boolean;
  message: string;
  data: {
    purchase_request: PurchaseRequest;
    purchase_order: any; // PurchaseOrder
  };
}

export interface ConvertToMultiplePOsResponse {
  success: boolean;
  message: string;
  data: {
    purchase_request: PurchaseRequest;
    purchase_orders: any[]; // Array de PurchaseOrder
    orders_count: number;
    order_numbers: string[];
  };
}

export interface ProductSearchResponse {
  success: boolean;
  data: ProductSearchItem[];
}

export interface ProductSearchItem {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  gtin?: string;
  item_category_id?: number;
  item_status_id?: number;
  brand_id?: number;
  unit_of_measurement_id?: number;
  storage_type_id?: number;
  observations?: string;
  detailed_info?: string;
  status?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  unit_of_measurement?: string;
  price?: number;
  provider_code?: string;
  contract_item_id?: number;
  // Campos de proveedor (para items de contrato de cliente)
  provider_id?: number;
  provider_name?: string;
  provider_contract_id?: number;
  provider_contract_name?: string;
  provider_price?: number;
}

export interface ContractsResponse {
  success: boolean;
  data: ContractSummary[];
}

export interface ContractSummary {
  id: number;
  contract_number: string;
  name: string;
  provider_id?: number;
  customer_id?: number;
  client_contract_id?: number;
  start_date: string;
  end_date: string;
  status: string;
  items_count?: number;
  provider?: {
    id: number;
    company: string;
    shortname: string;
  };
  customer?: {
    id: number;
    company: string;
    shortname: string;
  };
}

// Extensiones para PurchaseRequest con campos de Fase 2
export interface PurchaseRequestExtended extends PurchaseRequest {
  is_contract_related?: boolean;
  manual_destination?: string;
  workflow_phase?: 'phase1_request' | 'phase2_preauth' | 'completed';
  pre_authorized_by?: number;
  pre_authorized_at?: string;
  pre_authorization_notes?: string;
  requires_product_integration?: boolean;
  integration_notes?: string;
  pre_authorizer?: {
    id: number;
    name: string;
    email: string;
  };
}

// Extensiones para PurchaseRequestItem con campos de revisión
export interface PurchaseRequestItemExtended extends PurchaseRequestItem {
  is_manual_item?: boolean;
  suggested_category?: string;
  suggested_provider_id?: number;
  estimated_price?: number;
  review_status?: 'pending' | 'approved' | 'rejected' | 'needs_integration';
  review_notes?: string;
  suggested_provider?: {
    id: number;
    company: string;
    shortname: string;
  };
  // Campos de proveedor del contrato
  provider_name?: string;
  contract_price?: number;
  source_contract_id?: number;
}
