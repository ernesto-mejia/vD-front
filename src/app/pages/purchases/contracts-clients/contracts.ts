// ==================== INTERFACES DE CONTRATOS DE CLIENTES ====================

/**
 * Sistema de regionalización (IMSS, Pemex, ISSSTE, Nacional)
 */
export interface RegionSystem {
  id: number;
  code: string;
  name: string;
  description?: string;
  active_regions_count?: number;
  is_active?: boolean;
}

/**
 * Región/Delegación dentro de un sistema
 */
export interface SystemRegion {
  id: number;
  region_system_id: number;
  code: string;
  name: string;
  states?: string[];        // Estados que cubre (JSON)
  is_nationwide?: boolean;  // Si aplica a todo el país
  is_active?: boolean;
}

/**
 * Tipo de documento de contrato
 */
export interface ContractDocumentType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_required?: boolean;
  display_order?: number;
}

/**
 * Documento adjunto del contrato
 */
export interface ContractDocument {
  id?: number;
  contract_id?: number;
  document_type_id?: number;
  document_type?: ContractDocumentType;
  file_name?: string;
  filename?: string;  // Del backend ShowClientContractAction
  original_name?: string;  // Del backend
  file_path?: string;
  path?: string;  // Del backend
  file_size?: number;
  size?: number;  // Del backend
  mime_type?: string;
  status?: 'pending' | 'uploaded' | 'verified' | 'rejected';
  observations?: string;
  uploaded_at?: string;
  last_modified?: string;  // Del backend
  verified_at?: string;
  download_url?: string;  // URL para descargar
}

/**
 * Prórroga/Extensión del contrato
 */
export interface ContractExtension {
  id: number;
  contract_id: number;
  original_end_date: string;
  new_end_date: string;
  extension_days: number;
  reason?: string;
  document_reference?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
}

/**
 * Asignación de ítem por unidad médica (Fase 2 del wizard)
 */
export interface ContractUnitItem {
  id?: number;
  contract_id?: number;
  address_id: number;
  item_id: number;
  address?: CustomerAddress;
  item?: Item;
  min_quantity?: number;
  max_quantity?: number;
  unit_price?: number;
  observations?: string;
}

/**
 * Afianzadora (proveedor tipo afianzadora)
 */
export interface BondingCompany {
  id: number;
  shortname: string;
  company: string;
  tax_id?: string;
}

/**
 * Contrato de cliente completo
 */
export interface ClientContract {
  id?: number;
  customer_id: number;
  customer_name?: string;          // Razón social del cliente (auto-llenado)
  project_name: string;            // Nombre identificativo del proyecto
  description?: string;            // Descripción del contrato

  // Regiones (ahora múltiples)
  region_id?: number;              // Legacy: Región única
  region_ids?: number[];           // Nuevo: Múltiples regiones
  region_name?: string;            // Legacy: Nombre región única
  region_names?: string[];         // Nuevo: Nombres de múltiples regiones
  regions_display?: string;        // Texto concatenado de regiones para mostrar
  system_regions?: SystemRegion[]; // Relación con regiones

  start_date: string;              // Fecha de inicio de vigencia
  end_date: string;                // Fecha de fin de vigencia
  min_amount: number;              // Monto mínimo garantizado
  max_amount: number;              // Monto máximo
  contract_number?: string;        // Número de contrato
  licitation_number?: string;      // Número/Folio de licitación (antes reference_number)
  status_id?: number;              // Estado del contrato
  status_name?: string;

  // Afianzadora
  bonding_company_id?: number;
  bonding_company?: BondingCompany;
  bonding_amount?: number;
  bonding_start_date?: string;
  bonding_end_date?: string;
  has_bonding?: boolean;

  // Prórrogas
  has_extension?: boolean;
  original_ending_date?: string;
  extension_days?: number;
  extension_reason?: string;
  extension_approved_at?: string;
  extensions?: ContractExtension[];

  // Alertas
  alert_days_before?: number;
  days_remaining?: number;
  is_near_expiration?: boolean;
  is_expired?: boolean;

  // Wizard
  wizard_step?: 'info' | 'units' | 'summary' | 'completed';
  is_draft?: boolean;
  required_document_types?: number[];

  created_at?: string;
  updated_at?: string;

  // Licitación origen (si fue creado desde una licitación)
  licitation_id?: number;
  licitation?: {
    id_licitation: number;
    licitation_number: string;
    licitation_date?: string;
    status?: string;
    description?: string;
    title?: string;
  };

  // Relaciones
  addresses?: ContractAddress[];    // Direcciones/unidades médicas seleccionadas
  items?: ContractItem[];           // Pruebas/estudios del contrato
  unit_items?: ContractUnitItem[];  // Asignación por unidad médica
  documents?: ContractDocument[];   // Documentos adjuntos
  providers?: ContractProvider[];   // Proveedores relacionados
}

/**
 * Dirección/Unidad médica del contrato
 */
export interface ContractAddress {
  id?: number;
  contract_id?: number;
  address_id: number;              // ID de la dirección del cliente
  address_name?: string;           // Nombre de la unidad médica (ej: "Clínica 195 - Chalco")
  address_full?: string;           // Dirección completa
}

/**
 * Prueba/Estudio incluido en el contrato
 */
export interface ContractItem {
  id?: number;
  contract_id?: number;
  item_id: number;                 // ID del artículo/prueba
  item_name?: string;              // Nombre de la prueba
  item_code?: string;              // Código del artículo
  price?: number;                  // Precio unitario
  min_quantity?: number;           // Cantidad mínima
  max_quantity?: number;           // Cantidad máxima
  description?: string;
}

/**
 * Proveedor asociado al contrato de cliente
 */
export interface ContractProvider {
  id?: number;
  provider_contract_id: number;    // ID del contrato de proveedor
  provider_id?: number;
  provider_name?: string;
  provider_items?: ProviderContractItem[];  // Ítems que ofrece este proveedor
}

/**
 * Ítem del contrato de proveedor
 */
export interface ProviderContractItem {
  id?: number;
  item_id: number;
  item_name?: string;
  provider_price: number;          // Precio del proveedor
  currency?: string;
}

// ==================== REGIONES IMSS (Legacy - mantener compatibilidad) ====================

export interface IMSSRegion {
  id: number;
  name: string;
  code?: string;
  delegations?: string[];          // Delegaciones que pertenecen a esta región
}

// ==================== PAYLOAD PARA CREAR CONTRATO ====================

export interface ClientContractCreateRequest {
  customer_id: number;
  project_name: string;
  description?: string;

  // Regiones (múltiples)
  region_ids?: number[];

  // Fechas y montos
  start_date: string;
  end_date: string;
  min_amount: number;
  max_amount: number;
  contract_number?: string;
  licitation_number?: string;      // Antes era reference_number
  status_id?: number;

  // Direcciones y pruebas (Fase 1)
  address_ids: number[];
  item_ids: number[];

  // Afianzadora
  has_bonding?: boolean;
  bonding_company_id?: number;
  bonding_amount?: number;
  bonding_start_date?: string;
  bonding_end_date?: string;

  // Alertas
  alert_days_before?: number;

  // Documentos requeridos
  required_document_type_ids?: number[];

  // Wizard
  wizard_step?: 'info' | 'units' | 'summary' | 'completed';
  is_draft?: boolean;

  // Fase 2: Asignación por unidad
  unit_items?: ContractUnitItemRequest[];
}

export interface ContractUnitItemRequest {
  address_id: number;
  item_id: number;
  min_quantity?: number;
  max_quantity?: number;
  unit_price?: number;
  observations?: string;
}

export interface ClientContractUpdateRequest extends Partial<ClientContractCreateRequest> {
  id: number;

  // Prórroga (opcional en update)
  extension?: {
    new_end_date: string;
    extension_days?: number;
    reason?: string;
    document_reference?: string;
  };
}

// ==================== RESPUESTAS API ====================

export interface ClientContractResponse {
  ok: boolean;
  message?: string;
  data?: ClientContract;
}

export interface ClientContractsListResponse {
  ok: boolean;
  message?: string;
  data?: ClientContract[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
}

export interface IMSSRegionsResponse {
  ok: boolean;
  data?: IMSSRegion[];
}

export interface RegionSystemsResponse {
  ok: boolean;
  data?: RegionSystem[];
}

export interface SystemRegionsResponse {
  ok: boolean;
  data?: SystemRegion[];
}

export interface RegionsByCustomerResponse {
  ok: boolean;
  data?: {
    system: RegionSystem;
    regions: SystemRegion[];
  };
}

export interface CustomerAddressesResponse {
  ok: boolean;
  data?: CustomerAddress[];
}

export interface CustomerAddress {
  id: number;
  shortname: string;               // Nombre corto de la unidad médica
  address: string;
  city?: string;
  state?: string;
  region_id?: number;              // Región a la que pertenece
}

export interface ItemsResponse {
  ok: boolean;
  data?: Item[];
}

export interface Item {
  id: number;
  name: string;
  code?: string;
  description?: string;
  unit_price?: number;
  category?: string;
}

export interface ContractDocumentTypesResponse {
  ok: boolean;
  data?: ContractDocumentType[];
}

export interface ContractDocumentsResponse {
  ok: boolean;
  data?: ContractDocument[];
}

export interface ContractDocumentResponse {
  ok: boolean;
  message?: string;
  data?: ContractDocument;
}

export interface ContractDocumentDownloadResponse {
  ok: boolean;
  data?: {
    url: string;
    file_name: string;
  };
}

export interface ContractExtensionsResponse {
  ok: boolean;
  data?: ContractExtension[];
}

export interface ContractExtensionResponse {
  ok: boolean;
  message?: string;
  data?: ContractExtension;
}

export interface BondingCompaniesResponse {
  ok: boolean;
  data?: BondingCompany[];
}

export interface ContractUnitItemsResponse {
  ok: boolean;
  data?: { [addressId: string]: ContractUnitItem[] };  // Agrupados por address_id
}

export interface ExpiringContractsResponse {
  ok: boolean;
  data?: {
    id: number;
    project_name: string;
    customer: any;
    end_date: string;
    days_remaining: number;
    has_bonding: boolean;
    max_amount: number;
    status: any;
  }[];
}

// ==================== FILTROS ====================

export interface ContractFilters {
  customer_id?: number;
  region_id?: number;
  status_id?: number;
  start_date_from?: string;
  start_date_to?: string;
  search?: string;
  has_bonding?: boolean;
  expiring_within_days?: number;
  is_draft?: boolean;
}

// ==================== WIZARD STATE ====================

export type WizardStep = 'info' | 'units' | 'summary' | 'completed';

export interface WizardState {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  formData: ClientContractCreateRequest;
  isValid: {
    info: boolean;
    units: boolean;
    summary: boolean;
  };
}
