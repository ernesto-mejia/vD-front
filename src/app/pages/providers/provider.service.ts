import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {
  Provider,
  ProviderAddress,
  ProviderContact,
  ProviderDocument,
  ProviderContract,
  ProviderFullResponse,
  ProvidersListResponse,
  ProviderCreateRequest,
  TaxRegime,
  TaxConcept,
  CompanyScope,
  Equipment,
  ProviderDetailAddress,
  PhoneCode,
  PhoneCodesResponse,
} from './providers';
import { apiEndpoint } from '../../shared/api-endpoint.util';
import { NotificationGatewayService } from '../../core/services/notification-gateway.service';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private phoneCodesCache: PhoneCode[] | null = null;

  constructor(
    private http: HttpClient,
    private notifications: NotificationGatewayService
  ) {
    // El interceptor authInterceptor se encarga de agregar el token automáticamente
  }

  // Obtener códigos telefónicos internacionales
  getPhoneCodes(): Observable<PhoneCode[]> {
    if (this.phoneCodesCache) {
      return of(this.phoneCodesCache);
    }

    return this.http.get<PhoneCodesResponse>(apiEndpoint('v2/company/meta/phone-codes')).pipe(
      map((response) => response.data || []),
      tap((data) => {
        this.phoneCodesCache = data;
      })
    );
  }

  // CRUD principal para Providers
  createProvider(payload: ProviderCreateRequest): Observable<any> {
    return this.http.post<any>(apiEndpoint('company/providers'), payload).pipe(
      tap((resp: any) => {
        const id = resp?.id ?? resp?.data?.id;
        if (id) {
          this.notifications
            .emitEvent('providers', 'create', Number(id), {
              request: payload,
              response: resp,
            })
            .subscribe();
        }
      })
    );
  }

  getProviders(): Observable<ProvidersListResponse> {
    return this.http.get<ProvidersListResponse>(
      apiEndpoint('company/providers')
    );
  }

  getProvider(id: number): Observable<ProviderFullResponse> {
    return this.http.get<ProviderFullResponse>(
      apiEndpoint(`v2/company/providers/${id}`)
    );
  }

  deleteProvider(id: number): Observable<any> {
    return this.http.delete(apiEndpoint(`v2/company/providers/${id}`)).pipe(
      tap((resp: any) => {
        this.notifications
          .emitEvent('providers', 'delete', Number(id), { response: resp })
          .subscribe();
      })
    );
  }

  // Métodos auxiliares (comparten endpoints con customers)
  getProviderAddresses(id: number): Observable<ProviderAddress[]> {
    return this.http.get<ProviderAddress[]>(
      apiEndpoint(`company/providers/${id}/addresses`)
    );
  }

  getProviderContacts(id: number): Observable<ProviderContact[]> {
    return this.http.get<ProviderContact[]>(
      apiEndpoint(`company/providers/${id}/contacts`)
    );
  }

  getProviderDocuments(id: number): Observable<ProviderDocument[]> {
    return this.http.get<ProviderDocument[]>(
      apiEndpoint(`company/providers/${id}/documents`)
    );
  }

  getProviderContracts(id: number): Observable<ProviderContract[]> {
    return this.http.get<ProviderContract[]>(
      apiEndpoint(`company/providers/${id}/contracts`)
    );
  }

  getTaxRegimes(): Observable<TaxRegime[]> {
    return this.http.get<TaxRegime[]>(apiEndpoint('v2/tax-regimes/list'));
  }

  getTaxConcepts(): Observable<TaxConcept[]> {
    return this.http.get<TaxConcept[]>(apiEndpoint('v2/tax-concepts/list'));
  }

  getCompanyScopes(): Observable<CompanyScope[]> {
    return this.http.get<CompanyScope[]>(apiEndpoint('v2/company/meta/scopes'));
  }

  // getCompanyScopes(): Observable<CompanyScope[]> {
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${localStorage.getItem('token')}`
  //   });
  //   return this.http.get<CompanyScope[]>(
  //     MainlibraryComponent.server_endpoint('v2/company/meta/scopes'),
  //     { headers }
  //   );
  // }

  getEquipments(searchTerm: string = ''): Observable<Equipment[]> {
    const body = searchTerm ? { searchLikeEquipment: searchTerm } : {};
    return this.http.post<Equipment[]>(apiEndpoint('equipments/list'), body);
  }

  getAddressByZipcode(zipcode: string): Observable<any> {
    return this.http.get(apiEndpoint(`direccion/${zipcode}`));
  }

  // Método de actualización usando el endpoint legacy company/{id}
  updateProviderLegacy(id: number, payload: any): Observable<any> {
    return this.http.put<any>(
      apiEndpoint(`v2/company/providers/${id}`),
      payload
    );
  }

  // Eliminar contacto
  deleteContact(contactId: number): Observable<any> {
    return this.http.delete(apiEndpoint(`v2/contacts/delete/${contactId}`));
  }
  // Agregar contacto
  createContact(contact: any): Observable<any> {
    return this.http.post(apiEndpoint(`v2/contacts/create`), contact);
  }
  // Actualizar contacto
  updateContact(contact: any): Observable<any> {
    return this.http.put(
      apiEndpoint(`v2/contacts/update/${contact.id}`),
      contact
    );
  }

  // Eliminar dirección
  deleteAddress(addressId: number): Observable<any> {
    return this.http.delete(apiEndpoint(`address/delete/${addressId}`));
  }

  // List Scope Types
  listScopeTypes(): Observable<any> {
    return this.http.get<any>(apiEndpoint('company/meta/scopes'));
  }

  // Actualizar dirección
  updateAddress(
    providerId: number,
    address: ProviderDetailAddress
  ): Observable<any> {
    return this.http.put(apiEndpoint(`address/update/${address.id}`), address);
  }

  // Crear dirección
  createAddress(
    providerId: number,
    address: ProviderDetailAddress
  ): Observable<any> {
    return this.http.post(apiEndpoint(`address/create`), {
      ...address,
      providerId,
    });
  }

  deleteContactAddress(selectedAddress: number): Observable<any> {
    return this.http.delete(
      apiEndpoint(`address/contact/delete/${selectedAddress}`)
    );
  }
  createContactAddress(
    providerId: number,
    addressId: number,
    contact: any
  ): Observable<any> {
    return this.http.post(apiEndpoint(`address/contact/create`), {
      providerId: Number(providerId),
      addressId: addressId,
      ...contact,
    });
  }
  updateContactAddress(
    providerId: number,
    addressId: number,
    contact: any
  ): Observable<any> {
    return this.http.put(apiEndpoint(`address/contact/update/${contact.id}`), {
      providerId: Number(providerId),
      addressId: addressId,
      ...contact,
    });
  }

  // Nuevos métodos para API v2
  createAddressV2(address: any): Observable<any> {
    return this.http.post(apiEndpoint(`v2/address/create`), address);
  }

  updateAddressV2(addressId: number, address: any): Observable<any> {
    return this.http.put(
      apiEndpoint(`v2/address/update/${addressId}`),
      address
    );
  }

  createContactV2(contact: any): Observable<any> {
    return this.http.post(apiEndpoint(`v2/contacts/create`), contact);
  }

  updateContactV2(contactId: number, contact: any): Observable<any> {
    return this.http.put(
      apiEndpoint(`v2/contacts/update/${contactId}`),
      contact
    );
  }

  // Método V2 para eliminar dirección
  deleteAddressV2(addressId: number): Observable<any> {
    return this.http.delete(apiEndpoint(`v2/address/delete/${addressId}`));
  }

  // Método V2 para eliminar contacto
  deleteContactV2(contactId: number): Observable<any> {
    return this.http.delete(apiEndpoint(`v2/contacts/delete/${contactId}`));
  }

  // ==================== CONFIGURACIÓN DE IMPUESTOS ====================

  /**
   * Obtener la configuración de impuestos del proveedor
   */
  getTaxConfiguration(providerId: number): Observable<any> {
    return this.http.get<any>(
      apiEndpoint(`v2/company/providers/${providerId}/tax-configuration`)
    );
  }

  /**
   * Actualizar la configuración de impuestos del proveedor
   */
  updateTaxConfiguration(providerId: number, config: any): Observable<any> {
    return this.http.put<any>(
      apiEndpoint(`v2/company/providers/${providerId}/tax-configuration`),
      config
    );
  }

  /**
   * Calcular impuestos para un monto dado usando la configuración del proveedor
   */
  calculateTaxes(providerId: number, subtotal: number): Observable<any> {
    return this.http.post<any>(
      apiEndpoint(`v2/company/providers/${providerId}/calculate-taxes`),
      { subtotal }
    );
  }

  /**
   * Obtener las reglas de impuestos disponibles
   */
  getTaxRules(): Observable<any> {
    return this.http.get<any>(apiEndpoint('v2/tax-rules'));
  }

  /**
   * Detecta el tipo de persona basándose en la longitud del RFC
   */
  getPersonTypeFromRfc(rfc: string): 'fisica' | 'moral' | null {
    if (!rfc) return null;
    const cleanRfc = rfc.trim().toUpperCase();
    if (cleanRfc.length === 12) return 'moral';
    if (cleanRfc.length === 13) return 'fisica';
    return null;
  }

  /**
   * Obtiene el nombre del tipo de persona
   */
  getPersonTypeName(type: 'fisica' | 'moral'): string {
    return type === 'fisica' ? 'Persona Física' : 'Persona Moral';
  }

  /**
   * Formatea una tasa decimal como porcentaje
   */
  formatRateAsPercentage(rate: number, decimals: number = 2): string {
    return (rate * 100).toFixed(decimals) + '%';
  }
}
