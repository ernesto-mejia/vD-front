// ==================== INTERFACES DE CONTRATOS DE PROVEEDORES ====================

/**
 * Contrato de proveedor completo
 */
export interface ProviderContract {
  id?: number;
  provider_id: number;
  provider_name?: string;           // Nombre del proveedor
  provider_company?: string;        // Razón social del proveedor
  provider_tax_id?: string;         // RFC del proveedor
  contract_name?: string;           // Nombre del contrato (opcional ahora)
  description?: string;

  // Relación opcional con contrato de cliente
  client_contract_id?: number | null;
  client_contract_name?: string;    // Nombre del contrato de cliente relacionado
  client_name?: string;             // Nombre del cliente del contrato relacionado

  start_date?: string;
  end_date?: string;
  status_id?: number;
  status_name?: string;
  created_at?: string;
  updated_at?: string;

  // Conteo de items (para lista)
  items_count?: number;
  total_value?: number;

  // Items/servicios con precios del proveedor
  items?: ProviderContractItem[];
}

/**
 * Ítem/servicio con precio del proveedor
 */
export interface ProviderContractItem {
  id?: number;
  provider_contract_id?: number;
  item_id?: number | null;          // Null si es item manual
  item_name?: string;
  item_code?: string;
  provider_price: number;           // Precio que cobra el proveedor
  currency?: string;
  unit?: string;
  description?: string;
  is_manual?: boolean;              // True si es item ingresado manualmente
}

// ==================== PAYLOAD PARA CREAR CONTRATO ====================

export interface ProviderContractCreateRequest {
  provider_id: number;
  contract_name?: string;              // Ahora es opcional
  description?: string;
  client_contract_id?: number | null;  // Opcional: relación con contrato de cliente
  start_date?: string;
  end_date?: string;
  status_id?: number;
  items: ProviderContractItemCreate[];  // Lista de ítems con precios
}

export interface ProviderContractItemCreate {
  item_id?: number | null;   // Null si es item manual
  item_name?: string;        // Nombre del item (requerido si es manual)
  item_code?: string;        // Código del item (opcional)
  provider_price: number;
  currency?: string;
  description?: string;
  is_manual?: boolean;       // True si es item ingresado manualmente
}

export interface ProviderContractUpdateRequest extends Partial<ProviderContractCreateRequest> {
  id: number;
}

// ==================== RESPUESTAS API ====================

export interface ProviderContractResponse {
  ok: boolean;
  message?: string;
  data?: ProviderContract;
}

export interface ProviderContractsListResponse {
  ok: boolean;
  message?: string;
  data?: ProviderContract[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
}

// ==================== LISTA DE PRECIOS ====================

/**
 * Entrada de lista de precios (para estadística y solicitudes de compra)
 */
export interface PriceListEntry {
  id?: number;
  item_id: number;
  item_name: string;
  item_code?: string;
  provider_id: number;
  provider_name: string;
  provider_contract_id?: number;
  provider_contract_name?: string;
  client_contract_id?: number;
  client_contract_name?: string;
  client_id?: number;
  client_name?: string;
  price: number;
  currency: string;
  valid_from?: string;
  valid_to?: string;
}

export interface PriceListResponse {
  ok: boolean;
  data?: PriceListEntry[];
  meta?: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

// ==================== FILTROS ====================

export interface ProviderContractFilters {
  provider_id?: number;
  client_contract_id?: number;
  has_client_contract?: boolean;
  status_id?: number;
  search?: string;
}

export interface PriceListFilters {
  client_id?: number;
  provider_id?: number;
  client_contract_id?: number;
  provider_contract_id?: number;
  item_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ==================== OPCIONES PARA SELECTS ====================

export interface ProviderOption {
  id: number;
  shortname: string;
  company: string;
  tax_id?: string;
}

export interface ClientContractOption {
  id: number;
  project_name: string;
  customer_name?: string;
  start_date?: string;
  end_date?: string;
}

// ==================== ITEMS DEL PROVEEDOR ====================

/**
 * Ítem que un proveedor ofrece (desde contract-item/provider/{id}/items)
 */
export interface ProviderItemSummary {
  contract_item_id: number;
  contract_id: number;
  contract_reference?: string;
  item_id: number;
  item_name: string;
  item_description?: string;
  sku?: string;
  price?: number;
  provider_price?: number;
  currency?: string;
  minimum_quantity?: number;
  maximum_quantity?: number;
  discount?: number;
  observations?: string;
}

export interface ProviderItemsResponse {
  provider_id: number;
  total_items: number;
  items: ProviderItemSummary[];
}
