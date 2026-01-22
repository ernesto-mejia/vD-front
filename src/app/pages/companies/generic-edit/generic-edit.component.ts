import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { GenericEntityConfig } from '../generic-entity.config';

declare var bootstrap: any;

@Component({
  selector: 'app-generic-edit',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './generic-edit.component.html',
  styleUrl: './generic-edit.component.css'
})
export class GenericEditComponent implements OnInit, OnDestroy {
  @Input() config!: GenericEntityConfig;

  // Estado general
  isEditing = true;
  ReadOnly = false;
  submitted = false;
  loading = false;
  entityId = '';

  // Datos principales
  entity: any = null;
  companyTypes: any[] = [];
  companyScopes: any[] = [];
  xtax_regimes: any[] = [];
  xtax_concepts: any[] = [];
  availableEquipments: any[] = [];

  // Datos relacionados
  contactos: any[] = [];
  direcciones: any[] = [];
  documentos: any[] = [];
  contratos: any[] = [];

  // Modales
  showAddressModal = false;
  showContactModal = false;
  selectedAddress: any = null;
  selectedContact: any = null;
  modalMode: 'view' | 'edit' | 'create' = 'view';

  // Formularios temporales
  newContact: any = {};
  newAddress: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      console.error('GenericEditComponent requires config input');
      return;
    }
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el componente
   */
  private initializeComponent(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.entityId = params['id'];
          if (this.entityId) {
            this.loadDropdownData();
            this.loadEntityData();
          } else {
            this.handleError('ID no válido');
          }
        },
        error: (error: unknown) => {
          console.error('Error al obtener parámetros de ruta:', error);
          this.handleError('Error al cargar los datos');
        }
      });
  }

  /**
   * Carga los datos de catálogos
   */
  private loadDropdownData(): void {
    const service = this.config.serviceClass;

    if (service.getMetaTypes) {
      service.getMetaTypes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (types: any[]) => this.companyTypes = types,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getMetaScopes) {
      service.getMetaScopes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (scopes: any[]) => this.companyScopes = scopes,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getTaxRegimes) {
      service.getTaxRegimes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (regimes: any[]) => this.xtax_regimes = regimes,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getTaxConcepts) {
      service.getTaxConcepts()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (concepts: any[]) => this.xtax_concepts = concepts,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getEquipment) {
      service.getEquipment()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (equipment: any[]) => this.availableEquipments = equipment,
          error: (error: unknown) => console.error('Error:', error)
        });
    }
  }

  /**
   * Carga los datos de la entidad
   */
  private loadEntityData(): void {
    this.loading = true;
    const service = this.config.serviceClass;
    const getMethod = this.getGetMethodName();

    service[getMethod](this.entityId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          this.entity = this.extractEntityFromResponse(response);
          this.loadRelatedData();
        },
        error: (error: unknown) => {
          console.error('Error:', error);
          this.handleError(`No se pudo cargar el ${this.config.singularName.toLowerCase()}`);
        }
      });
  }

  /**
   * Extrae la entidad de la respuesta
   */
  private extractEntityFromResponse(response: any): any {
    if (response.ok && response.data) {
      return response.data;
    }
    return response;
  }

  /**
   * Carga datos relacionados
   */
  private loadRelatedData(): void {
    const service = this.config.serviceClass;

    if (service.getContacts) {
      service.getContacts(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (contacts: any[]) => this.contactos = contacts,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getAddresses) {
      service.getAddresses(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (addresses: any[]) => this.direcciones = addresses,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getDocuments) {
      service.getDocuments(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (documents: any[]) => this.documentos = documents,
          error: (error: unknown) => console.error('Error:', error)
        });
    }

    if (service.getContracts) {
      service.getContracts(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (contracts: any[]) => this.contratos = contracts,
          error: (error: unknown) => console.error('Error:', error)
        });
    }
  }

  /**
   * Obtiene el nombre del método del servicio para obtener un registro
   */
  private getGetMethodName(): string {
    switch (this.config.entityType) {
      case 'provider':
        return 'getProvider';
      case 'customer':
        return 'getCustomer';
      default:
        return 'getEntity';
    }
  }

  /**
   * Guarda los cambios de la entidad
   */
  saveChanges(): void {
    this.submitted = true;

    if (!this.validateForm()) {
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    const service = this.config.serviceClass;
    const updateMethod = this.getUpdateMethodName();

    service[updateMethod](this.entityId, this.entity)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: `${this.config.singularName} actualizado correctamente`
          }).then(() => {
            this.location.back();
          });
        },
        error: (error: any) => {
          console.error('Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo actualizar el ${this.config.singularName.toLowerCase()}`
          });
        }
      });
  }

  /**
   * Agrega un contacto
   */
  addContact(): void {
    if (!this.newContact.contact_name || !this.newContact.contact_email) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Nombre y email son requeridos'
      });
      return;
    }

    const service = this.config.serviceClass;

    if (service.createContact) {
      const payload = {
        parent_table: 'companies',
        parent_id: Number(this.entityId),
        ...this.newContact
      };

      service.createContact(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModals();
            this.loadRelatedData();
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Contacto agregado correctamente'
            });
          },
          error: (error: unknown) => {
            console.error('Error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo agregar el contacto'
            });
          }
        });
    }
  }

  /**
   * Agrega una dirección
   */
  addAddress(): void {
    if (!this.newAddress.street || !this.newAddress.city) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Calle y ciudad son requeridos'
      });
      return;
    }

    const service = this.config.serviceClass;

    if (service.createAddress) {
      const payload = {
        parent_table: 'companies',
        parent_id: Number(this.entityId),
        ...this.newAddress
      };

      service.createAddress(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModals();
            this.loadRelatedData();
            Swal.fire({
              icon: 'success',
              title: 'Éxito',
              text: 'Dirección agregada correctamente'
            });
          },
          error: (error: unknown) => {
            console.error('Error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo agregar la dirección'
            });
          }
        });
    }
  }

  /**
   * Elimina un contacto
   */
  deleteContact(contactId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará el contacto.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const service = this.config.serviceClass;

        if (service.deleteContact) {
          service.deleteContact(contactId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadRelatedData();
                Swal.fire('Éxito', 'Contacto eliminado correctamente', 'success');
              },
              error: (error: unknown) => {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar el contacto', 'error');
              }
            });
        }
      }
    });
  }

  /**
   * Elimina una dirección
   */
  deleteAddress(addressId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará la dirección.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const service = this.config.serviceClass;

        if (service.deleteAddress) {
          service.deleteAddress(addressId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.loadRelatedData();
                Swal.fire('Éxito', 'Dirección eliminada correctamente', 'success');
              },
              error: (error: unknown) => {
                console.error('Error:', error);
                Swal.fire('Error', 'No se pudo eliminar la dirección', 'error');
              }
            });
        }
      }
    });
  }

  /**
   * Abre modal para agregar contacto
   */
  openAddContactModal(): void {
    this.newContact = {};
    this.modalMode = 'create';
    this.showContactModal = true;
  }

  /**
   * Abre modal para agregar dirección
   */
  openAddAddressModal(): void {
    this.newAddress = { country: 'MX' };
    this.modalMode = 'create';
    this.showAddressModal = true;
  }

  /**
   * Cierra los modales
   */
  closeModals(): void {
    this.showContactModal = false;
    this.showAddressModal = false;
    this.newContact = {};
    this.newAddress = {};
  }

  /**
   * Valida el formulario
   */
  private validateForm(): boolean {
    if (!this.entity?.company || !this.entity?.shortname || !this.entity?.tax_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Por favor completa todos los campos requeridos'
      });
      return false;
    }
    return true;
  }

  /**
   * Obtiene el nombre del método para actualizar
   */
  private getUpdateMethodName(): string {
    switch (this.config.entityType) {
      case 'provider':
        return 'updateProvider';
      case 'customer':
        return 'updateCustomer';
      default:
        return 'update';
    }
  }

  /**
   * Regresa atrás
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Maneja errores
   */
  private handleError(message: string): void {
    this.loading = false;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    }).then(() => {
      this.location.back();
    });
  }
}
