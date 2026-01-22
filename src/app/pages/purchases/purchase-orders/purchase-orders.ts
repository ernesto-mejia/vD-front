// =====================================================
// PURCHASE ORDERS - INTERFACES AND TYPES
// =====================================================

// Estado de la orden de compra
export interface PurchaseOrderStatus {
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

// Item de la orden de compra
export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  item_id?: number;
  purchase_request_item_id?: number;
  provider_id?: number;            // Proveedor asignado a este item
  provider_name?: string;          // Nombre del proveedor (cache)
  item_code?: string;
  item_name?: string;
  description?: string; // Alias for item_name/item_description
  item_description?: string;
  provider_code?: string;
  provider_sku?: string;
  // Quantity fields (both naming conventions)
  quantity?: number; // Alias
  quantity_ordered?: number;
  received_quantity?: number; // Alias
  quantity_received?: number;
  quantity_pending?: number;
  // Unit fields
  unit?: string; // Alias
  unit_of_measurement?: string;
  // Price/Tax fields
  unit_price: number;
  tax_rate?: number; // Some backends return this
  discount_percent?: number;
  discount_amount?: number;
  line_subtotal?: number;
  is_tax_exempt?: boolean;
  vat_amount?: number;
  line_total?: number;
  line_status?: 'pending' | 'partial' | 'received' | 'cancelled';
  notes?: string;
  line_number?: number;
  expected_date?: string;
  received_date?: string;
  // Relaciones cargadas
  item?: {
    id: number;
    code?: string;
    sku?: string;
    name: string;
  };
  receipts?: PurchaseOrderReceipt[];
}

// Recepción de mercancía
export interface PurchaseOrderReceipt {
  id: number;
  purchase_order_id: number;
  purchase_order_item_id?: number;
  received_by: number;
  quantity_received: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  lot_number?: string;
  serial_number?: string;
  expiration_date?: string;
  warehouse_id?: number;
  location?: string;
  receipt_document_number?: string;
  notes?: string;
  received_at: string;
  created_at: string;
  // Relaciones
  receiver?: {
    id: number;
    name: string;
    email: string;
  };
  warehouse?: {
    id: number;
    name: string;
  };
  purchase_order_item?: PurchaseOrderItem;
  // Array of received items when receipt contains multiple items
  items?: {
    id: number;
    purchase_order_item_id: number;
    quantity_received: number;
    purchase_order_item?: PurchaseOrderItem;
  }[];
}

// Historial de la orden
export interface PurchaseOrderHistory {
  id: number;
  purchase_order_id: number;
  user_id: number;
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'sent' |
          'received' | 'partial_received' | 'invoiced' | 'cancelled' | 'closed' | 'reopened';
  from_status_id?: number;
  to_status_id?: number;
  comments?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Relaciones
  user?: {
    id: number;
    name: string;
    email: string;
  };
  from_status?: PurchaseOrderStatus;
  to_status?: PurchaseOrderStatus;
}

// Orden de compra principal
export interface PurchaseOrder {
  id: number;
  order_number: string;
  purchase_request_id?: number;
  provider_id: number;
  contract_id?: number;
  created_by: number;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status_id: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  description?: string;
  destination_area_id?: number;
  destination_department_id?: number;
  internal_notes?: string;
  vendor_notes?: string;
  billing_address_id?: number;
  shipping_address_id?: number;

  // Totales
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  vat_retention_amount: number;
  isr_retention_amount: number;
  other_taxes_amount: number;
  shipping_cost: number;
  total: number;

  // Tasas
  vat_rate: number;
  vat_retention_rate: number;
  isr_retention_rate: number;

  // Moneda
  currency: string;
  exchange_rate: number;

  // Términos de pago
  payment_terms?: string;
  payment_due_date?: string;
  payment_method: 'transfer' | 'check' | 'cash' | 'credit_card' | 'other';

  // Envío
  shipping_method?: string;
  tracking_number?: string;
  carrier?: string;

  // Estado de recepción
  received_percentage: number;
  is_fully_received: boolean;
  fully_received_at?: string;

  // Facturación
  is_invoiced: boolean;
  invoice_number?: string;
  invoice_date?: string;

  // Aprobación
  approved_by?: number;
  approved_at?: string;

  // Envío al proveedor
  sent_by?: number;
  sent_at?: string;
  sent_method?: string;

  // Cancelación
  cancelled_by?: number;
  cancelled_at?: string;
  cancellation_reason?: string;

  // Cierre
  closed_by?: number;
  closed_at?: string;
  closing_notes?: string;

  // Confirmación de compra (comprador)
  purchased_by?: number;
  purchased_at?: string;
  purchase_receipt_path?: string;
  estimated_delivery_date_confirmed?: string;
  purchase_notes?: string;

  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Relaciones
  provider?: {
    id: number;
    company: string;
    name?: string; // Alias for company
    shortname?: string;
    rfc?: string;
    email?: string;
    phone?: string;
    document_number?: string;
    addresses?: any[];
  };
  contract?: {
    id: number;
    contract_number: string;
    description?: string;
  };
  status?: PurchaseOrderStatus;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  approver?: {
    id: number;
    name: string;
    email: string;
  };
  po_authorizer?: {
    id: number;
    name: string;
    user_name?: string;
    email: string;
  };
  sender?: {
    id: number;
    name: string;
    email: string;
  };
  canceller?: {
    id: number;
    name: string;
    email: string;
  };
  closer?: {
    id: number;
    name: string;
    email: string;
  };
  purchaser?: {
    id: number;
    name: string;
    email: string;
  };
  purchase_request?: {
    id: number;
    request_number: string;
    title?: string;
    destination_area?: {
      id: number;
      area: string;
      code?: string;
    };
  };
  destination_area?: {
    id: number;
    name: string;
    code?: string;
  };
  destination_department?: {
    id: number;
    name: string;
    code?: string;
    budget_center?: string;
  };
  billing_address?: any;
  shipping_address?: any;
  items?: PurchaseOrderItem[];
  history?: PurchaseOrderHistory[];
  receipts?: PurchaseOrderReceipt[];
}

// =====================================================
// DTOs
// =====================================================

export interface CreatePurchaseOrderDTO {
  purchase_request_id?: number;
  provider_id: number;
  contract_id?: number;
  title: string;
  description?: string;
  destination_area_id?: number;
  destination_department_id?: number;
  order_date: string;
  expected_delivery_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  billing_address_id?: number;
  shipping_address_id?: number;
  internal_notes?: string;
  vendor_notes?: string;
  payment_terms?: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_cost?: number;
  currency?: string;
  exchange_rate?: number;
  items: CreatePurchaseOrderItemDTO[];
}

export interface CreatePurchaseOrderItemDTO {
  item_id?: number;
  item_code?: string;
  item_name: string;
  item_description?: string;
  provider_code?: string;
  provider_sku?: string;
  quantity_ordered: number;
  unit_price: number;
  unit_of_measurement?: string;
  discount_percent?: number;
  is_tax_exempt?: boolean;
  notes?: string;
  expected_date?: string;
}

export interface UpdatePurchaseOrderDTO {
  title?: string;
  description?: string;
  expected_delivery_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  billing_address_id?: number;
  shipping_address_id?: number;
  internal_notes?: string;
  vendor_notes?: string;
  payment_terms?: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_cost?: number;
  items?: UpdatePurchaseOrderItemDTO[];
}

export interface UpdatePurchaseOrderItemDTO {
  id?: number;
  item_id?: number;
  provider_id?: number;        // Proveedor asignado a este item
  provider_name?: string;      // Nombre del proveedor (cache)
  item_code?: string;
  item_name?: string;
  item_description?: string;
  provider_code?: string;
  provider_sku?: string;
  quantity_ordered?: number;
  unit_price?: number;
  unit_of_measurement?: string;
  discount_percent?: number;
  is_tax_exempt?: boolean;
  notes?: string;
  expected_date?: string;
}

// DTO para recepción de mercancía
export interface ReceiveItemDTO {
  purchase_order_item_id: number;
  quantity_received: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  lot_number?: string;
  serial_number?: string;
  expiration_date?: string;
  warehouse_id?: number;
  location?: string;
  notes?: string;
}

export interface ReceiveOrderDTO {
  items: ReceiveItemDTO[];
  receipt_document_number?: string;
  notes?: string;
}

// DTO para registrar factura
export interface RegisterInvoiceDTO {
  invoice_number: string;
  invoice_date: string;
}

// DTO para filtros de búsqueda
export interface PurchaseOrderFilters {
  status_id?: number;
  status_code?: string;
  provider_id?: number;
  priority?: string;
  created_by?: number;
  my_orders?: boolean;
  pending_receipt?: boolean;
  not_invoiced?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Respuesta de cálculo de totales
export interface TotalsCalculation {
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  vat_retention_amount: number;
  isr_retention_amount: number;
  shipping_cost: number;
  total: number;
  tax_rates: {
    vat_rate: number;
    vat_retention_rate: number;
    isr_retention_rate: number;
  };
}

// =====================================================
// CONSTANTES
// =====================================================

export const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'secondary', icon: 'bi-arrow-down' },
  { value: 'normal', label: 'Normal', color: 'primary', icon: 'bi-dash' },
  { value: 'high', label: 'Alta', color: 'warning', icon: 'bi-arrow-up' },
  { value: 'urgent', label: 'Urgente', color: 'danger', icon: 'bi-exclamation-triangle' },
];

export const PAYMENT_METHODS = [
  { value: 'transfer', label: 'Transferencia bancaria' },
  { value: 'check', label: 'Cheque' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'other', label: 'Otro' },
];

export const ORDER_STATUS_CODES = {
  // Estados del flujo principal
  DRAFT: 'DRAFT',                         // Borrador
  OPEN: 'OPEN',                           // Abierto (enviado para autorización)
  RELEASED: 'RELEASED',                   // Liberado (primera aprobación)
  AUTHORIZED: 'AUTHORIZED',               // Autorizado (aprobación final)
  REJECTED: 'REJECTED',                   // Rechazado

  // Estados de compra con proveedor
  PENDING_PROVIDER: 'PENDING_PROVIDER',   // Pendiente de envío a proveedor
  SENT: 'SENT',                           // Enviado al proveedor
  CONFIRMED: 'CONFIRMED',                 // Confirmado por proveedor

  // Estados de entrega
  IN_DELIVERY: 'IN_DELIVERY',             // En proceso de entrega
  PARTIAL_RECEIVED: 'PARTIAL_RECEIVED',   // Recibido parcialmente
  RECEIVED: 'RECEIVED',                   // Recibido completo
  BACKORDER: 'BACKORDER',                 // Backorder (pendiente de inventario)

  // Estados finales
  INVOICED: 'INVOICED',                   // Facturado
  CLOSED: 'CLOSED',                       // Cerrado
  PARTIALLY_CLOSED: 'PARTIALLY_CLOSED',   // Cerrado parcialmente
  CANCELLED: 'CANCELLED',                 // Cancelado

  // Legacy (compatibilidad)
  PENDING_APPROVAL: 'PENDING_APPROVAL',   // Alias para OPEN
  APPROVED: 'APPROVED',                   // Alias para AUTHORIZED
} as const;

export const LINE_STATUS = [
  { value: 'pending', label: 'Pendiente', color: 'warning' },
  { value: 'partial', label: 'Parcial', color: 'info' },
  { value: 'received', label: 'Recibido', color: 'success' },
  { value: 'cancelled', label: 'Cancelado', color: 'danger' },
];

// DTO para confirmar compra
export interface ConfirmPurchaseDTO {
  receipt?: File;
  estimated_delivery_date?: string; // YYYY-MM-DD
  estimated_delivery_time?: string; // HH:mm
  notes?: string;
}

// Respuesta de confirmación de compra
export interface ConfirmPurchaseResponse {
  success: boolean;
  message: string;
  data: {
    order: PurchaseOrder;
    estimated_delivery: string;
    receipt_url?: string;
  };
}

// ==================== COMPRAS POR PROVEEDOR (FASE 5) ====================

// Compra realizada con un proveedor específico
export interface ProviderPurchase {
  id: number;
  purchase_order_id: number;
  provider_id: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: 'pending' | 'purchased' | 'confirmed' | 'received' | 'cancelled';
  purchased_by?: number;
  purchased_at?: string;
  receipt_path?: string;
  receipt_filename?: string;
  receipt_url?: string;
  purchase_notes?: string;
  estimated_delivery_date?: string;
  estimated_delivery_time?: string;
  actual_delivery_date?: string;
  confirmed_by?: number;
  confirmed_at?: string;
  pdf_path?: string;
  pdf_url?: string;
  pdf_generated_at?: string;
  provider?: Company;
  purchaser?: { id: number; name: string; email: string };
}

// Grupo de items por proveedor
export interface ProviderItemGroup {
  provider_id: number;
  provider_name: string;
  provider?: Company;
  items: PurchaseOrderItem[];
  subtotal: number;
  vat_amount: number;
  total: number;
  purchase?: ProviderPurchase;
  is_purchased: boolean;
  purchased_at?: string;
  estimated_delivery?: string;
  receipt_url?: string;
}

// Respuesta de compras por proveedor
export interface ProviderPurchasesResponse {
  success: boolean;
  data: {
    order: PurchaseOrder;
    providers: ProviderItemGroup[];
    completion_percentage: number;
  };
}

// Respuesta al confirmar compra con proveedor
export interface ConfirmProviderPurchaseResponse {
  success: boolean;
  message: string;
  data: {
    order: PurchaseOrder;
    provider_purchase: ProviderPurchase;
    all_providers_completed: boolean;
    completion_percentage: number;
  };
}

// Interface básica para Company (si no está importada)
interface Company {
  id: number;
  company?: string;
  shortname?: string;
  name?: string;
  email?: string;
  phone?: string;
  rfc?: string;
}
