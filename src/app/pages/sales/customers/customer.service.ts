import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  TaxAddress,
  Equipment,
} from './customers';
import { apiEndpoint } from '../../../shared/api-endpoint.util';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private metaTypesCache: MetaOption[] | null = null;
  private metaScopesCache: MetaOption[] | null = null;
  private taxRegimesCache: TaxRegime[] | null = null;
  private taxConceptsCache: TaxConcept[] | null = null;
  private readonly customersBasePath = 'v2/company/clients';
  private readonly contactsBasePath = 'v2/contacts';

  /**
   * Devuelve los contactos del cliente (para uso con GenericShowComponent)
   */
  getContacts(customerId: number): Observable<CustomerContact[]> {
    return this.getCustomerDetail(customerId).pipe(
      map((response: any) => response.data?.contacts ?? [])
    );
  }

  /**
   * Devuelve las direcciones del cliente (para uso con GenericShowComponent)
   */
  getAddresses(customerId: number): Observable<CustomerAddress[]> {
    return this.getCustomerDetail(customerId).pipe(
      map((response: any) => response.data?.addresses ?? [])
    );
  }

  constructor(private http: HttpClient) {
    // El interceptor authInterceptor se encarga de agregar el token automáticamente
  }

  // ==================== MÉTODOS MODIFICADOS ====================

  createCustomer(payload: CustomerCreateRequest): Observable<any> {
    return this.http.post<any>(apiEndpoint(this.customersBasePath), payload);
  }

  getCustomers(): Observable<CustomersListResponse> {
    return this.http
      .get<CustomersListResponse>(apiEndpoint(this.customersBasePath))
      .pipe(map((response) => this.normalizeCustomersListResponse(response)));
  }

  getCustomer(id: number): Observable<CustomerFullResponse> {
    return this.http
      .get<any>(apiEndpoint(`${this.customersBasePath}/${id}`))
      .pipe(map((response) => this.normalizeCustomerResponse(response)));
  }

  getCustomerDetail(id: number): Observable<CustomerDetailResponse> {
    return this.http
      .get<any>(apiEndpoint(`${this.customersBasePath}/${id}`))
      .pipe(map((response) => this.normalizeCustomerDetailResponse(response)));
  }

  deleteCustomer(id: number): Observable<CustomerDeleteResponse> {
    return this.http.delete<CustomerDeleteResponse>(
      apiEndpoint(`${this.customersBasePath}/${id}`)
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
        // Si la respuesta es un array directamente, usarlo
        // Si tiene una propiedad 'data', usar esa propiedad
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

  private normalizeCustomersListResponse(
    response: CustomersListResponse
  ): CustomersListResponse {
    const data =
      response.data?.map((customer) => this.normalizeCustomerData(customer)) ??
      [];
    return { ...response, data };
  }

  private normalizeCustomerResponse(response: any): CustomerFullResponse {
    const detail = this.normalizeCustomerDetailResponse(response);
    return {
      ok: detail.ok,
      data: detail.data.compania,
    };
  }

  private normalizeCustomerDetailResponse(
    response: any
  ): CustomerDetailResponse {
    const ok = Boolean(response?.ok ?? true);
    const rawData = response?.data ?? response;

    // LOG: Ver datos crudos recibidos

    if (this.isNestedPayload(rawData)) {
      const record = rawData as Record<string, unknown>;
      const companyBlock = this.extractCompanyBlock(record);
      if (!companyBlock) {
        throw new Error('La compañía no tiene información asociada');
      }

      const compania = this.mapCompany(companyBlock);
      const contacts = this.mapContacts(record['contacts']);
      const tax_address =
        this.mapTaxAddress(record['tax_address']) ?? undefined;
      const addresses = this.mapAddresses(record['addresses']);

      return {
        ok,
        data: {
          compania,
          contacts,
          tax_address,
          addresses,
        },
      };
    }

    const compania = this.mapCompany(rawData);
    // LOG: Fallback sin datos anidados
    console.warn(
      '[normalizeCustomerDetailResponse] Fallback, datos planos:',
      rawData
    );
    return {
      ok,
      data: {
        compania,
        contacts: [],
        addresses: [],
        //documents: [],
        //contracts: [],
        tax_address: {} as TaxAddress,
      },
    };
  }

  private normalizeCustomerData(
    customer: Customer | Record<string, unknown>
  ): Customer {
    return this.mapCompany(customer);
  }

  private mapCompany(companyRaw: unknown): Customer {
    const source = this.isObject(companyRaw) ? companyRaw : {};

    return {
      id:
        this.parseNumber(
          source['id'] ?? source['id_company'] ?? source['company_id']
        ) ?? 0,
      shortname:
        this.optionalString(source['shortname'] ?? source['nombre_corto']) ||
        '',
      company:
        this.toString(source['company'] ?? source['nombre_fiscal']) ||
        'Sin compañía',
      tax_id: this.toString(source['tax_id'] ?? source['rfc']) || '',
      other_id: this.optionalString(source['other_id'] ?? source['clave']),
      company_type: this.toString(source['company_type']) || '',
      website: this.optionalString(source['website']),
      tax_regime: this.optionalString(source['tax_regime']),
      tax_preferred_concept: this.optionalString(
        source['tax_preferred_concept']
      ),
      tax_status: this.toBooleanFlag(source['tax_status']),
      tax_byrules: this.toBooleanFlag(source['tax_byrules']),
      tax_actofincorporation: this.toBooleanFlag(
        source['tax_actofincorporation']
      ),
      company_scope: this.optionalString(source['company_scope']),
      company_procurement_status_id: this.parseNumber(
        source['company_procurement_status_id']
      ),
    };
  }

  private mapTaxAddress(taxAddressRaw: unknown): TaxAddress | null {
    if (!this.isObject(taxAddressRaw)) {
      return null;
    }

    const raw = taxAddressRaw as Record<string, unknown>;

    return {
      street: this.toString(raw['street']) || '',
      outside_number: this.toString(raw['outside_number']) || '',
      inside_number: this.toString(raw['inside_number']) || '',
      city: this.toString(raw['city']) || '',
      state: this.toString(raw['state']) || '',
      zipcode: this.toString(raw['zipcode']) || '',
      country: this.toString(raw['country']) || '',
      id: this.parseNumber(raw['id'] ?? raw['id_tax_address']) ?? 0,
      shortname: this.toString(raw['shortname']) || '',
      address: this.toString(raw['address']) || '',
      is_tax_address: true,
    };
  }

  private mapContacts(contactsRaw: unknown): CustomerContact[] {
    if (!Array.isArray(contactsRaw)) {
      return [];
    }

    return contactsRaw.map((contact, index) => {
      const raw = this.isObject(contact) ? contact : {};
      const id = this.parseNumber(raw['id_contact'] ?? raw['id']) ?? index + 1;

      return {
        id_contact: id,
        contact_name: this.toString(raw['contact_name']),
        contact_lastname: this.toString(raw['contact_lastname']),
        contact_lastname2: this.optionalString(raw['contact_lastname2']),
        contact_lada: this.optionalString(raw['contact_lada']),
        phone: this.optionalString(raw['phone'] ?? raw['contact_phone']),
        contact_extension: this.optionalString(raw['contact_extension'] ?? raw['extension']),
        email: this.optionalString(raw['email'] ?? raw['contact_email']),
        job_position: this.optionalString(
          raw['job_position'] ?? raw['contact_job_position']
        ),
        contact_department: this.optionalString(raw['contact_department']),
      };
    });
  }

  private mapAddresses(addressesRaw: unknown): CustomerAddress[] {
    if (!Array.isArray(addressesRaw)) {
      return [];
    }

    return addressesRaw.map((address, index) => {
      const raw = this.isObject(address) ? address : {};
      const id = this.parseNumber(raw['id_address'] ?? raw['id']) ?? index + 1;
      const contacts = this.mapAddressContacts(raw['contact_addresses']);
      const primaryContact = this.pickAddressContact(contacts);
      const legacyContactName = this.optionalString(raw['contact_name']);
      const legacyContactLastname = this.optionalString(
        raw['contact_lastname']
      );
      const legacyContactLastname2 = this.optionalString(
        raw['contact_lastname2']
      );
      const legacyPhone = this.optionalString(raw['phone']);
      const legacyEmail = this.optionalString(raw['email']);
      const legacyJob = this.optionalString(raw['job_position']);
      const legacyDepartment = this.optionalString(raw['contact_department']);

      return {
        id_address: id,
        id,
        shortname: this.toString(raw['shortname']) || 'Sin nombre',
        address:
          this.toString(raw['address']) ||
          this.composeAddress(raw) ||
          'Sin información',
        country: this.toString(raw['country']),
        county: this.toString(raw['county']),
        city: this.toString(raw['city']),
        state: this.toString(raw['state']),
        zipcode: this.toString(raw['zipcode']),
        street: this.toString(raw['street']),
        outside_number: this.toString(raw['outside_number']),
        inside_number: this.toString(raw['inside_number']),
        contact_addresses: contacts,
        contact_name: primaryContact?.contact_name ?? legacyContactName,
        contact_lastname:
          primaryContact?.contact_lastname ?? legacyContactLastname,
        contact_lastname2: legacyContactLastname2,
        phone: primaryContact?.contact_phone ?? legacyPhone,
        email: primaryContact?.contact_email ?? legacyEmail,
        job_position: primaryContact?.contact_job_position ?? legacyJob,
        contact_department:
          primaryContact?.contact_department ?? legacyDepartment,
        equipment: this.optionalString(raw['equipment']),
        id_equipment: this.parseNumber(raw['id_equipment']),
      };
    });
  }

  private mapAddressContacts(contactRaw: unknown): ContactAddress[] {
    if (!Array.isArray(contactRaw)) {
      return [];
    }

    return contactRaw.map((contact) => {
      const raw = this.isObject(contact) ? contact : {};
      return {
        id: this.parseNumber(raw['id']),
        parent_id: this.parseNumber(raw['parent_id'] ?? raw['id_parent']),
        parent_table: this.optionalString(raw['parent_table']) ?? 'addresses',
        contact_name: this.toString(
          raw['contact_name_address'] ?? raw['contact_name']
        ),
        contact_lastname: this.toString(
          raw['contact_lastname_address'] ?? raw['contact_lastname']
        ),
        contact_lastname2: this.optionalString(
          raw['contact_lastname2_address'] ?? raw['contact_lastname2']
        ),
        contact_lada: this.optionalString(raw['contact_lada']),
        contact_phone: this.optionalString(
          raw['contact_phone'] ?? raw['phone']
        ),
        contact_extension: this.optionalString(
          raw['contact_extension'] ?? raw['extension']
        ),
        contact_email: this.optionalString(
          raw['contact_email'] ?? raw['email']
        ),
        contact_job_position: this.optionalString(
          raw['contact_job_position'] ?? raw['job_position']
        ),
        contact_department: this.optionalString(raw['contact_department']),
      };
    });
  }

  private pickAddressContact(
    contacts: ContactAddress[]
  ): ContactAddress | null {
    if (!contacts.length) {
      return null;
    }
    return contacts[0];
  }

  private composeAddress(
    addressRaw: Record<string, unknown>
  ): string | undefined {
    const street = this.toString(addressRaw['street']);
    const outside = this.toString(addressRaw['outside_number']);
    const inside = this.toString(addressRaw['inside_number']);
    const city = this.toString(addressRaw['city']);
    const state = this.toString(addressRaw['state']);
    const zipcode = this.toString(addressRaw['zipcode']);

    const parts = [
      street,
      outside,
      inside ? `Int. ${inside}` : undefined,
      city,
      state,
      zipcode,
    ].filter(Boolean) as string[];

    if (parts.length === 0) {
      return undefined;
    }

    return parts.join(', ');
  }

  private toBooleanFlag(value: unknown): boolean | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return (
        normalized === '1' ||
        normalized === 'true' ||
        normalized === 'si' ||
        normalized === 'sí'
      );
    }
    return Boolean(value);
  }

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
      contact_phone: this.optionalString(contact.contact_phone),
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
