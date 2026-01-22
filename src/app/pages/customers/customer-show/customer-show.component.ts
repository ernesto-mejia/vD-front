import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, finalize, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { CustomerService } from '../../../pages/customers/customer.service';
import { DocumentAttachmentService, DocumentAttachment } from '../../../shared/services/document-attachment.service';
import {
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerContract,
  CustomerDetailResponse,
  CustomerDocument,
  MetaOption,
  ContactAddress,
  TaxAddress,
  PhoneCode
} from '../customers';

type TabType = 'info' | 'contacts' | 'addresses' | 'taxData' | 'documents' | 'contracts';
@Component({
  selector: 'app-customer-show',
  templateUrl: './customer-show.component.html',
  styleUrl: './customer-show.component.css'
})
export class CustomerShowComponent implements OnInit, OnDestroy {
  loading = true;
  compania: Customer | null = null;
  contactos: CustomerContact[] = [];
  taxAddress: TaxAddress = {} as TaxAddress;
  direcciones: CustomerAddress[] = [];
  documentos: CustomerDocument[] = [];
  contratos: CustomerContract[] = [];

  companyTypes: MetaOption[] = [];
  companyScopes: MetaOption[] = [];
  companyTypeLabel = '';
  companyScopeLabel = '';

  xtax_regimes: any[] = [];
  xtax_concepts: any[] = [];
  phoneCodes: PhoneCode[] = [];

  // Documentos de cumplimiento
  requiredDocuments: DocumentAttachment[] = [];
  loadingDocuments = false;

  customerId = '';
  activeTab: TabType = 'info';

  showAddressModal = false;
  showContactModal = false;
  selectedAddress: CustomerAddress | null = null;
  selectedContact: ContactAddress | null = null;
  modalMode: 'view' | 'edit' | 'create' = 'view';

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly customerService: CustomerService,
    private readonly documentAttachmentService: DocumentAttachmentService,
    private readonly router: Router,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el componente y carga los datos
   */
  private initializeComponent(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.customerId = params['id'];
          if (this.customerId) {
            this.loadDropdownData();
            this.loadCustomerData();
          } else {
            this.handleError('ID de cliente no válido');
          }
        },
        error: (error) => {
          console.error('Error al obtener parámetros de ruta:', error);
          this.handleError('Error al cargar los datos del cliente');
        }
      });
  }

  /**
   * Muestra alerta de carga
   */
  private showLoading(): void {
    this.loading = true;
    Swal.fire({
      title: 'Cargando...',
      text: 'Obteniendo información del cliente',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      }
    });
  }

  /**
   * Oculta alerta de carga
   */
  private hideLoading(): void {
    this.loading = false;
    Swal.close();
  }

  /**
   * Carga los datos del cliente desde la API usando el servicio
   */
  loadCustomerData(): void {
    this.showLoading();

    this.customerService.getCustomerDetail(Number(this.customerId))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.hideLoading())
      )
      .subscribe({
        next: (response: CustomerDetailResponse) => this.handleSuccessResponse(response),
        error: (error: HttpErrorResponse) => this.handleErrorResponse(error)
      });


  }

  /**
   * Maneja la respuesta exitosa de la API, SE PUEDE HACER CONSOLE AQUI
   */
  private handleSuccessResponse(response: CustomerDetailResponse): void {
    if (!response || !response.ok || !response.data) {
      this.handleError('Datos de cliente no válidos');
      return;
    }

    const detail = response.data;

    if (!detail?.compania) {
      this.handleError('La compañía no tiene información asociada');
      return;
    }
    this.compania = detail.compania;
    // Mapear los contactos de la API al formato esperado por la interfaz CustomerContact
    this.contactos = (detail.contacts ?? []).map((c: any) => this.mapContactFromApi(c));
    this.taxAddress = (detail as any).tax_address || [] ;

    // Mapear direcciones y asegurar que county se mapee a colony
    this.direcciones = (detail.addresses ?? []).map((addr: any) => ({
      ...addr,
      colony: addr.colony || addr.county || ''
    }));

    // Debug: ver la estructura de los contactos de dirección
    if (this.direcciones.length > 0 && this.direcciones[0].contact_addresses) {
      console.log('Contactos de dirección:', this.direcciones[0].contact_addresses);
    }    this.syncSelectedAddress(this.direcciones);
    // this.documentos = detail.documents ?? [];
    // this.contratos = detail.contracts ?? [];

    // Cargar documentos de cumplimiento desde el response
    this.loadDocumentAttachments(detail);
  }

  /**
   * Carga los documentos de cumplimiento - primero intenta del response, luego de API
   */
  private loadDocumentAttachments(detail?: any): void {
    // Si el response incluye documents, usarlos directamente
    if (detail?.documents && Array.isArray(detail.documents) && detail.documents.length > 0) {
      this.requiredDocuments = detail.documents.map((doc: any) => ({
        id: doc.id,
        document_type_id: doc.document_type_id,
        document_type: doc.document_type,
        status: doc.status,
        file_url: doc.file_url,
        description: doc.description,
        attachable_type: doc.attachable_type || 'App\\Models\\Company',
        attachable_id: doc.attachable_id || this.compania?.id,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }));
      this.loadingDocuments = false;
      return;
    }

    // Fallback: cargar desde API separada
    if (!this.compania?.id) {
      this.loadingDocuments = false;
      return;
    }

    this.loadingDocuments = true;
    this.documentAttachmentService.getByCompany(this.compania.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents: DocumentAttachment[]) => {
          this.requiredDocuments = documents || [];
          this.loadingDocuments = false;
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al cargar documentos de cumplimiento:', err);
          this.loadingDocuments = false;
        }
      });
  }

  /**
   * Calcula el porcentaje de documentos completados
   */
  getDocumentCompliancePercentage(): number {
    if (this.requiredDocuments.length === 0) return 0;
    const completed = this.requiredDocuments.filter(d => d.status === 'complete').length;
    return Math.round((completed / this.requiredDocuments.length) * 100);
  }

  /**
   * Verifica si todos los documentos están completos
   */
  areAllDocumentsComplete(): boolean {
    return this.requiredDocuments.length > 0 &&
           this.requiredDocuments.every(d => d.status === 'complete');
  }

  /**
   * Mapea un contacto de la API al formato esperado por CustomerContact
   * La API devuelve: id, contact_email, contact_phone, contact_job_position, contact_lada, contact_department
   * La interfaz espera: id_contact, email, phone, job_position, contact_lada, contact_department
   */
  private mapContactFromApi(apiContact: any): CustomerContact {
    return {
      id_contact: apiContact.id ?? apiContact.id_contact ?? 0,
      contact_name: apiContact.contact_name ?? '',
      contact_lastname: apiContact.contact_lastname ?? '',
      contact_lastname2: apiContact.contact_lastname2 ?? undefined,
      contact_lada: apiContact.contact_lada ?? undefined,
      phone: apiContact.contact_phone ?? apiContact.phone ?? undefined,
      contact_extension: apiContact.contact_extension ?? undefined,
      email: apiContact.contact_email ?? apiContact.email ?? undefined,
      job_position: apiContact.contact_job_position ?? apiContact.job_position ?? undefined,
      contact_department: apiContact.contact_department ?? undefined,
    };
  }

  /**
   * Maneja errores de la petición HTTP
   */
  private handleErrorResponse(error: HttpErrorResponse): void {
    console.error('Error al cargar el cliente:', error);

    let errorMessage = 'No se pudo cargar la información del cliente';

    if (error.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
      this.router.navigate(['/login']);
    } else if (error.status === 404) {
      errorMessage = 'Cliente no encontrado';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet';
    }

    this.handleError(errorMessage);
  }

  /**
   * Muestra mensaje de error al usuario
   */
  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0d6efd'
    });
  }

  /**
   * Carga los datos de los dropdowns (regímenes fiscales, conceptos, etc.)
   */
  private loadDropdownData(): void {
    // Cargar regímenes fiscales
    this.customerService.getTaxRegimes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.xtax_regimes = data;
        },
        error: (error: any) => {
          console.error('Error al cargar regímenes fiscales:', error);
        }
      });

    // Cargar conceptos fiscales
    this.customerService.getTaxConcepts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.xtax_concepts = data;
        },
        error: (error: any) => {
          console.error('Error al cargar conceptos fiscales:', error);
        }
      });

    // Cargar códigos de teléfono
    this.customerService.getPhoneCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (phoneCodes) => {
          this.phoneCodes = phoneCodes;
        },
        error: (error: any) => {
          console.error('Error al cargar códigos de teléfono:', error);
        }
      });
  }

  /**
   * Obtiene el texto del régimen fiscal a partir del objeto TaxDisplayOption
   */
  getTaxRegimeText(taxRegime: any): string {
    if (!taxRegime) return 'No especificado';

    // Nueva estructura: objeto con id y display
    if (typeof taxRegime === 'object' && taxRegime.display) {
      return taxRegime.display;
    }

    // Legacy: si es un ID numérico, buscar en la lista
    if (typeof taxRegime === 'number' || (typeof taxRegime === 'string' && !isNaN(Number(taxRegime)))) {
      const regime = this.xtax_regimes.find(r => r.id === Number(taxRegime));
      return regime ? `${regime.tax_regime} - ${regime.description || ''}`.trim() : 'No especificado';
    }

    // Si es un string (legacy), devolverlo directamente
    if (typeof taxRegime === 'string') {
      return taxRegime;
    }

    return 'No especificado';
  }

  /**
   * Obtiene el texto del concepto fiscal a partir del objeto TaxDisplayOption
   */
  getTaxConceptText(taxConcept: any): string {
    if (!taxConcept) return 'No especificado';

    // Nueva estructura: objeto con id y display
    if (typeof taxConcept === 'object' && taxConcept.display) {
      return taxConcept.display;
    }

    // Legacy: si es un ID numérico, buscar en la lista
    if (typeof taxConcept === 'number' || (typeof taxConcept === 'string' && !isNaN(Number(taxConcept)))) {
      const concept = this.xtax_concepts.find(c => c.id === Number(taxConcept));
      return concept ? `${concept.tax_concept} - ${concept.description || ''}`.trim() : 'No especificado';
    }

    // Si es un string (legacy), devolverlo directamente
    if (typeof taxConcept === 'string') {
      return taxConcept;
    }

    return 'No especificado';
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  /**
   * Regresa a la página anterior
   */
  goBack(): void { this.router.navigate(['/customers/list']);
 }

  /**
   * Navega a la página de edición
   */
  goToEdit(): void {
    if (!this.customerId) {
      this.handleError('No se puede editar: ID de cliente no válido');
      return;
    }
    this.router.navigate(['/customers/edit', this.customerId]);
  }

  viewAddress(address: CustomerAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: [...(address.contact_addresses ?? [])].map((contact) => ({ ...contact }))
    };
    this.modalMode = 'view';
    this.showAddressModal = true;
  }

  editAddress(address: CustomerAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: [...(address.contact_addresses ?? [])].map((contact) => ({ ...contact }))
    };

    // Construir la dirección completa si no existe o está vacía
    if (!this.selectedAddress.address || this.selectedAddress.address.trim() === '') {
      const parts: string[] = [];

      if (this.selectedAddress.street) {
        parts.push(this.selectedAddress.street);
      }

      if (this.selectedAddress.outside_number) {
        parts.push(this.selectedAddress.outside_number);
      }

      if (this.selectedAddress.inside_number) {
        parts.push(`Int. ${this.selectedAddress.inside_number}`);
      }

      if (this.selectedAddress.county) {
        parts.push(this.selectedAddress.county);
      }

      if (this.selectedAddress.city) {
        parts.push(this.selectedAddress.city);
      }

      if (this.selectedAddress.state) {
        parts.push(this.selectedAddress.state);
      }

      if (this.selectedAddress.zipcode) {
        parts.push(`CP ${this.selectedAddress.zipcode}`);
      }

      if (this.selectedAddress.country) {
        parts.push(this.selectedAddress.country);
      }

      this.selectedAddress.address = parts.filter(Boolean).join(', ');
    }

    this.modalMode = 'edit';
    this.showAddressModal = true;
  }

  createAddress(): void {
    this.selectedAddress = {
      id_address: 0,
      id: 0,
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
      contact_addresses: []
    };
    this.modalMode = 'create';
    this.showAddressModal = true;
  }

  deleteAddress(address: CustomerAddress): void {
    const addressId = address.id ?? address.id_address;
    if (!addressId) {
      this.handleError('No se puede eliminar: dirección sin identificador');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar la dirección "${address.shortname}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      Swal.fire({
        title: 'Eliminando...',
        text: 'Procesando solicitud',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null)
      });

      this.customerService.deleteAddress(addressId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Dirección eliminada',
              confirmButtonColor: '#0d6efd'
            });
            this.loadCustomerData();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al eliminar la dirección:', error);
            this.handleError('No se pudo eliminar la dirección');
          }
        });
    });
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.selectedAddress = null;
    this.modalMode = 'view';
  }

  saveAddress(): void {
    if (!this.selectedAddress) {
      return;
    }

    // Extraer contact_addresses y otros campos no necesarios
    const { contact_addresses, ...addressWithoutContacts } = this.selectedAddress;

    // Si hay contactos existentes, usar el primero para mantener el formato requerido por el API
    // Si no hay contactos, enviar campos vacíos/null
    const firstContact = contact_addresses && contact_addresses.length > 0 ? contact_addresses[0] : null;

    // Asegurar que el id_company esté presente y agregar datos del contacto
    const addressData: any = {
      ...addressWithoutContacts,
      county: addressWithoutContacts.colony || '', // county debe contener la colonia
      id_company: Number(this.customerId),
      contact_name: firstContact?.contact_name || '',
      contact_lastname: firstContact?.contact_lastname || '',
      contact_lastname2: firstContact?.contact_lastname2 || '',
      contact_phone: firstContact?.contact_phone || '',
      contact_email: firstContact?.contact_email || '',
      contact_job_position: firstContact?.contact_job_position || '',
      contact_department: firstContact?.contact_department || ''
    };

    const request$ = this.modalMode === 'create'
      ? this.customerService.createAddress(Number(this.customerId), addressData)
      : this.customerService.updateAddress(Number(this.customerId), addressData);

    const loadingText = this.modalMode === 'create' ? 'Creando dirección' : 'Actualizando dirección';
    const successText = this.modalMode === 'create' ? 'Dirección creada correctamente' : 'Dirección actualizada correctamente';

    Swal.fire({
      title: 'Guardando...',
      text: loadingText,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: successText,
            confirmButtonColor: '#0d6efd'
          });
          this.closeAddressModal();
          this.loadCustomerData();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al guardar la dirección:', error);
          this.handleError('No se pudo guardar la dirección');
        }
      });
  }
  // ==================== MÉTODOS PARA CONTACTOS DE DIRECCIONES ====================

  viewContact(contact: ContactAddress | any): void {
    this.selectedContact = {
      id: contact.id,
      contact_name: contact.contact_name_address || contact.contact_name || '',
      contact_lastname: contact.contact_lastname_address || contact.contact_lastname || '',
      contact_lastname2: contact.contact_lastname2_address || contact.contact_lastname2 || '',
      contact_lada: contact.contact_lada || '',
      contact_phone: (contact.contact_phone || '').replace(/[^0-9]/g, ''),
      contact_extension: contact.contact_extension || '',
      contact_email: contact.contact_email || '',
      contact_job_position: contact.contact_job_position || '',
      contact_department: contact.contact_department || ''
    };
    this.modalMode = 'view';
    this.showContactModal = true;
  }

  editContact(contact: ContactAddress | any): void {
    this.selectedContact = {
      id: contact.id,
      contact_name: contact.contact_name_address || contact.contact_name || '',
      contact_lastname: contact.contact_lastname_address || contact.contact_lastname || '',
      contact_lastname2: contact.contact_lastname2_address || contact.contact_lastname2 || '',
      contact_lada: contact.contact_lada || '',
      contact_phone: (contact.contact_phone || '').replace(/[^0-9]/g, ''),
      contact_extension: contact.contact_extension || '',
      contact_email: contact.contact_email || '',
      contact_job_position: contact.contact_job_position || '',
      contact_department: contact.contact_department || ''
    };
    this.modalMode = 'edit';
    this.showContactModal = true;
  }

  createContact(): void {
    this.selectedContact = {
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: ''
    };
    this.modalMode = 'create';
    this.showContactModal = true;
  }

  deleteContact(contact: ContactAddress): void {
    if (!contact?.id) {
      this.handleError('El contacto seleccionado no tiene identificador');
      return;
    }

    const contactId = contact.id;


    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el contacto "${this.getContactAddressFullName(contact)}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      Swal.fire({
        title: 'Eliminando...',
        text: 'Procesando solicitud',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null)
      });

    this.customerService.deleteContactAddress(contactId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.removeContactFromState(contactId);
            Swal.fire({
              icon: 'success',
              title: 'Contacto eliminado',
              confirmButtonColor: '#0d6efd'
            });
            this.closeContactModal();
            this.loadCustomerData();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al eliminar el contacto:', error);
            this.handleError('No se pudo eliminar el contacto');
          }
        });
    });
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.selectedContact = null;
    this.modalMode = 'view';
  }

  // Validación: permite solo números en el campo
  onlyNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  saveContact(): void {
    if (!this.selectedContact || !this.selectedAddress) {
      return;
    }

    const customerId = Number(this.customerId);
    const addressId = this.direcciones[0]?.id_address;

    if (!customerId || !addressId) {
      this.handleError('No se puede guardar el contacto: datos de referencia incompletos');
      return;
    }

    let request$;
    let loadingText = '';
    let successText = '';
    const contactData: ContactAddress = {
      id: this.modalMode === 'edit' ? this.selectedContact.id : undefined,
      parent_table: 'addresses',
      parent_id: addressId,
      contact_name: this.selectedContact.contact_name,
      contact_lastname: this.selectedContact.contact_lastname,
      contact_lastname2: this.selectedContact.contact_lastname2,
      contact_lada: this.selectedContact.contact_lada,
      contact_phone: this.selectedContact.contact_phone,
      contact_extension: this.selectedContact.contact_extension,
      contact_email: this.selectedContact.contact_email,
      contact_job_position: this.selectedContact.contact_job_position,
      contact_department: this.selectedContact.contact_department
    };

    if (this.modalMode === 'create') {
      loadingText = 'Creando contacto';
      successText = 'Contacto creado correctamente';
      request$ = this.customerService.createContactAddress( contactData);


    } else if (this.modalMode === 'edit') {
      if (!this.selectedContact.id) {
        this.handleError('No se puede actualizar: contacto sin identificador');
        return;
      }

      loadingText = 'Actualizando contacto';
      successText = 'Contacto actualizado correctamente';
      request$ = this.customerService.updateContactAddress(contactData);

    }

    else {
      this.closeContactModal();
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      text: loadingText,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: successText,
            confirmButtonColor: '#0d6efd'
          });
          this.closeContactModal();
          this.closeAddressModal();
          this.loadCustomerData();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al guardar el contacto:', error);
          this.handleError('No se pudo guardar el contacto');
        }
      });
  }

  private removeContactFromState(contactId: number): void {
    if (this.selectedAddress?.contact_addresses?.length) {
      this.selectedAddress = {
        ...this.selectedAddress,
        contact_addresses: this.selectedAddress.contact_addresses.filter((contact) => contact.id !== contactId)
      };
    }

    this.direcciones = this.direcciones.map((address) => {
      if (!address.contact_addresses?.length) {
        return address;
      }

      const updatedContacts = address.contact_addresses.filter((contact) => contact.id !== contactId);
      if (updatedContacts.length === address.contact_addresses.length) {
        return address;
      }

      return {
        ...address,
        contact_addresses: updatedContacts
      };
    });
  }

  private syncSelectedAddress(addresses: CustomerAddress[]): void {
    if (!this.selectedAddress) {
      return;
    }

    const selectedId = this.selectedAddress.id_address ?? this.selectedAddress.id;
    if (!selectedId) {
      return;
    }

    const updatedAddress = addresses.find((address) => (address.id_address ?? address.id) === selectedId);
    if (!updatedAddress) {
      return;
    }

    this.selectedAddress = {
      ...updatedAddress,
      contact_addresses: [...(updatedAddress.contact_addresses ?? [])]
    };
  }

  getContactFullName(contact: CustomerContact): string {
    const parts = [
      contact.contact_name,
      contact.contact_lastname,
      contact.contact_lastname2
    ].filter(Boolean);

    return parts.join(' ') || 'Sin nombre';
  }

  getContactAddressFullName(contact: ContactAddress | any): string {
    // Intentar primero con el formato con sufijo _address
    const parts = [
      contact.contact_name_address || contact.contact_name,
      contact.contact_lastname_address || contact.contact_lastname,
      contact.contact_lastname2_address || contact.contact_lastname2,
    ].filter(Boolean);

    return parts.join(' ') || 'Sin nombre';
  }

  /**
   * Obtiene la clase CSS para el estado del documento
   */
  getDocumentStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'Activo': 'bg-success',
      'Inactivo': 'bg-secondary',
      'Pendiente': 'bg-warning',
      'Cancelado': 'bg-danger',
      'Completado': 'bg-success',
      'En Proceso': 'bg-info'
    };

    return statusClasses[status] || 'bg-secondary';
  }

  getContractStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'Activo': 'bg-success',
      'Inactivo': 'bg-secondary',
      'Vigente': 'bg-success',
      'Expirado': 'bg-warning',
      'Cancelado': 'bg-danger',
      'En Proceso': 'bg-info',
      'Pendiente': 'bg-warning'
    };

    return statusClasses[status] || 'bg-secondary';
  }


  hasContracts(): boolean {
    return this.contratos.length > 0;
  }

  getFullAddress(address: CustomerAddress): string {
    const parts = [
      address.street,
      address.outside_number ? `#${address.outside_number}` : null,
      address.inside_number ? `Int. ${address.inside_number}` : null,
      address.colony,
      address.municipality,
      address.city,
      address.state,
      address.zipcode ? `CP ${address.zipcode}` : null,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Construye automáticamente la dirección completa a partir de los campos individuales
   */
  buildFullAddress(): void {
    if (!this.selectedAddress) {
      return;
    }

    const parts: string[] = [];

    // Agregar calle
    if (this.selectedAddress.street) {
      parts.push(this.selectedAddress.street);
    }

    // Agregar número exterior
    if (this.selectedAddress.outside_number) {
      parts.push(this.selectedAddress.outside_number);
    }

    // Agregar número interior si existe
    if (this.selectedAddress.inside_number) {
      parts.push(`Int. ${this.selectedAddress.inside_number}`);
    }

    // Agregar colonia si existe
    if (this.selectedAddress.colony) {
      parts.push(this.selectedAddress.colony);
    }

    // Agregar municipio/alcaldía si existe
    if (this.selectedAddress.municipality) {
      parts.push(this.selectedAddress.municipality);
    }

    // Agregar ciudad
    if (this.selectedAddress.city) {
      parts.push(this.selectedAddress.city);
    }

    // Agregar estado
    if (this.selectedAddress.state) {
      parts.push(this.selectedAddress.state);
    }

    // Agregar código postal
    if (this.selectedAddress.zipcode) {
      parts.push(`CP ${this.selectedAddress.zipcode}`);
    }

    // Agregar país
    if (this.selectedAddress.country) {
      parts.push(this.selectedAddress.country);
    }

    // Construir la dirección completa
    this.selectedAddress.address = parts.filter(Boolean).join(', ');
  }

  getComplianceStatusClass(): string {
    if (!this.compania) return 'bg-secondary';

    const hasTaxData = this.compania.tax_regime?.id && this.compania.tax_preferred_concept?.id;

    // Verificar documentos de cumplimiento
    const hasDocuments = this.requiredDocuments.length > 0;
    const allDocumentsComplete = hasDocuments &&
      this.requiredDocuments.every(doc => doc.status === 'complete' || doc.file_url);

    if (hasTaxData && hasDocuments && allDocumentsComplete) {
      return 'bg-success';
    } else if (hasTaxData || (hasDocuments && this.requiredDocuments.some(doc => doc.status === 'complete' || doc.file_url))) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }

  getComplianceStatusText(): string {
    if (!this.compania) return 'No disponible';

    const hasTaxData = this.compania.tax_regime?.id && this.compania.tax_preferred_concept?.id;

    // Verificar documentos de cumplimiento
    const hasDocuments = this.requiredDocuments.length > 0;
    const allDocumentsComplete = hasDocuments &&
      this.requiredDocuments.every(doc => doc.status === 'complete' || doc.file_url);
    const someDocumentsComplete = hasDocuments &&
      this.requiredDocuments.some(doc => doc.status === 'complete' || doc.file_url);

    if (hasTaxData && hasDocuments && allDocumentsComplete) {
      return 'Completo';
    } else if (hasTaxData || someDocumentsComplete) {
      return 'Parcial';
    } else if (!hasDocuments) {
      return 'Sin documentos';
    } else {
      return 'Incompleto';
    }
  }

  getLastUpdateDate(): string {
    return 'No disponible'; // El nuevo JSON no incluye updated_at por ahora
  }

  viewDocument(doc: CustomerDocument): void {
    sessionStorage.setItem('lastTab', 'Documentos');
    this.router.navigate(['/document/0/' + doc.id_document + '/0']);
  }

  viewContract(contract: CustomerContract): void {
    sessionStorage.setItem('lastTab', 'Contratos');
    this.router.navigate(['/contracts/2/' + contract.id_contract + '/0']);
  }
}
