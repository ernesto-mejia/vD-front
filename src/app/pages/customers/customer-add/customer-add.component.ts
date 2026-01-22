import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { CustomerService } from '../customer.service';
import {
  CustomerCreateRequest,
  CompanyCreate,
  ContactCreate,
  AddressCreate,
  ContactAddressCreate,
  MetaOption,
  PhoneCode,
  DocumentCreate,
} from '../customers';
import {
  ZipcodeService,
  ZipcodeFormData,
} from '../../../shared/services/zipcode.service';
import {
  DocumentAttachmentService,
  DocumentType,
} from '../../../shared/services/document-attachment.service';

@Component({
  selector: 'app-customer-add',
  templateUrl: './customer-add.component.html',
  styleUrls: ['./customer-add.component.css'],
})
export class CustomerAddComponent implements OnInit, OnDestroy {
  // Propiedades públicas para el template
  currentStep: number = 1;
  readonly totalSteps: number = 3;
  submitted: boolean = false;
  apiError: boolean = false;
  compania: CompanyCreate = {} as CompanyCreate;
  contacto: ContactCreate = {} as ContactCreate;
  direccion: AddressCreate = {} as AddressCreate;
  contacto_address: ContactAddressCreate = {} as ContactAddressCreate;

  private destroy$ = new Subject<void>();

  companyTypes: MetaOption[] = [];
  companyScopes: MetaOption[] = [];
  phoneCodes: PhoneCode[] = [];

  // Documentos requeridos
  documentTypes: DocumentType[] = [];
  selectedDocumentTypeIds: number[] = [];
  loadingDocumentTypes = false;

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
    private customerService: CustomerService,
    private zipcodeService: ZipcodeService,
    private documentAttachmentService: DocumentAttachmentService
  ) {}

  ngOnInit(): void {
    this.initializeFormData();
    this.loadMetaOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFormData(): void {
    this.compania = {
      company: '',
      shortname: '',
      tax_id: '',
      // clave: '',
      company_type: 'cliente',
      website: '',
      tax_regime: '',
      tax_preferred_concept: '',
      tax_status: '1',
      tax_byrules: '1',
      tax_actofincorporation: '1',
      // company_scope: 'servicios'
    };

    this.contacto = {
      contact_name: '',
      contact_lastname: '',
      contact_lada: '',
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    };

    this.direccion = {
      shortname: '',
      address: '',
      country: 'MX',
      county: '',
      municipality: '',
      city: '',
      state: '',
      zipcode: '',
      street: '',
      outside_number: '',
      inside_number: '',
      colony: '',
      contact_addresses: [],
    };

    this.contacto_address = {
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

  private loadMetaOptions(): void {
    this.customerService
      .getCompanyMetaTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.companyTypes = types;
          if (!this.compania.company_type && this.companyTypes.length) {
            this.compania.company_type = this.companyTypes[0].value;
          }
        },
        error: (error) => {
          console.error('Error al cargar tipos de compañía:', error);
        },
      });

    this.customerService
      .getCompanyMetaScopes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (scopes) => {
          this.companyScopes = scopes;
          if (!this.compania.company_scope && this.companyScopes.length) {
            this.compania.company_scope = this.companyScopes[0].value;
          }
        },
        error: (error) => {
          console.error('Error al cargar alcances de compañía:', error);
        },
      });

    this.customerService
      .getPhoneCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (phoneCodes) => {
          this.phoneCodes = phoneCodes;
        },
        error: (error) => {
          console.error('Error al cargar códigos de teléfono:', error);
        },
      });

    // Cargar tipos de documentos
    this.loadDocumentTypes();
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

  // Métodos de navegación (se mantienen igual)
  goBack(): void {
    this.location.back();
  }

  nextStep(): void {
    this.submitted = true;
    if (!this.validateCurrentStep()) return;

    this.currentStep++;
    this.submitted = false;
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.submitted = false;
    }
  }

  private validateCurrentStep(): boolean {
    const validators: Record<number, () => boolean> = {
      1: () => this.validateStep1(),
      2: () => this.validateStep2(),
      3: () => true, // El paso 3 no requiere validación adicional
    };
    return validators[this.currentStep]?.() ?? true;
  }

  private validateStep1(): boolean {
    const { shortname, company, tax_id, company_type, company_scope } =
      this.compania;
    if (!shortname || !company || !tax_id || !company_type || !company_scope) {
      this.showWarningAlert(
        'Campos Requeridos',
        'Por favor complete los campos obligatorios (Razón Social, Nombre Comercial, RFC, Tipo y Ámbito)'
      );
      return false;
    }
    return true;
  }

  private validateStep2(): boolean {
    const { contact_name, contact_lastname, contact_email } = this.contacto;
    if (!contact_name || !contact_lastname || !contact_email) {
      this.showWarningAlert(
        'Campos Requeridos',
        'Por favor complete los campos obligatorios del contacto'
      );
      return false;
    }
    return true;
  }

  saveNewCustomer(): void {
    this.submitted = true;
    if (!this.validateStep3()) return;

    this.createCustomer();
  }

  private validateStep3(): boolean {
    const { shortname, street, outside_number } = this.direccion;
    if (!shortname || !street || !outside_number) {
      this.showWarningAlert(
        'Campos Requeridos',
        'Por favor complete los campos obligatorios de la dirección'
      );
      return false;
    }
    return true;
  }

  private createCustomer(): void {
    // Construir el payload con la NUEVA estructura
    const payload: CustomerCreateRequest = {
      compania: {
        ...this.compania,
        tax_status: this.compania.tax_status || '1',
        tax_byrules: this.compania.tax_byrules || '1',
        tax_actofincorporation: this.compania.tax_actofincorporation || '1',
      },
      contacts: [
        {
          contact_name: this.contacto.contact_name,
          contact_lastname: this.contacto.contact_lastname,
          contact_lada: this.contacto.contact_lada,
          contact_phone: this.contacto.contact_phone,
          contact_extension: this.contacto.contact_extension,
          contact_email: this.contacto.contact_email,
          contact_job_position: this.contacto.contact_job_position,
          contact_department: this.contacto.contact_department,
        },
      ],
      addresses: [
        {
          shortname: this.direccion.shortname,
          address: this.buildFullAddress(),
          country: this.direccion.country || 'MX',
          county: this.direccion.colony || '',
          municipality: this.direccion.municipality || '',
          city: this.direccion.city,
          state: this.direccion.state,
          zipcode: this.direccion.zipcode,
          street: this.direccion.street,
          outside_number: this.direccion.outside_number,
          inside_number: this.direccion.inside_number,
          contact_addresses: this.contacto_address.contact_name_address
            ? [
                {
                  contact_name_address:
                    this.contacto_address.contact_name_address,
                  contact_lastname_address:
                    this.contacto_address.contact_lastname_address,
                  contact_lada: this.contacto_address.contact_lada,
                  contact_phone: this.contacto_address.contact_phone,
                  contact_extension: this.contacto_address.contact_extension,
                  contact_email: this.contacto_address.contact_email,
                  contact_job_position:
                    this.contacto_address.contact_job_position,
                  contact_department: this.contacto_address.contact_department,
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
      title: 'Creando cliente...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading(null);
      },
    });

    // MODIFICADO: Usar el método createCustomer actualizado
    this.customerService
      .createCustomer(payload)
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
      this.direccion.street,
      this.direccion.outside_number,
      this.direccion.inside_number
        ? `Int. ${this.direccion.inside_number}`
        : null,
      this.direccion.colony,
      this.direccion.municipality,
      this.direccion.city,
      this.direccion.state,
      this.direccion.zipcode,
    ].filter((part) => part && String(part).trim() !== '');

    return parts.join(', ');
  }

  private handleCreateSuccess(response: any): void {
    if (response?.error) {
      this.handleCreateError({ error: response } as HttpErrorResponse);
      return;
    }

    const customerId = response?.data?.id || response?.id;

    setTimeout(() => {
      if (customerId) {
        this.showSuccessAlertWithNavigation(customerId);
      } else {
        this.showSimpleSuccessAlert();
      }
    }, 300);
  }

  private showSuccessAlertWithNavigation(customerId: number): void {
    Swal.fire({
      icon: 'success',
      title: '¡Cliente creado!',
      text: 'El cliente se ha creado correctamente.',
      showCancelButton: true,
      confirmButtonText: 'Ver cliente',
      cancelButtonText: 'Continuar en la lista',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/customers/show', customerId]);
      } else {
        this.router.navigate(['/customers/list']);
      }
    });
  }

  private showSimpleSuccessAlert(): void {
    Swal.fire({
      icon: 'success',
      title: 'Cliente creado',
      text: 'El cliente se creó correctamente.',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6',
    }).then(() => {
      this.router.navigate(['/customers']);
    });
  }

  private handleCreateError(error: HttpErrorResponse): void {
    this.apiError = true;

    setTimeout(() => {
      Swal.fire({
        icon: 'error',
        title: 'Error al crear el cliente',
        html: this.getErrorMessage(error),
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Entendido',
      });
    }, 300);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    // Manejar errores de validación (422)
    if (error.status === 422) {
      const errorData = error.error;
      if (errorData?.errors) {
        const errorList = Object.entries(errorData.errors)
          .map(([field, messages]: [string, any]) => {
            const fieldMessages = Array.isArray(messages)
              ? messages
              : [messages];
            const friendlyField = this.getFriendlyFieldName(field);
            return fieldMessages
              .map(
                (msg: string) => `<li><strong>${friendlyField}:</strong> ${this.getFriendlyErrorMessage(msg, field)}</li>`
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
      const errorData = error.error;
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
      error.error?.message ||
      `Error ${error.status}: Error desconocido al procesar la solicitud. Por favor, inténtelo de nuevo.`
    );
  }

  /**
   * Convierte nombres de campos técnicos a nombres amigables para el usuario
   */
  private getFriendlyFieldName(field: string): string {
    // Manejar campos de direcciones y contactos
    if (field.includes('addresses') && field.includes('contact_addresses')) {
      if (field.includes('contact_email')) {
        return 'Correo electrónico del contacto';
      }
      if (field.includes('contact_name')) {
        return 'Nombre del contacto';
      }
      if (field.includes('contact_phone')) {
        return 'Teléfono del contacto';
      }
      if (field.includes('contact_position')) {
        return 'Puesto del contacto';
      }
    }

    // Manejar campos de direcciones
    if (field.includes('addresses')) {
      if (field.includes('street')) {
        return 'Calle';
      }
      if (field.includes('exterior_number')) {
        return 'Número exterior';
      }
      if (field.includes('interior_number')) {
        return 'Número interior';
      }
      if (field.includes('zipcode')) {
        return 'Código postal';
      }
      if (field.includes('city')) {
        return 'Ciudad';
      }
      if (field.includes('state')) {
        return 'Estado';
      }
      if (field.includes('country')) {
        return 'País';
      }
    }

    // Campos principales
    const fieldMap: { [key: string]: string } = {
      'business_name': 'Razón social',
      'tax_id': 'RFC',
      'email': 'Correo electrónico',
      'phone': 'Teléfono',
      'contact_name': 'Nombre del contacto',
      'contact_email': 'Correo electrónico',
      'contact_phone': 'Teléfono del contacto',
      'contact_position': 'Puesto',
    };

    return fieldMap[field] || field;
  }

  /**
   * Convierte mensajes de error técnicos a mensajes amigables
   */
  private getFriendlyErrorMessage(message: string, field: string): string {
    // Detectar tipo de validación y convertir a mensaje amigable
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('must be a valid email')) {
      return 'Por favor, ingrese un correo electrónico válido (ejemplo: usuario@ejemplo.com)';
    }

    if (lowerMsg.includes('is required') || lowerMsg.includes('field is required')) {
      return 'Este campo es obligatorio';
    }

    if (lowerMsg.includes('must be at least')) {
      const match = message.match(/(\d+)/);
      const length = match ? match[1] : '';
      return `Debe tener al menos ${length} caracteres`;
    }

    if (lowerMsg.includes('must not be greater than')) {
      const match = message.match(/(\d+)/);
      const length = match ? match[1] : '';
      return `No debe exceder los ${length} caracteres`;
    }

    if (lowerMsg.includes('already exists') || lowerMsg.includes('already been taken')) {
      return 'Este valor ya está registrado en el sistema';
    }

    if (lowerMsg.includes('invalid format')) {
      return 'El formato ingresado no es válido';
    }

    if (lowerMsg.includes('must be a number')) {
      return 'Debe ser un número válido';
    }

    // Si no coincide con ningún patrón conocido, devolver el mensaje original
    // pero limpiando el nombre del campo técnico si aparece
    return message.replace(field, '').replace(/^:\s*/, '').trim();
  }

  validateRFC(rfc: string): void {
    if (!rfc) return;

    const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcPattern.test(rfc)) {
      this.showWarningAlert(
        'RFC Inválido',
        'El formato del RFC no es válido. Debe seguir el patrón correcto para personas morales (12 caracteres) o físicas (13 caracteres).'
      );
      this.compania.tax_id = '';
    }
  }

  formatPhone(event: any, field: 'contact_phone' | 'phone_address'): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').substring(0, 10);

    if (field === 'contact_phone') {
      this.contacto.contact_phone = value;
    } else {
      this.contacto_address.contact_phone = value;
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
              this.direccion.country =
                data.country === 'México' ? 'MX' : data.country;
              this.direccion.state = data.state;
              this.direccion.city = data.city;
              this.direccion.municipality = data.municipality;

              // Si solo hay una colonia, seleccionarla automáticamente
              if (data.settlements.length === 1) {
                this.direccion.colony = data.settlements[0];
              } else if (data.settlements.length > 1) {
                // Si hay múltiples, limpiar para que el usuario seleccione
                this.direccion.colony = '';
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

  private showWarningAlert(title: string, text: string): void {
    Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#ffc107',
      confirmButtonText: 'Entendido',
    });
  }

  // Getter para modo lectura
  get ReadOnly(): boolean {
    return false;
  }
}
