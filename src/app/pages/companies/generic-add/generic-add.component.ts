import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { GenericEntityConfig } from '../generic-entity.config';
import { ZipcodeService, ZipcodeFormData } from '../../../shared/services/zipcode.service';

@Component({
  selector: 'app-generic-add',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './generic-add.component.html',
  styleUrls: ['./generic-add.component.css']
})
export class GenericAddComponent implements OnInit, OnDestroy {
  @Input() config!: GenericEntityConfig;

  private state = {
    submitted: false,
    apiError: false,
    currentStep: 1,
    totalSteps: 3,
    compania: {} as any,
    contacto: {} as any,
    direccion: {} as any,
    contacto_address: {} as any
  };

  private destroy$ = new Subject<void>();
  companyTypes: any[] = [];
  companyScopes: any[] = [];

  // Variables para datos de código postal
  zipcodeData: ZipcodeFormData | null = null;
  loadingZipcode = false;
  settlements: string[] = [];
  hasMultipleSettlements = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private zipcodeService: ZipcodeService
  ) {}

  ngOnInit(): void {
    if (!this.config) {
      console.error('GenericAddComponent requires config input');
      return;
    }
    this.initializeFormData();
    this.loadMetaOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa los datos del formulario
   */
  private initializeFormData(): void {
    this.state.compania = {
      company: '',
      shortname: '',
      tax_id: '',
      clave: '',
      company_type: this.config.companyTypeDefaultValue || 'proveedor',
      website: '',
      tax_regime: '',
      tax_preferred_concept: '',
      tax_status: '1',
      tax_byrules: '1',
      tax_actofincorporation: '1',
      company_scope: this.config.companyScopeDefaultValue || 'servicios',
      id_company_scope: null
    };

    this.state.contacto = {
      contact_name: '',
      contact_lastname: '',
      contact_phone: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: ''
    };

    this.state.direccion = {
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

    this.state.contacto_address = {
      contact_name_address: '',
      contact_lastname_address: '',
      contact_phone: '',
      contact_email: '',
      contact_job_position: '',
      contact_department: ''
    };
  }

  /**
   * Carga las opciones de meta datos
   */
  private loadMetaOptions(): void {
    const service = this.config.serviceClass;

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
  }

  /**
   * Obtiene la propiedad compania del estado
   */
  get compania(): any {
    return this.state.compania;
  }

  /**
   * Obtiene la propiedad contacto del estado
   */
  get contacto(): any {
    return this.state.contacto;
  }

  /**
   * Obtiene la propiedad direccion del estado
   */
  get direccion(): any {
    return this.state.direccion;
  }

  /**
   * Obtiene la propiedad contacto_address del estado
   */
  get contacto_address(): any {
    return this.state.contacto_address;
  }

  /**
   * Obtiene el paso actual
   */
  get currentStep(): number {
    return this.state.currentStep;
  }

  /**
   * Obtiene el total de pasos
   */
  get totalSteps(): number {
    return this.state.totalSteps;
  }

  /**
   * Obtiene el estado de envío
   */
  get submitted(): boolean {
    return this.state.submitted;
  }

  /**
   * Valida el RFC (formato mexicano básico)
   */
  validateRFC(rfc: string): boolean {
    if (!rfc) return false;
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}(?:[A-Z0-9]{3})?$/;
    return rfcRegex.test(rfc.toUpperCase());
  }

  /**
   * Valida el paso 1
   */
  private validateStep1(): boolean {
    const { company, shortname, tax_id, company_type } = this.state.compania;
    if (!company || !shortname || !tax_id || !company_type) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Por favor completa todos los campos requeridos del paso 1'
      });
      return false;
    }

    if (!this.validateRFC(tax_id)) {
      Swal.fire({
        icon: 'warning',
        title: 'RFC Inválido',
        text: 'El RFC debe tener un formato válido'
      });
      return false;
    }

    return true;
  }

  /**
   * Valida el paso 2
   */
  private validateStep2(): boolean {
    const { contact_name, contact_lastname, contact_email } = this.state.contacto;
    if (!contact_name || !contact_lastname || !contact_email) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Por favor completa todos los campos requeridos del paso 2'
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Inválido',
        text: 'El email debe tener un formato válido'
      });
      return false;
    }

    return true;
  }

  /**
   * Valida el paso 3
   */
  private validateStep3(): boolean {
    const { street, city, state } = this.state.direccion;
    if (!street || !city || !state) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos Requeridos',
        text: 'Por favor completa todos los campos requeridos del paso 3'
      });
      return false;
    }
    return true;
  }

  /**
   * Valida el paso actual
   */
  private validateCurrentStep(): boolean {
    switch (this.state.currentStep) {
      case 1:
        return this.validateStep1();
      case 2:
        return this.validateStep2();
      case 3:
        return this.validateStep3();
      default:
        return true;
    }
  }

  /**
   * Siguiente paso
   */
  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.state.currentStep < this.state.totalSteps) {
        this.state.currentStep++;
      }
    }
  }

  /**
   * Paso anterior
   */
  previousStep(): void {
    if (this.state.currentStep > 1) {
      this.state.currentStep--;
    }
  }

  /**
   * Guarda el nuevo registro
   */
  saveNewEntity(): void {
    this.state.submitted = true;

    if (!this.validateCurrentStep()) {
      return;
    }

    Swal.fire({
      title: 'Guardando...',
      text: `Creando nuevo ${this.config.singularName.toLowerCase()}...`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null)
    });

    const payload = this.buildPayload();
    const service = this.config.serviceClass;
    const createMethod = this.getCreateMethodName();

    service[createMethod](payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.state.submitted = false)
      )
      .subscribe({
        next: (response: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: `${this.config.singularName} creado correctamente`
          }).then(() => {
            const listRoute = this.config.listRoute;
            this.router.navigate([listRoute]);
          });
        },
        error: (error: any) => {
          console.error('Error al crear:', error);
          let errorMessage = `No se pudo crear el ${this.config.singularName.toLowerCase()}`;

          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.detail) {
            errorMessage = error.error.detail;
          }

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage
          });
        }
      });
  }

  /**
   * Construye el payload para la API
   */
  private buildPayload(): any {
    const contacto_address = this.state.contacto_address.contact_name_address ? [this.state.contacto_address] : [];

    const addresses = [{
      ...this.state.direccion,
      contact_addresses: contacto_address
    }];

    return {
      compania: this.state.compania,
      contacts: [this.state.contacto],
      addresses: addresses
    };
  }

  /**
   * Obtiene el nombre del método para crear
   */
  private getCreateMethodName(): string {
    switch (this.config.entityType) {
      case 'provider':
        return 'createProvider';
      case 'customer':
        return 'createCustomer';
      default:
        return 'create';
    }
  }

  /**
   * Regresa a la lista
   */
  goBack(): void {
    this.location.back();
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
      this.zipcodeService.getAddressByZipcode(zipcode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: ZipcodeFormData | null) => {
            this.loadingZipcode = false;
            if (data) {
              this.zipcodeData = data;
              this.settlements = data.settlements;
              this.hasMultipleSettlements = data.hasMultipleSettlements;

              // Autocompletar campos
              this.state.direccion.country = data.country === 'México' ? 'MX' : data.country;
              this.state.direccion.state = data.state;
              this.state.direccion.city = data.city;
              this.state.direccion.county = data.county;

              // Si solo hay una colonia, seleccionarla automáticamente
              if (data.settlements.length === 1) {
                this.state.direccion.colony = data.settlements[0];
              } else if (data.settlements.length > 1) {
                // Si hay múltiples, limpiar para que el usuario seleccione
                this.state.direccion.colony = '';
              }
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
  /**
   * ReadOnly property para formularios
   */
  get ReadOnly(): boolean {
    return false;
  }
}
