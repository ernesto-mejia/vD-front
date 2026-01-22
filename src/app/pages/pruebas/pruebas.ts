// ==================== INTERFACES PARA PRUEBAS ====================

export interface Prueba {
  id: number;
  code?: string; // Clave interna
  name: string;
  group_name?: string;
  sat_code?: string; // Clave SAT
  unit?: string; // Unidad de medida
  client_id?: number; // Cliente relacionado
  client?: ClientOption;
  specialty_id?: number; // Especialidad
  specialty?: SpecialtyOption;
  has_tax_code?: boolean; // Codigo de impuesto
  tax_rule_id?: number | null;
  is_billable?: boolean; // Se factura
  is_purchasable?: boolean; // Se compra
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PruebaDisplayOption {
  id?: string;
  display?: string;
}

// ==================== OPCIONES PARA SELECTS ====================

export interface ClientOption {
  id: number;
  name: string;
  tax_id?: string | null; // RFC
  shortname?: string | null;
}

export interface SpecialtyOption {
  id: number;
  name: string;
}

export interface TaxRuleOption {
  id: number;
  code: string;
  name: string;
}

export interface MedicalTestOption {
  id: number;
  name?: string;
  code?: string;
  group_name?: string | null;
}

// ==================== ESTRUCTURA PARA CREAR PRUEBA ====================

export interface PruebaCreateRequest {
  code?: string;
  name: string;
  group_name?: string;
  sat_code?: string;
  unit?: string;
  client_id?: number;
  specialty_id?: number;
  has_tax_code?: boolean;
  tax_rule_id?: number | null;
  is_billable?: boolean;
  is_purchasable?: boolean;
}

export interface PruebaUpdateRequest {
  code?: string;
  name?: string;
  group_name?: string;
  sat_code?: string;
  unit?: string;
  client_id?: number;
  specialty_id?: number;
  has_tax_code?: boolean;
  tax_rule_id?: number | null;
  is_billable?: boolean;
  is_purchasable?: boolean;
}

// ==================== RESPUESTAS DE API ====================

export interface PruebasListResponse {
  current_page: number;
  data: Prueba[];
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

export type PruebaDetailResponse = Prueba;

export type PruebaCreateResponse = Prueba;

export interface PruebaDeleteResponse {
  ok: boolean;
  message?: string;
}
