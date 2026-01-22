import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { ProviderService } from '../provider.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  ProviderContact,
  ProviderAddress,
  ProviderDocument,
  ProviderContract,
  ProviderFullResponse,
  Provider,
  ProviderDetailContact,
  ProviderDetailAddress,
  ContactAddress,
  PhoneCode,
} from '../providers';
import Swal from 'sweetalert2';
import { ZipcodeService, ZipcodeFormData } from '../../../shared/services/zipcode.service';
import { DocumentAttachmentService, DocumentAttachment, DocumentType } from '../../../shared/services/document-attachment.service';

declare var bootstrap: any;

@Component({
  selector: 'app-provider-edit',
  templateUrl: './provider-edit.component.html',
  styleUrls: ['./provider-edit.component.css'],
})
export class ProviderEditComponent implements OnInit {
  // ...existing code...
  editingProviderContact: ProviderDetailContact | null = null;
  isEditingProviderContact: boolean = false;

  isEditing: boolean = true;
  ReadOnly: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  contacts: ProviderContact[] = [];
  addresses: ProviderAddress[] = [];
  xtax_regimes: any[] = [];
  xtax_concepts: any[] = [];
  xcompany_scope: any[] = [];

  availableEquipments: any[] = [];
  documentos: ProviderDocument[] = [];
  contratos: ProviderContract[] = [];
  providerId: string = '';
  currentTab: string = 'info';
  shortname: any = null;
  contactos: ProviderDetailContact[] = [];
  direcciones: ProviderDetailAddress[] = [];
  contact_Address: ContactAddress[] = [];

  companydata: any = {
    id_company: 0,
    company: '',
    shortname: '',
    rfc: '',
    clave: '',
    website: '',
    tax_regime: null,
    tax_preferred_concept: null,
    tax_status: null,
    tax_byrules: null,
    tax_actofincorporation: null,
    id_company_type: 2,
    id_company_scope: [],
    type: 'Provider',
  };

  newContact: any = {
    contact_name: '',
    contact_lastname: '',
    contact_lastname2: '',
    contact_lada: '',
    phone: '',
    contact_extension: '',
    email: '',
    job_position: '',
    contact_department: '',
  };

  newAddress: any = {
    shortname: '',
    address: '',
    zipcode: '',
    street: '',
    outside_number: '',
    inside_number: '',
    city: '',
    county: '', // Colonia/asentamiento
    municipality: '', // Municipio/Alcaldía
    colony: '', // También usado para colonia
    state: '',
    country: '',
    contact_name: '',
    contact_lastname: '',
    contact_lastname2: '',
    phone: '',
    email: '',
    job_position: '',
    contact_department: '',
    equipment: null,
  };
  company: any = {};
  counties: string[] = [];
  cities: string[] = [];
  states: string[] = [];
  countries: string[] = [];
  apiError: boolean = false;

  // Variables para datos de código postal
  zipcodeData: ZipcodeFormData | null = null;
  loadingZipcode = false;
  settlements: string[] = [];
  hasMultipleSettlements = false;

  // Modal states
  showAddressModal = false;
  showContactModal = false;
  selectedAddress: ProviderDetailAddress | null = null;
  selectedContact: ContactAddress | null = null;

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

  // Modes separados para cada modal
  addressModalMode: 'view' | 'edit' | 'create' = 'view';
  contactModalMode: 'view' | 'edit' | 'create' = 'view';

  // Para manejar contactos temporales en direcciones nuevas
  temporaryContacts: ContactAddress[] = [];
  isCreatingNewAddress: boolean = false;

  // Configuración de impuestos
  taxConfiguration: any = null;
  taxRules: any[] = [];
  loadingTaxConfig = false;
  savingTaxConfig = false;
  taxCalculationPreview: any = null;
  useCustomRates = false;

  private destroy$ = new Subject<void>();
  constructor(
    private route: ActivatedRoute,
    private providerService: ProviderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location,
    private zipcodeService: ZipcodeService,
    private documentAttachmentService: DocumentAttachmentService
  ) {}

  ngOnInit(): void {
    this.providerId = this.route.snapshot.paramMap.get('id') || '';
    if (this.providerId) {
      this.loadInitialData();
    }
    // this.providerService.listScopeTypes().subscribe({
    //   next: (data: any) => this.xcompany_scope = data.data,
    //   error: (err: HttpErrorResponse) => console.error('Error al cargar alcances de compañía:', err)
    // });
  }

  loadInitialData(): void {
    this.showLoading();
    Promise.all([
      this.loadProviderData(),
      this.loadDropdownData(),
      // this.loadAvailableEquipments()
    ])
      .then(() => {
        this.hideLoading();
        this.debugDropdownValues();
        // Cargar configuración de impuestos después de cargar datos del proveedor
        this.loadTaxConfiguration();
        this.loadTaxRules();
      })
      .catch((error) => {
        console.error('Error al cargar datos iniciales:', error);
        this.hideLoading();
        this.showErrorAlert('Error al cargar los datos del proveedor');
      });
  }

  showLoading(): void {
    this.loading = true;
    Swal.fire({
      title: 'Cargando...',
      text: 'Obteniendo información del proveedor',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });
  }

  hideLoading(): void {
    this.loading = false;
    Swal.close();
  }

  showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Entendido',
    });
  }

  loadProviderData(): void {
    this.showLoading();

    this.providerService
      .getProvider(Number(this.providerId))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.hideLoading())
      )
      .subscribe({
        next: (response) => this.handleSuccessResponse(response),
        error: (error: HttpErrorResponse) => this.handleErrorResponse(error),
      });
  }

  private handleSuccessResponse(response: ProviderFullResponse): void {
    if (!response || !response.ok || !response.data) {
      this.handleError('Datos de proveedor no válidos');


      return;
    }
    this.company = response.data.compania;
    console.log('Company loaded:', this.company);
    console.log('Company keys:', Object.keys(this.company));
    this.shortname = response.data.compania.shortname;

    // Asegurar que id_company_scope sea un array
    if (!this.company.id_company_scope) {
      this.company.id_company_scope = [];
    } else if (!Array.isArray(this.company.id_company_scope)) {
      this.company.id_company_scope = [this.company.id_company_scope];
    }

    this.contactos = (response.data.contacts || []).map((c: any) => this.mapContactFromApi(c));
    // Mapear direcciones y asegurar que county se mapee a colony
    this.direcciones = (response.data.addresses || []).map((address: any) => ({
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: (address.contact_addresses || []).map((c: any) => this.mapContactAddressFromApi(c))
    }));
    this.documentos = [];
    this.contratos = [];

    // Cargar documentos adjuntos desde el response
    this.loadRequiredDocuments(response.data);
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
        attachable_id: doc.attachable_id || this.company?.id,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }));
      this.loadingDocuments = false;
      return;
    }

    // Fallback: cargar desde API separada
    if (!this.company?.id) {
      this.loadingDocuments = false;
      return;
    }

    this.loadingDocuments = true;
    this.documentAttachmentService
      .getByCompany(this.company.id)
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
   * Mapea un contacto de la API al formato esperado
   */
  private mapContactFromApi(apiContact: any): any {
    return {
      id: apiContact.id ?? apiContact.id_contact ?? 0,
      contact_name: apiContact.contact_name ?? '',
      contact_lastname: apiContact.contact_lastname ?? '',
      contact_lastname2: apiContact.contact_lastname2 ?? undefined,
      contact_lada: apiContact.contact_lada ?? undefined,
      contact_phone: apiContact.contact_phone ?? undefined,
      contact_extension: apiContact.contact_extension ?? undefined,
      contact_email: apiContact.contact_email ?? undefined,
      contact_job_position: apiContact.contact_job_position ?? undefined,
      contact_department: apiContact.contact_department ?? undefined,
    };
  }

  /**
   * Mapea un contacto de dirección de la API al formato esperado
   */
  private mapContactAddressFromApi(apiContact: any): any {
    return {
      id: apiContact.id ?? undefined,
      parent_id: apiContact.parent_id ?? apiContact.id_parent ?? undefined,
      parent_table: apiContact.parent_table ?? undefined,
      contact_name_address: apiContact.contact_name_address ?? apiContact.contact_name ?? '',
      contact_lastname_address: apiContact.contact_lastname_address ?? apiContact.contact_lastname ?? '',
      contact_lada: apiContact.contact_lada ?? undefined,
      contact_phone: apiContact.contact_phone ?? undefined,
      contact_extension: apiContact.contact_extension ?? undefined,
      contact_email: apiContact.contact_email ?? undefined,
      contact_job_position: apiContact.contact_job_position ?? undefined,
      contact_department: apiContact.contact_department ?? undefined,
    };
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
    const reader = new FileReader();
    reader.onload = () => {
      const fakeUrl = `https://storage.example.com/documents/${this.company?.id}/${document.document_type_id}/${file.name}`;

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
   * Verifica el estado de cumplimiento
   */
  private checkComplianceStatus(): void {
    if (!this.company) return;

    const compliance = this.documentAttachmentService.checkFullCompliance(
      this.company,
      this.requiredDocuments
    );

    if (compliance.isCompliant) {
      console.log('Cumplimiento completo');
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

  // Función para recargar solo la dirección seleccionada en el modal
  private refreshSelectedAddress(): void {
    if (!this.selectedAddress || !this.selectedAddress.id) return;

    // Buscar la dirección actualizada en la lista
    const updatedAddress = this.direcciones.find(
      (addr) => addr.id === this.selectedAddress!.id
    );
    if (updatedAddress) {
      // Actualizar la dirección seleccionada con los nuevos datos
      this.selectedAddress = { ...updatedAddress };

      // Forzar detección de cambios
      this.cdr.detectChanges();
    } else {
    }
  }

  // Función para recargar datos completos y luego actualizar la dirección seleccionada
  private reloadDataAndRefreshAddress(): void {
    // Guardar el ID de la dirección seleccionada
    const selectedAddressId = this.selectedAddress?.id;

    // Recargar todos los datos
    this.loadProviderData();

    // Después de que los datos se carguen, actualizar la dirección seleccionada
    if (selectedAddressId) {
      // Usar un pequeño delay para asegurar que los datos estén cargados
      setTimeout(() => {
        const updatedAddress = this.direcciones.find(
          (addr) => addr.id === selectedAddressId
        );

        if (updatedAddress && this.selectedAddress) {
          this.selectedAddress = { ...updatedAddress };

          this.cdr.detectChanges();
        } else {
          console.log(' Address not found or selectedAddress is null');
        }
      }, 200); // Incrementado a 200ms para dar más tiempo
    }
  }

  // Función alternativa que recarga específicamente una dirección desde la API
  private refreshAddressFromAPI(): void {
    if (!this.selectedAddress?.id) return;

    // Hacer una llamada específica para obtener datos actualizados del proveedor
    this.providerService
      .getProvider(Number(this.providerId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ProviderFullResponse) => {
          if (response?.data?.addresses) {
            // Actualizar la lista de direcciones
            this.direcciones = response.data.addresses;

            // Buscar y actualizar la dirección seleccionada
            const updatedAddress = this.direcciones.find(
              (addr) => addr.id === this.selectedAddress!.id
            );
            if (updatedAddress) {
              this.selectedAddress = { ...updatedAddress };
              this.cdr.detectChanges();
            }
          }
        },
        error: (error) => {
          console.error(' Error refreshing address from API:', error);
        },
      });
  }

  // Función combinada que fuerza la actualización completa de la vista
  private forceAddressContactsRefresh(): void {
    // Método 1: Recargar desde API
    this.refreshAddressFromAPI();

    // Método 2: Forzar detección de cambios inmediata
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 100);

    // Método 3: Segunda verificación después de un delay
    setTimeout(() => {
      if (this.selectedAddress?.id) {
        const updatedAddress = this.direcciones.find(
          (addr) => addr.id === this.selectedAddress!.id
        );
        if (
          updatedAddress &&
          JSON.stringify(updatedAddress) !==
            JSON.stringify(this.selectedAddress)
        ) {
          this.selectedAddress = { ...updatedAddress };
          this.cdr.detectChanges();
        }
      }
    }, 500);
  }

  private handleErrorResponse(error: HttpErrorResponse): void {
    console.error('Error al cargar el proveedor:', error);

    let errorMessage = 'No se pudo cargar la información del proveedor';

    if (error.status === 401) {
      errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
      this.router.navigate(['/login']);
    } else if (error.status === 404) {
      errorMessage = 'Proveedor no encontrado';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet';
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

  private handleErrorHtml(htmlMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      html: htmlMessage,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0d6efd',
    });
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0d6efd',
    });
  }

  loadDropdownData(): Promise<void> {
    return new Promise((resolve) => {
      let loadedCount = 0;
      const totalRequests = 4;
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount === totalRequests) resolve();
      };

      this.providerService.getTaxRegimes().subscribe({
        next: (resp: any) => {
          this.xtax_regimes = resp.data;
          checkAllLoaded();
        },
        error: () => checkAllLoaded(),
      });

      this.providerService.getTaxConcepts().subscribe({
        next: (resp: any) => {
          this.xtax_concepts = resp.data;
          checkAllLoaded();
        },
        error: () => checkAllLoaded(),
      });

      this.providerService.getCompanyScopes().subscribe({
        next: (data: any) => {
          this.xcompany_scope = data.data;
          checkAllLoaded();
        },
        error: () => checkAllLoaded(),
      });

      this.providerService.getPhoneCodes().subscribe({
        next: (data: PhoneCode[]) => {
          this.phoneCodes = data;
          checkAllLoaded();
        },
        error: () => checkAllLoaded(),
      });

      // Cargar tipos de documentos
      this.loadDocumentTypes();
    });
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
    console.log('addRequiredDocuments called');
    console.log('selectedDocumentTypeIds:', this.selectedDocumentTypeIds);
    console.log('providerId:', this.providerId);

    if (this.selectedDocumentTypeIds.length === 0 || !this.providerId) {
      console.log('Early return - no docs selected or no provider id');
      return;
    }

    this.addingDocuments = true;
    this.documentAttachmentService
      .createMultipleForCompany(Number(this.providerId), this.selectedDocumentTypeIds)
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

  loadAvailableEquipments(term: string = ''): Promise<void> {
    return new Promise((resolve) => {
      this.providerService.getEquipments(term).subscribe({
        next: (data: any) => {
          this.availableEquipments = data;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  saveProvider(): void {
    this.submitted = true;
    if (!this.company.shortname || !this.company.tax_id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
      });
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar la información del proveedor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateProvider();
      }
    });
  }

  updateProvider(): void {
    Swal.fire({
      title: 'Actualizando...',
      text: 'Guardando cambios del proveedor',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    // Convertir valores booleanos a strings ("1" o "0")
    const convertBooleanToString = (value: any): string => {
      if (value === true || value === 1 || value === '1') return '1';
      if (value === false || value === 0 || value === '0') return '0';
      return '0'; // valor por defecto
    };

    const updated = {
      compania: {
        id_company: this.company.id_company,
        company: this.company.nombre_corto || this.company.company,
        shortname: this.company.shortname,
        tax_id: this.company.tax_id,
        clave: this.company.clave,
        company_type: 'Provider',
        website: this.company.website || null,
        tax_regime_id: this.company.tax_regime.id,
        tax_preferred_concept_id: this.company.tax_preferred_concept.id,
        tax_status: convertBooleanToString(this.company.tax_status),
        tax_byrules: convertBooleanToString(this.company.tax_byrules),
        tax_actofincorporation: convertBooleanToString(
          this.company.tax_actofincorporation
        ),
        id_company_type: this.company.id_company_type || 2,
        id_company_scope: Array.isArray(this.company.id_company_scope)
          ? this.company.id_company_scope
          : [this.company.id_company_scope].filter(Boolean),
      },
    };

    this.providerService
      .updateProviderLegacy(Number(this.providerId), updated)
      .subscribe({
        next: () => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Cambios guardados',
            text: 'Los datos se han actualizado correctamente.',
            timer: 1500,
            showConfirmButton: false,
          });
          // Refrescar los datos después de la actualización exitosa
             this.router.navigate(['/providers/show', this.providerId]);
        },
        error: (error: HttpErrorResponse) => {
          Swal.close();
          console.error('Error al actualizar el proveedor:', error);
          let errorMessage = 'No se pudo actualizar el proveedor.';
          if (error.status === 422 && (error as any).error?.errors) {
            const errorList = Object.values((error as any).error.errors)
              .flat()
              .map((err: any) => `<li>${err}</li>`)
              .join('');
            errorMessage = `<ul>${errorList}</ul>`;
          }
          Swal.fire({ icon: 'error', title: 'Error', html: errorMessage });
        },
      });
  }

  closeModalProperly(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      } else {
        const newModal = new bootstrap.Modal(modalElement);
        newModal.hide();
      }
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((b) => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 150);
    }
  }

  goToList() {
    this.router.navigate(['/providers/list']);
  }
  goBack(): void {
    this.location.back();
  }
  setCurrentTab(tab: string): void {
    this.currentTab = tab;
  }

  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) (backdrop as HTMLElement).remove();
    }
  }

  validateRFC(rfc: string): void {
    if (!rfc) return;
    rfc = rfc.toUpperCase().trim();
    const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;
    const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
    if (rfc.length === 12 && regexMoral.test(rfc)) {
      Swal.fire({
        icon: 'success',
        title: 'RFC válido',
        text: 'Este RFC corresponde a una Persona Moral',
      });
    } else if (rfc.length === 13 && regexFisica.test(rfc)) {
      Swal.fire({
        icon: 'success',
        title: 'RFC válido',
        text: 'Este RFC corresponde a una Persona Física',
      });
    } else {
      this.companydata.rfc = '';
      Swal.fire({
        icon: 'error',
        title: 'RFC inválido',
        text: 'El RFC no cumple con el formato requerido.',
      });
    }
  }

  validatePhoneInput(event: any): void {
    const input = event.target as HTMLInputElement;
    // Extraer solo números del valor de entrada
    let numbers = input.value.replace(/[^0-9]/g, '');

    // Limitar a máximo 10 dígitos
    if (numbers.length > 10) {
      numbers = numbers.substring(0, 10);
    }

    // Guardar solo los números en el modelo (sin formato)
    this.newContact.phone = numbers;

    // Aplicar formato visual +1 (XXX) XXX-XXXX para mostrar al usuario
    // let formattedValue = '';
    // if (numbers.length > 0) {
    //   formattedValue = '+1';
    //   if (numbers.length <= 3) {
    //     formattedValue += ` (${numbers}`;
    //   } else if (numbers.length <= 6) {
    //     formattedValue += ` (${numbers.substring(0, 3)}) ${numbers.substring(3)}`;
    //   } else {
    //     formattedValue += ` (${numbers.substring(0, 3)}) ${numbers.substring(3, 6)}-${numbers.substring(6)}`;
    //   }
    // }

    // Actualizar el valor visual del input
    input.value = numbers;
  }

  debugDropdownValues(): void {}

  getComplianceStatusClass(): string {
    if (!this.company) return 'bg-secondary';

    const hasTaxData =
      this.company.tax_regime?.id && this.company.tax_preferred_concept?.id;

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
    if (!this.company) return 'No disponible';

    const hasTaxData =
      this.company.tax_regime?.id && this.company.tax_preferred_concept?.id;

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
    if (!this.company?.updated_at) {
      return 'No disponible';
    }
    try {
      const date = new Date(this.company.updated_at);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha no válida';
    }
  }

  // Métodos para manejar cambios en los checkboxes de compliance
  onTaxStatusChange(): void {
    this.cdr.detectChanges();
    this.forceComplianceUpdate();
  }

  onTaxActOfIncorporationChange(): void {
    this.cdr.detectChanges();
    this.forceComplianceUpdate();
  }

  onTaxByRulesChange(): void {
    this.cdr.detectChanges();
    this.forceComplianceUpdate();
  }

  onTaxRegimeChange(): void {
    this.cdr.detectChanges();
    this.forceComplianceUpdate();
  }

  onTaxPreferredConceptChange(): void {
    this.cdr.detectChanges();
    this.forceComplianceUpdate();
  }

  private forceComplianceUpdate(): void {
    // Forzar una actualización del estado de compliance
    setTimeout(() => {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }, 50);
  }

  viewDocument(doc: any): void {
    sessionStorage.setItem('lastTab', 'Documentos');
    this.router.navigate(['/document/0/' + doc.id_document + '/0']);
  }

  // Utilidades de formato para tabla de documentos
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-MX');
    } catch {
      return 'N/A';
    }
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—';
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(value);
    } catch {
      return String(value);
    }
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
  // ==================== MÉTODOS PARA CONTRATOS====================
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

  viewContract(contract: any): void {
    sessionStorage.setItem('lastTab', 'Contratos');
    this.router.navigate(['/contracts/2/' + contract.id_contract + '/0']);
  }

  // ==================== MÉTODOS PARA DIRECCIONES ====================

  buildAddress(address: any): string {
    const {
      shortname,
      street,
      outside_number,
      inside_number,
      zipcode,
      city,
      state,
      country,
      county,
      municipality,
      colony,
    } = address;
    const addressParts: string[] = [];
    if (shortname && shortname.trim() !== '') {
      addressParts.push(shortname);
    }
    const streetPart = [
      street,
      outside_number ? `#${outside_number}` : '',
      inside_number ? `Int. ${inside_number}` : '',
    ]
      .filter((p: string) => p && p.trim() !== '')
      .join(' ');
    if (streetPart.trim() !== '') {
      addressParts.push(streetPart);
    }
    // Agregar colonia (colony o county)
    const colonyValue = colony || county;
    if (colonyValue && colonyValue.trim() !== '') {
      addressParts.push(colonyValue);
    }
    // Agregar municipio/alcaldía
    if (municipality && municipality.trim() !== '') {
      addressParts.push(municipality);
    }
    const locationPart = [city, state, zipcode ? `C.P. ${zipcode}` : '']
      .filter((p: string) => p && p.trim() !== '')
      .join(', ');
    if (locationPart.trim() !== '') {
      addressParts.push(locationPart);
    }
    if (country && country.trim() !== '') {
      addressParts.push(country);
    }
    return addressParts.join(', ');
  }

  previewAddress(): string {
    return this.buildAddress(this.newAddress);
  }

  onZipcodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const zipcode = target.value?.trim();

    // Limpiar datos anteriores si el código postal cambió
    if (zipcode.length < 5) {
      this.resetZipcodeData();
      return;
    }

    if (zipcode.length === 5 && this.zipcodeService.isValidZipcode(zipcode)) {
      this.loadingZipcode = true;
      this.apiError = false;
      this.zipcodeService.getAddressByZipcode(zipcode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: ZipcodeFormData | null) => {
            this.loadingZipcode = false;
            if (data) {
              this.zipcodeData = data;
              this.settlements = data.settlements;
              this.hasMultipleSettlements = data.hasMultipleSettlements;

              // Autocompletar campos en newAddress o selectedAddress según el contexto
              if (this.selectedAddress) {
                this.selectedAddress.country = data.country === 'México' ? 'MX' : data.country;
                this.selectedAddress.state = data.state;
                this.selectedAddress.city = data.city;
                this.selectedAddress.municipality = data.municipality; // Municipio/Alcaldía (ej: Iztapalapa)

                if (data.settlements.length === 1) {
                  this.selectedAddress.colony = data.settlements[0]; // Colonia (ej: Valle del Sur)
                  this.selectedAddress.county = data.settlements[0]; // También en county para compatibilidad
                } else if (data.settlements.length > 1) {
                  this.selectedAddress.colony = '';
                  this.selectedAddress.county = '';
                }
                this.updateSelectedAddressField();
              } else {
                this.newAddress.country = data.country === 'México' ? 'MX' : data.country;
                this.newAddress.state = data.state;
                this.newAddress.city = data.city;
                this.newAddress.municipality = data.municipality; // Municipio/Alcaldía (ej: Iztapalapa)

                if (data.settlements.length === 1) {
                  this.newAddress.colony = data.settlements[0]; // Colonia (ej: Valle del Sur)
                  this.newAddress.county = data.settlements[0]; // También en county para compatibilidad
                } else if (data.settlements.length > 1) {
                  this.newAddress.colony = '';
                  this.newAddress.county = '';
                }
                this.updateAddressField();
              }
            } else {
              this.resetZipcodeData();
            }
          },
          error: () => {
            this.loadingZipcode = false;
            this.apiError = true;
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

  updateAddressField(): void {
    this.newAddress.address = this.buildAddress(this.newAddress);
  }

  updateSelectedAddressField(): void {
    if (this.selectedAddress) {
      this.selectedAddress.address = this.buildAddress(this.selectedAddress);
    }
  }

  deleteAddress(address: ProviderDetailAddress): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción. Se eliminará la dirección y todos sus contactos asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando dirección...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading(null);
          },
        });

        this.providerService.deleteAddressV2(address.id).subscribe({
          next: (response) => {
            this.direcciones = this.direcciones.filter(
              (a) => a.id !== address.id
            );
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La dirección ha sido eliminada correctamente.',
              timer: 1500,
              showConfirmButton: false,
            });
            this.loadProviderData(); // Recargar datos
          },
          error: (error: HttpErrorResponse) => {
            Swal.close();
            console.error('❌ Error al eliminar la dirección:', error);
            console.error('❌ Error details:', error.error);
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

  viewAddress(address: ProviderDetailAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || ''
    };
    this.addressModalMode = 'view';
    this.showAddressModal = true;
  }

  editAddress(address: ProviderDetailAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || ''
    };
    this.isCreatingNewAddress = false;
    this.temporaryContacts = []; // No usamos contactos temporales para edición
    this.addressModalMode = 'edit';
    this.showAddressModal = true;
  }
  createAddress(): void {
    this.selectedAddress = {
      id: 0,
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
    };

    // Limpiar contactos temporales y marcar como nueva dirección
    this.temporaryContacts = [];
    this.isCreatingNewAddress = true;
    this.addressModalMode = 'create';
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.selectedAddress = null;
    this.addressModalMode = 'view';
    this.temporaryContacts = [];
    this.isCreatingNewAddress = false;
  }

  saveAddress(): void {
    if (!this.selectedAddress) return;

    // Validar campos requeridos
    if (!this.selectedAddress.shortname || !this.selectedAddress.street) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'El nombre corto y la calle son campos obligatorios.',
      });
      return;
    }

    // Actualizar la dirección completa
    this.selectedAddress.address = this.buildAddress(this.selectedAddress);

    if (this.addressModalMode === 'create') {
      this.createNewAddress();
    } else if (this.addressModalMode === 'edit') {
      this.updateExistingAddress();
    }
  }

  private createNewAddress(): void {
    if (!this.selectedAddress) return;

    // Mostrar loading
    Swal.fire({
      title: 'Creando dirección...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    // Preparar datos para la API v2/address/create (sin contacto)
    const addressData = {
      id_company: Number(this.providerId),
      shortname: this.selectedAddress.shortname,
      address: this.selectedAddress.address,
      zipcode: this.selectedAddress.zipcode || '',
      street: this.selectedAddress.street || '',
      outside_number: this.selectedAddress.outside_number || '',
      inside_number: this.selectedAddress.inside_number || '',
      city: this.selectedAddress.city || '',
      county: this.selectedAddress.colony || this.selectedAddress.county || '', // Colonia
      municipality: this.selectedAddress.municipality || '', // Municipio/Alcaldía
      state: this.selectedAddress.state || '',
      country: this.selectedAddress.country || 'MX',
      id_equipment: null,
    };

    this.providerService.createAddressV2(addressData).subscribe({
      next: (response) => {
        const newAddressId = response.data?.id_address; // Corregido: usar id_address en lugar de id_adress

        if (!newAddressId) {
          console.error(' No address ID found in response:', response);
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al obtener el ID de la dirección creada.',
          });
          return;
        }

        if (newAddressId && this.temporaryContacts.length > 0) {
          // Crear contactos temporales uno por uno
          this.createTemporaryContacts(newAddressId, 0);
        } else {
          // Si no hay contactos temporales, completar el proceso
          this.completeAddressCreation();
        }
      },
      error: (error: HttpErrorResponse) => {
        Swal.close();
        console.error('Error al crear dirección:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la dirección. Intente nuevamente.',
        });
      },
    });
  }

  private createTemporaryContacts(addressId: number, index: number): void {
    if (index >= this.temporaryContacts.length) {
      this.completeAddressCreation();
      return;
    }

    const contact = this.temporaryContacts[index];

    const contactData = {
      parent_table: 'addresses',
      parent_id: addressId,
      contact_name: contact.contact_name_address,
      contact_lastname: contact.contact_lastname_address,
      contact_lastname2: '',
      contact_lada: contact.contact_lada || '',
      contact_phone: this.getCleanPhoneNumber(contact.contact_phone),
      contact_extension: contact.contact_extension || '',
      contact_email: contact.contact_email || '',
      contact_job_position: contact.contact_job_position || '',
      contact_department: contact.contact_department || '',
    };

    this.providerService.createContactV2(contactData).subscribe({
      next: (response) => {
        // Continuar con el siguiente contacto
        this.createTemporaryContacts(addressId, index + 1);
      },
      error: (error: HttpErrorResponse) => {
        // Continuar con el siguiente contacto aunque este falle
        this.createTemporaryContacts(addressId, index + 1);
      },
    });
  }

  private updateExistingAddress(): void {
    if (!this.selectedAddress) return;

    // Mostrar loading
    Swal.fire({
      title: 'Actualizando dirección...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    // Preparar datos para la API v2/address/update (sin contacto)
    const addressData = {
      id_company: Number(this.providerId),
      shortname: this.selectedAddress.shortname,
      address: this.selectedAddress.address,
      zipcode: this.selectedAddress.zipcode || '',
      street: this.selectedAddress.street || '',
      outside_number: this.selectedAddress.outside_number || '',
      inside_number: this.selectedAddress.inside_number || '',
      city: this.selectedAddress.city || '',
      county: this.selectedAddress.colony || this.selectedAddress.county || '', // Colonia
      municipality: this.selectedAddress.municipality || '', // Municipio/Alcaldía
      state: this.selectedAddress.state || '',
      country: this.selectedAddress.country || 'MX',
      contact_name: '',
      contact_lastname: '',
      contact_phone: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
      id_equipment: null,
    };

    this.providerService
      .updateAddressV2(this.selectedAddress.id, addressData)
      .subscribe({
        next: (response) => {
          this.completeAddressUpdate();
        },
        error: (error: HttpErrorResponse) => {
          Swal.close();
          console.error('Error al actualizar dirección:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la dirección. Intente nuevamente.',
          });
        },
      });
  }

  private completeAddressCreation(): void {
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Dirección creada',
      text: 'La dirección se ha creado exitosamente.',
      timer: 1500,
      showConfirmButton: false,
    });
    this.closeAddressModal();
    this.loadProviderData(); // Recargar datos para mostrar nueva dirección
  }

  private completeAddressUpdate(): void {
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'Dirección actualizada',
      text: 'La dirección se ha actualizada exitosamente.',
      timer: 1500,
      showConfirmButton: false,
    });
    this.closeAddressModal();
    this.loadProviderData(); // Recargar datos para mostrar cambios
  } // ==================== MÉTODOS PARA CONTACTOS DE DIRECCIONES ====================

  createAddressContact(): void {
    if (!this.selectedAddress) return;

    this.selectedContact = {
      contact_name_address: '',
      contact_lastname_address: '',
      contact_phone: '',
      contact_extension: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    };
    this.contactModalMode = 'create';
    this.showContactModal = true;
  }

  editAddressContact(contact: ContactAddress): void {
    this.selectedContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.contactModalMode = 'edit';
    this.showContactModal = true;
  }

  saveAddressContact(): void {
    if (!this.selectedContact || !this.selectedAddress) return;

    // Validar campos requeridos
    if (
      !this.selectedContact.contact_name_address ||
      !this.selectedContact.contact_lastname_address
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'El nombre y apellido son campos obligatorios.',
      });
      return;
    }

    if (this.isCreatingNewAddress) {
      // Para nueva dirección: guardar temporalmente
      this.saveTemporaryContact();
    } else {
      // Para dirección existente: guardar directamente en la API
      if (this.contactModalMode === 'create') {
        this.createNewAddressContact();
      } else if (this.contactModalMode === 'edit') {
        this.updateAddressContact();
      }
    }
  }

  private saveTemporaryContact(): void {
    if (!this.selectedContact) return;

    if (this.contactModalMode === 'create') {
      // Agregar a la lista temporal
      const tempContact: ContactAddress = {
        contact_name_address: this.selectedContact.contact_name_address,
        contact_lastname_address: this.selectedContact.contact_lastname_address,
        contact_lada: this.selectedContact.contact_lada || '',
        contact_phone: this.selectedContact.contact_phone || '',
        contact_extension: this.selectedContact.contact_extension || '',
        contact_email: this.selectedContact.contact_email || '',
        contact_job_position: this.selectedContact.contact_job_position || '',
        contact_department: this.selectedContact.contact_department || '',
      };

      this.temporaryContacts.push(tempContact);

      Swal.fire({
        icon: 'success',
        title: 'Contacto agregado',
        text: 'El contacto se ha agregado temporalmente.',
        timer: 1000,
        showConfirmButton: false,
      });

      // Forzar actualización de la vista
      this.cdr.detectChanges();
    } else if (this.contactModalMode === 'edit') {
      // Actualizar en la lista temporal
      const index = this.temporaryContacts.findIndex(
        (c) => c.id === this.selectedContact!.id
      );
      if (index !== -1) {
        this.temporaryContacts[index] = {
          ...this.selectedContact,
          contact_name_address: this.selectedContact.contact_name_address,
          contact_lastname_address:
            this.selectedContact.contact_lastname_address,
          contact_lada: this.selectedContact.contact_lada || '',
          contact_phone: this.selectedContact.contact_phone || '',
          contact_extension: this.selectedContact.contact_extension || '',
          contact_email: this.selectedContact.contact_email || '',
          contact_job_position: this.selectedContact.contact_job_position || '',
          contact_department: this.selectedContact.contact_department || '',
        };

        Swal.fire({
          icon: 'success',
          title: 'Contacto actualizado',
          text: 'El contacto se ha actualizado temporalmente.',
          timer: 1000,
          showConfirmButton: false,
        });

        // Forzar actualización de la vista
        this.cdr.detectChanges();
      }
    }

    this.closeContactModal();
  }

  private createNewAddressContact(): void {
    if (!this.selectedContact || !this.selectedAddress) return;

    Swal.fire({
      title: 'Creando contacto...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    const contactData = {
      parent_table: 'addresses',
      parent_id: this.selectedAddress.id,
      contact_name: this.selectedContact.contact_name_address,
      contact_lastname: this.selectedContact.contact_lastname_address,
      contact_lastname2: '',
      contact_lada: this.selectedContact.contact_lada || '',
      contact_phone: this.getCleanPhoneNumber(
        this.selectedContact.contact_phone
      ),
      contact_extension: this.selectedContact.contact_extension || '',
      contact_email: this.selectedContact.contact_email || '',
      contact_job_position: this.selectedContact.contact_job_position || '',
      contact_department: this.selectedContact.contact_department || '',
    };

    this.providerService.createContactV2(contactData).subscribe({
      next: (response) => {
        Swal.close();
        Swal.fire({
          icon: 'success',
          title: 'Contacto creado',
          text: 'El contacto se ha creado exitosamente.',
          timer: 1500,
          showConfirmButton: false,
        });
        this.closeContactModal();
        this.forceAddressContactsRefresh(); // Usar la función combinada de refresco
      },
      error: (error: HttpErrorResponse) => {
        Swal.close();
        console.error('Error al crear contacto de dirección:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el contacto. Intente nuevamente.',
        });
      },
    });
  }

  private updateAddressContact(): void {
    if (
      !this.selectedContact ||
      !this.selectedAddress ||
      !this.selectedContact.id
    )
      return;

    Swal.fire({
      title: 'Actualizando contacto...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      },
    });

    const contactData = {
      parent_table: 'addresses',
      parent_id: this.selectedAddress.id,
      contact_name: this.selectedContact.contact_name_address,
      contact_lastname: this.selectedContact.contact_lastname_address,
      contact_lastname2: '',
      contact_lada: this.selectedContact.contact_lada || '',
      contact_phone: this.getCleanPhoneNumber(
        this.selectedContact.contact_phone
      ),
      contact_extension: this.selectedContact.contact_extension || '',
      contact_email: this.selectedContact.contact_email || '',
      contact_job_position: this.selectedContact.contact_job_position || '',
      contact_department: this.selectedContact.contact_department || '',
    };

    this.providerService
      .updateContactV2(this.selectedContact.id, contactData)
      .subscribe({
        next: (response) => {
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Contacto actualizado',
            text: 'El contacto se ha actualizado exitosamente.',
            timer: 1500,
            showConfirmButton: false,
          });
          this.closeContactModal();
          this.forceAddressContactsRefresh(); // Usar la función combinada de refresco
        },
        error: (error: HttpErrorResponse) => {
          Swal.close();
          console.error('Error al actualizar contacto de dirección:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el contacto. Intente nuevamente.',
          });
        },
      });
  }

  deleteAddressContact(contact: ContactAddress): void {
    if (!contact.id) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.isCreatingNewAddress) {
          // Eliminar de la lista temporal
          this.temporaryContacts = this.temporaryContacts.filter(
            (c) => c.id !== contact.id
          );
          Swal.fire({
            icon: 'success',
            title: 'Contacto eliminado',
            text: 'El contacto ha sido eliminado temporalmente.',
            timer: 1500,
            showConfirmButton: false,
          });

          // Forzar actualización de la vista
          this.cdr.detectChanges();
        } else {
          // Mostrar loading
          Swal.fire({
            title: 'Eliminando contacto...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading(null);
            },
          });

          // Llamar API V2 para eliminar contacto de dirección existente
          this.providerService.deleteContactV2(contact.id).subscribe({
            next: (response) => {
              Swal.fire({
                icon: 'success',
                title: 'Contacto eliminado',
                text: 'El contacto ha sido eliminado exitosamente.',
                timer: 1500,
                showConfirmButton: false,
              });
              this.forceAddressContactsRefresh(); // Usar la función combinada de refresco
            },
            error: (error: HttpErrorResponse) => {
              console.error('❌ Error al eliminar contacto:', error);
              console.error('❌ Error details:', error.error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el contacto. Intente nuevamente.',
              });
            },
          });
        }
      }
    });
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.selectedContact = null;
    this.contactModalMode = 'view';

    // Forzar actualización de la vista para reflejar cambios
    this.cdr.detectChanges();
  }

  getContactAddressFullName(contact: ContactAddress): string {
    const parts = [
      contact.contact_name_address,
      contact.contact_lastname_address,
    ].filter(Boolean);

    return parts.join(' ') || 'Sin nombre';
  }

  // Función helper para obtener la lista correcta de contactos
  getAddressContacts(): ContactAddress[] {
    if (this.isCreatingNewAddress) {
      return this.temporaryContacts;
    } else {
      const contacts = this.selectedAddress?.contact_addresses || [];
      return contacts;
    }
  }

  // Función helper para saber si estamos editando un contacto temporal
  isEditingTemporaryContact(contact: ContactAddress): boolean {
    return (
      this.isCreatingNewAddress &&
      this.temporaryContacts.some((c) => c.id === contact.id)
    );
  }

  // ==================== MÉTODOS PARA CONTACTOS ====================

  viewContact(contact: ContactAddress): void {
    this.selectedContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.contactModalMode = 'view';
    this.showContactModal = true;
  }

  editContact(contact: ContactAddress): void {
    this.selectedContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.contactModalMode = 'edit';
    this.showContactModal = true;
  }

  createContact(): void {
    this.selectedContact = {
      contact_name_address: '',
      contact_lastname_address: '',
      contact_phone: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: '',
    };
    this.contactModalMode = 'create';
    this.showContactModal = true;
  }

  saveContact(): void {
    if (
      !this.newContact.contact_name ||
      !this.newContact.contact_lastname ||
      !this.newContact.email
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Todos los campos obligatorios deben ser llenados.',
      });
      return;
    }

    if (this.isEditingProviderContact && this.editingProviderContact) {
      // Guardar cambios en el contacto existente
      Swal.fire({
        title: 'Guardando...',
        text: 'Actualizando contacto',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
        },
      });

      const payload = {
        contact_name: this.newContact.contact_name,
        contact_lastname: this.newContact.contact_lastname,
        contact_lada: this.newContact.contact_lada,
        contact_phone: this.getCleanPhoneNumber(this.newContact.phone),
        contact_extension: this.newContact.contact_extension,
        contact_email: this.newContact.email,
        contact_job_position: this.newContact.job_position,
        contact_department: this.newContact.contact_department,
        parent_id: this.providerId ? Number(this.providerId) : null,
        parent_table: 'companies',
        id: this.editingProviderContact?.id,
      };

      this.providerService
        .updateContact(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Contacto actualizado',
              text: 'El contacto se ha actualizado correctamente.',
              timer: 1500,
              showConfirmButton: false,
            });
            this.newContact = {
              contact_name: '',
              contact_lastname: '',
              contact_lastname2: '',
              contact_lada: '',
              phone: '',
              contact_extension: '',
              email: '',
              job_position: '',
              contact_department: '',
            };
            this.isEditingProviderContact = false;
            this.editingProviderContact = null;
            this.closeModal('addContactModal');
            this.loadProviderData();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al actualizar el contacto:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el contacto',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#0d6efd',
            });
          },
        });
    } else {
      // Agregar nuevo contacto
      Swal.fire({
        title: 'Guardando...',
        text: 'Creando contacto',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
        },
      });

      const payload = {
        contact_name: this.newContact.contact_name,
        contact_lastname: this.newContact.contact_lastname,
        contact_lada: this.newContact.contact_lada,
        contact_phone: this.getCleanPhoneNumber(this.newContact.phone),
        contact_extension: this.newContact.contact_extension,
        contact_email: this.newContact.email,
        contact_job_position: this.newContact.job_position,
        contact_department: this.newContact.contact_department,
        parent_id:
          this.newContact.parent_id ??
          (this.providerId ? Number(this.providerId) : null),
        parent_table: 'companies',
      };

      this.providerService
        .createContact(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Contacto agregado',
              text: 'El contacto se ha guardado correctamente.',
              timer: 1500,
              showConfirmButton: false,
            });
            this.newContact = {
              contact_name: '',
              contact_lastname: '',
              contact_lastname2: '',
              contact_lada: '',
              phone: '',
              contact_extension: '',
              email: '',
              job_position: '',
              contact_department: '',
            };
            this.isEditingProviderContact = false;
            this.editingProviderContact = null;
            this.closeModal('addContactModal');
            this.loadProviderData();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al crear el contacto:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo crear el contacto',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#0d6efd',
            });
          },
        });

      return;
    }
    this.newContact = {
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      contact_lada: '',
      phone: '',
      contact_extension: '',
      email: '',
      job_position: '',
      contact_department: '',
    };
    this.isEditingProviderContact = false;
    this.editingProviderContact = null;
    this.closeModal('addContactModal');
    this.cdr.detectChanges();
  }

  deleteContact(contactOrId: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      // Si es un número, es un id_contact (contacto general)
      if (typeof contactOrId === 'number') {
        this.providerService.deleteContact(contactOrId).subscribe({
          next: () => {
            this.contactos = this.contactos.filter((c) => c.id !== contactOrId);
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
      } else if (
        contactOrId &&
        typeof contactOrId === 'object' &&
        contactOrId.contact_name_address !== undefined
      ) {
        // Es un contacto de dirección (ContactAddress)
        if (
          this.selectedAddress &&
          Array.isArray(this.selectedAddress.contact_addresses)
        ) {
          this.selectedAddress.contact_addresses =
            this.selectedAddress.contact_addresses.filter(
              (c: ContactAddress) => c !== contactOrId
            );
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El contacto ha sido eliminado correctamente.',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }
    });
  }

  editProviderContact(contact: ProviderDetailContact): void {
    this.editingProviderContact = { ...contact };
    this.isEditingProviderContact = true;
    // Rellenar el formulario del modal de contacto con los datos del contacto a editar
    this.newContact = {
      contact_name: contact.contact_name,
      contact_lastname: contact.contact_lastname,
      contact_lastname2: '',
      phone: contact.contact_phone,
      contact_extension: contact.contact_extension || '',
      email: contact.contact_email,
      job_position: contact.contact_job_position,
      contact_department: contact.contact_department,
      parent_id: contact.id,
      parent_table: 'companies',
    };
    // Abrir el modal de contacto
    const modalElement = document.getElementById('addContactModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();

      // Limpiar el teléfono de cualquier formato después de que se cargue el modal
      setTimeout(() => {
        const phoneInput = modalElement.querySelector(
          'input[name="phone"]'
        ) as HTMLInputElement;
        if (phoneInput && contact.contact_phone) {
          // Mostrar solo números sin formato
          const numbers = contact.contact_phone.replace(/[^0-9]/g, '');
          phoneInput.value = numbers;
        }
      }, 200);
    }
  }

  openAddContactModal(): void {
    this.isEditingProviderContact = false;
    this.editingProviderContact = null;
    this.newContact = {
      contact_name: '',
      contact_lastname: '',
      contact_lastname2: '',
      contact_lada: '',
      phone: '',
      contact_extension: '',
      email: '',
      job_position: '',
      contact_department: '',
      parent_id: this.providerId ? Number(this.providerId) : null,
      parent_table: 'companies',
    };
    const modalElement = document.getElementById('addContactModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();
    }
  }

  formatPhone(event: any, field: 'contact_phone' | 'phone_address'): void {
    const input = event.target as HTMLInputElement;
    // Extraer solo números del valor de entrada
    let numbers = input.value.replace(/[^0-9]/g, '');

    // Limitar a máximo 10 dígitos
    if (numbers.length > 10) {
      numbers = numbers.substring(0, 10);
    }

    // Guardar solo los números en el modelo (sin formato) según el campo
    if (field === 'contact_phone') {
      if (this.selectedContact) {
        this.selectedContact.contact_phone = numbers;
      }
    } else {
      this.newContact.phone = numbers;
    }

    // Actualizar el valor visual del input
    input.value = numbers;
  }

  /**
   * Permite solo números en el input
   */
  onlyNumbers(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '');
  }

  // Función auxiliar para formatear números de teléfono para mostrar en la UI
  formatPhoneForDisplay(phoneNumber: string | undefined): string {
    if (!phoneNumber) return 'N/A';

    // Extraer solo números
    const numbers = phoneNumber.replace(/[^0-9]/g, '');

    // Si no hay números, retornar N/A
    if (numbers.length === 0) return 'N/A';

    // Retornar el número sin formato especial
    return numbers;
  }

  // Función para obtener solo los números sin formato (para enviar a la API)
  getCleanPhoneNumber(phoneNumber: string | undefined): string {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/[^0-9]/g, '');
  }

  // Función para limpiar el input de teléfono cuando se carga un valor existente
  formatPhoneInputOnLoad(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input && input.value) {
      // Extraer solo números del valor actual (limpiar cualquier formato previo)
      const numbers = input.value.replace(/[^0-9]/g, '');
      // Mostrar solo los números sin formato
      input.value = numbers;
    }
  }

  // Manejar cambios en checkboxes de scope
  onScopeChange(scopeValue: number, event: any): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (!this.company.id_company_scope) {
      this.company.id_company_scope = [];
    }

    if (isChecked) {
      if (!this.company.id_company_scope.includes(scopeValue)) {
        this.company.id_company_scope.push(scopeValue);
      }
    } else {
      const index = this.company.id_company_scope.indexOf(scopeValue);
      if (index > -1) {
        this.company.id_company_scope.splice(index, 1);
      }
    }
  }

  // Verificar si un scope está seleccionado
  isScopeChecked(scopeValue: number): boolean {
    return this.company.id_company_scope?.includes(scopeValue) || false;
  }

  // ==================== CONFIGURACIÓN DE IMPUESTOS ====================

  /**
   * Carga la configuración de impuestos del proveedor
   */
  loadTaxConfiguration(): void {
    if (!this.providerId) return;

    this.loadingTaxConfig = true;
    this.providerService.getTaxConfiguration(Number(this.providerId)).subscribe({
      next: (response: any) => {
        if (response.ok) {
          this.taxConfiguration = response.data;
          this.useCustomRates = response.data.configuration?.use_custom_rates || false;

          // Calcular preview inicial
          this.calculateTaxPreview(10000);
        }
        this.loadingTaxConfig = false;
      },
      error: (err) => {
        console.error('Error al cargar configuración de impuestos:', err);
        this.loadingTaxConfig = false;
      }
    });
  }

  /**
   * Carga las reglas de impuestos disponibles
   */
  loadTaxRules(): void {
    this.providerService.getTaxRules().subscribe({
      next: (response: any) => {
        this.taxRules = response.data || [];
      },
      error: (err) => {
        console.error('Error al cargar reglas de impuestos:', err);
      }
    });
  }

  /**
   * Obtiene el tipo de persona basado en el RFC
   */
  getPersonType(): 'fisica' | 'moral' | null {
    const rfc = this.company?.rfc || this.companydata?.rfc;
    return this.providerService.getPersonTypeFromRfc(rfc);
  }

  /**
   * Obtiene el nombre del tipo de persona
   */
  getPersonTypeName(): string {
    const type = this.getPersonType();
    if (!type) return 'No determinado';
    return this.providerService.getPersonTypeName(type);
  }

  /**
   * Reglas filtradas por tipo de persona
   */
  getFilteredTaxRules(): any[] {
    const personType = this.getPersonType();
    if (!personType) return this.taxRules.filter(r => r.active);
    return this.taxRules.filter(r => r.active && r.person_type === personType);
  }

  /**
   * Cuando cambia la regla de impuestos seleccionada
   */
  onTaxRuleChange(ruleId: number | null): void {
    if (!this.taxConfiguration) {
      this.taxConfiguration = { configuration: {} };
    }
    if (!this.taxConfiguration.configuration) {
      this.taxConfiguration.configuration = {};
    }
    this.taxConfiguration.configuration.tax_rule_id = ruleId;

    // Actualizar tasas efectivas si se selecciona una regla
    if (ruleId) {
      const rule = this.taxRules.find(r => r.id === ruleId);
      if (rule) {
        this.taxConfiguration.effective_rates = {
          vat_rate: rule.vat_rate,
          vat_retention_applies: rule.vat_retention_applies,
          vat_retention_rate: rule.vat_retention_rate,
          isr_retention_applies: rule.isr_retention_applies,
          isr_retention_rate: rule.isr_retention_rate,
          source: 'rule'
        };
      }
    }

    this.calculateTaxPreview(10000);
  }

  /**
   * Toggle para usar tasas personalizadas
   */
  toggleCustomRates(): void {
    this.useCustomRates = !this.useCustomRates;
    if (!this.taxConfiguration) {
      this.taxConfiguration = { configuration: {} };
    }
    if (!this.taxConfiguration.configuration) {
      this.taxConfiguration.configuration = {};
    }
    this.taxConfiguration.configuration.use_custom_rates = this.useCustomRates;

    if (this.useCustomRates && !this.taxConfiguration.configuration.custom_vat_rate) {
      // Inicializar con valores por defecto
      this.taxConfiguration.configuration.custom_vat_rate = 0.16;
      this.taxConfiguration.configuration.custom_vat_retention_applies = false;
      this.taxConfiguration.configuration.custom_vat_retention_rate = 0;
      this.taxConfiguration.configuration.custom_isr_retention_applies = false;
      this.taxConfiguration.configuration.custom_isr_retention_rate = 0;
    }

    this.calculateTaxPreview(10000);
  }

  /**
   * Calcula preview de impuestos
   */
  calculateTaxPreview(subtotal: number): void {
    if (!this.providerId) return;

    this.providerService.calculateTaxes(Number(this.providerId), subtotal).subscribe({
      next: (response: any) => {
        if (response.ok) {
          this.taxCalculationPreview = response.data;
        }
      },
      error: (err) => {
        console.error('Error al calcular impuestos:', err);
      }
    });
  }

  /**
   * Guarda la configuración de impuestos
   */
  saveTaxConfiguration(): void {
    if (!this.providerId || !this.taxConfiguration?.configuration) return;

    this.savingTaxConfig = true;
    const config = this.taxConfiguration.configuration;

    this.providerService.updateTaxConfiguration(Number(this.providerId), {
      tax_rule_id: config.tax_rule_id || null,
      use_custom_rates: this.useCustomRates,
      custom_vat_rate: this.useCustomRates ? config.custom_vat_rate : null,
      custom_vat_retention_applies: this.useCustomRates ? config.custom_vat_retention_applies : null,
      custom_vat_retention_rate: this.useCustomRates ? config.custom_vat_retention_rate : null,
      custom_isr_retention_applies: this.useCustomRates ? config.custom_isr_retention_applies : null,
      custom_isr_retention_rate: this.useCustomRates ? config.custom_isr_retention_rate : null,
      default_cfdi_use_id: config.default_cfdi_use_id || null,
      notes: config.notes || null,
    }).subscribe({
      next: (response: any) => {
        this.savingTaxConfig = false;
        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Guardado',
            text: 'Configuración de impuestos actualizada correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadTaxConfiguration();
        }
      },
      error: (err) => {
        this.savingTaxConfig = false;
        console.error('Error al guardar configuración de impuestos:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar la configuración de impuestos'
        });
      }
    });
  }

  /**
   * Formatea una tasa como porcentaje
   */
  formatRate(rate: number): string {
    return this.providerService.formatRateAsPercentage(rate);
  }
}
