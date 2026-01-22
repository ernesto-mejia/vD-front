import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin, of, concat, from } from 'rxjs';
import { concatMap, catchError, finalize, last, tap } from 'rxjs/operators';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ClientContractService } from '../contract.service';
import { CustomerService } from '../../../customers/customer.service';
import {
  ClientContractCreateRequest,
  RegionSystem,
  SystemRegion,
  CustomerAddress,
  Item,
  BondingCompany,
  ContractDocumentType,
  ContractUnitItemRequest,
  WizardStep
} from '../contracts';

interface CustomerOption {
  id: number;
  shortname: string;
  company: string;
  tax_id?: string;
}

interface UnitItemRow {
  address_id: number;
  address_name?: string;
  item_id: number;
  item_name?: string;
  min_quantity: number;
  max_quantity: number;
  unit_price: number;
  observations?: string;
}

@Component({
  selector: 'app-contract-add',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, SidebarComponent],
  templateUrl: './contract-add.component.html',
  styleUrl: './contract-add.component.css'
})
export class ContractAddComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ==================== WIZARD STATE ====================
  currentStep: WizardStep = 'info';
  steps: { id: WizardStep; label: string; icon: string }[] = [
    { id: 'info', label: 'Información General', icon: 'fa-clipboard-list' },
    { id: 'units', label: 'Asignación por Unidad', icon: 'fa-hospital' },
    { id: 'summary', label: 'Resumen y Documentos', icon: 'fa-check-circle' }
  ];

  // Estado del formulario
  submitted = false;
  saving = false;

  // ==================== DATOS DEL CONTRATO ====================
  contract: ClientContractCreateRequest = {
    customer_id: 0,
    project_name: '',
    description: '',
    region_ids: [],
    start_date: '',
    end_date: '',
    min_amount: 0,
    max_amount: 0,
    contract_number: '',
    licitation_number: '',
    address_ids: [],
    item_ids: [],
    has_bonding: false,
    bonding_company_id: undefined,
    bonding_amount: undefined,
    bonding_start_date: '',
    bonding_end_date: '',
    alert_days_before: 30,
    required_document_type_ids: [],
    wizard_step: 'info',
    is_draft: true,
    unit_items: []
  };

  // Campo auto-llenado
  customerCompany = '';

  // ==================== OPCIONES PARA SELECTS ====================
  customers: CustomerOption[] = [];
  regionSystems: RegionSystem[] = [];
  customerRegions: SystemRegion[] = [];
  customerRegionSystem: RegionSystem | null = null;
  customerAddresses: CustomerAddress[] = [];
  items: Item[] = [];
  bondingCompanies: BondingCompany[] = [];
  documentTypes: ContractDocumentType[] = [];

  // ==================== ESTADOS DE CARGA ====================
  loadingCustomers = false;
  loadingRegions = false;
  loadingAddresses = false;
  loadingItems = false;
  loadingBondingCompanies = false;
  loadingDocumentTypes = false;

  // ==================== SELECCIONES ====================
  selectedRegionIds: number[] = [];
  selectedAddressIds: number[] = [];
  selectedItemIds: number[] = [];
  selectedDocumentTypeIds: number[] = [];

  // ==================== ARCHIVOS DE DOCUMENTOS (Fase 3) ====================
  documentFiles: Map<number, File> = new Map(); // docTypeId -> File

  // ==================== ASIGNACIÓN POR UNIDAD (Fase 2) ====================
  unitItemsRows: UnitItemRow[] = [];
  unitItemsGrouped: { address: CustomerAddress; items: UnitItemRow[] }[] = []; // Cache para evitar recálculos
  showUnitItemModal = false;
  currentUnitItem: UnitItemRow = {
    address_id: 0,
    item_id: 0,
    min_quantity: 0,
    max_quantity: 0,
    unit_price: 0
  };

  constructor(
    private contractService: ClientContractService,
    private customerService: CustomerService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== CARGA DE DATOS ====================

  private loadInitialData(): void {
    forkJoin({
      items: this.contractService.getItems(),
      documentTypes: this.contractService.getDocumentTypes(),
      bondingCompanies: this.contractService.getBondingCompanies()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.items = result.items;
          this.documentTypes = result.documentTypes;
          this.bondingCompanies = result.bondingCompanies;
        },
        error: (err) => console.error('Error cargando datos iniciales:', err)
      });

    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.loadingCustomers = true;
    this.customerService.getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.customers = (response.data || []).map((c: any) => ({
            id: c.id,
            shortname: c.shortname,
            company: c.company,
            tax_id: c.tax_id
          }));
          this.loadingCustomers = false;
        },
        error: (err) => {
          console.error('Error cargando clientes:', err);
          this.loadingCustomers = false;
        }
      });
  }

  // ==================== EVENTOS DE SELECCIÓN (FASE 1) ====================

  onCustomerChange(customer: CustomerOption | null): void {
    if (customer) {
      this.contract.customer_id = customer.id;
      this.customerCompany = customer.company;

      // Limpiar selecciones previas
      this.selectedRegionIds = [];
      this.selectedAddressIds = [];
      this.customerAddresses = [];
      this.customerRegions = [];

      // Cargar regiones según el cliente (IMSS, Pemex, etc.)
      this.loadRegionsByCustomer(customer.id);
    } else {
      this.contract.customer_id = 0;
      this.customerCompany = '';
      this.customerAddresses = [];
      this.customerRegions = [];
      this.selectedRegionIds = [];
      this.selectedAddressIds = [];
    }
  }

  private loadRegionsByCustomer(customerId: number): void {
    this.loadingRegions = true;
    this.contractService.getRegionsByCustomer(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.customerRegionSystem = result.system;
          this.customerRegions = result.regions;
          this.loadingRegions = false;
        },
        error: (err) => {
          console.error('Error cargando regiones:', err);
          this.loadingRegions = false;
          // Fallback: cargar todas las regiones IMSS
          this.contractService.getIMSSRegions()
            .pipe(takeUntil(this.destroy$))
            .subscribe(regions => {
              this.customerRegions = regions.map(r => ({
                id: r.id,
                region_system_id: 1,
                code: r.code || '',
                name: r.name,
                is_active: true
              }));
            });
        }
      });
  }

  onRegionsChange(): void {
    this.contract.region_ids = this.selectedRegionIds;
    this.selectedAddressIds = [];
    this.customerAddresses = [];

    if (this.contract.customer_id && this.selectedRegionIds.length > 0) {
      this.loadAddressesByRegions();
    }
  }

  private loadAddressesByRegions(): void {
    this.loadingAddresses = true;
    // Usar el nuevo endpoint que filtra por múltiples regiones
    this.contractService.getCustomerAddressesByRegions(
      this.contract.customer_id,
      this.selectedRegionIds
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.customerAddresses = addresses;
          this.loadingAddresses = false;
        },
        error: (err) => {
          console.error('Error cargando direcciones por regiones:', err);
          // Fallback: cargar todas las direcciones
          this.loadAllCustomerAddresses();
        }
      });
  }

  private loadAllCustomerAddresses(): void {
    if (!this.contract.customer_id) return;

    this.loadingAddresses = true;
    this.contractService.getCustomerAddresses(this.contract.customer_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses) => {
          this.customerAddresses = addresses;
          this.loadingAddresses = false;
        },
        error: (err) => {
          console.error('Error cargando direcciones:', err);
          this.loadingAddresses = false;
        }
      });
  }

  // ==================== AFIANZADORA ====================

  onHasBondingChange(): void {
    if (!this.contract.has_bonding) {
      this.contract.bonding_company_id = undefined;
      this.contract.bonding_amount = undefined;
      this.contract.bonding_start_date = '';
      this.contract.bonding_end_date = '';
    }
  }

  // ==================== WIZARD NAVIGATION ====================

  get currentStepIndex(): number {
    return this.steps.findIndex(s => s.id === this.currentStep);
  }

  isStepCompleted(step: WizardStep): boolean {
    const stepIndex = this.steps.findIndex(s => s.id === step);
    return stepIndex < this.currentStepIndex;
  }

  isStepActive(step: WizardStep): boolean {
    return this.currentStep === step;
  }

  canGoToStep(step: WizardStep): boolean {
    const targetIndex = this.steps.findIndex(s => s.id === step);
    // Solo puede ir a pasos anteriores o al siguiente si el actual es válido
    if (targetIndex < this.currentStepIndex) return true;
    if (targetIndex === this.currentStepIndex + 1) return this.validateCurrentStep();
    return false;
  }

  goToStep(step: WizardStep): void {
    if (this.canGoToStep(step) || this.isStepCompleted(step)) {
      this.currentStep = step;
      this.contract.wizard_step = step;
    }
  }

  nextStep(): void {
    this.submitted = true;
    if (!this.validateCurrentStep()) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    const nextIndex = this.currentStepIndex + 1;
    if (nextIndex < this.steps.length) {
      this.currentStep = this.steps[nextIndex].id;
      this.contract.wizard_step = this.currentStep;
      this.submitted = false;

      // Preparar datos para el paso 2
      if (this.currentStep === 'units') {
        this.prepareUnitItemsData();
      }
    }
  }

  prevStep(): void {
    const prevIndex = this.currentStepIndex - 1;
    if (prevIndex >= 0) {
      this.currentStep = this.steps[prevIndex].id;
      this.contract.wizard_step = this.currentStep;
      this.submitted = false;
    }
  }

  // ==================== VALIDACIONES ====================

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 'info':
        return this.validateInfoStep();
      case 'units':
        return this.validateUnitsStep();
      case 'summary':
        return true;
      default:
        return false;
    }
  }

  validateInfoStep(): boolean {
    return !!(
      this.contract.customer_id &&
      this.contract.project_name?.trim() &&
      this.selectedRegionIds.length > 0 &&
      this.contract.start_date &&
      this.contract.end_date &&
      this.validateDates() &&
      this.contract.min_amount >= 0 &&
      this.validateAmounts() &&
      this.selectedAddressIds.length > 0 &&
      this.selectedItemIds.length > 0 &&
      (!this.contract.has_bonding || this.validateBonding())
    );
  }

  validateUnitsStep(): boolean {
    // Opcional: verificar que haya al menos una asignación por unidad
    return true;
  }

  validateDates(): boolean {
    if (!this.contract.start_date || !this.contract.end_date) return true;
    return new Date(this.contract.end_date) >= new Date(this.contract.start_date);
  }

  validateAmounts(): boolean {
    return this.contract.max_amount >= this.contract.min_amount;
  }

  validateBonding(): boolean {
    if (!this.contract.has_bonding) return true;
    return !!(
      this.contract.bonding_company_id &&
      this.contract.bonding_amount &&
      this.contract.bonding_amount > 0
    );
  }

  // ==================== FASE 2: ASIGNACIÓN POR UNIDAD ====================

  prepareUnitItemsData(): void {
    // Si ya hay datos, no sobrescribir
    if (this.unitItemsRows.length > 0) {
      this.updateGroupedData();
      return;
    }

    // Crear filas base: cada unidad médica × cada prueba
    this.unitItemsRows = [];

    const selectedAddresses = this.customerAddresses.filter(
      a => this.selectedAddressIds.includes(a.id)
    );
    const selectedItems = this.items.filter(
      i => this.selectedItemIds.includes(i.id)
    );

    // OPTIMIZACIÓN: Limitar a máximo 10 direcciones × 50 items para evitar congelar el navegador
    const maxAddresses = selectedAddresses.slice(0, 10);
    const maxItems = selectedItems.slice(0, 50);

    // Crear una fila por cada combinación de dirección × item
    for (const address of maxAddresses) {
      for (const item of maxItems) {
        this.unitItemsRows.push({
          address_id: address.id,
          address_name: address.shortname || address.address,
          item_id: item.id,
          item_name: item.name,
          min_quantity: 0,
          max_quantity: 0,
          unit_price: item.unit_price || 0,
          observations: ''
        });
      }
    }

    // Actualizar la vista agrupada una sola vez
    this.updateGroupedData();
  }

  /**
   * Actualiza los datos agrupados (llamar solo cuando cambian los datos)
   */
  private updateGroupedData(): void {
    const grouped: Map<number, { address: CustomerAddress; items: UnitItemRow[] }> = new Map();

    for (const row of this.unitItemsRows) {
      if (!grouped.has(row.address_id)) {
        const address = this.customerAddresses.find(a => a.id === row.address_id);
        if (address) {
          grouped.set(row.address_id, { address, items: [] });
        }
      }
      grouped.get(row.address_id)?.items.push(row);
    }

    this.unitItemsGrouped = Array.from(grouped.values());
  }

  removeUnitItem(addressId: number, itemId: number): void {
    const index = this.unitItemsRows.findIndex(
      r => r.address_id === addressId && r.item_id === itemId
    );
    if (index !== -1) {
      this.unitItemsRows.splice(index, 1);
      this.updateGroupedData(); // Actualizar vista agrupada
    }
  }

  // TrackBy functions para optimizar *ngFor
  trackByAddressId(index: number, group: { address: CustomerAddress; items: UnitItemRow[] }): number {
    return group.address.id;
  }

  trackByItemId(index: number, row: UnitItemRow): number {
    return row.item_id;
  }

  // ==================== GUARDAR ====================

  saveAsDraft(): void {
    this.contract.is_draft = true;
    this.saveContract();
  }

  saveAndComplete(): void {
    this.submitted = true;
    if (!this.validateInfoStep()) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos de información general', 'error');
      return;
    }
    this.contract.is_draft = false;
    this.contract.wizard_step = 'completed';
    this.saveContract();
  }

  private saveContract(): void {
    // Preparar payload
    const payload: ClientContractCreateRequest = {
      ...this.contract,
      region_ids: this.selectedRegionIds,
      address_ids: this.selectedAddressIds,
      item_ids: this.selectedItemIds,
      required_document_type_ids: this.selectedDocumentTypeIds,
      unit_items: this.unitItemsRows.map(row => ({
        address_id: row.address_id,
        item_id: row.item_id,
        min_quantity: row.min_quantity || undefined,
        max_quantity: row.max_quantity || undefined,
        unit_price: row.unit_price || undefined,
        observations: row.observations || undefined
      }))
    };

    this.saving = true;
    Swal.fire({
      title: 'Guardando contrato...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.contractService.createContract(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const contractId = response.data?.id;

          // Si hay archivos para subir y el contrato fue creado exitosamente
          if (contractId && this.documentFiles.size > 0) {
            this.uploadContractDocuments(contractId);
          } else {
            this.onContractSaveComplete();
          }
        },
        error: (err) => {
          this.saving = false;
          console.error('Error guardando contrato:', err);
          Swal.fire('Error', err.error?.message || 'No se pudo guardar el contrato', 'error');
        }
      });
  }

  /**
   * Sube los documentos adjuntos al contrato creado
   */
  private uploadContractDocuments(contractId: number): void {
    Swal.update({
      title: 'Subiendo documentos...',
      html: `0 de ${this.documentFiles.size} documentos subidos`
    });

    const fileEntries = Array.from(this.documentFiles.entries());
    let uploadedCount = 0;
    let errorCount = 0;

    // Subir documentos secuencialmente para evitar sobrecargar el servidor
    from(fileEntries).pipe(
      concatMap(([docTypeId, file]) => {
        return this.contractService.uploadDocument(contractId, docTypeId, file).pipe(
          tap(() => {
            uploadedCount++;
            Swal.update({
              html: `${uploadedCount} de ${this.documentFiles.size} documentos subidos`
            });
          }),
          catchError((err) => {
            errorCount++;
            console.error(`Error subiendo documento tipo ${docTypeId}:`, err);
            return of(null); // Continuar con el siguiente aunque falle
          })
        );
      }),
      last(),
      finalize(() => {
        this.saving = false;

        if (errorCount > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Contrato guardado',
            text: `El contrato fue creado pero ${errorCount} documento(s) no pudieron subirse. Puede agregarlos más tarde.`,
            confirmButtonText: 'Entendido'
          }).then(() => this.router.navigate(['/purchases/contracts-clients']));
        } else {
          this.onContractSaveComplete();
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * Maneja la finalización exitosa del guardado del contrato
   */
  private onContractSaveComplete(): void {
    this.saving = false;
    const message = this.contract.is_draft
      ? 'Borrador guardado correctamente'
      : 'Contrato creado correctamente';
    Swal.fire('Éxito', message, 'success')
      .then(() => this.router.navigate(['/purchases/contracts-clients']));
  }

  // ==================== NAVEGACIÓN ====================

  goBack(): void {
    if (this.hasUnsavedChanges()) {
      Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Perderá los cambios no guardados',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          this.location.back();
        }
      });
    } else {
      this.location.back();
    }
  }

  private hasUnsavedChanges(): boolean {
    return !!(
      this.contract.customer_id ||
      this.contract.project_name?.trim() ||
      this.selectedRegionIds.length > 0 ||
      this.selectedItemIds.length > 0
    );
  }

  // ==================== UTILIDADES ====================

  customerSearchFn(term: string, item: CustomerOption): boolean {
    term = term.toLowerCase();
    return item.shortname?.toLowerCase().includes(term) ||
           item.company?.toLowerCase().includes(term) ||
           item.tax_id?.toLowerCase().includes(term) || false;
  }

  getSelectedRegionNames(): string {
    return this.customerRegions
      .filter(r => this.selectedRegionIds.includes(r.id))
      .map(r => r.name)
      .join(', ');
  }

  getSelectedAddressNames(): string {
    return this.customerAddresses
      .filter(a => this.selectedAddressIds.includes(a.id))
      .map(a => a.shortname)
      .join(', ');
  }

  getSelectedItemNames(): string {
    return this.items
      .filter(i => this.selectedItemIds.includes(i.id))
      .map(i => i.name)
      .join(', ');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  getBondingCompanyName(companyId: number | undefined): string {
    if (!companyId) return '-';
    const company = this.bondingCompanies.find(b => b.id === companyId);
    return company?.shortname || company?.company || '-';
  }

  toggleDocumentType(docTypeId: number): void {
    const index = this.selectedDocumentTypeIds.indexOf(docTypeId);
    if (index > -1) {
      this.selectedDocumentTypeIds.splice(index, 1);
      // También remover el archivo si existe
      this.documentFiles.delete(docTypeId);
    } else {
      this.selectedDocumentTypeIds.push(docTypeId);
    }
  }

  // ==================== MANEJO DE ARCHIVOS DE DOCUMENTOS (Fase 3) ====================

  /**
   * Obtiene el archivo seleccionado para un tipo de documento
   */
  getDocumentFile(docTypeId: number): File | undefined {
    return this.documentFiles.get(docTypeId);
  }

  /**
   * Maneja la selección de un archivo para un tipo de documento
   */
  onFileSelected(event: Event, docTypeId: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar tipo de archivo (PDF, imágenes, documentos comunes)
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        Swal.fire('Archivo no válido', 'Tipo de archivo no permitido. Use PDF, imágenes o documentos Office.', 'warning');
        input.value = '';
        return;
      }

      // Validar tamaño (máximo 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        Swal.fire('Archivo muy grande', 'El archivo es demasiado grande. Máximo 10MB.', 'warning');
        input.value = '';
        return;
      }

      this.documentFiles.set(docTypeId, file);

      // Auto-seleccionar el tipo de documento si no está seleccionado
      if (!this.selectedDocumentTypeIds.includes(docTypeId)) {
        this.selectedDocumentTypeIds.push(docTypeId);
      }
    }
  }

  /**
   * Remueve el archivo seleccionado para un tipo de documento
   */
  removeDocumentFile(docTypeId: number): void {
    this.documentFiles.delete(docTypeId);
  }

  /**
   * Cuenta los documentos que tienen archivos adjuntos
   */
  getDocumentsWithFiles(): number {
    return this.documentFiles.size;
  }

  /**
   * Obtiene el nombre del archivo para mostrar
   */
  getDocumentFileName(docTypeId: number): string {
    const file = this.documentFiles.get(docTypeId);
    return file ? file.name : '';
  }

  /**
   * Formatea el tamaño del archivo para mostrar
   */
  getDocumentFileSize(docTypeId: number): string {
    const file = this.documentFiles.get(docTypeId);
    if (!file) return '';

    const bytes = file.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
