import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { PurchaseRequestService, DestinationArea, DestinationDepartment } from '../purchase-request.service';
import { ProviderService } from '../../../providers/provider.service';
import { Provider } from '../../../providers/providers';
import {
  CreatePurchaseRequestDTO,
  PRIORITIES,
  ProductSearchItem,
  ContractSummary
} from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-request-add',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, NgSelectModule, SidebarComponent],
  templateUrl: './purchase-request-add.component.html',
  styleUrls: ['./purchase-request-add.component.css']
})
export class PurchaseRequestAddComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private productSearchSubject = new Subject<string>();

  form!: FormGroup;
  priorities = PRIORITIES;

  // Datos para Fase 1: Solo solicitudes simples sin proveedores ni precios
  contracts: ContractSummary[] = [];  // Contratos de proveedor
  clientContracts: ContractSummary[] = [];  // Contratos de cliente
  relatedProviderContracts: ContractSummary[] = [];  // Contratos de proveedor relacionados a un contrato de cliente
  contractProducts: ProductSearchItem[] = [];
  searchedProducts: ProductSearchItem[] = [];
  isContractRelated = false;

  // Tipo de contrato seleccionado: 'provider' o 'client'
  contractType: 'provider' | 'client' = 'provider';

  // Para modal de selección de productos del contrato
  showContractProductsModal = false;
  selectedContractProducts: ProductSearchItem[] = [];
  contractProductSearchTerm = '';

  // Datos para selector de destino por área/departamento
  destinationAreas: DestinationArea[] = [];
  availableDepartments: DestinationDepartment[] = [];
  useManualDestination = false;

  // Fecha mínima para el campo de fecha requerida
  minDate: string = new Date().toISOString().split('T')[0];

  // Modal de item manual
  showManualItemModal = false;
  manualItemForm!: FormGroup;

  // Estados de carga
  loading = false;
  loadingContracts = false;
  loadingClientContracts = false;
  loadingRelatedProviders = false;
  loadingContractProducts = false;
  loadingProductSearch = false;

  // Búsqueda
  productSearchTerm = '';

  // Modo con precios/proveedor directo (desde pending-preauthorization)
  withPricingMode = false;

  // Lista de proveedores para modo withPricing
  providers: Provider[] = [];
  loadingProviders = false;

  constructor(
    private fb: FormBuilder,
    private purchaseRequestService: PurchaseRequestService,
    private providerService: ProviderService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si viene del modo with pricing
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.withPricingMode = params['withPricing'] === 'true';
      if (this.withPricingMode) {
        this.loadProviders();
      }
    });

    this.initForm();
    this.initManualItemForm();
    this.loadUserContracts();
    this.loadClientContracts();
    this.loadDestinationOptions();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    const today = new Date();
    const requiredDate = new Date(today);
    requiredDate.setDate(requiredDate.getDate() + 7);

    this.form = this.fb.group({
      is_contract_related: [false],
      contract_id: [null],  // Contrato de proveedor
      client_contract_id: [null],  // Contrato de cliente
      // Nuevos campos para destino por área/departamento
      destination_area_id: [null],
      destination_department_id: [null],
      manual_destination: [''],
      title: ['', Validators.required],
      description: [''],
      priority: ['normal', Validators.required],
      required_date: [this.formatDateForInput(requiredDate), Validators.required],
      notes: [''],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    // Escuchar cambios en is_contract_related
    this.form.get('is_contract_related')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.isContractRelated = value;
      this.onContractModeChange();
    });

    // Escuchar cambios en destination_area_id
    this.form.get('destination_area_id')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(areaId => {
      this.onAreaChange(areaId);
    });

    // Escuchar cambios en contract_id (contrato de proveedor)
    this.form.get('contract_id')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(contractId => {
      if (contractId && this.contractType === 'provider') {
        this.loadContractProducts(contractId);
      } else {
        this.contractProducts = [];
      }
    });

    // Escuchar cambios en client_contract_id (contrato de cliente)
    this.form.get('client_contract_id')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(clientContractId => {
      if (clientContractId && this.contractType === 'client') {
        this.loadClientContractProviders(clientContractId);
      } else {
        this.relatedProviderContracts = [];
        this.contractProducts = [];
      }
    });
    // Agregar validaciones condicionales
    this.setupConditionalValidations();
  }

  private setupConditionalValidations(): void {
    this.form.get('is_contract_related')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isContract => {
      if (isContract) {
        // Cuando está relacionado a contrato, actualizar validaciones según el tipo
        this.updateContractValidations();
        this.form.get('destination_area_id')?.clearValidators();
        this.form.get('manual_destination')?.clearValidators();
      } else {
        this.form.get('contract_id')?.clearValidators();
        this.form.get('client_contract_id')?.clearValidators();
        // Si no está en modo manual, el área es requerida
        if (!this.useManualDestination) {
          this.form.get('destination_area_id')?.setValidators(Validators.required);
          this.form.get('manual_destination')?.clearValidators();
        } else {
          this.form.get('destination_area_id')?.clearValidators();
          this.form.get('manual_destination')?.setValidators(Validators.required);
        }
      }
      this.form.get('contract_id')?.updateValueAndValidity();
      this.form.get('client_contract_id')?.updateValueAndValidity();
      this.form.get('destination_area_id')?.updateValueAndValidity();
      this.form.get('manual_destination')?.updateValueAndValidity();
    });
  }

  /**
   * Actualiza las validaciones según el tipo de contrato seleccionado
   */
  private updateContractValidations(): void {
    if (this.contractType === 'provider') {
      this.form.get('contract_id')?.setValidators(Validators.required);
      this.form.get('client_contract_id')?.clearValidators();
    } else {
      this.form.get('contract_id')?.clearValidators();
      this.form.get('client_contract_id')?.setValidators(Validators.required);
    }
    this.form.get('contract_id')?.updateValueAndValidity();
    this.form.get('client_contract_id')?.updateValueAndValidity();
  }

  // ==================== MÉTODOS PARA DESTINO POR ÁREA ====================

  loadDestinationOptions(): void {
    this.purchaseRequestService.getDestinationOptions().subscribe({
      next: (response) => {
        if (response.success) {
          this.destinationAreas = response.data;
        }
      },
      error: (error) => console.error('Error cargando opciones de destino:', error)
    });
  }

  onAreaChange(areaId: number | null): void {
    this.form.patchValue({ destination_department_id: null });

    if (areaId) {
      const selectedArea = this.destinationAreas.find(a => a.id === +areaId);
      this.availableDepartments = selectedArea?.departments || [];
    } else {
      this.availableDepartments = [];
    }
  }

  toggleManualDestination(): void {
    this.useManualDestination = !this.useManualDestination;

    if (this.useManualDestination) {
      this.form.patchValue({ destination_area_id: null, destination_department_id: null });
      this.form.get('destination_area_id')?.clearValidators();
      this.form.get('manual_destination')?.setValidators(Validators.required);
    } else {
      this.form.patchValue({ manual_destination: '' });
      this.form.get('destination_area_id')?.setValidators(Validators.required);
      this.form.get('manual_destination')?.clearValidators();
    }

    this.form.get('destination_area_id')?.updateValueAndValidity();
    this.form.get('manual_destination')?.updateValueAndValidity();
  }

  private initManualItemForm(): void {
    this.manualItemForm = this.fb.group({
      item_name: ['', Validators.required],
      item_description: [''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit_of_measurement: ['pza'],
      notes: ['']
    });
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private createItemFormGroup(item?: any): FormGroup {
    return this.fb.group({
      item_id: [item?.item_id || null],
      item_name: [item?.item_name || '', Validators.required],
      item_description: [item?.item_description || ''],
      is_manual_item: [item?.is_manual_item || false],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(0.01)]],
      unit_of_measurement: [item?.unit_of_measurement || 'pza'],
      notes: [item?.notes || ''],
      // Campos adicionales para modo withPricing
      provider_id: [item?.provider_id || null],
      unit_price: [item?.unit_price || null],
      // Campo para mostrar el proveedor (cuando viene de contrato de cliente)
      provider_name: [item?.provider_name || null]
    });
  }

  loadProviders(): void {
    this.loadingProviders = true;
    this.providerService.getProviders().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.providers = response.data || [];
        this.loadingProviders = false;
      },
      error: (err) => {
        console.error('Error loading providers:', err);
        this.loadingProviders = false;
      }
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemFormGroup());
  }

  addManualItem(): void {
    if (this.manualItemForm.invalid) {
      return;
    }

    const manualItem = this.manualItemForm.value;
    const itemGroup = this.createItemFormGroup({
      item_id: null,
      item_name: manualItem.item_name,
      item_description: manualItem.item_description,
      is_manual_item: true,
      quantity: manualItem.quantity,
      unit_of_measurement: manualItem.unit_of_measurement,
      notes: manualItem.notes
    });

    this.itemsArray.push(itemGroup);
    this.closeManualItemModal();
  }

  addProductFromSearch(product: ProductSearchItem): void {
    const itemGroup = this.createItemFormGroup({
      item_id: product.id,
      item_name: product.name,
      item_description: product.description,
      is_manual_item: false,
      quantity: 1,
      unit_of_measurement: 'pza'
    });

    this.itemsArray.push(itemGroup);
    this.searchedProducts = [];
    this.productSearchTerm = '';
  }

  addContractProduct(product: ProductSearchItem): void {
    const itemGroup = this.createItemFormGroup({
      item_id: product.id,
      item_name: product.name,
      item_description: product.description,
      is_manual_item: false,
      quantity: 1,
      unit_of_measurement: 'pza'
    });

    this.itemsArray.push(itemGroup);
  }

  openManualItemModal(): void {
    this.manualItemForm.reset({
      item_name: '',
      item_description: '',
      quantity: 1,
      unit_of_measurement: 'pza',
      notes: ''
    });
    this.showManualItemModal = true;
  }

  closeManualItemModal(): void {
    this.showManualItemModal = false;
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 0) {
      this.itemsArray.removeAt(index);
    }
  }

  // ==================== MÉTODOS PARA TIPO DE CONTRATO ====================

  onContractTypeChange(type: 'provider' | 'client'): void {
    this.contractType = type;
    this.form.patchValue({
      contract_id: null,
      client_contract_id: null
    });
    this.contractProducts = [];
    this.relatedProviderContracts = [];

    // Actualizar validaciones según el tipo de contrato
    this.updateContractValidations();
  }

  // ==================== CARGAR DATOS DE CONTRATOS ====================

  loadUserContracts(search?: string): void {
    this.loadingContracts = true;
    this.purchaseRequestService.getUserContracts(search)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contracts = response.data || [];
          this.loadingContracts = false;
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          this.contracts = [];
          this.loadingContracts = false;
        }
      });
  }

  loadClientContracts(search?: string): void {
    this.loadingClientContracts = true;
    this.purchaseRequestService.getClientContracts(search)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.clientContracts = response.data || [];
          this.loadingClientContracts = false;
        },
        error: (error) => {
          console.error('Error loading client contracts:', error);
          this.clientContracts = [];
          this.loadingClientContracts = false;
        }
      });
  }

  loadClientContractProviders(clientContractId: number): void {
    this.loadingRelatedProviders = true;
    this.purchaseRequestService.getClientContractProviders(clientContractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.relatedProviderContracts = response.data || [];
          this.loadingRelatedProviders = false;

          // Si hay proveedores relacionados, preguntar si desea cargar todos los items
          if (this.relatedProviderContracts.length > 0) {
            this.promptLoadClientContractItems(clientContractId);
          }
        },
        error: (error) => {
          console.error('Error loading related provider contracts:', error);
          this.relatedProviderContracts = [];
          this.loadingRelatedProviders = false;
        }
      });
  }

  /**
   * Preguntar al usuario si desea cargar todos los items de un contrato de cliente
   */
  private promptLoadClientContractItems(clientContractId: number): void {
    const totalContracts = this.relatedProviderContracts.length;
    const totalItems = this.relatedProviderContracts.reduce((sum, c) => sum + (c.items_count || 0), 0);

    Swal.fire({
      title: '¿Cargar items del contrato?',
      html: `Este contrato de cliente tiene <b>${totalContracts}</b> contrato(s) de proveedor relacionado(s) con un total de <b>${totalItems}</b> item(s).<br><br>¿Cómo desea proceder?`,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#6c757d',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Cargar todos los items',
      denyButtonText: 'Seleccionar por proveedor',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadAllClientContractItems(clientContractId);
      } else if (result.isDenied) {
        // El usuario seleccionará manualmente desde la lista de proveedores
        Swal.fire({
          icon: 'info',
          title: 'Selección manual',
          text: 'Seleccione un contrato de proveedor de la lista para cargar sus items.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  /**
   * Cargar todos los items de los contratos de proveedor relacionados a un contrato de cliente
   */
  loadAllClientContractItems(clientContractId: number): void {
    this.loadingContractProducts = true;
    this.purchaseRequestService.getClientContractAllItems(clientContractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contractProducts = response.data || [];
          this.loadingContractProducts = false;

          if (this.contractProducts.length > 0) {
            this.promptAddAllContractItems();
          }
        },
        error: (error) => {
          console.error('Error loading client contract items:', error);
          this.contractProducts = [];
          this.loadingContractProducts = false;
        }
      });
  }

  /**
   * Cargar items de un contrato de proveedor específico (relacionado a contrato de cliente)
   */
  loadRelatedProviderContractProducts(providerContractId: number): void {
    this.loadContractProducts(providerContractId);
  }

  loadContractProducts(contractId: number): void {
    this.loadingContractProducts = true;
    this.purchaseRequestService.getContractProducts(contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contractProducts = response.data || [];
          this.loadingContractProducts = false;

          // Preguntar si desea agregar todos los items del contrato
          if (this.contractProducts.length > 0) {
            this.promptAddAllContractItems();
          }
        },
        error: (error) => {
          console.error('Error loading contract products:', error);
          this.contractProducts = [];
          this.loadingContractProducts = false;
        }
      });
  }

  /**
   * Preguntar al usuario si desea agregar todos los items del contrato
   */
  private promptAddAllContractItems(): void {
    Swal.fire({
      title: '¿Agregar items del contrato?',
      text: `Este contrato tiene ${this.contractProducts.length} item(s). ¿Desea agregarlos todos a la solicitud?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, agregar todos',
      cancelButtonText: 'No, seleccionar manualmente'
    }).then((result) => {
      if (result.isConfirmed) {
        this.addAllContractItems();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Abrir modal para selección manual
        this.openContractProductsModal();
      }
    });
  }

  /**
   * Abrir modal de selección de productos del contrato
   */
  openContractProductsModal(): void {
    this.selectedContractProducts = [];
    this.contractProductSearchTerm = '';
    this.showContractProductsModal = true;
  }

  /**
   * Cerrar modal de selección de productos del contrato
   */
  closeContractProductsModal(): void {
    this.showContractProductsModal = false;
  }

  /**
   * Toggle selección de producto del contrato
   */
  toggleContractProduct(product: ProductSearchItem, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedContractProducts.includes(product)) {
        this.selectedContractProducts.push(product);
      }
    } else {
      const index = this.selectedContractProducts.indexOf(product);
      if (index > -1) {
        this.selectedContractProducts.splice(index, 1);
      }
    }
  }

  /**
   * Agregar productos seleccionados del modal
   */
  addSelectedContractProducts(): void {
    if (this.selectedContractProducts.length === 0) {
      Swal.fire('Aviso', 'Seleccione al menos un producto', 'warning');
      return;
    }

    this.selectedContractProducts.forEach(product => {
      // Verificar si ya existe
      const exists = this.itemsArray.controls.some(
        ctrl => ctrl.get('item_id')?.value === product.id
      );
      if (!exists) {
        const itemGroup = this.createItemFormGroup({
          item_id: product.id,
          item_name: product.name,
          item_description: product.description,
          is_manual_item: false,
          quantity: 1,
          unit_of_measurement: product.unit_of_measurement || 'pza',
          provider_id: product.provider_id || null,
          provider_name: product.provider_name || null,
          unit_price: product.provider_price || product.price || null  // Precio del contrato/proveedor
        });
        this.itemsArray.push(itemGroup);
      }
    });

    Swal.fire({
      icon: 'success',
      title: 'Items agregados',
      text: `Se agregaron ${this.selectedContractProducts.length} item(s) del contrato`,
      timer: 2000,
      showConfirmButton: false
    });

    this.closeContractProductsModal();
  }

  /**
   * Filtrar productos del contrato para el modal
   */
  get filteredContractProducts(): ProductSearchItem[] {
    if (!this.contractProductSearchTerm.trim()) {
      return this.contractProducts;
    }
    const term = this.contractProductSearchTerm.toLowerCase();
    return this.contractProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description?.toLowerCase().includes(term)) ||
      (p.sku?.toLowerCase().includes(term))
    );
  }

  /**
   * Agregar todos los items del contrato a la lista
   */
  addAllContractItems(): void {
    if (this.contractProducts.length === 0) return;

    // Limpiar items existentes si hay alguno
    while (this.itemsArray.length > 0) {
      this.itemsArray.removeAt(0);
    }

    // Agregar todos los items del contrato
    this.contractProducts.forEach(product => {
      const itemGroup = this.createItemFormGroup({
        item_id: product.id,
        item_name: product.name,
        item_description: product.description,
        is_manual_item: false,
        quantity: 1,
        unit_of_measurement: product.unit_of_measurement || 'pza',
        provider_id: product.provider_id || null,
        provider_name: product.provider_name || null,
        unit_price: product.provider_price || product.price || null  // Precio del contrato/proveedor
      });
      this.itemsArray.push(itemGroup);
    });

    Swal.fire({
      icon: 'success',
      title: 'Items agregados',
      text: `Se agregaron ${this.contractProducts.length} item(s) del contrato`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  searchProducts(term: string): void {
    if (term.length < 2) {
      this.searchedProducts = [];
      return;
    }

    this.loadingProductSearch = true;

    this.purchaseRequestService.searchProducts(term, { limit: 15 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.searchedProducts = response.data || [];
          this.loadingProductSearch = false;
        },
        error: (error) => {
          console.error('Error searching products:', error);
          this.searchedProducts = [];
          this.loadingProductSearch = false;
        }
      });
  }

  onContractModeChange(): void {
    if (this.isContractRelated) {
      // Modo contrato: limpiar destino manual
      this.form.get('manual_destination')?.setValue('');
    } else {
      // Modo interno: limpiar contrato
      this.form.get('contract_id')?.setValue(null);
      this.contractProducts = [];
    }
  }

  // Configurar búsqueda con debounce
  private setupSearchSubscriptions(): void {
    this.productSearchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchProducts(term);
    });
  }

  onProductSearch(term: string): void {
    this.productSearchTerm = term;
    this.productSearchSubject.next(term);
  }

  // Guardar
  async save(submitAfterSave = false): Promise<void> {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (this.itemsArray.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un artículo', 'error');
      return;
    }

    // Validar que cada item tenga nombre
    const itemsWithoutName = this.itemsArray.controls.filter(
      (item) => !item.get('item_name')?.value?.trim()
    );
    if (itemsWithoutName.length > 0) {
      Swal.fire('Error', 'Todos los artículos deben tener un nombre', 'error');
      return;
    }

    // Validar destino: o tiene contrato, o tiene área seleccionada, o tiene destino manual
    const formValue = this.form.value;
    const hasDestination = formValue.is_contract_related ||
                           formValue.destination_area_id ||
                           formValue.manual_destination?.trim();

    if (!hasDestination) {
      Swal.fire('Error', 'Debe especificar un destino para la solicitud', 'error');
      return;
    }

    // Validar contrato según el tipo seleccionado
    if (formValue.is_contract_related) {
      if (this.contractType === 'provider' && !formValue.contract_id) {
        Swal.fire('Error', 'Debe seleccionar un contrato de proveedor', 'error');
        return;
      }
      if (this.contractType === 'client' && !formValue.client_contract_id) {
        Swal.fire('Error', 'Debe seleccionar un contrato de cliente', 'error');
        return;
      }
    }

    this.loading = true;

    const today = new Date().toISOString().split('T')[0];

    // Determinar el contract_id a enviar según el tipo
    let contractIdToSend = undefined;
    if (formValue.is_contract_related) {
      if (this.contractType === 'provider') {
        contractIdToSend = formValue.contract_id;
      } else if (this.contractType === 'client') {
        // Para contrato de cliente, enviamos el client_contract_id
        // El backend puede manejarlo apropiadamente
        contractIdToSend = formValue.client_contract_id;
      }
    }

    const dto: CreatePurchaseRequestDTO = {
      contract_id: contractIdToSend,
      is_contract_related: formValue.is_contract_related,
      manual_destination: formValue.manual_destination || undefined,
      destination_area_id: formValue.destination_area_id || undefined,
      destination_department_id: formValue.destination_department_id || undefined,
      title: formValue.title,
      description: formValue.description || undefined,
      request_date: today,
      priority: formValue.priority,
      required_date: formValue.required_date,
      internal_notes: formValue.notes || undefined,
      items: formValue.items.map((item: any) => ({
        item_id: item.item_id || undefined,
        item_name: item.item_name,
        item_description: item.item_description || undefined,
        is_manual_item: item.is_manual_item || !item.item_id,
        quantity: item.quantity,
        unit_of_measurement: item.unit_of_measurement,
        notes: item.notes || undefined,
        // Datos del proveedor (desde contrato)
        provider_id: item.provider_id || undefined,
        provider_name: item.provider_name || undefined,
        unit_price: item.unit_price || undefined,
        contract_price: item.unit_price || undefined, // Guardar como precio de contrato
        source_contract_id: item.provider_id ? contractIdToSend : undefined
      }))
    };

    this.purchaseRequestService.create(dto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;

        if (submitAfterSave && response.data) {
          this.submitRequest(response.data.id);
        } else {
          Swal.fire('Éxito', 'Solicitud de compra creada correctamente. Está en estado borrador.', 'success');
          this.router.navigate(['/purchases/purchase-requests']);
        }
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || 'Error al crear la solicitud';
        Swal.fire('Error', message, 'error');
      }
    });
  }

  private submitRequest(id: number): void {
    this.purchaseRequestService.submit(id).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Solicitud creada y enviada para pre-autorización', 'success');
        this.router.navigate(['/purchases/purchase-requests']);
      },
      error: () => {
        Swal.fire('Aviso', 'Solicitud creada pero no se pudo enviar automáticamente. Puede enviarla desde el listado.', 'warning');
        this.router.navigate(['/purchases/purchase-requests']);
      }
    });
  }

  cancel(): void {
    if (this.withPricingMode) {
      this.router.navigate(['/purchases/purchase-requests/pending-preauthorization']);
    } else {
      this.router.navigate(['/purchases/purchase-requests']);
    }
  }

  saveWithPricing(): void {
    if (this.form.invalid || this.itemsArray.length === 0) {
      this.markFormGroupTouched();
      Swal.fire('Error', 'Complete todos los campos requeridos', 'error');
      return;
    }

    // Validar que todos los items tengan proveedor y precio
    const formValue = this.form.value;
    const invalidItems = formValue.items.filter((item: any) => !item.provider_id || !item.unit_price || item.unit_price <= 0);
    if (invalidItems.length > 0) {
      Swal.fire('Error', 'Todos los items deben tener proveedor y precio asignado', 'error');
      return;
    }

    this.loading = true;

    const today = new Date().toISOString().split('T')[0];
    const dto: CreatePurchaseRequestDTO = {
      contract_id: formValue.contract_id || undefined,
      is_contract_related: formValue.is_contract_related,
      manual_destination: formValue.manual_destination || undefined,
      destination_area_id: formValue.destination_area_id || undefined,
      destination_department_id: formValue.destination_department_id || undefined,
      title: formValue.title,
      description: formValue.description || undefined,
      request_date: today,
      priority: formValue.priority,
      required_date: formValue.required_date,
      internal_notes: formValue.notes || undefined,
      skip_preauthorization: true, // Saltar pre-autorización, ir directo a autorización final
      items: formValue.items.map((item: any) => ({
        item_id: item.item_id || undefined,
        item_name: item.item_name,
        item_description: item.item_description || undefined,
        is_manual_item: item.is_manual_item || !item.item_id,
        quantity: item.quantity,
        unit_of_measurement: item.unit_of_measurement,
        notes: item.notes || undefined,
        provider_id: item.provider_id,
        unit_price: item.unit_price
      }))
    };

    this.purchaseRequestService.create(dto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.data) {
          // Enviar para autorización final directamente
          this.purchaseRequestService.submitForFinalAuthorization(response.data.id).subscribe({
            next: () => {
              this.loading = false;
              Swal.fire('Éxito', 'Solicitud creada y enviada para autorización final', 'success');
              this.router.navigate(['/purchases/purchase-requests/pending-preauthorization']);
            },
            error: () => {
              this.loading = false;
              Swal.fire('Aviso', 'Solicitud creada pero no se pudo enviar automáticamente.', 'warning');
              this.router.navigate(['/purchases/purchase-requests/pending-preauthorization']);
            }
          });
        }
      },
      error: (err) => {
        this.loading = false;
        const message = err.error?.message || 'Error al crear la solicitud';
        Swal.fire('Error', message, 'error');
      }
    });
  }

  // Utilidades
  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            Object.keys(c.controls).forEach(k => c.get(k)?.markAsTouched());
          }
        });
      }
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const item = this.itemsArray.at(index);
    const field = item?.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
