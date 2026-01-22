import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { CustomerService } from '../customer.service';
import {
  Customer,
  CustomerContact,
  CustomerAddress,
  CustomerDocument,
  CustomerContract,
  CustomerDetailResponse,
  MetaOption,
  ContactAddress,
  PhoneCode,
} from '../customers';
import Swal from 'sweetalert2';
import { Subject, finalize, takeUntil } from 'rxjs';
import { CustomerPermissionService } from '../services/customer-permission.service';
import { ZipcodeService, ZipcodeFormData } from '../../../shared/services/zipcode.service';
import { DocumentAttachmentService, DocumentAttachment, DocumentType } from '../../../shared/services/document-attachment.service';

declare var bootstrap: any;

type TabType =
  | 'info'
  | 'contacts'
  | 'addresses'
  | 'taxData'
  | 'documents'
  | 'contracts';

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrl: './customer-edit.component.css',
})
export class CustomerEditComponent implements OnInit, OnDestroy {
  loading = true;
  compania: Customer | null = null;
  contactos: CustomerContact[] = [];
  direcciones: CustomerAddress[] = [];
  documentos: CustomerDocument[] = [];
  contratos: CustomerContract[] = [];

  companyTypes: MetaOption[] = [];
  companyScopes: MetaOption[] = [];
  taxRegimes: any[] = [];
  taxConcepts: any[] = [];

  customerId = '';
  activeTab: TabType = 'info';

  showAddressModal = false;

  // Propiedades para control de permisos
  canEditCustomers: boolean = false;
  canViewCustomerAddresses: boolean = false;
  canCreateCustomerAddresses: boolean = false;
  canEditCustomerAddresses: boolean = false;
  canDeleteCustomerAddresses: boolean = false;
  canViewCustomerContacts: boolean = false;
  canCreateCustomerContacts: boolean = false;
  canEditCustomerContacts: boolean = false;
  canDeleteCustomerContacts: boolean = false;
  canViewCustomerDocuments: boolean = false;
  showContactModal = false;
  showAddressContactModal = false;
  selectedAddress: CustomerAddress | null = null;
  selectedContact: CustomerContact | null = null;
  selectedAddressContact: ContactAddress | null = null;
  selectedAddressContactIndex: number = -1; // Índice del contacto seleccionado para edición
  modalMode: 'view' | 'edit' | 'create' = 'view';
  addressContactModalMode: 'view' | 'edit' | 'create' = 'view'; // Modo separado para el modal de contactos de dirección
  addressActiveTab: string = 'info';

  // Variables para búsqueda de códigos postales
  counties: string[] = [];
  cities: string[] = [];
  states: string[] = [];
  countries: string[] = [];

  // Códigos telefónicos internacionales
  phoneCodes: PhoneCode[] = [];

  // Documentos adjuntos requeridos
  requiredDocuments: DocumentAttachment[] = [];
  documentTypes: DocumentType[] = [];
  loadingDocuments = false;
  uploadingDocument: number | null = null;
  selectedDocumentTypeIds: number[] = [];
  loadingDocumentTypes = false;
  addingDocuments = false;

  // Variables para datos de código postal
  zipcodeData: ZipcodeFormData | null = null;
  loadingZipcode = false;
  settlements: string[] = [];
  hasMultipleSettlements = false;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly customerService: CustomerService,
    private readonly router: Router,
    private readonly location: Location,
    private readonly customerPermissionService: CustomerPermissionService,
    private readonly zipcodeService: ZipcodeService,
    private readonly documentAttachmentService: DocumentAttachmentService
  ) {}

  ngOnInit(): void {
    this.checkUserPermissions();
    this.initializeComponent();
  }

  private checkUserPermissions(): void {
    this.canEditCustomers = this.customerPermissionService.canEditCustomers();
    this.canViewCustomerAddresses =
      this.customerPermissionService.canViewCustomerAddresses();
    this.canCreateCustomerAddresses =
      this.customerPermissionService.canCreateCustomerAddresses();
    this.canEditCustomerAddresses =
      this.customerPermissionService.canEditCustomerAddresses();
    this.canDeleteCustomerAddresses =
      this.customerPermissionService.canDeleteCustomerAddresses();
    this.canViewCustomerContacts =
      this.customerPermissionService.canViewCustomerContacts();
    this.canCreateCustomerContacts =
      this.customerPermissionService.canCreateCustomerContacts();
    this.canEditCustomerContacts =
      this.customerPermissionService.canEditCustomerContacts();
    this.canDeleteCustomerContacts =
      this.customerPermissionService.canDeleteCustomerContacts();
    this.canViewCustomerDocuments =
      this.customerPermissionService.canViewCustomerDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el componente y carga los datos
   */
  private initializeComponent(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        this.customerId = params['id'] || '';
        if (this.customerId) {
          this.loadCustomerData();
          this.loadDropdownData();
        }
      },
      error: (error) => {
        console.error('Error al obtener parámetros de ruta:', error);
        this.handleError('No se pudo cargar el ID del cliente');
      },
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
      },
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
   * Carga los datos del cliente desde la API
   */
  loadCustomerData(): void {
    this.showLoading();

    this.customerService
      .getCustomerDetail(Number(this.customerId))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.hideLoading())
      )
      .subscribe({
        next: (response: CustomerDetailResponse) =>
          this.handleSuccessResponse(response),
        error: (error: HttpErrorResponse) => this.handleErrorResponse(error),
      });
  }

  /**
   * Maneja la respuesta exitosa de la API CONSOLEAR
   */
  private handleSuccessResponse(response: CustomerDetailResponse): void {
    if (!response || !response.ok || !response.data) {
      this.handleError('Respuesta inválida del servidor');
      return;
    }

    const detail = response.data;

    if (!detail?.compania) {
      this.handleError('No se encontró información de la compañía');
      return;
    }

    this.compania = detail.compania;

    // Asegurar que shortname tenga un valor (usar company si está vacío)
    this.compania.shortname =
      this.compania.shortname || this.compania.company || '';

    // Asegurar que tax_regime y tax_preferred_concept sean objetos para evitar errores en el template
    if (!this.compania.tax_regime) {
      this.compania.tax_regime = { id: undefined, display: '' };
    }
    if (!this.compania.tax_preferred_concept) {
      this.compania.tax_preferred_concept = { id: undefined, display: '' };
    }

    // Asegurar que id_company_scope sea un array
    if (!this.compania.id_company_scope) {
      this.compania.id_company_scope = [];
    } else if (!Array.isArray(this.compania.id_company_scope)) {
      this.compania.id_company_scope = [this.compania.id_company_scope];
    }

    // Mapear los contactos de la API al formato esperado por la interfaz CustomerContact
    this.contactos = (detail.contacts ?? []).map((c: any) => this.mapContactFromApi(c));

    // Mapear las direcciones y sus contactos, asegurando que county se mapee a colony
    this.direcciones = (detail.addresses ?? []).map((address: any) => ({
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: (address.contact_addresses ?? []).map((c: any) => this.mapContactAddressFromApi(c))
    }));

    // Cargar documentos adjuntos desde el response
    this.loadRequiredDocuments(detail);
  }

  /**
   * Carga los documentos adjuntos requeridos - primero del response, luego de API
   */
  private loadRequiredDocuments(detail?: any): void {
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
    this.documentAttachmentService
      .getByCompany(this.compania.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.requiredDocuments = documents;
          this.loadingDocuments = false;
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
          this.loadingDocuments = false;
        },
      });
  }

  /**
   * Sube un archivo para un documento
   */
  uploadDocumentFile(document: DocumentAttachment, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingDocument = document.id;

    // Aquí se debería subir el archivo a un storage y obtener la URL
    // Por ahora simulamos con un FileReader para mostrar la funcionalidad
    const reader = new FileReader();
    reader.onload = () => {
      // En producción, aquí subirías el archivo a S3/Storage y obtendrías la URL real
      const fakeUrl = `https://storage.example.com/documents/${this.compania?.id}/${document.document_type_id}/${file.name}`;

      this.documentAttachmentService
        .uploadFile(document.id, fakeUrl)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedDoc) => {
            const index = this.requiredDocuments.findIndex(d => d.id === document.id);
            if (index !== -1) {
              this.requiredDocuments[index] = updatedDoc;
            }
            this.uploadingDocument = null;
            this.checkComplianceStatus();
            Swal.fire({
              icon: 'success',
              title: 'Documento subido',
              text: 'El documento se ha subido correctamente.',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error al subir documento:', error);
            this.uploadingDocument = null;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo subir el documento.'
            });
          }
        });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Elimina el archivo de un documento
   */
  removeDocumentFile(document: DocumentAttachment): void {
    Swal.fire({
      title: '¿Eliminar documento?',
      text: 'Se eliminará el archivo adjunto de este documento.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.documentAttachmentService
          .removeFile(document.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedDoc) => {
              const index = this.requiredDocuments.findIndex(d => d.id === document.id);
              if (index !== -1) {
                this.requiredDocuments[index] = updatedDoc;
              }
              this.checkComplianceStatus();
              Swal.fire({
                icon: 'success',
                title: 'Documento eliminado',
                text: 'El archivo se ha eliminado correctamente.',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error al eliminar documento:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el documento.'
              });
            }
          });
      }
    });
  }

  /**
   * Verifica el estado de cumplimiento y actualiza si es necesario
   */
  private checkComplianceStatus(): void {
    if (!this.compania) return;

    const compliance = this.documentAttachmentService.checkFullCompliance(
      this.compania,
      this.requiredDocuments
    );

    // Si está completo, podrías actualizar un estado en la compañía
    if (compliance.isCompliant) {
      console.log('Cumplimiento completo');
      // Aquí podrías llamar a una API para actualizar el estado de cumplimiento
    }
  }

  /**
   * Obtiene el porcentaje de cumplimiento de documentos
   */
  getDocumentCompliancePercentage(): number {
    return this.documentAttachmentService.getCompliancePercentage(this.requiredDocuments);
  }

  /**
   * Verifica si todos los documentos están completos
   */
  areAllDocumentsComplete(): boolean {
    return this.documentAttachmentService.checkComplianceStatus(this.requiredDocuments);
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
   * Mapea un contacto de dirección de la API al formato esperado por ContactAddress
   * La API puede devolver: contact_name_address, contact_lastname_address o contact_name, contact_lastname
   */
  private mapContactAddressFromApi(apiContact: any): ContactAddress {
    return {
      id: apiContact.id ?? undefined,
      parent_id: apiContact.parent_id ?? apiContact.id_parent ?? undefined,
      parent_table: apiContact.parent_table ?? undefined,
      contact_name: apiContact.contact_name ?? apiContact.contact_name_address ?? '',
      contact_lastname: apiContact.contact_lastname ?? apiContact.contact_lastname_address ?? '',
      contact_lastname2: apiContact.contact_lastname2 ?? apiContact.contact_lastname2_address ?? undefined,
      contact_lada: apiContact.contact_lada ?? undefined,
      contact_phone: apiContact.contact_phone ?? undefined,
      contact_extension: apiContact.contact_extension ?? undefined,
      contact_email: apiContact.contact_email ?? undefined,
      contact_job_position: apiContact.contact_job_position ?? undefined,
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
      errorMessage = 'No tiene autorización para ver este cliente';
    } else if (error.status === 404) {
      errorMessage = 'Cliente no encontrado';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor';
    } else if (error.status === 422 && error.error?.errors) {
      const errorList = Object.entries(error.error.errors)
        .map(([field, messages]: [string, any]) => {
          const fieldMessages = Array.isArray(messages) ? messages : [messages];
          return fieldMessages.map((msg: string) => `<li><strong>${field}:</strong> ${msg}</li>`).join('');
        })
        .join('');
      this.handleErrorHtml(`<ul class="text-start mb-0">${errorList}</ul>`);
      return;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.handleError(errorMessage);
  }

  /**
   * Muestra mensaje de error al usuario con HTML
   */
  private handleErrorHtml(htmlMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      html: htmlMessage,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0d6efd',
    });
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
      confirmButtonColor: '#0d6efd',
    });
  }

  /**
   * Carga los datos de los dropdowns (regímenes fiscales, conceptos, etc.)
   */
  private loadDropdownData(): void {
    // Cargar regímenes fiscales
    this.customerService
      .getTaxRegimes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.taxRegimes = data;
        },
        error: (error: any) => {
          console.error('Error al cargar regímenes fiscales:', error);
        },
      });

    // Cargar conceptos fiscales
    this.customerService
      .getTaxConcepts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.taxConcepts = data;
        },
        error: (error: any) => {
          console.error('Error al cargar conceptos fiscales:', error);
        },
      });

    // Cargar alcances de empresa
    this.customerService
      .getCompanyMetaScopes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: MetaOption[]) => {
          this.companyScopes = data;
        },
        error: (error: any) => {
          console.error('Error al cargar alcances de empresa:', error);
        },
      });

    // Cargar tipos de empresa
    this.customerService
      .getCompanyMetaTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: MetaOption[]) => {
          this.companyTypes = data;
        },
        error: (error: any) => {
          console.error('Error al cargar tipos de compañía:', error);
        },
      });

    // Cargar códigos telefónicos
    this.customerService
      .getPhoneCodes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: PhoneCode[]) => {
          this.phoneCodes = data;
        },
        error: (error: any) => {
          console.error('Error al cargar códigos telefónicos:', error);
        },
      });

    // Cargar tipos de documentos
    this.loadDocumentTypes();
  }

  /**
   * Carga los tipos de documentos disponibles para el selector
   */
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

  /**
   * Obtiene los tipos de documentos que aún no están asignados
   */
  get availableDocumentTypes(): DocumentType[] {
    const assignedTypeIds = this.requiredDocuments.map(d => d.document_type_id);
    return this.documentTypes.filter(type => !assignedTypeIds.includes(type.id));
  }

  /**
   * Agrega nuevos documentos requeridos
   */
  addRequiredDocuments(): void {
    if (this.selectedDocumentTypeIds.length === 0 || !this.customerId) {
      return;
    }

    this.addingDocuments = true;
    this.documentAttachmentService
      .createMultipleForCompany(Number(this.customerId), this.selectedDocumentTypeIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newDocuments) => {
          this.requiredDocuments = [...this.requiredDocuments, ...newDocuments];
          this.selectedDocumentTypeIds = [];
          this.addingDocuments = false;
          Swal.fire({
            icon: 'success',
            title: 'Documentos agregados',
            text: `Se agregaron ${newDocuments.length} documento(s) requerido(s).`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al agregar documentos:', error);
          this.addingDocuments = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron agregar los documentos requeridos.'
          });
        }
      });
  }

  /**
   * Elimina un documento requerido
   */
  removeRequiredDocument(document: DocumentAttachment): void {
    Swal.fire({
      title: '¿Eliminar documento requerido?',
      text: `Se eliminará "${document.document_type}" de los documentos requeridos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.documentAttachmentService
          .delete(document.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.requiredDocuments = this.requiredDocuments.filter(d => d.id !== document.id);
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El documento requerido se eliminó correctamente.',
                timer: 2000,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error al eliminar documento:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el documento requerido.'
              });
            }
          });
      }
    });
  }

  /**
   * Manejador de cambio de régimen fiscal
   */
  onTaxRegimeChange(): void {
    // Actualizar el display del régimen seleccionado
    if (this.compania?.tax_regime?.id) {
      const selectedRegime = this.taxRegimes.find(
        (r: any) => r.id === Number(this.compania!.tax_regime!.id)
      );
      if (selectedRegime) {
        this.compania.tax_regime.display = `${selectedRegime.tax_regime} - ${selectedRegime.description || ''}`.trim();
      }
    }
  }

  /**
   * Manejador de cambio de concepto fiscal preferido
   */
  onTaxConceptChange(): void {
    // Actualizar el display del concepto seleccionado
    if (this.compania?.tax_preferred_concept?.id) {
      const selectedConcept = this.taxConcepts.find(
        (c: any) => c.id === Number(this.compania!.tax_preferred_concept!.id)
      );
      if (selectedConcept) {
        this.compania.tax_preferred_concept.display = `${selectedConcept.tax_concept} - ${selectedConcept.description || ''}`.trim();
      }
    }
  }

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  /**
   * Cambia la pestaña activa del modal de direcciones
   */
  setAddressActiveTab(tab: string): void {
    this.addressActiveTab = tab;
  }

  /**
   * Regresa a la página anterior
   */
  goBack(): void {
    this.router.navigate(['/customers/show', this.customerId]);
  }

  /**
   * Navega a la lista de clientes
   */
  goToList(): void {
    this.router.navigate(['/customers']);
  }

  /**
   * Guarda los cambios del cliente (valida y muestra confirmación)
   */
  saveCustomer(): void {
    if (
      !this.compania?.shortname ||
      !this.compania?.company ||
      !this.compania?.tax_id
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
      });
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar la información del cliente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateCustomer();
      }
    });
  }

  /**
   * Actualiza la información del cliente en el servidor
   */
  private updateCustomer(): void {
    if (!this.compania) return;

    Swal.fire({
      title: 'Actualizando...',
      text: 'Guardando cambios del cliente',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    // Construir las direcciones con el formato completo
    this.direcciones.forEach((address: any) => {
      address.address = this.getFullAddress(address);
    });

    // Convertir valores booleanos a strings ("1" o "0")
    const convertBooleanToString = (value: any): string => {
      if (value === true || value === 1 || value === '1') return '1';
      if (value === false || value === 0 || value === '0') return '0';
      return '0'; // valor por defecto
    };

    // Extraer ID de tax_regime (puede ser objeto {id, display} o valor directo)
    const getTaxRegimeId = (taxRegime: any): number | null => {
      if (!taxRegime) return null;
      if (typeof taxRegime === 'object' && taxRegime.id) return Number(taxRegime.id);
      if (typeof taxRegime === 'number') return taxRegime;
      if (typeof taxRegime === 'string' && !isNaN(Number(taxRegime))) return Number(taxRegime);
      return null;
    };

    // Extraer ID de tax_preferred_concept (puede ser objeto {id, display} o valor directo)
    const getTaxConceptId = (taxConcept: any): number | null => {
      if (!taxConcept) return null;
      if (typeof taxConcept === 'object' && taxConcept.id) return Number(taxConcept.id);
      if (typeof taxConcept === 'number') return taxConcept;
      if (typeof taxConcept === 'string' && !isNaN(Number(taxConcept))) return Number(taxConcept);
      return null;
    };

    const updatedCustomer = {
      compania: {
        id: this.compania.id,
        shortname: this.compania.shortname,
        company: this.compania.company,
        tax_id: this.compania.tax_id,
        clave: (this.compania as any).clave || null,
        company_type: this.compania.company_type || 'Client',
        website: this.compania.website || null,
        tax_regime_id: getTaxRegimeId(this.compania.tax_regime),
        tax_preferred_concept_id: getTaxConceptId(this.compania.tax_preferred_concept),
        tax_status: convertBooleanToString(this.compania.tax_status),
        tax_byrules: convertBooleanToString(this.compania.tax_byrules),
        tax_actofincorporation: convertBooleanToString(
          this.compania.tax_actofincorporation
        ),
      },
    };


    this.customerService
      .updateCustomer(Number(this.customerId), updatedCustomer)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: 'Los datos se han actualizado correctamente.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/customers/show', this.customerId]);
          });
        },
        error: (error: HttpErrorResponse) => {
          Swal.close();
          console.error('Error al actualizar el cliente:', error);
          let errorMessage = 'No se pudo actualizar el cliente.';
          if (error.status === 422 && error.error.errors) {
            const errorList = Object.values(error.error.errors)
              .flat()
              .map((err: any) => `<li>${err}</li>`)
              .join('');
            errorMessage = `<ul>${errorList}</ul>`;
          }
          Swal.fire({
            icon: 'error',
            title: 'Error',
            html: errorMessage,
          });
        },
      });
  }

  // ==================== MÉTODOS PARA CONTACTOS ====================

  createContact(): void {
    this.selectedContact = {
      id_contact: 0,
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      phone: '',
      email: '',
      job_position: '',
      contact_department: '',
    };
    this.modalMode = 'create';
    this.showContactModal = true;
  }

  editContact(contact: CustomerContact): void {
    this.selectedContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      phone: contact.phone ? contact.phone.replace(/[^0-9]/g, '') : ''
    };
    this.modalMode = 'edit';
    this.showContactModal = true;
  }

  deleteContact(contact: CustomerContact): void {
    if (!contact?.id_contact) {
      console.error('ID de contacto no válido');
      return;
    }

    const contactId = contact.id_contact;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el contacto "${this.getContactFullName(
        contact
      )}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(null),
        });

        this.customerService
          .deleteContact(contactId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.contactos = this.contactos.filter(
                (c) => c.id_contact !== contactId
              );
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El contacto ha sido eliminado correctamente.',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error al eliminar el contacto:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el contacto.',
              });
            },
          });
      }
    });
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.selectedContact = null;
    this.modalMode = 'view';
  }

  saveContact(): void {
    if (!this.selectedContact) {
      return;
    }

    if (
      !this.selectedContact.contact_name ||
      !this.selectedContact.contact_lastname ||
      !this.selectedContact.email
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
      });
      return;
    }

    const customerId = Number(this.customerId);
    if (!customerId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo determinar el cliente para asociar el contacto.',
      });
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      text:
        this.modalMode === 'create'
          ? 'Creando contacto'
          : 'Actualizando contacto',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    // Preparar el objeto con la estructura CustomerContactForm
    const contactForm = {
      contact_name: this.selectedContact.contact_name,
      contact_lastname: this.selectedContact.contact_lastname,
      contact_lastname2: this.selectedContact.contact_lastname2,
      contact_lada: this.selectedContact.contact_lada,
      phone: this.selectedContact.phone,
      contact_extension: this.selectedContact.contact_extension,
      email: this.selectedContact.email,
      job_position: this.selectedContact.job_position,
      contact_department: this.selectedContact.contact_department,
    };

    const request$ =
      this.modalMode === 'create'
        ? this.customerService.createContact(customerId, contactForm)
        : this.customerService.updateContact(
            this.selectedContact.id_contact!,
            customerId,
            contactForm
          );

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (this.modalMode === 'create') {
          // Para nuevos contactos, usar los datos del formulario y agregar el id de la respuesta
          const newContact: CustomerContact = {
            ...this.selectedContact!,
            id_contact: response?.id_contact || response?.id || undefined,
          };
          this.contactos.push(newContact);
        } else {
          // Para actualizaciones, buscar y actualizar el contacto en el array local
          const index = this.contactos.findIndex(
            (c) => c.id_contact === this.selectedContact?.id_contact
          );
          if (index !== -1 && this.selectedContact) {
            // Actualizar con los datos modificados localmente
            this.contactos[index] = { ...this.selectedContact };
          }
        }
        // Forzar detección de cambios
        this.contactos = [...this.contactos];

        this.closeContactModal();
        Swal.fire({
          icon: 'success',
          title:
            this.modalMode === 'create'
              ? 'Contacto creado'
              : 'Contacto actualizado',
          text: 'El contacto se ha guardado correctamente.',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al guardar el contacto:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo guardar el contacto.',
        });
      },
    });
  }

  getContactFullName(contact: CustomerContact): string {
    const parts = [
      contact.contact_name,
      contact.contact_lastname,
      contact.contact_lastname2,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
  }

  // ==================== MÉTODOS PARA DIRECCIONES ====================

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
      contact_addresses: [],
    };
    this.addressActiveTab = 'info';
    this.modalMode = 'create';
    this.showAddressModal = true;
  }

  editAddress(address: CustomerAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: [...(address.contact_addresses ?? [])].map(
        (contact) => ({ ...contact })
      ),
    };

    // Construir la dirección completa si no existe o está vacía
    if (
      !this.selectedAddress.address ||
      this.selectedAddress.address.trim() === ''
    ) {
      this.buildFullAddress();
    }

    this.addressActiveTab = 'info';
    this.modalMode = 'edit';
    this.showAddressModal = true;
  }

  /**
   * Abre el modal de dirección en modo solo lectura (ver)
   */
  viewAddress(address: CustomerAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: [...(address.contact_addresses ?? [])].map(
        (contact) => ({ ...contact })
      ),
    };

    // Construir la dirección completa si no existe o está vacía
    if (
      !this.selectedAddress.address ||
      this.selectedAddress.address.trim() === ''
    ) {
      this.buildFullAddress();
    }

    this.addressActiveTab = 'info';
    this.modalMode = 'view';
    this.showAddressModal = true;
  }

  deleteAddress(address: CustomerAddress): void {
    const addressId = address.id ?? address.id_address;
    if (!addressId) {
      console.error('ID de dirección no válido');
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
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(null),
        });

        this.customerService
          .deleteAddress(addressId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.direcciones = this.direcciones.filter(
                (a) => (a.id ?? a.id_address) !== addressId
              );
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'La dirección ha sido eliminada correctamente.',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error al eliminar la dirección:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la dirección.',
              });
            },
          });
      }
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

    // Validar campos obligatorios de la dirección
    if (
      !this.selectedAddress.shortname ||
      !this.selectedAddress.zipcode ||
      !this.selectedAddress.street ||
      !this.selectedAddress.colony ||
      !this.selectedAddress.outside_number
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: 'Por favor, complete todos los campos obligatorios de la dirección.',
      });
      return;
    }

    // Extraer contact_addresses y otros campos no necesarios
    const { contact_addresses, ...addressWithoutContacts } =
      this.selectedAddress;

    // Determinar si es creación o actualización basándose en si tiene un ID válido
    const addressId =
      this.selectedAddress.id ?? this.selectedAddress.id_address;
    const isCreating = !addressId || addressId === 0;

    // Validar que haya al menos un contacto al crear una dirección
    if (isCreating && (!contact_addresses || contact_addresses.length === 0)) {
      Swal.fire({
        icon: 'warning',
        title: 'Contacto requerido',
        html: 'La dirección debe tener al menos un contacto asociado.<br><br>Por favor, agregue un contacto antes de guardar la dirección.',
        confirmButtonText: 'Entendido',
      });
      return;
    }

    if (isCreating) {
      // Flujo de creación: primero crear la dirección, luego el contacto
      this.createAddressAndContact(
        addressWithoutContacts,
        contact_addresses || []
      );
    } else {
      // Flujo de actualización (sin cambios)
      this.updateExistingAddress(addressWithoutContacts);
    }
  }

  /**
   * Crea una dirección y luego sus contactos de forma asíncrona
   */
  private createAddressAndContact(
    addressData: Partial<CustomerAddress>,
    contacts: ContactAddress[]
  ): void {
    // Preparar datos de la dirección sin contactos
    const addressPayload: any = {
      ...addressData,
      county: addressData.colony || '', // county debe ser la colonia
      id_company: Number(this.customerId),
      parent_table: 'companies',
      parent_id: Number(this.customerId),
    };

    // Eliminar campos que no deben enviarse en la creación
    delete addressPayload.id;
    delete addressPayload.id_address;
    delete addressPayload.contact_addresses;

    Swal.fire({
      title: 'Guardando...',
      text: 'Creando dirección',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    // Paso 1: Crear la dirección
    this.customerService
      .createAddress(Number(this.customerId), addressPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addressResponse: any) => {
          // Intentar extraer el ID de diferentes posibles ubicaciones en la respuesta
          let newAddressId =
            addressResponse?.id ||
            addressResponse?.id_address ||
            addressResponse?.data?.id ||
            addressResponse?.data?.id_address ||
            addressResponse?.address?.id ||
            addressResponse?.address?.id_address;

          if (!newAddressId) {
            console.error(
              'Estructura de respuesta no reconocida:',
              addressResponse
            );
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se recibió el ID de la dirección creada. Revise la consola para más detalles.',
            });
            return;
          }

          // Actualizar el array local con la nueva dirección
          const newAddress: CustomerAddress = {
            ...this.selectedAddress!,
            id: newAddressId,
            id_address: newAddressId,
            contact_addresses: [],
          };

          this.direcciones.push(newAddress);
          this.selectedAddress = newAddress;
          this.direcciones = [...this.direcciones];

          // Paso 2: Crear todos los contactos asociados a la dirección
          if (contacts.length > 0) {
            this.createContactsForAddress(newAddressId, contacts);
          } else {
            // Si no hay contactos (no debería llegar aquí por la validación)
            this.closeAddressModal();
            Swal.fire({
              icon: 'success',
              title: 'Dirección creada',
              text: 'La dirección se ha creado correctamente.',
              timer: 1500,
              showConfirmButton: false,
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al crear la dirección:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.message || 'No se pudo crear la dirección.',
          });
        },
      });
  }

  /**
   * Crea múltiples contactos para una dirección recién creada de forma secuencial
   */
  private createContactsForAddress(
    addressId: number,
    contacts: ContactAddress[]
  ): void {
    if (!contacts || contacts.length === 0) {
      this.closeAddressModal();
      Swal.fire({
        icon: 'success',
        title: 'Dirección creada',
        text: 'La dirección se ha creado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      text: `Creando contactos de la dirección (0/${contacts.length})`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    // Crear contactos uno por uno de forma secuencial
    this.createContactSequentially(addressId, contacts, 0, contacts.length);
  }

  /**
   * Crea un contacto individual de forma recursiva para procesar todos los contactos secuencialmente
   */
  private createContactSequentially(
    addressId: number,
    contacts: ContactAddress[],
    index: number,
    total: number
  ): void {
    if (index >= contacts.length) {
      // Todos los contactos han sido creados
      this.closeAddressModal();
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: `Dirección y ${total} contacto${
          total > 1 ? 's' : ''
        } creados correctamente.`,
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    const contact = contacts[index];
    const contactPayload: ContactAddress = {
      parent_table: 'addresses',
      parent_id: addressId,
      contact_name: contact.contact_name,
      contact_lastname: contact.contact_lastname,
      contact_lastname2: contact.contact_lastname2,
      contact_lada: contact.contact_lada,
      contact_phone: contact.contact_phone,
      contact_extension: contact.contact_extension,
      contact_email: contact.contact_email,
      contact_job_position: contact.contact_job_position,
      contact_department: contact.contact_department,
    };
    // Actualizar el mensaje de progreso
    Swal.update({
      text: `Creando contactos de la dirección (${index + 1}/${total})`,
    });

    this.customerService
      .createContactAddress(contactPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contactResponse: any) => {
          // Actualizar el contacto con el ID recibido
          const newContact: ContactAddress = {
            ...contactPayload,
            id:
              contactResponse?.id ||
              contactResponse?.id_contact ||
              contactResponse?.data?.id,
          };

          // Actualizar el array local
          if (this.selectedAddress) {
            if (!this.selectedAddress.contact_addresses) {
              this.selectedAddress.contact_addresses = [];
            }
            this.selectedAddress.contact_addresses.push(newContact);
            this.selectedAddress.contact_addresses = [
              ...this.selectedAddress.contact_addresses,
            ];

            // Sincronizar con el array principal de direcciones
            const addressIndex = this.direcciones.findIndex(
              (d) =>
                (d.id ?? d.id_address) ===
                (this.selectedAddress!.id ?? this.selectedAddress!.id_address)
            );
            if (addressIndex !== -1) {
              this.direcciones[addressIndex].contact_addresses = [
                ...this.selectedAddress.contact_addresses,
              ];
              this.direcciones = [...this.direcciones];
            }
          }

          // Procesar el siguiente contacto
          this.createContactSequentially(addressId, contacts, index + 1, total);
        },
        error: (error: HttpErrorResponse) => {
          console.error(`Error al crear el contacto ${index + 1}:`, error);

          // Si hay un error, preguntar al usuario si desea continuar con los demás contactos
          Swal.fire({
            icon: 'warning',
            title: 'Error al crear contacto',
            html: `Hubo un error al crear el contacto ${
              index + 1
            } de ${total}.<br><br>¿Desea continuar creando los demás contactos?`,
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
          }).then((result) => {
            if (result.isConfirmed) {
              // Continuar con el siguiente contacto
              this.createContactSequentially(
                addressId,
                contacts,
                index + 1,
                total
              );
            } else {
              // Detener el proceso
              this.closeAddressModal();
              Swal.fire({
                icon: 'info',
                title: 'Proceso detenido',
                text: `Se crearon ${index} de ${total} contactos correctamente.`,
                confirmButtonText: 'Aceptar',
              });
            }
          });
        },
      });
  }

  /**
   * Actualiza una dirección existente
   */
  private updateExistingAddress(addressData: Partial<CustomerAddress>): void {
    const addressPayload: any = {
      ...addressData,
      county: addressData.colony || '', // county debe ser la colonia
      id_company: Number(this.customerId),
      parent_table: 'companies',
      parent_id: Number(this.customerId),
    };

    Swal.fire({
      title: 'Guardando...',
      text: 'Actualizando dirección',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.customerService
      .updateAddress(Number(this.customerId), addressPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Actualizar dirección existente en el array
          const index = this.direcciones.findIndex(
            (d) =>
              (d.id ?? d.id_address) ===
              (this.selectedAddress?.id ?? this.selectedAddress?.id_address)
          );
          if (index !== -1 && this.selectedAddress) {
            // Mantener los contactos de la dirección
            const currentContacts = this.direcciones[index].contact_addresses;
            this.direcciones[index] = { ...this.selectedAddress };
            this.direcciones[index].contact_addresses = currentContacts;
          }

          // Forzar detección de cambios
          this.direcciones = [...this.direcciones];

          this.closeAddressModal();
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Dirección actualizada correctamente.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar la dirección:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.error?.message || 'No se pudo actualizar la dirección.',
          });
        },
      });
  }

  // ==================== MÉTODOS PARA CONTACTOS DE DIRECCIONES ====================

  viewAddressContact(contact: ContactAddress): void {
    this.selectedAddressContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.addressContactModalMode = 'view';
    this.showAddressContactModal = true;
  }

  editAddressContact(contact: ContactAddress, index?: number): void {
    this.selectedAddressContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.selectedAddressContactIndex = index !== undefined ? index : -1;
    this.addressContactModalMode = 'edit';
    this.showAddressContactModal = true;
  }

  createAddressContact(): void {
    if (!this.selectedAddress) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe seleccionar una dirección primero',
      });
      return;
    }

    // Inicializar el array si no existe
    if (!this.selectedAddress.contact_addresses) {
      this.selectedAddress.contact_addresses = [];
    }

    this.selectedAddressContact = {
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      contact_lada: undefined,
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    };
    this.addressContactModalMode = 'create';
    this.showAddressContactModal = true;
  }

  deleteAddressContact(contact: ContactAddress): void {
    const addressId =
      this.selectedAddress?.id ?? this.selectedAddress?.id_address;

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el contacto "${this.getContactAddressFullName(
        contact
      )}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      // Si la dirección no tiene ID, es una dirección nueva - eliminar solo localmente
      if (!addressId) {
        if (this.selectedAddress?.contact_addresses) {
          // Buscar el contacto por sus datos
          const contactIndex = this.selectedAddress.contact_addresses.findIndex(
            (c) =>
              c.contact_name === contact.contact_name &&
              c.contact_lastname === contact.contact_lastname &&
              (c.contact_lastname2 || '') ===
                (contact.contact_lastname2 || '') &&
              (c.contact_phone || '') === (contact.contact_phone || '') &&
              (c.contact_email || '') === (contact.contact_email || '')
          );

          if (contactIndex !== -1) {
            this.selectedAddress.contact_addresses.splice(contactIndex, 1);
            this.selectedAddress.contact_addresses = [
              ...this.selectedAddress.contact_addresses,
            ];

            Swal.fire({
              icon: 'success',
              title: 'Contacto eliminado',
              text: 'El contacto ha sido eliminado de la lista local.',
              timer: 1500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo encontrar el contacto para eliminar.',
            });
          }
        }
        return;
      }

      // Si el contacto no tiene ID, no se puede eliminar del servidor
      if (!contact?.id) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El contacto seleccionado no tiene identificador para eliminarlo del servidor.',
        });
        return;
      }

      const contactId = contact.id;

      Swal.fire({
        title: 'Eliminando...',
        text: 'Procesando solicitud',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(null),
      });

      this.customerService
        .deleteContactAddress(contactId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Actualizar el array local
            this.removeContactFromState(contactId);

            // Forzar detección de cambios
            if (this.selectedAddress) {
              this.selectedAddress.contact_addresses = [
                ...(this.selectedAddress.contact_addresses || []),
              ];
            }

            const addressIndex = this.direcciones.findIndex(
              (d) =>
                (d.id ?? d.id_address) ===
                (this.selectedAddress?.id ?? this.selectedAddress?.id_address)
            );
            if (addressIndex !== -1) {
              this.direcciones[addressIndex].contact_addresses = [
                ...(this.direcciones[addressIndex].contact_addresses || []),
              ];
              this.direcciones = [...this.direcciones];
            }

            Swal.fire({
              icon: 'success',
              title: 'Contacto eliminado',
              text: 'El contacto de la dirección ha sido eliminado correctamente.',
              timer: 1500,
              showConfirmButton: false,
            });
            this.closeAddressContactModal();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al eliminar el contacto:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el contacto de la dirección.',
            });
          },
        });
    });
  }

  closeAddressContactModal(): void {
    this.showAddressContactModal = false;
    this.selectedAddressContact = null;
    this.selectedAddressContactIndex = -1;
    this.addressContactModalMode = 'view';
  }

  /**
   * Permite solo números en el input
   */
  onlyNumbers(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
  }

  /**
   * Formatea el teléfono del contacto principal
   */
  formatPhone(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').substring(0, 10);
    if (this.selectedContact) {
      this.selectedContact.phone = value;
    }
    input.value = value;
  }

  /**
   * Formatea el teléfono del contacto de dirección
   */
  formatPhoneAddressContact(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '').substring(0, 10);
    if (this.selectedAddressContact) {
      this.selectedAddressContact.contact_phone = value;
    }
    input.value = value;
  }

  saveAddressContact(): void {
    if (!this.selectedAddressContact || !this.selectedAddress) {
      return;
    }

    if (
      !this.selectedAddressContact.contact_name ||
      !this.selectedAddressContact.contact_lastname
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete al menos el nombre y apellido del contacto.',
      });
      return;
    }

    const addressId =
      this.selectedAddress.id ?? this.selectedAddress.id_address;

    // Si la dirección aún no tiene ID (es nueva), manejar localmente
    if (!addressId) {
      if (!this.selectedAddress.contact_addresses) {
        this.selectedAddress.contact_addresses = [];
      }

      const contactData: ContactAddress = {
        contact_name: this.selectedAddressContact.contact_name,
        contact_lastname: this.selectedAddressContact.contact_lastname,
        contact_lastname2: this.selectedAddressContact.contact_lastname2,
        contact_lada: this.selectedAddressContact.contact_lada,
        contact_phone: this.selectedAddressContact.contact_phone,
        contact_extension: this.selectedAddressContact.contact_extension,
        contact_email: this.selectedAddressContact.contact_email,
        contact_job_position: this.selectedAddressContact.contact_job_position,
        contact_department: this.selectedAddressContact.contact_department,
      };

      if (this.addressContactModalMode === 'create') {
        // Agregar nuevo contacto al array local
        this.selectedAddress.contact_addresses.push(contactData);
        this.selectedAddress.contact_addresses = [
          ...this.selectedAddress.contact_addresses,
        ];

        this.closeAddressContactModal();
        Swal.fire({
          icon: 'success',
          title: 'Contacto agregado',
          text: 'El contacto se guardará cuando guarde la dirección.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else if (this.addressContactModalMode === 'edit') {
        let contactIndex = -1;

        // Usar el índice guardado si está disponible
        if (
          this.selectedAddressContactIndex >= 0 &&
          this.selectedAddressContactIndex <
            this.selectedAddress.contact_addresses.length
        ) {
          contactIndex = this.selectedAddressContactIndex;
        }
        // Fallback: buscar por ID si existe
        else if (this.selectedAddressContact.id) {
          contactIndex = this.selectedAddress.contact_addresses.findIndex(
            (c) => c.id === this.selectedAddressContact!.id
          );
        }

        if (contactIndex !== -1) {
          if (this.selectedAddress.contact_addresses[contactIndex].id) {
            contactData.id =
              this.selectedAddress.contact_addresses[contactIndex].id;
          }

          this.selectedAddress.contact_addresses[contactIndex] = contactData;
          this.selectedAddress.contact_addresses = [
            ...this.selectedAddress.contact_addresses,
          ];

          this.closeAddressContactModal();
          Swal.fire({
            icon: 'success',
            title: 'Contacto actualizado',
            text: 'Los cambios se guardarán cuando guarde la dirección.',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          console.error('No se encontró el contacto para actualizar');
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo encontrar el contacto para actualizar. Revise la consola para más detalles.',
          });
        }
      }
      return;
    }

    const contactData: ContactAddress = {
      id:
        this.addressContactModalMode === 'edit'
          ? this.selectedAddressContact.id
          : undefined,
      parent_table: 'addresses',
      parent_id: addressId,
      contact_name: this.selectedAddressContact.contact_name,
      contact_lastname: this.selectedAddressContact.contact_lastname,
      contact_lastname2: this.selectedAddressContact.contact_lastname2,
      contact_lada: this.selectedAddressContact.contact_lada,
      contact_phone: this.selectedAddressContact.contact_phone,
      contact_extension: this.selectedAddressContact.contact_extension,
      contact_email: this.selectedAddressContact.contact_email,
      contact_job_position: this.selectedAddressContact.contact_job_position,
      contact_department: this.selectedAddressContact.contact_department,
    };

    let request$;
    let loadingText = '';
    let successText = '';

    if (this.addressContactModalMode === 'create') {
      loadingText = 'Creando contacto';
      successText = 'Contacto creado correctamente';
      request$ = this.customerService.createContactAddress(contactData);
    } else if (this.addressContactModalMode === 'edit') {
      if (!this.selectedAddressContact.id) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se puede actualizar: contacto sin identificador',
        });
        return;
      }
      loadingText = 'Actualizando contacto';
      successText = 'Contacto actualizado correctamente';
      request$ = this.customerService.updateContactAddress(contactData);
    } else {
      this.closeAddressContactModal();
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      text: loadingText,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        // Actualizar el array local de contactos de la dirección
        if (this.selectedAddress) {
          if (!this.selectedAddress.contact_addresses) {
            this.selectedAddress.contact_addresses = [];
          }

          if (this.addressContactModalMode === 'create') {
            // Agregar nuevo contacto al array local
            // Usar contactData (que tiene todos los campos) y solo agregar el id de la respuesta si existe
            const newContact: ContactAddress = {
              ...contactData,
              id: response?.id || response?.id_contact || contactData.id,
            };
            this.selectedAddress.contact_addresses.push(newContact);
          } else if (this.addressContactModalMode === 'edit') {
            // Actualizar contacto existente en el array local
            const index = this.selectedAddress.contact_addresses.findIndex(
              (c) => c.id === this.selectedAddressContact?.id
            );
            if (index !== -1) {
              this.selectedAddress.contact_addresses[index] = {
                ...contactData,
              };
            }
          }

          // Forzar detección de cambios
          this.selectedAddress.contact_addresses = [
            ...this.selectedAddress.contact_addresses,
          ];

          // También actualizar en el array principal de direcciones
          const addressIndex = this.direcciones.findIndex(
            (d) =>
              (d.id ?? d.id_address) ===
              (this.selectedAddress!.id ?? this.selectedAddress!.id_address)
          );
          if (addressIndex !== -1) {
            this.direcciones[addressIndex].contact_addresses = [
              ...this.selectedAddress.contact_addresses,
            ];
            this.direcciones = [...this.direcciones];
          }
        }

        this.closeAddressContactModal();
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: successText,
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al guardar el contacto:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error?.message || 'No se pudo guardar el contacto.',
        });
      },
    });
  }

  private removeContactFromState(contactId: number): void {
    if (!this.selectedAddress) {
      return;
    }

    if (this.selectedAddress.contact_addresses) {
      this.selectedAddress.contact_addresses =
        this.selectedAddress.contact_addresses.filter(
          (c) => c.id !== contactId
        );
    }

    // Sincronizar con el array de direcciones principal
    const addressIndex = this.direcciones.findIndex(
      (addr) =>
        (addr.id ?? addr.id_address) ===
        (this.selectedAddress!.id ?? this.selectedAddress!.id_address)
    );

    if (
      addressIndex !== -1 &&
      this.direcciones[addressIndex].contact_addresses
    ) {
      this.direcciones[addressIndex].contact_addresses = this.direcciones[
        addressIndex
      ].contact_addresses!.filter((c) => c.id !== contactId);
    }
  }

  private syncSelectedAddress(addresses: CustomerAddress[]): void {
    if (!this.selectedAddress) {
      return;
    }

    const currentAddressId =
      this.selectedAddress.id ?? this.selectedAddress.id_address;
    const updatedAddress = addresses.find(
      (addr) => (addr.id ?? addr.id_address) === currentAddressId
    );

    if (updatedAddress) {
      this.selectedAddress = {
        ...updatedAddress,
        contact_addresses: [...(updatedAddress.contact_addresses ?? [])].map(
          (contact) => ({ ...contact })
        ),
      };
    }
  }

  getContactAddressFullName(contact: ContactAddress): string {
    const parts = [
      contact.contact_name,
      contact.contact_lastname,
      contact.contact_lastname2,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
  }

  /**
   * Búsqueda de dirección por código postal
   */
  onZipcodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const zipcode = target.value?.trim();

    // Limpiar datos anteriores si el código postal cambió
    if (zipcode.length < 5) {
      this.resetZipcodeData();
      return;
    }

    if (zipcode.length === 5 && this.selectedAddress && this.zipcodeService.isValidZipcode(zipcode)) {
      this.loadingZipcode = true;
      this.zipcodeService.getAddressByZipcode(zipcode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: ZipcodeFormData | null) => {
            this.loadingZipcode = false;
            if (data && this.selectedAddress) {
              this.zipcodeData = data;
              this.settlements = data.settlements;
              this.hasMultipleSettlements = data.hasMultipleSettlements;

              // Autocompletar campos
              this.selectedAddress.country = data.country === 'México' ? 'MX' : data.country;
              this.selectedAddress.state = data.state;
              this.selectedAddress.city = data.city;
              this.selectedAddress.municipality = data.municipality;

              // Si solo hay una colonia, seleccionarla automáticamente
              if (data.settlements.length === 1) {
                this.selectedAddress.colony = data.settlements[0];
              } else if (data.settlements.length > 1) {
                // Si hay múltiples, limpiar para que el usuario seleccione
                this.selectedAddress.colony = '';
              }

              this.buildFullAddress();
            } else {
              this.resetZipcodeData();
            }
          },
          error: () => {
            this.loadingZipcode = false;
            this.resetZipcodeData();
          }
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

  getFullAddress(address: CustomerAddress): string {
    const parts = [];

    // Calle y número
    const streetPart = [
      address.street,
      address.outside_number ? `#${address.outside_number}` : '',
      address.inside_number ? `Int. ${address.inside_number}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (streetPart) parts.push(streetPart);

    // Colonia y Municipio
    if (address.colony) parts.push(address.colony);
    if (address.municipality) parts.push(address.municipality);

    // Ciudad, Estado, CP
    const locationPart = [
      address.city,
      address.state,
      address.zipcode ? `C.P. ${address.zipcode}` : '',
    ]
      .filter(Boolean)
      .join(', ');

    if (locationPart) parts.push(locationPart);

    // País
    if (address.country) parts.push(address.country);

    return parts.join(', ');
  }

  /**
   * Construye automáticamente la dirección completa a partir de los campos individuales
   */
  buildFullAddress(): void {
    if (!this.selectedAddress) return;

    const parts = [];

    // Calle y número
    const streetPart = [
      this.selectedAddress.street,
      this.selectedAddress.outside_number
        ? `#${this.selectedAddress.outside_number}`
        : '',
      this.selectedAddress.inside_number
        ? `Int. ${this.selectedAddress.inside_number}`
        : '',
    ]
      .filter(Boolean)
      .join(' ');

    if (streetPart.trim()) {
      parts.push(streetPart);
    }

    // Colonia y Municipio
    if (this.selectedAddress.colony && this.selectedAddress.colony.trim()) {
      parts.push(this.selectedAddress.colony);
    }

    if (this.selectedAddress.municipality && this.selectedAddress.municipality.trim()) {
      parts.push(this.selectedAddress.municipality);
    }

    // Ciudad, Estado, CP
    const locationParts = [];
    if (this.selectedAddress.city && this.selectedAddress.city.trim()) {
      locationParts.push(this.selectedAddress.city);
    }
    if (this.selectedAddress.state && this.selectedAddress.state.trim()) {
      locationParts.push(this.selectedAddress.state);
    }
    if (this.selectedAddress.zipcode && this.selectedAddress.zipcode.trim()) {
      locationParts.push(`C.P. ${this.selectedAddress.zipcode}`);
    }

    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }

    // País
    if (this.selectedAddress.country && this.selectedAddress.country.trim()) {
      parts.push(this.selectedAddress.country);
    }

    this.selectedAddress.address = parts.join(', ');
  }

  // ==================== MÉTODOS AUXILIARES ====================

  getComplianceStatusClass(): string {
    if (!this.compania) return 'bg-secondary';

    const hasTaxData =
      this.compania.tax_regime?.id && this.compania.tax_preferred_concept?.id;

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

    const hasTaxData =
      this.compania.tax_regime?.id && this.compania.tax_preferred_concept?.id;

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
    // En modo edición, la fecha de actualización se actualiza después de guardar
    return 'Edición en curso';
  }

  getDocumentStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      Activo: 'bg-success',
      Inactivo: 'bg-secondary',
      Pendiente: 'bg-warning',
      Cancelado: 'bg-danger',
      Completado: 'bg-success',
      'En Proceso': 'bg-info',
    };
    return statusClasses[status] || 'bg-secondary';
  }

  getContractStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      Activo: 'bg-success',
      Inactivo: 'bg-secondary',
      Vigente: 'bg-success',
      Expirado: 'bg-warning',
      Cancelado: 'bg-danger',
      'En Proceso': 'bg-info',
      Pendiente: 'bg-warning',
    };
    return statusClasses[status] || 'bg-secondary';
  }

  hasContracts(): boolean {
    return this.contratos.length > 0;
  }

  viewDocument(doc: CustomerDocument): void {
    sessionStorage.setItem('lastTab', 'Documentos');
    this.router.navigate(['/document/0/' + doc.id_document + '/0']);
  }

  viewContract(contract: CustomerContract): void {
    sessionStorage.setItem('lastTab', 'Contratos');
    this.router.navigate(['/contracts/2/' + contract.id_contract + '/0']);
  }

  validateRFC(rfc: string): void {
    if (!rfc || !this.compania) return;

    rfc = rfc.toUpperCase().trim();
    const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
    const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;

    if (rfc.length === 12 && regexMoral.test(rfc)) {
      Swal.fire({
        icon: 'success',
        title: 'RFC válido',
        text: 'Este RFC corresponde a una Persona Moral',
        timer: 1500,
        showConfirmButton: false,
      });
    } else if (rfc.length === 13 && regexFisica.test(rfc)) {
      Swal.fire({
        icon: 'success',
        title: 'RFC válido',
        text: 'Este RFC corresponde a una Persona Física',
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      this.compania.tax_id = '';
      Swal.fire({
        icon: 'error',
        title: 'RFC inválido',
        text: 'El RFC no cumple con el formato requerido.',
      });
    }
  }
}
