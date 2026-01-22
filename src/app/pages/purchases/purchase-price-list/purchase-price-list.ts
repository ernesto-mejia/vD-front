// ==================== INTERFACES PARA LISTA DE PRECIOS DE COMPRA ====================

export interface PurchasePriceList {
  id: number;
  code: string;  // Código único de la lista de precios
  name: string;
  description?: string;
  provider_id?: number;  // Proveedor asociado
  provider_name?: string;  // Nombre del proveedor (para display)
  provider_contract_id?: number;  // Contrato del proveedor asociado
  provider_contract_name?: string;  // Nombre del contrato
  currency: string;  // MXN, USD, EUR
  start_date?: string;  // Fecha de inicio de vigencia
  end_date?: string;  // Fecha de fin de vigencia
  discount_percentage?: number;  // Porcentaje de descuento general
  payment_terms?: string;  // Términos de pago
  delivery_time?: number;  // Tiempo de entrega en días
  minimum_order?: number;  // Pedido mínimo
  notes?: string;
  is_active?: boolean;
  items?: PurchasePriceListItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PurchasePriceListItem {
  id: number;
  price_list_id: number;
  product_id?: number;
  service_id?: number;
  product_name?: string;
  service_name?: string;
  sku?: string;  // # catálogo
  umc?: string;  // Unidad de medida de compra
  unit_price: number;  // Precio de lista (editable)
  discount_percentage?: number;
  final_price?: number;
  minimum_quantity?: number;
  notes?: string;
  selected?: boolean;  // Para checkbox en la tabla
}

// Interface para items del proveedor que se muestran en la tabla
export interface ProviderProductItem {
  id: number;
  item_id: number;
  name: string;
  sku?: string;  // # catálogo
  umc?: string;  // Unidad de medida
  unit_price: number;  // Precio de lista
  selected: boolean;  // Para checkbox
  contract_id?: number;
  contract_name?: string;
}

export interface PurchasePriceListDisplayOption {
  id?: string;
  display?: string;
}

// ==================== ESTRUCTURA PARA CREAR LISTA DE PRECIOS ====================

export interface PurchasePriceListCreateRequest {
  code: string;
  name: string;
  description?: string;
  provider_id?: number;
  provider_contract_id?: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  discount_percentage?: number;
  payment_terms?: string;
  delivery_time?: number;
  minimum_order?: number;
  notes?: string;
  is_active?: boolean;
  items?: PurchasePriceListItemRequest[];
}

export interface PurchasePriceListItemRequest {
  product_id?: number;
  service_id?: number;
  item_name?: string;
  sku?: string;
  umc?: string;
  unit_price: number;
  discount_percentage?: number;
  minimum_quantity?: number;
  notes?: string;
}

export interface PurchasePriceListUpdateRequest {
  code?: string;
  name?: string;
  description?: string;
  provider_id?: number;
  provider_contract_id?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  discount_percentage?: number;
  payment_terms?: string;
  delivery_time?: number;
  minimum_order?: number;
  notes?: string;
  is_active?: boolean;
  items?: PurchasePriceListItemRequest[];
}

// ==================== RESPUESTAS DE API ====================

export interface PurchasePriceListsResponse {
  current_page: number;
  data: PurchasePriceList[];
  first_page_url?: string;
  from?: number;
  last_page?: number;
  last_page_url?: string;
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number;
  total?: number;
}

export type PurchasePriceListDetailResponse = PurchasePriceList;

export type PurchasePriceListCreateResponse = PurchasePriceList;

export interface PurchasePriceListDeleteResponse {
  ok: boolean;
  message?: string;
}

// ==================== OPCIONES DE METADATA ====================

export interface CurrencyOption {
  id: string;
  name: string;
  symbol: string;
}

export interface ProviderOption {
  id: number;
  name?: string;
  shortname?: string;
  company?: string;
  tax_id?: string;
}

export interface ProviderContractOption {
  id: number;
  contract_name?: string;
  contract_number?: string;
  provider_id?: number;
  provider_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface ProductOption {
  id: number;
  name: string;
  sku?: string;
}

export interface ServiceOption {
  id: number;
  name: string;
  code?: string;
}
