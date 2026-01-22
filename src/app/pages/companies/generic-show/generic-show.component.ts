import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { GenericEntityConfig } from '../generic-entity.config';

type TabType = 'info' | 'contacts' | 'addresses' | 'taxData' | 'documents' | 'contracts' | 'tax_address';

@Component({
  selector: 'app-generic-show',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './generic-show.component.html',
  styleUrl: './generic-show.component.css'
})
export class GenericShowComponent implements OnInit, OnDestroy {
  @Input() config!: GenericEntityConfig;

  loading = true;
  entity: any = null;
  entityId = '';
  activeTab: TabType = 'info';

  // Datos relacionados
  contactos: any[] = [];
  direcciones: any[] = [];
  documentos: any[] = [];
  contratos: any[] = [];

  // Catálogos
  companyTypes: any[] = [];
  companyScopes: any[] = [];
  xtax_regimes: any[] = [];
  xtax_concepts: any[] = [];

  // Modales
  showAddressModal = false;
  showContactModal = false;
  selectedAddress: any = null;
  selectedContact: any = null;
  modalMode: 'view' | 'edit' | 'create' = 'view';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      console.error('GenericShowComponent requires config input');
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

    // Cargar metadatos
    if (service.getMetaTypes) {
      service.getMetaTypes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (types: any[]) => this.companyTypes = types,
          error: (error: unknown) => console.error('Error loading company types:', error)
        });
    }

    if (service.getMetaScopes) {
      service.getMetaScopes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (scopes: any[]) => this.companyScopes = scopes,
          error: (error: unknown) => console.error('Error loading company scopes:', error)
        });
    }

    // Cargar datos fiscales
    if (service.getTaxRegimes) {
      service.getTaxRegimes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (regimes: any[]) => this.xtax_regimes = regimes,
          error: (error: unknown) => console.error('Error loading tax regimes:', error)
        });
    }

    if (service.getTaxConcepts) {
      service.getTaxConcepts()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (concepts: any[]) => this.xtax_concepts = concepts,
          error: (error: unknown) => console.error('Error loading tax concepts:', error)
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
          console.error(`Error al cargar ${this.config.singularName.toLowerCase()}:`, error);
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
   * Carga datos relacionados (contactos, direcciones, etc.)
   */
  private loadRelatedData(): void {
    const service = this.config.serviceClass;

    if (service.getContacts) {
      service.getContacts(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (contacts: any[]) => this.contactos = contacts,
          error: (error: unknown) => console.error('Error loading contacts:', error)
        });
    }

    if (service.getAddresses) {
      service.getAddresses(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (addresses: any[]) => this.direcciones = addresses,
          error: (error: unknown) => console.error('Error loading addresses:', error)
        });
    }

    if (service.getDocuments) {
      service.getDocuments(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (documents: any[]) => this.documentos = documents,
          error: (error: unknown) => console.error('Error loading documents:', error)
        });
    }

    if (service.getContracts) {
      service.getContracts(this.entityId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (contracts: any[]) => this.contratos = contracts,
          error: (error: unknown) => console.error('Error loading contracts:', error)
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
   * Cambiar pestaña activa
   */
  selectTab(tab: TabType): void {
    this.activeTab = tab;
  }

  /**
   * Abrir modal para agregar contacto
   */
  openAddContactModal(): void {
    this.selectedContact = null;
    this.modalMode = 'create';
    this.showContactModal = true;
  }

  /**
   * Abrir modal para agregar dirección
   */
  openAddAddressModal(): void {
    this.selectedAddress = null;
    this.modalMode = 'create';
    this.showAddressModal = true;
  }

  /**
   * Cerrar modales
   */
  closeModals(): void {
    this.showContactModal = false;
    this.showAddressModal = false;
    this.selectedContact = null;
    this.selectedAddress = null;
  }

  /**
   * Navegar hacia atrás
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Navegar a editar
   */
  goToEdit(): void {
    this.router.navigate([this.config.editRoute, this.entityId]);
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

  /**
   * Obtiene la etiqueta de un tipo de empresa
   */
  getCompanyTypeLabel(value: string | number | null): string {
    if (!value) return '-';
    const type = this.companyTypes.find(t => t.value === value);
    return type ? type.label : String(value);
  }

  /**
   * Obtiene la etiqueta de un ámbito de empresa
   */
  getCompanyScopeLabel(value: string | undefined): string {
    if (!value) return '-';
    const scope = this.companyScopes.find(s => s.value === value);
    return scope ? scope.label : value;
  }
}
