import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ProviderContractService } from '../contract.service';
import {
  ProviderContractCreateRequest,
  ProviderContractItemCreate,
  ProviderOption,
  ClientContractOption,
  ProviderItemSummary
} from '../contracts';

interface ItemOption {
  id: number;
  name: string;
  code?: string;
  unit_price?: number;
}

interface ItemWithPrice {
  item_id: number | null;    // Null si es item manual
  item_name: string;
  item_code?: string;
  reference_price?: number;  // Precio de referencia del catálogo
  provider_price: number;    // Precio que da el proveedor
  currency: string;
  is_manual: boolean;        // True si es item ingresado manualmente
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

  submitted = false;
  saving = false;

  // Datos del contrato
  contractName = '';  // Ahora es opcional
  description = '';
  selectedProviderId: number | null = null;
  providerCompany = '';  // Auto-llenado

  // Relación con contrato de cliente
  hasClientContract = false;
  selectedClientContractId: number | null = null;

  // Fechas
  startDate = '';
  endDate = '';

  // Opciones
  providers: ProviderOption[] = [];
  clientContracts: ClientContractOption[] = [];
  items: ItemOption[] = [];

  // Items del proveedor seleccionado (desde API)
  providerItems: ProviderItemSummary[] = [];
  loadingProviderItems = false;

  // Items con precios agregados
  contractItems: ItemWithPrice[] = [];

  // Para agregar item del catálogo
  selectedItemToAdd: number | null = null;
  itemPriceToAdd: number = 0;

  // Para agregar item manual (nuevo)
  manualItemName = '';
  manualItemCode = '';
  manualItemPrice: number = 0;
  showManualItemForm = false;

  // Estados de carga
  loadingProviders = false;
  loadingClientContracts = false;
  loadingItems = false;

  // Búsqueda de contratos de cliente
  clientContractSearch$ = new Subject<string>();

  constructor(
    private contractService: ProviderContractService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.setupClientContractSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    // Cargar proveedores
    this.loadingProviders = true;
    this.contractService.getProviders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => {
          this.providers = providers;
          this.loadingProviders = false;
        },
        error: () => this.loadingProviders = false
      });

    // Cargar items/pruebas
    this.loadingItems = true;
    this.contractService.getItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.items = items;
          this.loadingItems = false;
        },
        error: () => this.loadingItems = false
      });

    // Cargar contratos de cliente iniciales
    this.loadClientContracts();
  }

  private loadClientContracts(): void {
    this.loadingClientContracts = true;
    this.contractService.getClientContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.clientContracts = contracts;
          this.loadingClientContracts = false;
        },
        error: () => this.loadingClientContracts = false
      });
  }

  private setupClientContractSearch(): void {
    this.clientContractSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      if (term && term.length >= 2) {
        this.loadingClientContracts = true;
        this.contractService.searchClientContracts(term)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (contracts) => {
              this.clientContracts = contracts;
              this.loadingClientContracts = false;
            },
            error: () => this.loadingClientContracts = false
          });
      }
    });
  }

  // ==================== EVENTOS ====================

  onProviderChange(provider: ProviderOption | null): void {
    if (provider) {
      this.selectedProviderId = provider.id;
      this.providerCompany = provider.company;
      this.loadProviderItems(provider.id);
    } else {
      this.selectedProviderId = null;
      this.providerCompany = '';
      this.providerItems = [];
    }
  }

  /**
   * Cargar items/servicios que ofrece el proveedor seleccionado
   */
  private loadProviderItems(providerId: number): void {
    this.loadingProviderItems = true;
    this.providerItems = [];
    this.contractService.getProviderItems(providerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.providerItems = items;
          this.loadingProviderItems = false;
        },
        error: () => {
          this.providerItems = [];
          this.loadingProviderItems = false;
        }
      });
  }

  onHasClientContractChange(): void {
    if (!this.hasClientContract) {
      this.selectedClientContractId = null;
    }
  }

  // ==================== GESTIÓN DE ITEMS ====================

  /**
   * Agregar un item del proveedor a la lista del contrato
   */
  addProviderItem(providerItem: ProviderItemSummary): void {
    // Verificar que no esté duplicado
    if (this.isItemAdded(providerItem.item_id)) {
      Swal.fire('Aviso', 'Este item ya está agregado al contrato', 'warning');
      return;
    }

    this.contractItems.push({
      item_id: providerItem.item_id,
      item_name: providerItem.item_name,
      item_code: providerItem.sku,
      reference_price: providerItem.price,
      provider_price: providerItem.provider_price || providerItem.price || 0,
      currency: providerItem.currency || 'MXN',
      is_manual: false
    });

    Swal.fire({
      icon: 'success',
      title: 'Item agregado',
      text: providerItem.item_name,
      timer: 1500,
      showConfirmButton: false
    });
  }

  /**
   * Verifica si un item ya está en la lista del contrato
   */
  isItemAdded(itemId: number): boolean {
    return this.contractItems.some(i => i.item_id === itemId);
  }

  /**
   * Agregar item manualmente desde el catálogo general
   */
  addItem(): void {
    if (!this.selectedItemToAdd || this.itemPriceToAdd <= 0) {
      Swal.fire('Error', 'Seleccione un item y especifique un precio válido', 'warning');
      return;
    }

    // Verificar que no esté duplicado
    if (this.contractItems.some(i => i.item_id === this.selectedItemToAdd)) {
      Swal.fire('Error', 'Este item ya está agregado', 'warning');
      return;
    }

    const item = this.items.find(i => i.id === this.selectedItemToAdd);
    if (!item) return;

    this.contractItems.push({
      item_id: item.id,
      item_name: item.name,
      item_code: item.code,
      reference_price: item.unit_price,
      provider_price: this.itemPriceToAdd,
      currency: 'MXN',
      is_manual: false
    });

    // Limpiar selección
    this.selectedItemToAdd = null;
    this.itemPriceToAdd = 0;
  }

  /**
   * Agregar item manual (no del catálogo)
   */
  addManualItem(): void {
    if (!this.manualItemName?.trim()) {
      Swal.fire('Error', 'Ingrese el nombre del servicio/prueba', 'warning');
      return;
    }
    if (this.manualItemPrice <= 0) {
      Swal.fire('Error', 'Ingrese un precio válido', 'warning');
      return;
    }

    // Verificar que no esté duplicado por nombre
    const normalizedName = this.manualItemName.trim().toLowerCase();
    if (this.contractItems.some(i => i.item_name.toLowerCase() === normalizedName)) {
      Swal.fire('Error', 'Ya existe un item con ese nombre', 'warning');
      return;
    }

    this.contractItems.push({
      item_id: null,  // Null indica que es manual
      item_name: this.manualItemName.trim(),
      item_code: this.manualItemCode?.trim() || undefined,
      reference_price: undefined,
      provider_price: this.manualItemPrice,
      currency: 'MXN',
      is_manual: true
    });

    // Limpiar formulario
    this.manualItemName = '';
    this.manualItemCode = '';
    this.manualItemPrice = 0;
    this.showManualItemForm = false;

    Swal.fire({
      icon: 'success',
      title: 'Item manual agregado',
      timer: 1500,
      showConfirmButton: false
    });
  }

  toggleManualItemForm(): void {
    this.showManualItemForm = !this.showManualItemForm;
    if (!this.showManualItemForm) {
      this.manualItemName = '';
      this.manualItemCode = '';
      this.manualItemPrice = 0;
    }
  }

  removeItem(index: number): void {
    this.contractItems.splice(index, 1);
  }

  updateItemPrice(index: number, price: number): void {
    if (this.contractItems[index]) {
      this.contractItems[index].provider_price = price;
    }
  }

  getTotalItemsValue(): number {
    return this.contractItems.reduce((sum, item) => sum + (item.provider_price || 0), 0);
  }

  // ==================== VALIDACIONES ====================

  isFormValid(): boolean {
    return !!(
      this.selectedProviderId &&
      this.contractItems.length > 0 &&
      (!this.hasClientContract || this.selectedClientContractId)
    );
  }

  // ==================== GUARDAR ====================

  saveContract(): void {
    this.submitted = true;

    if (!this.isFormValid()) {
      Swal.fire('Error', 'Complete todos los campos requeridos y agregue al menos un item', 'error');
      return;
    }

    const items: ProviderContractItemCreate[] = this.contractItems.map(i => ({
      item_id: i.item_id,           // Null si es manual
      item_name: i.item_name,       // Nombre del item
      item_code: i.item_code,       // Código (opcional)
      provider_price: i.provider_price,
      currency: i.currency,
      is_manual: i.is_manual
    }));

    const payload: ProviderContractCreateRequest = {
      provider_id: this.selectedProviderId!,
      contract_name: this.contractName?.trim() || undefined,  // Opcional ahora
      description: this.description,
      client_contract_id: this.hasClientContract ? this.selectedClientContractId : null,
      start_date: this.startDate || undefined,
      end_date: this.endDate || undefined,
      items: items
    };

    this.saving = true;
    Swal.fire({
      title: 'Guardando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.contractService.createContract(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          Swal.fire('Éxito', 'Contrato de proveedor creado correctamente', 'success')
            .then(() => this.router.navigate(['/purchases/contracts-providers']));
        },
        error: (err) => {
          this.saving = false;
          Swal.fire('Error', err.error?.message || 'No se pudo guardar el contrato', 'error');
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  // ==================== UTILIDADES ====================

  providerSearchFn(term: string, item: ProviderOption): boolean {
    term = term.toLowerCase();
    return item.shortname?.toLowerCase().includes(term) ||
           item.company?.toLowerCase().includes(term) || false;
  }

  clientContractSearchFn(term: string, item: ClientContractOption): boolean {
    term = term.toLowerCase();
    return item.project_name?.toLowerCase().includes(term) ||
           item.customer_name?.toLowerCase().includes(term) || false;
  }

  formatMoney(amount: number | undefined): string {
    if (!amount) return '$0.00';
    return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
