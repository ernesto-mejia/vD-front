// Interfaces para el módulo de Impuestos (Tax Rules)

// ==================== ENUMS Y TIPOS ====================

export type PersonType = 'fisica' | 'moral';
export type AppliesTo = 'person' | 'item' | 'both';
export type ItemType = 'product' | 'service' | 'kit' | 'equipment' | 'supply' | 'consumable';

// ==================== TAX RULE ====================

export interface TaxRule {
  id: number;
  name: string;
  code: string;
  description?: string;
  person_type: PersonType;
  applies_to: AppliesTo;
  item_types?: ItemType[];
  sat_product_code?: string;
  item_category_id?: number;
  tax_regime_id?: number;
  vat_rate: number;
  vat_retention_applies: boolean;
  vat_retention_rate: number;
  isr_retention_applies: boolean;
  isr_retention_rate: number;
  ieps_applies: boolean;
  ieps_rate: number;
  is_border_zone: boolean;
  is_default: boolean;
  active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;

  // Relaciones
  tax_regime?: TaxRegime;

  // Computed (del backend)
  vat_rate_percentage?: string;
  vat_retention_percentage?: string;
  isr_retention_percentage?: string;
  ieps_rate_percentage?: string;
  person_type_name?: string;
  applies_to_name?: string;
  item_type_names?: string[];
}

export interface TaxRuleCreateRequest {
  name: string;
  code: string;
  description?: string;
  person_type: PersonType;
  applies_to?: AppliesTo;
  item_types?: ItemType[];
  sat_product_code?: string;
  item_category_id?: number | null;
  tax_regime_id?: number | null;
  vat_rate: number;
  vat_retention_applies: boolean;
  vat_retention_rate: number;
  isr_retention_applies: boolean;
  isr_retention_rate: number;
  ieps_applies?: boolean;
  ieps_rate?: number;
  is_border_zone?: boolean;
  is_default?: boolean;
  active?: boolean;
  priority?: number;
}

export interface TaxRuleUpdateRequest extends Partial<TaxRuleCreateRequest> {}

export interface TaxRuleResponse {
  ok: boolean;
  data: TaxRule;
  message?: string;
}

export interface TaxRulesListResponse {
  ok: boolean;
  data: TaxRule[];
  meta?: PaginationMeta;
}

// ==================== TAX REGIME (Catálogo SAT) ====================

export interface TaxRegime {
  id: number;
  sat_tax_regime_code: string;
  tax_regime: string;
}

export interface TaxRegimesResponse {
  ok: boolean;
  data: TaxRegime[];
}

// ==================== TAX CONCEPT / CFDI USE ====================

export interface TaxConcept {
  id: number;
  tax_concept: string; // Código SAT (G01, G03, etc.)
  concept_name: string; // Nombre descriptivo
}

export interface TaxConceptsResponse {
  ok: boolean;
  data: TaxConcept[];
}

// ==================== COMPANY TAX CONFIGURATION ====================

export interface CompanyTaxConfiguration {
  id: number;
  company_id: number;
  tax_rule_id?: number;
  use_custom_rates: boolean;

  // Custom rates (si use_custom_rates = true)
  custom_vat_rate?: number;
  custom_vat_retention_applies?: boolean;
  custom_vat_retention_rate?: number;
  custom_isr_retention_applies?: boolean;
  custom_isr_retention_rate?: number;

  // CFDI y crédito
  default_cfdi_use_id?: number;
  credit_days?: number;
  credit_limit?: number;
  notes?: string;

  created_at?: string;
  updated_at?: string;

  // Relaciones
  company?: CompanySummary;
  tax_rule?: TaxRule;
  default_cfdi_use?: TaxConcept;
}

export interface CompanyTaxConfigurationRequest {
  company_id: number;
  tax_rule_id?: number | null;
  use_custom_rates?: boolean;
  custom_vat_rate?: number | null;
  custom_vat_retention_applies?: boolean | null;
  custom_vat_retention_rate?: number | null;
  custom_isr_retention_applies?: boolean | null;
  custom_isr_retention_rate?: number | null;
  default_cfdi_use_id?: number | null;
  credit_days?: number | null;
  credit_limit?: number | null;
  notes?: string | null;
}

export interface CompanyTaxConfigurationResponse {
  ok: boolean;
  data: CompanyTaxConfiguration;
  message?: string;
}

export interface CompanyTaxConfigurationShowResponse {
  ok: boolean;
  data: {
    configuration: CompanyTaxConfiguration;
    effective_rates: EffectiveRates;
    company: CompanySummary;
  };
}

export interface CompanyTaxConfigurationsListResponse {
  ok: boolean;
  data: CompanyTaxConfiguration[];
  meta?: PaginationMeta;
}

// ==================== TAX CALCULATION ====================

export interface TaxCalculationRequest {
  subtotal: number;
  rfc?: string;
  tax_regime_id?: number;
  company_id?: number;
  tax_rule_id?: number;
}

export interface TaxCalculationResult {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  vat_retention_applies: boolean;
  vat_retention_rate: number;
  vat_retention_amount: number;
  isr_retention_applies: boolean;
  isr_retention_rate: number;
  isr_retention_amount: number;
  total_retentions: number;
  total: number;
  source: 'custom' | 'rule' | 'default' | 'company_configuration' | 'specified_rule' | 'applicable_rule';
  rule_name?: string;
  rule_code?: string;
  rates_source?: string;
  company_id?: number;
  company_name?: string;
}

export interface TaxCalculationResponse {
  ok: boolean;
  data: TaxCalculationResult;
}

// ==================== PERSON TYPE DETECTION ====================

export interface PersonTypeDetectionRequest {
  rfc: string;
}

export interface PersonTypeDetectionResult {
  rfc: string;
  length: number;
  person_type: 'fisica' | 'moral';
  person_type_name: string;
  default_rule?: TaxRule;
}

export interface PersonTypeDetectionResponse {
  ok: boolean;
  data: PersonTypeDetectionResult;
  message?: string;
}

// ==================== DEFAULTS ====================

export interface TaxRuleDefaults {
  fisica?: TaxRule;
  moral?: TaxRule;
}

export interface TaxRuleDefaultsResponse {
  ok: boolean;
  data: TaxRuleDefaults;
}

// ==================== EFFECTIVE RATES ====================

export interface EffectiveRates {
  vat_rate: number;
  vat_retention_applies: boolean;
  vat_retention_rate: number;
  isr_retention_applies: boolean;
  isr_retention_rate: number;
  source: 'custom' | 'rule' | 'default';
  rule_name?: string;
}

// ==================== HISTORY ====================

export interface TaxConfigurationHistoryEntry {
  id: number;
  company_id: number;
  changed_by: number;
  changed_by_name?: string;
  old_values: any;
  new_values: any;
  change_reason?: string;
  created_at: string;
}

export interface TaxConfigurationHistoryResponse {
  ok: boolean;
  data: TaxConfigurationHistoryEntry[];
}

// ==================== AUXILIARES ====================

export interface CompanySummary {
  id: number;
  shortname?: string;
  company?: string;
  tax_id?: string; // RFC
  company_type?: string;
  person_type?: PersonType;
  tax_regime_id?: number;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ==================== FILTERS ====================

export interface TaxRuleFilters {
  person_type?: PersonType;
  applies_to?: AppliesTo;
  item_type?: ItemType;
  active?: boolean;
  is_default?: boolean;
  tax_regime_id?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// ==================== OPTIONS ====================

export interface TaxRuleOptions {
  applies_to: Record<AppliesTo, string>;
  item_types: Record<ItemType, string>;
  person_types: Record<PersonType, string>;
  vat_rates: {
    standard: number;
    border: number;
    zero: number;
  };
}

export interface TaxRuleOptionsResponse {
  ok: boolean;
  data: TaxRuleOptions;
}

export interface CompanyTaxConfigFilters {
  company_id?: number;
  tax_rule_id?: number;
  use_custom_rates?: boolean;
  per_page?: number;
  page?: number;
}
