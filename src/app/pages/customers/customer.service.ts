import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Customer,
  CustomerFullResponse,
  CustomerDetailResponse,
  CustomersListResponse,
  CustomerCreateRequest,
  CustomerDeleteResponse,
  CustomerContact,
  CustomerContactForm,
  CustomerAddress,
  ContactAddress,
  ContactCreatePayload,
  ContactResponse,
  ContactDeleteResponse,
  ContactApiData,
  MetaOption,
  MetaOptionsResponse,
  TaxRegime,
  TaxConcept,
  Equipment,
  PhoneCode,
  PhoneCodesResponse,
} from './customers';
import { apiEndpoint } from '../../shared/api-endpoint.util';
import { NotificationGatewayService } from '../../core/services/notification-gateway.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private metaTypesCache: MetaOption[] | null = null;
  private metaScopesCache: MetaOption[] | null = null;
  private taxRegimesCache: TaxRegime[] | null = null;
  private taxConceptsCache: TaxConcept[] | null = null;
  private phoneCodesCache: PhoneCode[] | null = null;
  private readonly customersBasePath = 'v2/company/clients';
  private readonly contactsBasePath = 'v2/contacts';

  constructor(private http: HttpClient, private notifications: NotificationGatewayService) {
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

  // ==================== MÉTODOS MODIFICADOS (SIMPLIFICADOS) ====================

  createCustomer(payload: CustomerCreateRequest): Observable<any> {
    return this.http.post<any>(apiEndpoint(this.customersBasePath), payload).pipe(
      tap((resp: any) => {
        const id = resp?.id ?? resp?.data?.id;
        if (id) {
          this.notifications.emitEvent('customers', 'create', Number(id), { request: payload, response: resp }).subscribe();
        }
      })
    );
  }

  getCustomers(): Observable<CustomersListResponse> {
    return this.http.get<CustomersListResponse>(apiEndpoint(this.customersBasePath));
  }

  getCustomer(id: number): Observable<CustomerFullResponse> {
    return this.http.get<CustomerFullResponse>(apiEndpoint(`${this.customersBasePath}/${id}`));
  }

  getCustomerDetail(id: number): Observable<CustomerDetailResponse> {
    return this.http.get<CustomerDetailResponse>(apiEndpoint(`${this.customersBasePath}/${id}`));
  }

  deleteCustomer(id: number): Observable<CustomerDeleteResponse> {
    return this.http.delete<CustomerDeleteResponse>(
      apiEndpoint(`${this.customersBasePath}/${id}`)
    ).pipe(
      tap((resp) => {
        this.notifications.emitEvent('customers', 'delete', Number(id), { response: resp }).subscribe();
      })
    );
  }

  // ==================== MÉTODOS AUXILIARES (MANTENER) ====================

  getTaxRegimes(): Observable<TaxRegime[]> {
    if (this.taxRegimesCache) {
      return of(this.taxRegimesCache);
    }

    return this.http.get<any>(apiEndpoint('v2/tax-regimes/list')).pipe(
      map((response) => {
        // Si la respuesta es un array directamente, usarlo
        // Si tiene una propiedad 'data', usar esa propiedad
        const data = Array.isArray(response) ? response : response?.data ?? [];
        return data;
      }),
      tap((data) => {
        this.taxRegimesCache = data;
      })
    );
  }

  getTaxConcepts(): Observable<TaxConcept[]> {
    if (this.taxConceptsCache) {
      return of(this.taxConceptsCache);
     }

    return this.http.get<any>(apiEndpoint('v2/tax-concepts/list')).pipe(
      map((response) => {
        const data = Array.isArray(response) ? response : response?.data ?? [];
        return data;
      }),
      tap((data) => {
        this.taxConceptsCache = data;
      })
    );
  }

  getCompanyMetaTypes(): Observable<MetaOption[]> {
    if (this.metaTypesCache) {
      return of(this.metaTypesCache);
    }

    return this.http
      .get<MetaOptionsResponse>(apiEndpoint('company/meta/types'))
      .pipe(
        map((response) => response?.data ?? []),
        tap((data) => {
          this.metaTypesCache = data;
        })
      );
  }

  getCompanyMetaScopes(): Observable<MetaOption[]> {
    if (this.metaScopesCache) {
      return of(this.metaScopesCache);
    }

    return this.http
      .get<MetaOptionsResponse>(apiEndpoint('company/meta/scopes'))
      .pipe(
        map((response) => response?.data ?? []),
        tap((data) => {
          this.metaScopesCache = data;
        })
      );
  }

  getEquipments(searchTerm: string = ''): Observable<Equipment[]> {
    const body = searchTerm ? { searchLikeEquipment: searchTerm } : {};
    return this.http.post<Equipment[]>(apiEndpoint('equipments/list'), body);
  }

  getAddressByZipcode(zipcode: string): Observable<any> {
    return this.http.get(apiEndpoint(`direccion/${zipcode}`));
  }

  updateCustomer(id: number, payload: any): Observable<any> {
    return this.http.put<any>(
      apiEndpoint(`${this.customersBasePath}/${id}`),
      payload
    );
  }

  createContact(
    customerId: number,
    contact: CustomerContactForm
  ): Observable<CustomerContact> {
    const payload = this.buildContactPayload(customerId, contact);

    return this.http
      .post<ContactResponse>(
        apiEndpoint(`${this.contactsBasePath}/create`),
        payload
      )
      .pipe(map((response) => this.mapContactResponse(response)));
  }

  getContact(contactId: number): Observable<CustomerContact> {
    return this.http
      .get<ContactResponse>(
        apiEndpoint(`${this.contactsBasePath}/view/${contactId}`)
      )
      .pipe(map((response) => this.mapContactResponse(response)));
  }

  updateContact(
    contactId: number,
    customerId: number,
    contact: CustomerContactForm
  ): Observable<CustomerContact> {
    const payload = this.buildContactPayload(customerId, contact);

    return this.http
      .put<ContactResponse>(
        apiEndpoint(`${this.contactsBasePath}/update/${contactId}`),
        payload
      )
      .pipe(map((response) => this.mapContactResponse(response)));
  }

  deleteContact(contactId: number): Observable<ContactDeleteResponse> {
    return this.http.delete<ContactDeleteResponse>(
      apiEndpoint(`${this.contactsBasePath}/delete/${contactId}`)
    );
  }

  // ==================== MÉTODOS LEGACY DE NORMALIZACIÓN (DEPRECADOS) ====================

  deleteAddress(addressId: number): Observable<any> {
    return this.http.delete(apiEndpoint(`address/delete/${addressId}`));
  }

  updateAddress(customerId: number, address: CustomerAddress): Observable<any> {
    const addressId = address.id ?? address.id_address;

    if (!addressId || addressId === 0) {
      throw new Error(
        'La dirección seleccionada no tiene un identificador válido'
      );
    }

    return this.http.put(apiEndpoint(`v2/address/update/${addressId}`), {
      customerId: Number(customerId),
      ...address,
    });
  }

  createAddress(customerId: number, address: CustomerAddress): Observable<any> {
    return this.http.post(apiEndpoint('v2/address/create'), {
      customerId: Number(customerId),
      ...address,
    });
  }

  deleteContactAddress(contactId: number): Observable<any> {
    return this.http.delete(apiEndpoint(`v2/contacts/delete/${contactId}`));
  }

  createContactAddress(contact: ContactAddress): Observable<any> {
    const payload = this.buildAddressContactPayload(contact);

    return this.http.post(apiEndpoint('v2/contacts/create'), payload);
  }

  updateContactAddress(contact: ContactAddress): Observable<any> {
    if (!contact.id) {
      throw new Error('El contacto debe incluir un id para actualizarse');
    }

    const payload = this.buildAddressContactPayload(contact);

    return this.http.put(
      apiEndpoint(`v2/contacts/update/${contact.id}`),
      payload
    );
  }

  private buildAddressContactPayload(
    contact: ContactAddress
  ): Record<string, unknown> {
    const parentId = this.parseNumber(contact.parent_id ?? contact.id_parent);

    if (!parentId) {
      throw new Error(
        'El contacto debe incluir un identificador de dirección válido'
      );
    }

    return {
      parent_table: contact.parent_table ?? 'addresses',
      parent_id: parentId,
      contact_name: this.toString(contact.contact_name),
      contact_lastname: this.toString(contact.contact_lastname),
      contact_lastname2: this.optionalString(contact.contact_lastname2),
      contact_lada: this.optionalString(contact.contact_lada),
      contact_phone: this.optionalString(contact.contact_phone),
      contact_extension: this.optionalString(contact.contact_extension),
      contact_email: this.optionalString(contact.contact_email),
      contact_job_position: this.optionalString(contact.contact_job_position),
      contact_department: this.optionalString(contact.contact_department),
      contact_name_address: this.toString(contact.contact_name),
      contact_lastname_address: this.toString(contact.contact_lastname),
    };
  }

  private buildContactPayload(
    customerId: number,
    contact: CustomerContactForm
  ): ContactCreatePayload {
    return {
      parent_table: 'companies',
      parent_id: customerId,
      contact_name: contact.contact_name,
      contact_lastname: contact.contact_lastname,
      contact_lastname2: contact.contact_lastname2 || undefined,
      contact_lada: contact.contact_lada || undefined,
      contact_phone: contact.phone || undefined,
      contact_extension: contact.contact_extension || undefined,
      contact_email: contact.email || undefined,
      contact_job_position: contact.job_position || undefined,
      contact_department: contact.contact_department || undefined,
    };
  }

  private mapContactResponse(response: ContactResponse): CustomerContact {
    if (!response?.data) {
      throw new Error('Respuesta de contacto inválida');
    }
    return this.mapContactData(response.data);
  }

  private mapContactData(data: ContactApiData): CustomerContact {
    return {
      id_contact: data.id,
      contact_name: data.contact_name,
      contact_lastname: data.contact_lastname,
      contact_lastname2: data.contact_lastname2 || undefined,
      contact_lada: data.contact_lada || undefined,
      phone: data.contact_phone || undefined,
      contact_extension: data.contact_extension || undefined,
      email: data.contact_email || undefined,
      job_position: data.contact_job_position || undefined,
      contact_department: data.contact_department || undefined,
    };
  }

  private isNestedPayload(
    payload: unknown
  ): payload is Record<string, unknown> {
    if (!this.isObject(payload)) {
      return false;
    }
    const record = payload as Record<string, unknown>;
    return (
      this.isObject(record['company']) || this.isObject(record['compania'])
    );
  }

  private extractCompanyBlock(
    payload: Record<string, unknown>
  ): Record<string, unknown> | null {
    const block = payload['company'] ?? payload['compania'];
    return this.isObject(block) ? (block as Record<string, unknown>) : null;
  }

  private toString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  private optionalString(value: unknown): string | undefined {
    const result = this.toString(value);
    return result ? result : undefined;
  }

  private parseNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }
}
