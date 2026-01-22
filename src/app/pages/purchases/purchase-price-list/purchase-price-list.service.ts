import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  PurchasePriceList,
  PurchasePriceListsResponse,
  PurchasePriceListDetailResponse,
  PurchasePriceListCreateRequest,
  PurchasePriceListCreateResponse,
  PurchasePriceListUpdateRequest,
  PurchasePriceListDeleteResponse,
  ProviderOption,
  ProviderContractOption,
  ProviderProductItem,
  CurrencyOption,
  PurchasePriceListItem,
} from './purchase-price-list';
import { apiEndpoint } from '../../../shared/api-endpoint.util';
import { NotificationGatewayService } from '../../../core/services/notification-gateway.service';

@Injectable({
  providedIn: 'root',
})
export class PurchasePriceListService {
  private readonly basePath = 'v2/purchase-price-lists';

  //JRD
  /*Nota: Esto es temporal. Para removerlo después,
  solo elimina las propiedades testProvider, testProviderContracts,
  testProviderProducts, testContractProducts y
  las condiciones if (providerId === this.TEST_PROVIDER_ID) en el servicio.*/
  // ==================== DATOS FAKER ====================
  private fakePriceLists: PurchasePriceList[] = [
    {
      id: 1,
      code: 'PPL-001',
      name: 'Lista de Precios General 2026',
      description: 'Lista de precios para productos generales con descuento por volumen',
      provider_id: 1,
      provider_name: 'Proveedora Médica del Norte S.A. de C.V.',
      currency: 'MXN',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      discount_percentage: 5,
      payment_terms: '30 días',
      delivery_time: 7,
      minimum_order: 5000,
      notes: 'Aplicable a compras mayores a $5,000 MXN',
      is_active: true,
      items: [
        { id: 1, price_list_id: 1, product_id: 101, product_name: 'Guantes Quirúrgicos (Caja 100)', sku: 'GQ-100', unit_price: 450.00, discount_percentage: 5, final_price: 427.50, minimum_quantity: 10 },
        { id: 2, price_list_id: 1, product_id: 102, product_name: 'Mascarillas N95 (Caja 50)', sku: 'MN95-50', unit_price: 800.00, discount_percentage: 5, final_price: 760.00, minimum_quantity: 5 },
        { id: 3, price_list_id: 1, service_id: 201, service_name: 'Servicio de Esterilización', unit_price: 1500.00, discount_percentage: 0, final_price: 1500.00, minimum_quantity: 1 },
      ],
      created_at: '2026-01-10T10:30:00Z',
      updated_at: '2026-01-15T14:45:00Z',
    },
    {
      id: 2,
      code: 'PPL-002',
      name: 'Lista Equipos de Laboratorio',
      description: 'Precios especiales para equipos de laboratorio clínico',
      provider_id: 2,
      provider_name: 'Lab Equipment Solutions S.A.',
      currency: 'USD',
      start_date: '2026-01-15',
      end_date: '2026-06-30',
      discount_percentage: 10,
      payment_terms: '60 días',
      delivery_time: 15,
      minimum_order: 1000,
      notes: 'Incluye instalación y capacitación',
      is_active: true,
      items: [
        { id: 4, price_list_id: 2, product_id: 201, product_name: 'Centrífuga Digital', sku: 'CD-500', unit_price: 2500.00, discount_percentage: 10, final_price: 2250.00, minimum_quantity: 1 },
        { id: 5, price_list_id: 2, product_id: 202, product_name: 'Microscopio Binocular', sku: 'MB-PRO', unit_price: 1800.00, discount_percentage: 10, final_price: 1620.00, minimum_quantity: 1 },
      ],
      created_at: '2026-01-12T09:00:00Z',
      updated_at: '2026-01-12T09:00:00Z',
    },
    {
      id: 3,
      code: 'PPL-003',
      name: 'Consumibles Médicos Premium',
      description: 'Lista de precios para consumibles de alta calidad',
      provider_id: 3,
      provider_name: 'Medical Supplies International',
      currency: 'MXN',
      start_date: '2026-02-01',
      end_date: '2027-01-31',
      discount_percentage: 8,
      payment_terms: '45 días',
      delivery_time: 5,
      minimum_order: 10000,
      notes: 'Envío gratuito en pedidos mayores a $15,000 MXN',
      is_active: true,
      items: [
        { id: 6, price_list_id: 3, product_id: 301, product_name: 'Jeringa Descartable 10ml (Caja 100)', sku: 'JD10-100', unit_price: 350.00, discount_percentage: 8, final_price: 322.00, minimum_quantity: 20 },
        { id: 7, price_list_id: 3, product_id: 302, product_name: 'Algodón Estéril (Bolsa 500g)', sku: 'AE-500', unit_price: 180.00, discount_percentage: 8, final_price: 165.60, minimum_quantity: 50 },
        { id: 8, price_list_id: 3, product_id: 303, product_name: 'Vendas Elásticas (Paquete 12)', sku: 'VE-12', unit_price: 280.00, discount_percentage: 8, final_price: 257.60, minimum_quantity: 30 },
      ],
      created_at: '2026-01-18T11:20:00Z',
      updated_at: '2026-01-20T16:30:00Z',
    },
    {
      id: 4,
      code: 'PPL-004',
      name: 'Servicios de Mantenimiento',
      description: 'Lista de precios para servicios de mantenimiento de equipos',
      provider_id: 4,
      provider_name: 'TechMed Servicios S.A. de C.V.',
      currency: 'MXN',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      discount_percentage: 0,
      payment_terms: '15 días',
      delivery_time: 3,
      minimum_order: 0,
      notes: 'Contrato anual con tarifas fijas',
      is_active: true,
      items: [
        { id: 9, price_list_id: 4, service_id: 401, service_name: 'Mantenimiento Preventivo Equipo Menor', unit_price: 2500.00, discount_percentage: 0, final_price: 2500.00, minimum_quantity: 1 },
        { id: 10, price_list_id: 4, service_id: 402, service_name: 'Mantenimiento Correctivo', unit_price: 4500.00, discount_percentage: 0, final_price: 4500.00, minimum_quantity: 1 },
        { id: 11, price_list_id: 4, service_id: 403, service_name: 'Calibración de Equipos', unit_price: 1800.00, discount_percentage: 0, final_price: 1800.00, minimum_quantity: 1 },
      ],
      created_at: '2026-01-05T08:00:00Z',
      updated_at: '2026-01-05T08:00:00Z',
    },
    {
      id: 5,
      code: 'PPL-005',
      name: 'Lista Insumos de Oficina',
      description: 'Precios para papelería y artículos de oficina',
      provider_id: 5,
      provider_name: 'Office Depot México',
      currency: 'MXN',
      start_date: '2026-01-01',
      end_date: '2026-03-31',
      discount_percentage: 15,
      payment_terms: '30 días',
      delivery_time: 2,
      minimum_order: 1500,
      notes: 'Promoción de inicio de año',
      is_active: false,
      items: [
        { id: 12, price_list_id: 5, product_id: 501, product_name: 'Resma Papel Bond (500 hojas)', sku: 'RPB-500', unit_price: 120.00, discount_percentage: 15, final_price: 102.00, minimum_quantity: 10 },
        { id: 13, price_list_id: 5, product_id: 502, product_name: 'Tóner Impresora HP', sku: 'THP-BK', unit_price: 950.00, discount_percentage: 15, final_price: 807.50, minimum_quantity: 2 },
      ],
      created_at: '2025-12-20T10:00:00Z',
      updated_at: '2026-01-02T09:15:00Z',
    },
  ];

  private fakeProviders: ProviderOption[] = [
    { id: 1, name: 'Proveedora Médica del Norte S.A. de C.V.', tax_id: 'PMN850101ABC' },
    { id: 2, name: 'Lab Equipment Solutions S.A.', tax_id: 'LES900215XYZ' },
    { id: 3, name: 'Medical Supplies International', tax_id: 'MSI880530DEF' },
    { id: 4, name: 'TechMed Servicios S.A. de C.V.', tax_id: 'TMS910610GHI' },
    { id: 5, name: 'Office Depot México', tax_id: 'ODM850101JKL' },
    { id: 6, name: 'Farmacéutica Nacional S.A.', tax_id: 'FNS870720MNO' },
    { id: 7, name: 'Distribuidora de Equipos Médicos', tax_id: 'DEM920830PQR' },
  ];

  private fakeCurrencies: CurrencyOption[] = [
    { id: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { id: 'USD', name: 'Dólar Americano', symbol: 'US$' },
    { id: 'EUR', name: 'Euro', symbol: '€' },
  ];

  // ==================== PROVEEDOR DE PRUEBA (TEMPORAL) ====================
  // ID especial para el proveedor de prueba
  private readonly TEST_PROVIDER_ID = 999999;

  private testProvider: ProviderOption = {
    id: this.TEST_PROVIDER_ID,
    name: '🧪 PROVEEDOR DE PRUEBA (Temporal)',
    shortname: 'TEST-PROV',
    company: 'Proveedor de Prueba S.A. de C.V.',
    tax_id: 'XAXX010101000',
  };

  private testProviderContracts: ProviderContractOption[] = [
    { id: 9991, contract_name: 'Contrato Prueba 2026', contract_number: 'CTP-001', provider_id: this.TEST_PROVIDER_ID, start_date: '2026-01-01', end_date: '2026-12-31' },
    { id: 9992, contract_name: 'Contrato Equipo Médico', contract_number: 'CEM-002', provider_id: this.TEST_PROVIDER_ID, start_date: '2026-01-01', end_date: '2026-06-30' },
  ];

  private testProviderProducts: ProviderProductItem[] = [
    { id: 1001, item_id: 1001, name: 'Guantes Quirúrgicos Estériles (Caja 100)', sku: 'GQE-100', umc: 'CAJA', unit_price: 450.00, selected: false },
    { id: 1002, item_id: 1002, name: 'Mascarilla N95 (Caja 50)', sku: 'MN95-50', umc: 'CAJA', unit_price: 850.00, selected: false },
    { id: 1003, item_id: 1003, name: 'Jeringa Descartable 10ml (Caja 100)', sku: 'JD10-100', umc: 'CAJA', unit_price: 320.00, selected: false },
    { id: 1004, item_id: 1004, name: 'Alcohol Etílico 70% (1 Litro)', sku: 'AE70-1L', umc: 'LTR', unit_price: 85.00, selected: false },
    { id: 1005, item_id: 1005, name: 'Gasas Estériles (Paquete 200)', sku: 'GE-200', umc: 'PQT', unit_price: 180.00, selected: false },
    { id: 1006, item_id: 1006, name: 'Vendas Elásticas 4" (Docena)', sku: 'VE4-12', umc: 'DOC', unit_price: 240.00, selected: false },
    { id: 1007, item_id: 1007, name: 'Solución Salina 500ml', sku: 'SS-500', umc: 'PZA', unit_price: 45.00, selected: false },
    { id: 1008, item_id: 1008, name: 'Estetoscopio Profesional', sku: 'EST-PRO', umc: 'PZA', unit_price: 1250.00, selected: false },
    { id: 1009, item_id: 1009, name: 'Termómetro Digital', sku: 'TD-01', umc: 'PZA', unit_price: 180.00, selected: false },
    { id: 1010, item_id: 1010, name: 'Oxímetro de Pulso', sku: 'OXP-01', umc: 'PZA', unit_price: 650.00, selected: false },
  ];

  private testContractProducts: ProviderProductItem[] = [
    { id: 2001, item_id: 2001, name: 'Desfibrilador Automático', sku: 'DEF-AUTO', umc: 'PZA', unit_price: 28500.00, selected: false, contract_id: 9991, contract_name: 'Contrato Prueba 2026' },
    { id: 2002, item_id: 2002, name: 'Monitor de Signos Vitales', sku: 'MSV-PRO', umc: 'PZA', unit_price: 45000.00, selected: false, contract_id: 9991, contract_name: 'Contrato Prueba 2026' },
    { id: 2003, item_id: 2003, name: 'Cama Hospitalaria Eléctrica', sku: 'CHE-01', umc: 'PZA', unit_price: 35000.00, selected: false, contract_id: 9991, contract_name: 'Contrato Prueba 2026' },
  ];
  // ==================== FIN PROVEEDOR DE PRUEBA ====================

  // Flag para usar datos faker (true) o API real (false)
  private useFakeData = true;

  constructor(
    private http: HttpClient,
    private notifications: NotificationGatewayService
  ) {}

  /**
   * Obtener lista de todas las listas de precios
   */
  getPriceLists(): Observable<PurchasePriceList[]> {
    if (this.useFakeData) {
      return of(this.fakePriceLists).pipe(delay(500));
    }
    return this.http
      .get<PurchasePriceListsResponse>(apiEndpoint(this.basePath))
      .pipe(map((response) => response?.data ?? []));
  }

  /**
   * Obtener una lista de precios por ID
   */
  getPriceList(id: number): Observable<PurchasePriceListDetailResponse> {
    if (this.useFakeData) {
      const priceList = this.fakePriceLists.find((p) => p.id === id);
      if (!priceList) {
        throw new Error('Lista de precios no encontrada');
      }
      return of(priceList).pipe(delay(300));
    }
    return this.http.get<PurchasePriceListDetailResponse>(
      apiEndpoint(`${this.basePath}/${id}`)
    );
  }

  /**
   * Crear una nueva lista de precios
   */
  createPriceList(
    payload: PurchasePriceListCreateRequest
  ): Observable<PurchasePriceListCreateResponse> {
    if (this.useFakeData) {
      const newId = Math.max(...this.fakePriceLists.map((p) => p.id)) + 1;
      const provider = this.fakeProviders.find((p) => p.id === payload.provider_id);
      const newPriceList: PurchasePriceList = {
        id: newId,
        ...payload,
        provider_name: provider?.name,
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.fakePriceLists.push(newPriceList);
      return of(newPriceList).pipe(delay(500));
    }
    return this.http
      .post<PurchasePriceListCreateResponse>(apiEndpoint(this.basePath), payload)
      .pipe(
        tap((resp: any) => {
          const id = resp?.id;
          if (id) {
            this.notifications
              .emitEvent('purchase-price-lists', 'create', Number(id), {
                request: payload,
                response: resp,
              })
              .subscribe();
          }
        })
      );
  }

  /**
   * Actualizar una lista de precios existente
   */
  updatePriceList(
    id: number,
    payload: PurchasePriceListUpdateRequest
  ): Observable<PurchasePriceListCreateResponse> {
    if (this.useFakeData) {
      const index = this.fakePriceLists.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new Error('Lista de precios no encontrada');
      }
      const provider = payload.provider_id
        ? this.fakeProviders.find((p) => p.id === payload.provider_id)
        : null;

      // Excluir items del payload para evitar incompatibilidad de tipos
      const { items, ...restPayload } = payload;

      const updatedPriceList: PurchasePriceList = {
        ...this.fakePriceLists[index],
        ...restPayload,
        provider_name: provider?.name || this.fakePriceLists[index].provider_name,
        updated_at: new Date().toISOString(),
      };
      this.fakePriceLists[index] = updatedPriceList;
      return of(updatedPriceList).pipe(delay(500));
    }
    return this.http
      .put<PurchasePriceListCreateResponse>(
        apiEndpoint(`${this.basePath}/${id}`),
        payload
      )
      .pipe(
        tap((resp) => {
          this.notifications
            .emitEvent('purchase-price-lists', 'update', id, {
              request: payload,
              response: resp,
            })
            .subscribe();
        })
      );
  }

  /**
   * Eliminar una lista de precios
   */
  deletePriceList(id: number): Observable<PurchasePriceListDeleteResponse> {
    if (this.useFakeData) {
      const index = this.fakePriceLists.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.fakePriceLists.splice(index, 1);
      }
      return of({ ok: true, message: 'Lista de precios eliminada correctamente' }).pipe(delay(300));
    }
    return this.http
      .delete<PurchasePriceListDeleteResponse>(
        apiEndpoint(`${this.basePath}/${id}`)
      )
      .pipe(
        tap((resp) => {
          this.notifications
            .emitEvent('purchase-price-lists', 'delete', id, { response: resp })
            .subscribe();
        })
      );
  }

  /**
   * Obtener catálogo de proveedores
   * Usa la API real de proveedores (company/providers)
   * Incluye el proveedor de prueba al inicio de la lista
   */
  getProvidersCatalog(): Observable<ProviderOption[]> {
    return this.http
      .get<any>(apiEndpoint('company/providers'))
      .pipe(
        map((response) => {
          const providers = response?.data ?? response ?? [];
          // Mapear la respuesta al formato ProviderOption
          const mappedProviders = providers.map((p: any) => ({
            id: p.id,
            name: p.company || p.shortname || `Proveedor #${p.id}`,
            shortname: p.shortname,
            company: p.company,
            tax_id: p.tax_id,
          }));
          // Agregar proveedor de prueba al inicio
          return [this.testProvider, ...mappedProviders];
        })
      );
  }

  /**
   * Obtener contratos de un proveedor específico
   * Si es el proveedor de prueba, devuelve contratos simulados
   */
  getProviderContracts(providerId: number): Observable<ProviderContractOption[]> {
    // Si es el proveedor de prueba, devolver contratos simulados
    if (providerId === this.TEST_PROVIDER_ID) {
      return of(this.testProviderContracts).pipe(delay(300));
    }

    return this.http
      .get<any>(apiEndpoint(`v2/contracts/providers`), {
        params: { provider_id: providerId.toString() }
      })
      .pipe(
        map((response) => {
          const contracts = response?.data ?? response ?? [];
          return contracts.map((c: any) => ({
            id: c.id,
            contract_name: c.contract_name || `Contrato #${c.id}`,
            contract_number: c.contract_number,
            provider_id: c.provider_id,
            provider_name: c.provider_name,
            start_date: c.start_date,
            end_date: c.end_date,
          }));
        })
      );
  }

  /**
   * Obtener items/productos de un proveedor específico
   * Si es el proveedor de prueba, devuelve productos simulados
   */
  getProviderItems(providerId: number): Observable<ProviderProductItem[]> {
    // Si es el proveedor de prueba, devolver productos simulados
    if (providerId === this.TEST_PROVIDER_ID) {
      // Devolver copia para evitar mutaciones
      return of(this.testProviderProducts.map(p => ({ ...p, selected: false }))).pipe(delay(300));
    }

    return this.http
      .get<any>(apiEndpoint(`contract-item/provider/${providerId}/items`))
      .pipe(
        map((response) => {
          const items = response?.items ?? response?.data ?? [];
          return items.map((item: any) => ({
            id: item.contract_item_id || item.id,
            item_id: item.item_id,
            name: item.item_name || item.name,
            sku: item.sku || item.item_code || '',
            umc: item.unit || item.umc || 'PZA',
            unit_price: item.provider_price || item.price || 0,
            selected: false,
            contract_id: item.contract_id,
            contract_name: item.contract_reference,
          }));
        })
      );
  }

  /**
   * Obtener items de un contrato específico
   * Si es un contrato de prueba, devuelve productos simulados
   */
  getContractItems(contractId: number): Observable<ProviderProductItem[]> {
    // Si es un contrato de prueba (9991 o 9992), devolver productos simulados
    if (contractId === 9991 || contractId === 9992) {
      return of(this.testContractProducts.map(p => ({ ...p, selected: false }))).pipe(delay(300));
    }

    return this.http
      .get<any>(apiEndpoint(`v2/contracts/providers/${contractId}`))
      .pipe(
        map((response) => {
          const contract = response?.data ?? response;
          const items = contract?.items ?? [];
          return items.map((item: any) => ({
            id: item.id,
            item_id: item.item_id,
            name: item.item_name || item.name,
            sku: item.item_code || item.sku || '',
            umc: item.unit || 'PZA',
            unit_price: item.provider_price || 0,
            selected: false,
            contract_id: contractId,
            contract_name: contract?.contract_name,
          }));
        })
      );
  }

  /**
   * Obtener opciones de moneda
   */
  getCurrencies(): Observable<CurrencyOption[]> {
    if (this.useFakeData) {
      return of(this.fakeCurrencies).pipe(delay(100));
    }
    return this.http
      .get<any>(apiEndpoint('v2/currencies'))
      .pipe(map((response) => response?.data ?? response ?? this.fakeCurrencies));
  }
}
