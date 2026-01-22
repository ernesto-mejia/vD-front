// ==================== INTERFACES PARA SERVICIOS ====================

export interface Service {
  id: number;
  name: string;
  description?: string;
  code?: string;  // Clave
  tax_rule_id?: number;  // Relación con impuesto
  is_purchasable?: boolean;  // Se compra
  is_billable?: boolean;  // Se factura
  unit?: string;  // Unidad de medida [Actividad, Unidad]
  sat_unit_code?: string;  // Unidad de medida SAT (4 caracteres)
  is_active?: boolean;
  providers?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface ServiceDisplayOption {
  id?: string;
  display?: string;
}

// ==================== ESTRUCTURA PARA CREAR SERVICIO ====================

export interface ServiceCreateRequest {
  name: string;
  description?: string;
  code?: string;
  tax_rule_id?: number;
  is_purchasable?: boolean;
  is_billable?: boolean;
  unit?: string;
  sat_unit_code?: string;
  is_active?: boolean;
  providers?: number[];
}

export interface ServiceUpdateRequest {
  name?: string;
  description?: string;
  code?: string;
  tax_rule_id?: number;
  is_purchasable?: boolean;
  is_billable?: boolean;
  unit?: string;
  sat_unit_code?: string;
  is_active?: boolean;
  providers?: number[];
}

// ==================== RESPUESTAS DE API ====================

export interface ServicesListResponse {
  current_page: number;
  data: Service[];
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

export type ServiceDetailResponse = Service;

export type ServiceCreateResponse = Service;

export interface ServiceDeleteResponse {
  ok: boolean;
  message?: string;
}

// ==================== OPCIONES DE METADATA ====================

export interface ServiceTax {
  id: number;
  name: string;
  rate?: number;
  description?: string;
}

export interface ServiceUnit {
  id: string;
  name: string;
}

export interface ProviderOption {
  id: number;
  name?: string;
  tax_id?: string;
}
