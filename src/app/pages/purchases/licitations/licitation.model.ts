// ==================== INTERFACES DE LICITACIONES ====================

/**
 * Estados posibles de una licitación
 */
export type LicitationStatus =
  | 'draft'       // Borrador
  | 'submitted'   // Enviada/Presentada
  | 'in_review'   // En revisión
  | 'won'         // Ganada
  | 'lost'        // Perdida
  | 'cancelled'   // Cancelada
  | 'converted';  // Convertida a contrato

/**
 * Licitación completa
 */
export interface Licitation {
  id_licitation?: number;
  licitation_number: string;
  id_company: number;
  company_name?: string;
  licitation_date: string;
  description?: string;
  status: LicitationStatus;
  status_label?: string;

  // Fechas del proceso
  submission_deadline?: string;
  resolution_date?: string;

  // Montos
  estimated_amount?: number;
  won_amount?: number;

  // Campos legacy
  licitation_basis?: number;
  demand_per_unit?: number;
  clarification_meeting?: number;
  technical_offer?: number;
  economic_proposal?: number;

  // Archivos
  digital_file?: boolean;
  digital_file_location?: string;

  // Notas
  notes?: string;

  // Relaciones
  company?: {
    id: number;
    company: string;
    tax_id?: string;
  };
  contracts?: ContractSummary[];

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Resumen de contrato vinculado
 */
export interface ContractSummary {
  id: number;
  contract_number: string;
  contract_type: 'client' | 'provider';
  starting_date?: string;
  ending_date?: string;
  min_amount?: number;
  max_amount?: number;
}

/**
 * Payload para crear licitación
 */
export interface LicitationCreateRequest {
  licitation_number: string;
  id_company: number;
  licitation_date: string;
  description?: string;
  status?: LicitationStatus;
  submission_deadline?: string;
  resolution_date?: string;
  estimated_amount?: number;
  licitation_basis?: number;
  demand_per_unit?: number;
  clarification_meeting?: number;
  technical_offer?: number;
  economic_proposal?: number;
  digital_file?: boolean;
  digital_file_location?: string;
  notes?: string;
}

/**
 * Payload para actualizar licitación
 */
export interface LicitationUpdateRequest extends Partial<LicitationCreateRequest> {
  won_amount?: number;
}

/**
 * Payload para cambiar estado
 */
export interface LicitationStatusChangeRequest {
  status: LicitationStatus;
  won_amount?: number;
  notes?: string;
}

/**
 * Payload para convertir a contrato
 */
export interface ConvertToContractRequest {
  project_name: string;
  region_id: number;
  start_date: string;
  end_date: string;
  min_amount: number;
  max_amount: number;
  contract_number?: string;
  reference_number?: string;
  description?: string;
}

/**
 * Filtros para listado
 */
export interface LicitationFilters {
  company_id?: number;
  status?: LicitationStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  active_only?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * Respuesta de listado paginado
 */
export interface LicitationsListResponse {
  success: boolean;
  data: Licitation[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

/**
 * Respuesta de una licitación
 */
export interface LicitationResponse {
  success: boolean;
  data: Licitation;
  message?: string;
}

/**
 * Respuesta de conversión a contrato
 */
export interface ConvertToContractResponse {
  success: boolean;
  message: string;
  data: {
    licitation: Licitation;
    contract: any; // Contract completo
  };
}

/**
 * Estadísticas de licitaciones
 */
export interface LicitationStats {
  total: number;
  by_status: Record<LicitationStatus, number>;
  total_estimated: number;
  total_won: number;
  win_rate: number;
}

// ==================== HELPERS ====================

export const LICITATION_STATUS_OPTIONS: { value: LicitationStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Borrador', color: 'secondary' },
  { value: 'submitted', label: 'Enviada', color: 'primary' },
  { value: 'in_review', label: 'En Revisión', color: 'info' },
  { value: 'won', label: 'Ganada', color: 'success' },
  { value: 'lost', label: 'Perdida', color: 'danger' },
  { value: 'cancelled', label: 'Cancelada', color: 'warning' },
  { value: 'converted', label: 'Convertida', color: 'dark' },
];

export function getStatusLabel(status: LicitationStatus): string {
  return LICITATION_STATUS_OPTIONS.find(s => s.value === status)?.label ?? status;
}

export function getStatusColor(status: LicitationStatus): string {
  return LICITATION_STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'secondary';
}

export function canChangeStatus(status: LicitationStatus): boolean {
  return status !== 'converted';
}

export function canConvertToContract(licitation: Licitation): boolean {
  return licitation.status === 'won' && (!licitation.contracts || licitation.contracts.length === 0);
}
