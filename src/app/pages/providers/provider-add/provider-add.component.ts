import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../sidebar/sidebar.component';
import { ProviderService } from '../provider.service';
import {
  ProviderCreateRequest,
  CompanyCreate,
  ContactCreate,
  AddressCreate,
  ContactAddressCreate,
  PhoneCode,
  DocumentCreate,
} from '../providers';
import {
  ZipcodeService,
  ZipcodeFormData,
} from '../../../shared/services/zipcode.service';
import {
  DocumentAttachmentService,
  DocumentType,
} from '../../../shared/services/document-attachment.service';

@Component({
  selector: 'app-provider-add',
  templateUrl: './provider-add.component.html',
  styleUrls: ['./provider-add.component.css'],
})
export class ProviderAddComponent implements OnInit, OnDestroy {
  xcompany_scope: any[] = [];
  phoneCodes: PhoneCode[] = [];

  // Documentos requeridos
  documentTypes: DocumentType[] = [];
  selectedDocumentTypeIds: number[] = [];
  loadingDocumentTypes = false;

  private state = {
    submitted: false,
    apiError: false,
    currentStep: 1,
    totalSteps: 3,
    compania: {} as CompanyCreate,
    contacto: {} as ContactCreate,
    direccion: {} as AddressCreate,
    contacto_address: {} as ContactAddressCreate,
  };

  private destroy$ = new Subject<void>();

  // Variables para datos de código postal
  zipcodeData: ZipcodeFormData | null = null;
  loadingZipcode = false;
  settlements: string[] = [];
  hasMultipleSettlements = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private location: Location,
    private providerService: ProviderService,
    private zipcodeService: ZipcodeService,
    private documentAttachmentService: DocumentAttachmentService
  ) {}

  ngOnInit(): void {
    this.initializeFormData();
    this.loadDocumentTypes();
    this.providerService.listScopeTypes().subscribe({
      next: (data: any) => (this.xcompany_scope = data.data),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar alcances de compañía:', err),
    });
    this.providerService.getPhoneCodes().subscribe({
      next: (data: PhoneCode[]) => (this.phoneCodes = data),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar códigos telefónicos:', err),
    });
  }

  private loadDocumentTypes(): void {
    this.loadingDocumentTypes = true;
    this.documentAttachmentService
      .getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.documentTypes = types;
          this.loadingDocumentTypes = false;
        },
        error: (error) => {
          console.error('Error al cargar tipos de documentos:', error);
          this.loadingDocumentTypes = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  addresses: AddressCreate[] = [
    {
      shortname: '',
      address: '',
      country: 'MX',
      county: [],
      municipality: '',
      city: '',
      state: '',
      zipcode: '',
      street: '',
      outside_number: '',
      inside_number: '',
      colony: '',
      contact_addresses: [],
    },
  ];
  contacts: ContactCreate[] = [
    {
      contact_name: '',
      contact_lastname: '',
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    },
  ];
  private initializeFormData(): void {
    this.state.compania = {
      company: '',
      shortname: '',
      tax_id: '',
      // clave: '',
      company_type: '',
      website: '',
      tax_regime: '',
      tax_preferred_concept: '',
      tax_status: '1',
      tax_byrules: '1',
      tax_actofincorporation: '1',
      company_scope: '',
      id_company_scope: [],
    };

    this.state.contacto = {
      contact_name: '',
      contact_lastname: '',
      contact_lada: '',
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    };

    this.state.direccion = {
      shortname: '',
      address: '',
      country: 'MX',
      county: '',
      municipality: '',
      colony: '', // Colonia/asentamiento
      city: '',
      state: '',
      zipcode: '',
      street: '',
      outside_number: '',
      inside_number: '',
      contact_addresses: [],
    };

    this.state.contacto_address = {
      contact_name_address: '',
      contact_lastname_address: '',
      contact_lada: '',
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    };
  }

  goBack(): void {
    this.location.back();
  }

  nextStep(): void {
    this.state.submitted = true;
    if (!this.validateCurrentStep()) return;
    this.state.currentStep++;
    this.state.submitted = false;
  }

  previousStep(): void {
    if (this.state.currentStep > 1) {
      this.state.currentStep--;
      this.state.submitted = false;
    }
  }

  private validateCurrentStep(): boolean {
    const validators = {
      1: () => this.validateStep1(),
      2: () => this.validateStep2(),
    };
    return (
      validators[this.state.currentStep as keyof typeof validators]?.() ?? true
    );
  }

  private validateStep1(): boolean {
    const { shortname, company, tax_id } = this.state.compania;
    if (!shortname || !company || !tax_id) {
      this.showWarningAlert(
        'Campos Requeridos',
        'Por favor complete todos los campos obligatorios (Razón Social, Nombre Comercial y RFC)'
      );
      return false;
    }
    return true;
  }

  private validateStep2(): boolean {
    const { contact_name, contact_lastname, contact_email } =
      this.state.contacto;
    if (!contact_name || !contact_lastname || !contact_email) {
      this.showWarningAlert(
        'Campos Requeridos',
        'Por favor complete los campos obligatorios del contacto'
      );
      return false;
    }
    return true;
  }

  saveNewProvider(): void {
    this.state.submitted = true;
    if (!this.validateStep3()) return;
    this.createProvider();
  }

  private validateStep3(): boolean {
    const { shortname, street, outside_number } = this.state.direccion;
    if (!shortname || !street || !outside_number) {
      this.showWarningAlert(
        'Campos Requeridos',
        'Por favor complete los campos obligatorios de la dirección'
      );
      return false;
    }
    return true;
  }

  private createProvider(): void {
    const payload: ProviderCreateRequest = {
      compania: {
        ...this.state.compania,
        tax_status: this.state.compania.tax_status || '1',
        tax_byrules: this.state.compania.tax_byrules || '1',
        tax_actofincorporation:
          this.state.compania.tax_actofincorporation || '1',
        is_tax_address: 1,
        id_company_scope: Array.isArray(this.state.compania.id_company_scope)
          ? this.state.compania.id_company_scope
          : [this.state.compania.id_company_scope].filter(Boolean),
      },
      contacts: [
        {
          contact_name: this.state.contacto.contact_name,
          contact_lastname: this.state.contacto.contact_lastname,
          contact_lada: this.state.contacto.contact_lada,
          contact_phone: this.state.contacto.contact_phone,
          contact_extension: this.state.contacto.contact_extension,
          contact_email: this.state.contacto.contact_email,
          contact_job_position: this.state.contacto.contact_job_position,
          contact_department: this.state.contacto.contact_department,
        },
      ],
      addresses: [
        {
          shortname: this.state.direccion.shortname,
          address: this.buildFullAddress(),
          country: this.state.direccion.country || 'MX',
          county: this.state.direccion.colony || this.state.direccion.county || '', // Colonia/asentamiento (ej: Valle del Sur)
          municipality: this.state.direccion.municipality || '', // Municipio/Alcaldía (ej: Iztapalapa)
          city: this.state.direccion.city,
          state: this.state.direccion.state,
          zipcode: this.state.direccion.zipcode,
          street: this.state.direccion.street,
          outside_number: this.state.direccion.outside_number,
          inside_number: this.state.direccion.inside_number,
          contact_addresses: this.state.contacto_address.contact_name_address
            ? [
                {
                  contact_name_address:
                    this.state.contacto_address.contact_name_address,
                  contact_lastname_address:
                    this.state.contacto_address.contact_lastname_address,
                  contact_lada: this.state.contacto_address.contact_lada,
                  contact_phone: this.state.contacto_address.contact_phone,
                  contact_extension:
                    this.state.contacto_address.contact_extension,
                  contact_email: this.state.contacto_address.contact_email,
                  contact_job_position:
                    this.state.contacto_address.contact_job_position,
                  contact_department:
                    this.state.contacto_address.contact_department,
                },
              ]
            : [],
        },
      ],
    };

    // Agregar documentos seleccionados al payload
    if (this.selectedDocumentTypeIds.length > 0) {
      payload.documents = this.selectedDocumentTypeIds.map((typeId) => ({
        document_type_id: typeId,
        status: 'incomplete',
        file_url: null,
        description: null,
      }));
    }

    Swal.fire({
      title: 'Creando proveedor...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading(null);
      },
    });

    this.providerService
      .createProvider(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => Swal.close())
      )
      .subscribe({
        next: (response: any) => this.handleCreateSuccess(response),
        error: (error: HttpErrorResponse) => this.handleCreateError(error),
      });
  }

  private buildFullAddress(): string {
    const parts = [
      this.state.direccion.street,
      this.state.direccion.outside_number,
      this.state.direccion.inside_number
        ? `Int. ${this.state.direccion.inside_number}`
        : null,
      this.state.direccion.colony || this.state.direccion.county, // Colonia/asentamiento (ej: Valle del Sur)
      this.state.direccion.municipality, // Municipio/Alcaldía (ej: Iztapalapa)
      this.state.direccion.city,
      this.state.direccion.state,
      this.state.direccion.zipcode,
    ].filter((part) => part && String(part).trim() !== '');

    return parts.join(', ');
  }

  private handleCreateSuccess(response: any): void {
    if (response?.error) {
      this.handleCreateError({ error: response } as HttpErrorResponse);
      return;
    }

    const providerId = response?.data?.id || response?.id;

    setTimeout(() => {
      if (providerId) {
        this.showSuccessAlertWithNavigation(providerId);
      } else {
        this.showSimpleSuccessAlert();
      }
    }, 300);
  }

  private showSuccessAlertWithNavigation(providerId: number): void {
    Swal.fire({
      icon: 'success',
      title: '¡Proveedor creado!',
      text: 'El proveedor se ha creado correctamente.',
      showCancelButton: true,
      confirmButtonText: 'Ver proveedor',
      cancelButtonText: 'Continuar en la lista',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/providers/show', providerId]);
      } else {
        this.router.navigate(['/providers/list']);
      }
    });
  }

  private showSimpleSuccessAlert(): void {
    Swal.fire({
      icon: 'success',
      title: 'Proveedor creado',
      text: 'El proveedor se creó correctamente.',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    }).then(() => {
      this.router.navigate(['/providers']);
    });
  }

  private handleCreateError(error: HttpErrorResponse): void {
    this.state.apiError = true;

    setTimeout(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error al crear el proveedor',
        html: this.getErrorMessage(error),
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Entendido',
      });
    }, 300);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    // Manejar errores de validación (422)
    if (error.status === 422) {
      const errorData = (error as any).error;
      if (errorData?.errors) {
        const errorList = Object.entries(errorData.errors)
          .map(([field, messages]: [string, any]) => {
            const fieldMessages = Array.isArray(messages)
              ? messages
              : [messages];
            return fieldMessages
              .map(
                (msg: string) => `<li><strong>${field}:</strong> ${msg}</li>`
              )
              .join('');
          })
          .join('');
        return `<ul class="text-start mb-0">${errorList}</ul>`;
      }
      if (errorData?.message) {
        return errorData.message;
      }
    }

    // Manejar errores específicos del servidor
    if (error.status === 400 || error.status === 500) {
      const errorData = (error as any).error;
      if (errorData?.message) {
        return errorData.message;
      }
      if (errorData?.error) {
        return typeof errorData.error === 'string'
          ? errorData.error
          : JSON.stringify(errorData.error);
      }
    }

    const errorMessages: { [key: number]: string } = {
      0: 'No se puede conectar con el servidor. Por favor, verifique su conexión.',
      401: 'No tiene autorización para realizar esta acción.',
      403: 'No tiene permisos para realizar esta acción.',
      404: 'El recurso solicitado no fue encontrado.',
      500: 'Error interno del servidor. Por favor, inténtelo más tarde.',
    };

    return (
      errorMessages[error.status] ||
      (error as any).error?.message ||
      `Error ${error.status}: Error desconocido al procesar la solicitud. Por favor, inténtelo de nuevo.`
    );
  }

  validateRFC(rfc: string): void {
    if (!rfc) return;

    const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcPattern.test(rfc)) {
      this.showWarningAlert(
        'RFC Inválido',
        'El formato del RFC no es válido. Debe seguir el patrón correcto para personas morales (12 caracteres) o físicas (13 caracteres).'
      );
      this.state.compania.tax_id = '';
    }
  }

  formatPhone(event: any, field: 'contact_phone' | 'phone_address'): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').substring(0, 10);

    if (field === 'contact_phone') {
      this.state.contacto.contact_phone = value;
    } else {
      this.state.contacto_address.contact_phone = value;
    }

    input.value = value;
  }

  /**
   * Permite solo números en el input
   */
  onlyNumbers(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
  }

  private showWarningAlert(title: string, text: string): void {
    Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#ffc107',
      confirmButtonText: 'Entendido',
    });
  }

  // Manejar cambios en checkboxes de scope
  onScopeChange(scopeValue: number, event: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!this.state.compania.id_company_scope) {
      this.state.compania.id_company_scope = [];
    }

    if (isChecked) {
      if (!this.state.compania.id_company_scope.includes(scopeValue)) {
        this.state.compania.id_company_scope.push(scopeValue);
      }
    } else {
      const index = this.state.compania.id_company_scope.indexOf(scopeValue);
      if (index > -1) {
        this.state.compania.id_company_scope.splice(index, 1);
      }
    }
  }

  /**
   * Maneja el cambio del código postal y consulta la API para obtener datos de la dirección
   */
  onZipcodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const zipcode = input.value?.trim();

    // Limpiar datos anteriores si el código postal cambió
    if (zipcode.length < 5) {
      this.resetZipcodeData();
      return;
    }

    if (zipcode.length === 5 && this.zipcodeService.isValidZipcode(zipcode)) {
      this.loadingZipcode = true;
      this.zipcodeService
        .getAddressByZipcode(zipcode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: ZipcodeFormData | null) => {
            this.loadingZipcode = false;
            if (data) {
              this.zipcodeData = data;
              this.settlements = data.settlements;
              this.hasMultipleSettlements = data.hasMultipleSettlements;

              // Autocompletar campos
              this.state.direccion.country =
                data.country === 'México' ? 'MX' : data.country;
              this.state.direccion.state = data.state;
              this.state.direccion.city = data.city;
              this.state.direccion.municipality = data.municipality; // Municipio/Alcaldía (ej: Iztapalapa)

              // Si solo hay una colonia, seleccionarla automáticamente
              if (data.settlements.length === 1) {
                this.state.direccion.colony = data.settlements[0]; // Colonia (ej: Valle del Sur)
                this.state.direccion.county = data.settlements[0]; // También en county para compatibilidad
              } else if (data.settlements.length > 1) {
                // Si hay múltiples, limpiar para que el usuario seleccione
                this.state.direccion.colony = '';
                this.state.direccion.county = '';
              }
            } else {
              this.resetZipcodeData();
            }
          },
          error: () => {
            this.loadingZipcode = false;
            this.resetZipcodeData();
          },
        });
    }
  }

  /**
   * Reinicia los datos del código postal
   */
  private resetZipcodeData(): void {
    this.zipcodeData = null;
    this.settlements = [];
    this.hasMultipleSettlements = false;
  }

  // Verificar si un scope está seleccionado
  isScopeChecked(scopeValue: number): boolean {
    return this.state.compania.id_company_scope?.includes(scopeValue) || false;
  }

  // Getters para el template
  get submitted(): boolean {
    return this.state.submitted;
  }
  get ReadOnly(): boolean {
    return false;
  }
  get apiError(): boolean {
    return this.state.apiError;
  }
  get currentStep(): number {
    return this.state.currentStep;
  }
  get totalSteps(): number {
    return this.state.totalSteps;
  }
  get compania(): CompanyCreate {
    return this.state.compania;
  }
  get contacto(): ContactCreate {
    return this.state.contacto;
  }
  get direccion(): AddressCreate {
    return this.state.direccion;
  }
  get contacto_address(): ContactAddressCreate {
    return this.state.contacto_address;
  }

  // Gestión dinámica de Direcciones
  addAddress(): void {
    this.addresses.push({
      shortname: '',
      address: '',
      country: 'MX',
      county: '',
      city: '',
      state: '',
      zipcode: '',
      street: '',
      outside_number: '',
      inside_number: '',
      contact_addresses: [],
    });
  }

  removeAddress(index: number): void {
    if (this.addresses.length > 1) {
      this.addresses.splice(index, 1);
    }
  }
  addContactToAddress(addrIndex: number): void {
    if (!this.addresses[addrIndex].contact_addresses) {
      this.addresses[addrIndex].contact_addresses = [];
    }
    this.addresses[addrIndex].contact_addresses.push({
      contact_name_address: '',
      contact_lastname_address: '',
      contact_phone: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    });
  }

  removeContactFromAddress(addrIndex: number, contactIndex: number): void {
    const list = this.addresses[addrIndex].contact_addresses;
    if (list && list.length > 0) {
      list.splice(contactIndex, 1);
    }
  }

  // Formateadores de teléfono
  private sanitizePhone(val: string): string {
    return (val || '').replace(/[^\d+()\-\s]/g, '');
  }

  formatPhoneContact(event: any, index: number): void {
    const input = event.target;
    const value = this.sanitizePhone(input.value);
    this.contacts[index].contact_phone = value;
    input.value = value;
  }

  formatPhoneAddressContact(
    event: any,
    addrIndex: number,
    contactIndex: number
  ): void {
    const input = event.target;
    const value = this.sanitizePhone(input.value);
    if (
      this.addresses[addrIndex].contact_addresses &&
      this.addresses[addrIndex].contact_addresses[contactIndex]
    ) {
      this.addresses[addrIndex].contact_addresses[contactIndex].contact_phone =
        value;
    }
    input.value = value;
  }
}
