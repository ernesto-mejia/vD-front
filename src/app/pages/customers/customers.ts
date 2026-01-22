// ==================== NUEVA ESTRUCTURA DISPLAY ====================
export interface TaxDisplayOption {
  id?: string;
  display?: string;
}

export interface Customer {
  id: number;
  shortname?: string;
  company: string;
  tax_id: string;
  other_id?: string;
  company_type: string;
  website?: string;
  tax_regime?: TaxDisplayOption;
  tax_preferred_concept?: TaxDisplayOption;
  tax_status?: boolean;
  tax_byrules?: boolean;
  tax_actofincorporation?: boolean;
  company_scope?: string;
  id_company_scope?: number[];
  company_procurement_status_id?: number;
  is_tax_address?: number;
}

// ==================== NUEVA ESTRUCTURA PARA CREAR CLIENTE ====================

/**
 * Documento a crear junto con el cliente
 */
export interface DocumentCreate {
  document_type_id: number;
  status?: string;
  file_url?: string | null;
  description?: string | null;
}

export interface CustomerCreateRequest {
  compania: CompanyCreate;
  contacts: ContactCreate[];
  addresses: AddressCreate[];
  documents?: DocumentCreate[];
}

export interface CompanyCreate {
  company: string;
  shortname: string;
  tax_id: string;
  clave?: string;
  company_type: string;
  website?: string;
  tax_regime?: string;
  tax_preferred_concept?: string;
  tax_status?: string;
  tax_byrules?: string;
  tax_actofincorporation?: string;
  company_scope?: string;
}

export interface ContactCreate {
  contact_name: string;
  contact_lastname: string;
  contact_lada?: string;
  contact_phone?: string;
  contact_extension?: string;
  contact_email: string;
  contact_job_position?: string;
  contact_department?: string;
}

export interface AddressCreate {
  shortname: string;
  address?: string;
  country?: string;
  county?: string | string[]; // puede ser string o array de colonias
  municipality?: string; // delegación o municipio
  city?: string;
  state?: string;
  zipcode?: string;
  street?: string;
  outside_number?: string;
  inside_number?: string;
  colony?: string;
  contact_addresses?: ContactAddressCreate[];
}

export interface ContactAddressCreate {
  contact_name_address: string;
  contact_lastname_address: string;
  contact_lada?: string;
  contact_phone?: string;
  contact_extension?: string;
  contact_email?: string;
  contact_job_position?: string;
  contact_department?: string;
}

// ==================== INTERFACES PARA RESPUESTAS API ====================

// ==================== INTERFACES PARA EDICIÓN ====================
export interface CustomerContact {
  id_contact: number;
  contact_name: string;
  contact_lastname: string;
  contact_lastname2?: string;
  contact_lada?: string;
  phone?: string;
  contact_extension?: string;
  email?: string;
  job_position?: string;
  contact_department?: string;
}

export interface CustomerContactForm {
  contact_name: string;
  contact_lastname: string;
  contact_lastname2?: string;
  contact_lada?: string;
  phone?: string;
  contact_extension?: string;
  email?: string;
  job_position?: string;
  contact_department?: string;
}

export interface ContactCreatePayload {
  parent_table: 'companies';
  parent_id: number;
  contact_name: string;
  contact_lastname: string;
  contact_lastname2?: string;
  contact_lada?: string;
  contact_phone?: string;
  contact_extension?: string;
  contact_email?: string;
  contact_job_position?: string;
  contact_department?: string;
}

export interface ContactApiData {
  id: number;
  parent_table: string;
  parent_id: number;
  contact_name: string;
  contact_lastname: string;
  contact_lastname2?: string;
  contact_lada?: string;
  contact_phone?: string;
  contact_extension?: string;
  contact_email?: string;
  contact_job_position?: string;
  contact_department?: string;
  company?: Customer;
}

export interface ContactResponse {
  message: string;
  data: ContactApiData;
}

export interface ContactDeleteResponse {
  message: string;
}

export interface CustomerAddress {
  id_address: number;
  id?: number;
  shortname: string;
  address: string;
  country: string;
  county: string;
  municipality?: string;
  city: string;
  state: string;
  zipcode: string;
  street: string;
  outside_number: string;
  inside_number: string;
  contact_addresses?: ContactAddress[];
  contact_name?: string;
  contact_lastname?: string;
  contact_lastname2?: string;
  phone?: string;
  email?: string;
  job_position?: string;
  contact_department?: string;
  equipment?: string;
  colony?: string;
  id_equipment?: number;
}

export interface ContactAddress {
  id?: number;
  id_parent?: number;
  parent_id?: number;
  parent_table?: string;
  contact_name: string;
  contact_lastname: string;
  contact_lastname2?: string;
  contact_lada?: string;
  contact_phone?: string;
  contact_extension?: string;
  contact_email?: string;
  contact_job_position?: string;
  contact_department?: string;
}

export interface CustomerDocument {
  id_document: number;
  document_number?: string;
  document_date: string;
  document_type: string;
  document_status: string;
  total: number;
  reference_number?: string;
  observations?: string;
}

export interface CustomerContract {
  id_contract: number;
  contract_number?: string;
  contract_date: string;
  reference_number?: string;
  description?: string;
  contract_status: string;
  contract_type?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface CustomerFullResponse {
  ok: boolean;
  data: Customer;
}

export interface CustomerDetailResponse {
  ok: boolean;
  data: CustomerDetailData;
}

export interface CustomerDetailData {
  compania: Customer;
  contacts: CustomerContact[];
  tax_address?: TaxAddress;
  addresses: CustomerAddress[];
 // documents: CustomerDocument[];
  //contracts: CustomerContract[];
}

export interface TaxAddress {
  id: number;
  shortname: string;
  address: string;
  country: string;
  county?: string;
  municipality?: string;
  city: string;
  state: string;
  zipcode: string;
  street: string;
  outside_number: string;
  inside_number: string;
  is_tax_address: boolean;
  colony?: string;
}

export interface CustomersListResponse {
  ok: boolean;
  data: Customer[];
}

export interface CustomerDeleteResponse {
  ok: boolean;
  message: string;
}

export interface MetaOption {
  value: string;
  label: string;
}

export interface MetaOptionsResponse {
  data: MetaOption[];
}

// ==================== ELIMINAR INTERFACES LEGACY ====================
export interface TaxRegime {
  id: number;
  tax_regime: string;
  description?: string;
}

export interface TaxConcept {
  id: number;
  tax_concept: string;
  description?: string;
}

export interface CompanyScope {
  id_company_scope: number;
  company_scope: string;
  description?: string;
}

export interface Equipment {
  id_equipment: number;
  equipment: string;
  description?: string;
}

export interface DropdownDataResponse {
  tax_regimes: TaxRegime[];
  tax_concepts: TaxConcept[];
  company_scopes: CompanyScope[];
  equipments: Equipment[];
}

export interface StatusClasses {
  [key: string]: string;
}

// Interfaz para códigos telefónicos internacionales
export interface PhoneCode {
  value: string;
  label: string;
  iso_code: string;
}

export interface PhoneCodesResponse {
  data: PhoneCode[];
}
