import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import {
  TaxRule,
  TaxRuleCreateRequest,
  TaxRuleUpdateRequest,
  TaxRuleResponse,
  TaxRulesListResponse,
  TaxRuleFilters,
  TaxRuleDefaults,
  TaxRuleDefaultsResponse,
  TaxRuleOptions,
  TaxRuleOptionsResponse,
  TaxRegime,
  TaxRegimesResponse,
  TaxConcept,
  TaxConceptsResponse,
  CompanyTaxConfiguration,
  CompanyTaxConfigurationRequest,
  CompanyTaxConfigurationResponse,
  CompanyTaxConfigurationShowResponse,
  CompanyTaxConfigurationsListResponse,
  CompanyTaxConfigFilters,
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxCalculationResponse,
  PersonTypeDetectionRequest,
  PersonTypeDetectionResult,
  PersonTypeDetectionResponse,
  TaxConfigurationHistoryEntry,
  TaxConfigurationHistoryResponse,
  AppliesTo,
  ItemType,
} from './taxes';

@Injectable({
  providedIn: 'root'
})
export class TaxesService {
  private readonly taxRulesPath = 'v2/tax-rules';
  private readonly companyTaxConfigPath = 'v2/company-tax-config';

  // Caché para catálogos
  private taxRegimesCache: TaxRegime[] | null = null;
  private taxConceptsCache: TaxConcept[] | null = null;
  private taxRuleDefaultsCache: TaxRuleDefaults | null = null;
  private taxRuleOptionsCache: TaxRuleOptions | null = null;

  constructor(private http: HttpClient) { }

  // ==================== TAX RULES ====================

  /**
   * Obtener lista de reglas de impuestos
   */
  getTaxRules(filters?: TaxRuleFilters): Observable<TaxRulesListResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.person_type) params = params.set('person_type', filters.person_type);
      if (filters.applies_to) params = params.set('applies_to', filters.applies_to);
      if (filters.item_type) params = params.set('item_type', filters.item_type);
      if (filters.active !== undefined) params = params.set('active', filters.active.toString());
      if (filters.is_default !== undefined) params = params.set('is_default', filters.is_default.toString());
      if (filters.tax_regime_id) params = params.set('tax_regime_id', filters.tax_regime_id.toString());
      if (filters.sort_by) params = params.set('sort_by', filters.sort_by);
      if (filters.sort_dir) params = params.set('sort_dir', filters.sort_dir);
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
    }
    return this.http.get<TaxRulesListResponse>(apiEndpoint(this.taxRulesPath), { params });
  }

  /**
   * Obtener una regla de impuesto por ID
   */
  getTaxRule(id: number): Observable<TaxRuleResponse> {
    return this.http.get<TaxRuleResponse>(apiEndpoint(`${this.taxRulesPath}/${id}`));
  }

  /**
   * Crear nueva regla de impuesto
   */
  createTaxRule(payload: TaxRuleCreateRequest): Observable<TaxRuleResponse> {
    return this.http.post<TaxRuleResponse>(apiEndpoint(this.taxRulesPath), payload).pipe(
      tap(() => this.clearDefaultsCache())
    );
  }

  /**
   * Actualizar regla de impuesto
   */
  updateTaxRule(id: number, payload: TaxRuleUpdateRequest): Observable<TaxRuleResponse> {
    return this.http.put<TaxRuleResponse>(apiEndpoint(`${this.taxRulesPath}/${id}`), payload).pipe(
      tap(() => this.clearDefaultsCache())
    );
  }

  /**
   * Eliminar regla de impuesto
   */
  deleteTaxRule(id: number): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(apiEndpoint(`${this.taxRulesPath}/${id}`)).pipe(
      tap(() => this.clearDefaultsCache())
    );
  }

  /**
   * Obtener reglas por defecto para persona física y moral
   */
  getTaxRuleDefaults(): Observable<TaxRuleDefaults> {
    if (this.taxRuleDefaultsCache) {
      return of(this.taxRuleDefaultsCache);
    }
    return this.http.get<TaxRuleDefaultsResponse>(apiEndpoint(`${this.taxRulesPath}/defaults`)).pipe(
      map(response => response.data),
      tap(data => this.taxRuleDefaultsCache = data)
    );
  }

  /**
   * Obtener opciones de configuración (applies_to, item_types, etc.)
   */
  getTaxRuleOptions(): Observable<TaxRuleOptions> {
    if (this.taxRuleOptionsCache) {
      return of(this.taxRuleOptionsCache);
    }
    return this.http.get<TaxRuleOptionsResponse>(apiEndpoint(`${this.taxRulesPath}/options`)).pipe(
      map(response => response.data),
      tap(data => this.taxRuleOptionsCache = data)
    );
  }

  // ==================== TAX CALCULATION ====================

  /**
   * Calcular impuestos para un monto dado
   */
  calculateTaxes(request: TaxCalculationRequest): Observable<TaxCalculationResult> {
    return this.http.post<TaxCalculationResponse>(apiEndpoint(`${this.taxRulesPath}/calculate`), request).pipe(
      map(response => response.data)
    );
  }

  /**
   * Detectar tipo de persona por RFC
   */
  detectPersonType(rfc: string): Observable<PersonTypeDetectionResult> {
    return this.http.post<PersonTypeDetectionResponse>(
      apiEndpoint(`${this.taxRulesPath}/detect-person-type`),
      { rfc }
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== COMPANY TAX CONFIGURATIONS ====================

  /**
   * Obtener lista de configuraciones de impuestos por compañía
   */
  getCompanyTaxConfigurations(filters?: CompanyTaxConfigFilters): Observable<CompanyTaxConfigurationsListResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.company_id) params = params.set('company_id', filters.company_id.toString());
      if (filters.tax_rule_id) params = params.set('tax_rule_id', filters.tax_rule_id.toString());
      if (filters.use_custom_rates !== undefined) params = params.set('use_custom_rates', filters.use_custom_rates.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
    }
    return this.http.get<CompanyTaxConfigurationsListResponse>(apiEndpoint(this.companyTaxConfigPath), { params });
  }

  /**
   * Obtener configuración de impuestos de una compañía
   */
  getCompanyTaxConfiguration(companyId: number): Observable<CompanyTaxConfigurationShowResponse> {
    return this.http.get<CompanyTaxConfigurationShowResponse>(apiEndpoint(`${this.companyTaxConfigPath}/${companyId}`));
  }

  /**
   * Crear o actualizar configuración de impuestos de una compañía
   */
  saveCompanyTaxConfiguration(payload: CompanyTaxConfigurationRequest): Observable<CompanyTaxConfigurationResponse> {
    return this.http.post<CompanyTaxConfigurationResponse>(apiEndpoint(this.companyTaxConfigPath), payload);
  }

  /**
   * Actualizar configuración de impuestos de una compañía
   */
  updateCompanyTaxConfiguration(companyId: number, payload: Partial<CompanyTaxConfigurationRequest>): Observable<CompanyTaxConfigurationResponse> {
    return this.http.put<CompanyTaxConfigurationResponse>(apiEndpoint(`${this.companyTaxConfigPath}/${companyId}`), payload);
  }

  /**
   * Eliminar configuración de impuestos de una compañía
   */
  deleteCompanyTaxConfiguration(companyId: number): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(apiEndpoint(`${this.companyTaxConfigPath}/${companyId}`));
  }

  /**
   * Calcular impuestos para una compañía específica
   */
  calculateCompanyTaxes(companyId: number, subtotal: number): Observable<TaxCalculationResult> {
    return this.http.post<TaxCalculationResponse>(
      apiEndpoint(`${this.companyTaxConfigPath}/${companyId}/calculate`),
      { subtotal }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Regenerar configuración desde RFC de la compañía
   */
  regenerateCompanyTaxConfiguration(companyId: number): Observable<CompanyTaxConfigurationResponse> {
    return this.http.post<CompanyTaxConfigurationResponse>(
      apiEndpoint(`${this.companyTaxConfigPath}/${companyId}/regenerate`),
      {}
    );
  }

  /**
   * Obtener historial de cambios de configuración
   */
  getCompanyTaxConfigurationHistory(companyId: number): Observable<TaxConfigurationHistoryEntry[]> {
    return this.http.get<TaxConfigurationHistoryResponse>(
      apiEndpoint(`${this.companyTaxConfigPath}/${companyId}/history`)
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== CATÁLOGOS ====================

  /**
   * Obtener regímenes fiscales del SAT
   */
  getTaxRegimes(): Observable<TaxRegime[]> {
    if (this.taxRegimesCache) {
      return of(this.taxRegimesCache);
    }
    return this.http.get<TaxRegimesResponse>(apiEndpoint(`${this.taxRulesPath}/tax-regimes`)).pipe(
      map(response => response.data),
      tap(data => this.taxRegimesCache = data)
    );
  }

  /**
   * Obtener usos de CFDI
   */
  getCfdiUses(): Observable<TaxConcept[]> {
    if (this.taxConceptsCache) {
      return of(this.taxConceptsCache);
    }
    return this.http.get<TaxConceptsResponse>(apiEndpoint(`${this.companyTaxConfigPath}/cfdi-uses`)).pipe(
      map(response => response.data),
      tap(data => this.taxConceptsCache = data)
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatea una tasa decimal como porcentaje
   */
  formatRateAsPercentage(rate: number, decimals: number = 2): string {
    return (rate * 100).toFixed(decimals) + '%';
  }

  /**
   * Convierte un porcentaje a tasa decimal
   */
  percentageToRate(percentage: number): number {
    return percentage / 100;
  }

  /**
   * Obtiene el nombre del tipo de persona
   */
  getPersonTypeName(type: 'fisica' | 'moral'): string {
    return type === 'fisica' ? 'Persona Física' : 'Persona Moral';
  }

  /**
   * Obtiene el nombre del tipo de aplicación
   */
  getAppliesToName(appliesTo: AppliesTo): string {
    const names: Record<AppliesTo, string> = {
      'person': 'Solo Personas',
      'item': 'Solo Items',
      'both': 'Personas e Items'
    };
    return names[appliesTo] || appliesTo;
  }

  /**
   * Obtiene el nombre del tipo de item
   */
  getItemTypeName(itemType: ItemType): string {
    const names: Record<ItemType, string> = {
      'product': 'Productos',
      'service': 'Servicios',
      'kit': 'Kits',
      'equipment': 'Equipos',
      'supply': 'Insumos',
      'consumable': 'Consumibles'
    };
    return names[itemType] || itemType;
  }

  /**
   * Obtiene los nombres de múltiples tipos de item
   */
  getItemTypeNames(itemTypes: ItemType[] | undefined | null): string {
    if (!itemTypes || itemTypes.length === 0) {
      return 'Todos los tipos';
    }
    return itemTypes.map(t => this.getItemTypeName(t)).join(', ');
  }

  /**
   * Detecta el tipo de persona basándose en la longitud del RFC
   * RFC 12 caracteres = Persona Moral
   * RFC 13 caracteres = Persona Física
   */
  getPersonTypeFromRfc(rfc: string): 'fisica' | 'moral' | null {
    if (!rfc) return null;
    const cleanRfc = rfc.trim().toUpperCase();
    if (cleanRfc.length === 12) return 'moral';
    if (cleanRfc.length === 13) return 'fisica';
    return null;
  }

  /**
   * Limpia el caché de reglas por defecto
   */
  private clearDefaultsCache(): void {
    this.taxRuleDefaultsCache = null;
    this.taxRuleOptionsCache = null;
  }

  /**
   * Limpia todo el caché
   */
  clearCache(): void {
    this.taxRegimesCache = null;
    this.taxConceptsCache = null;
    this.taxRuleDefaultsCache = null;
    this.taxRuleOptionsCache = null;
  }
}
