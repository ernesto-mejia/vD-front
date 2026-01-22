import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from "../../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { ProviderService } from '../provider.service';
import { DocumentAttachmentService, DocumentAttachment } from '../../../shared/services/document-attachment.service';
import {
  Provider,
  ProviderAddress,
  ProviderContact,
  ProviderDocument,
  ProviderContract,
  ProviderFullResponse,
  ProviderDetailData,
  ProviderDetailContact,
  ProviderDetailAddress,
  ContactAddress,
  TaxAddress,
  PhoneCode,
} from '../providers';

// Tipo de pestañas disponibles
type TabType = 'info' | 'contacts' | 'addresses' | 'taxData' | 'documents' | 'contracts' | 'tax_address';

@Component({
  selector: 'app-provider-show',
  templateUrl: './provider-show.component.html',
  styleUrl: './provider-show.component.css'
})
export class ProviderShowComponent implements OnInit, OnDestroy {
  loading = true;

  company: Provider | null = null;
  shortname: any = null;
  contactos: ProviderDetailContact[] = [];
  direcciones: ProviderDetailAddress[] = [];
  documentos: ProviderDocument[] = [];
  contratos: ProviderContract[] = [];
  tax_address: TaxAddress = {} as TaxAddress;
  xcompany_scope: any[] = [];

  // Documentos de cumplimiento
  requiredDocuments: DocumentAttachment[] = [];
  loadingDocuments = false;

  providerId = '';
  // Tab activa (tipo any para evitar advertencias de comparación en plantilla)
  activeTab: TabType = 'info';

  // Modal states
  showAddressModal = false;
  showContactModal = false;
  selectedAddress: ProviderDetailAddress | null = null;
  selectedContact: ContactAddress | null = null;
  modalMode: 'view' | 'edit' | 'create' = 'view';

  // Códigos telefónicos internacionales
  phoneCodes: PhoneCode[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly providerService: ProviderService,
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

  private initializeComponent(): void {
    // Cargar los tipos de scope disponibles
    this.providerService.listScopeTypes().subscribe({
      next: (data: any) => this.xcompany_scope = data.data,
      error: (err: HttpErrorResponse) => console.error('Error al cargar alcances de compañía:', err)
    });

    // Cargar códigos telefónicos
    this.providerService.getPhoneCodes().subscribe({
      next: (data: PhoneCode[]) => this.phoneCodes = data,
      error: (err: HttpErrorResponse) => console.error('Error al cargar códigos telefónicos:', err)
    });

    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.providerId = params['id'];
          if (this.providerId) {
            this.loadProviderData();
          } else {
            this.handleError('ID de proveedor no válido');
          }
        },
        error: (error) => {
          console.error('Error al obtener parámetros de ruta:', error);
          this.handleError('Error al cargar los datos del proveedor');
        }
      });
  }

  private showLoading(): void {
    this.loading = true;
    Swal.fire({
      title: 'Cargando...',
      text: 'Obteniendo información del proveedor',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading(null);
      }
    });
  }

  private hideLoading(): void {
    this.loading = false;
    Swal.close();
  }

  loadProviderData(): void {
    this.showLoading();

    this.providerService.getProvider(Number(this.providerId))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.hideLoading())
      )
      .subscribe({
        next: (response) => this.handleSuccessResponse(response ),
        error: (error: HttpErrorResponse) => this.handleErrorResponse(error)
      });
  }

  private handleSuccessResponse(response: ProviderFullResponse): void {
    if (!response || !response.ok || !response.data) {
      this.handleError('Datos de proveedor no válidos');
      return;
    }

    this.company = response.data.compania;
    this.shortname = response.data.compania.shortname;
    this.contactos = (response.data.contacts || []).map((c: any) => this.mapContactFromApi(c));
    // Mapear direcciones y asegurar que county se mapee a colony
    this.direcciones = (response.data.addresses || []).map((address: any) => ({
      ...address,
      colony: address.colony || address.county || '',
      contact_addresses: (address.contact_addresses || []).map((c: any) => this.mapContactAddressFromApi(c))
    }));
    this.documentos = [];
    this.contratos = [];
    this.tax_address = (response.data as any).tax_address || [];

    // Cargar documentos de cumplimiento desde el response
    this.loadDocumentAttachments(response.data);
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
        attachable_id: doc.attachable_id || (this.company as any)?.id_company || (this.company as any)?.id,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }));
      this.loadingDocuments = false;
      return;
    }

    // Fallback: cargar desde API separada
    const companyId = (this.company as any)?.id_company || (this.company as any)?.id;
    if (!companyId) {
      this.loadingDocuments = false;
      return;
    }

    this.loadingDocuments = true;
    this.documentAttachmentService.getByCompany(companyId)
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
    }

    this.handleError(errorMessage);
  }

  private handleError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#0d6efd'
    });
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.location.back();
  }

  goToEdit(): void {
    if (!this.providerId) {
      this.handleError('No se puede editar: ID de proveedor no válido');
      return;
    }
    this.router.navigate(['/providers/edit', this.providerId]);
  }

  getContactFullName(contact: ProviderDetailContact): string {
    const parts = [
      contact.contact_name,
      contact.contact_lastname
    ].filter(Boolean);

    return parts.join(' ') || 'Sin nombre';
  }

  getContactAddressFullName(contact: ContactAddress): string {
    const parts = [
      contact.contact_name_address,
      contact.contact_lastname_address
    ].filter(Boolean);

    return parts.join(' ') || 'Sin nombre';
  }

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

  getFullAddress(address: ProviderDetailAddress): string {
    const parts = [
      address.address,
      address.city,
      address.state,
      address.zipcode,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  // ==================== MÉTODOS PARA DIRECCIONES ====================

  viewAddress(address: ProviderDetailAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || ''
    };
    this.modalMode = 'view';
    this.showAddressModal = true;
  }

  editAddress(address: ProviderDetailAddress): void {
    this.selectedAddress = {
      ...address,
      colony: address.colony || address.county || ''
    };
    this.modalMode = 'edit';
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
      contact_addresses: []
    };
    this.modalMode = 'create';
    this.showAddressModal = true;
  }

  deleteAddress(address: ProviderDetailAddress): void {
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
      if (result.isConfirmed) {
        this.providerService.deleteAddress(address.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Eliminado',
                text: 'La dirección ha sido eliminada',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProviderData();
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error al eliminar dirección:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la dirección',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
              });
            }
          });

        Swal.fire({
          title: 'Eliminado',
          text: 'La dirección ha sido eliminada',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
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
    if (!this.selectedAddress) return;

    if (this.modalMode === 'create') {
      Swal.fire({
        title: 'Guardando...',
        text: 'Creando dirección',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
        }
      });

      this.providerService.createAddress(Number(this.providerId), this.selectedAddress)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Dirección creada correctamente',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeAddressModal();
        this.loadProviderData();
          },
          error: (error: HttpErrorResponse) => {
        console.error('Error al crear dirección:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la dirección',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#0d6efd'
        });
          }
        });
      return;
    } else if (this.modalMode === 'edit') {
      Swal.fire({
        title: 'Guardando...',
        text: 'Actualizando dirección',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
        }
            });

            this.providerService.updateAddress(Number(this.providerId), this.selectedAddress)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Dirección actualizada correctamente',
              timer: 2000,
              showConfirmButton: false
            });
            this.closeAddressModal();
            this.loadProviderData();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error al actualizar dirección:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar la dirección',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#0d6efd'
            });
          }
        });
            return;
    }

    this.closeAddressModal();
    // Recargar datos después de guardar
    this.loadProviderData();
  }

  // ==================== MÉTODOS PARA CONTACTOS DE DIRECCIONES ====================

  viewContact(contact: ContactAddress): void {
    this.selectedContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.modalMode = 'view';
    this.showContactModal = true;
  }

  editContact(contact: ContactAddress): void {
    this.selectedContact = {
      ...contact,
      // Limpiar el teléfono de cualquier formato previo
      contact_phone: contact.contact_phone ? contact.contact_phone.replace(/[^0-9]/g, '') : ''
    };
    this.modalMode = 'edit';
    this.showContactModal = true;
  }

  createContact(): void {
    this.selectedContact = {
      contact_name_address: '',
      contact_lastname_address: '',
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
      if (result.isConfirmed) {
        this.providerService.deleteContactAddress(this.selectedAddress?.id || 0)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire({
                title: 'Eliminado',
                text: 'El contacto ha sido eliminado',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadProviderData();
            },
            error: (error: HttpErrorResponse) => {
              console.error('Error al eliminar contacto:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el contacto',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
              });
            }
          });

        Swal.fire({
          title: 'Eliminado',
          text: 'El contacto ha sido eliminado',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
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
    if (!this.selectedContact) return;

    if (this.modalMode === 'create') {
      if (!this.selectedAddress?.id) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se puede crear el contacto: dirección no seleccionada',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }

      Swal.fire({
        title: 'Guardando...',
        text: 'Creando contacto',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
        }
      });

      this.providerService.createContactAddress(
        Number(this.providerId),
        this.selectedAddress.id,
        this.selectedContact
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Contacto creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.closeContactModal();
          this.loadProviderData();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al crear contacto:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el contacto',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#0d6efd'
          });
        }
      });
      return;

    } else if (this.modalMode === 'edit') {
      if (!this.selectedAddress?.id || !this.selectedContact?.id) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se puede actualizar el contacto: datos incompletos',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#0d6efd'
        });
        return;
      }

      Swal.fire({
        title: 'Guardando...',
        text: 'Actualizando contacto',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(null);
        }
      });

      this.providerService.updateContactAddress(
        Number(this.providerId),
        this.selectedAddress.id,
        this.selectedContact
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Contacto actualizado correctamente',
        timer: 2000,
        showConfirmButton: false
          });
          this.closeContactModal();
          this.loadProviderData();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al actualizar contacto:', error);
          Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el contacto',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#0d6efd'
          });
        }
      });

      return;
    }

    this.closeContactModal();
    // Recargar datos después de guardar
    this.loadProviderData();
  }

  getComplianceStatusClass(): string {
    if (!this.company) return 'bg-secondary';

    const hasTaxData = this.company.tax_regime?.id && this.company.tax_preferred_concept?.id;

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

    const hasTaxData = this.company.tax_regime?.id && this.company.tax_preferred_concept?.id;

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
    return 'No disponible';
  }

  viewDocument(doc: ProviderDocument): void {
    sessionStorage.setItem('lastTab', 'Documentos');
    this.router.navigate(['/document/0/' + doc.id_document + '/0']);
  }

  viewContract(contract: ProviderContract): void {
    sessionStorage.setItem('lastTab', 'Contratos');
    this.router.navigate(['/contracts/2/' + contract.id_contract + '/0']);
  }

  // Método para obtener los labels de los tipos de proveedor seleccionados
  getScopeLabels(): string[] {
    if (!this.company?.id_company_scope || !Array.isArray(this.company.id_company_scope)) {
      return [];
    }

    return this.company.id_company_scope
      .map(scopeId => {
        const scope = this.xcompany_scope.find(s => s.value === scopeId);
        return scope ? scope.label : null;
      })
      .filter((label): label is string => label !== null);
  }

  // Método helper para obtener el label de un scope por su valor
  getScopeLabelByValue(value: number): string {
    const scope = this.xcompany_scope.find(s => s.value === value);
    return scope ? scope.label : 'Desconocido';
  }
}
