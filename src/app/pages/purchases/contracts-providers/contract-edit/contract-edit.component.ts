import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ProviderContractService } from '../contract.service';
import {
  ProviderContractUpdateRequest,
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
  item_id: number;
  item_name: string;
  item_code?: string;
  reference_price?: number;
  provider_price: number;
  currency: string;
}

@Component({
  selector: 'app-contract-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, SidebarComponent],
  templateUrl: './contract-edit.component.html',
  styleUrl: './contract-edit.component.css'
})
export class ContractEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  contractId: number = 0;
  submitted = false;
  saving = false;
  loading = true;

  // Datos del contrato
  contractName = '';
  description = '';
  selectedProviderId: number | null = null;
  providerCompany = '';

  hasClientContract = false;
  selectedClientContractId: number | null = null;

  startDate = '';
  endDate = '';

  // Opciones
  providers: ProviderOption[] = [];
  clientContracts: ClientContractOption[] = [];
  items: ItemOption[] = [];

  // Items del proveedor seleccionado (desde API)
  providerItems: ProviderItemSummary[] = [];
  loadingProviderItems = false;

  // Estado del contrato
  selectedStatusId: number | null = null;
  contractStatuses: { id: number; name: string }[] = [];

  // Items con precios
  contractItems: ItemWithPrice[] = [];

  // Para agregar item
  selectedItemToAdd: number | null = null;
  itemPriceToAdd: number = 0;

  // Estados de carga
  loadingProviders = false;
  loadingClientContracts = false;
  loadingItems = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private contractService: ProviderContractService
  ) {}

  ngOnInit(): void {
    this.contractId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.contractId) {
      this.loadInitialData();
    } else {
      this.router.navigate(['/purchases/contracts-providers']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInitialData(): void {
    this.loadProviders();
    this.loadItems();
    this.loadClientContracts();
    this.loadContractStatuses();
    this.loadContract();
  }

  private loadContractStatuses(): void {
    this.contractService.getContractStatuses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statuses) => this.contractStatuses = statuses,
        error: () => console.error('Error cargando estados de contrato')
      });
  }

  private loadContract(): void {
    this.loading = true;
    this.contractService.getContract(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const data = response.data;
          if (data) {
            this.contractName = data.contract_name || '';
            this.description = data.description || '';
            this.selectedProviderId = data.provider_id;
            this.providerCompany = data.provider_company || '';
            this.selectedClientContractId = data.client_contract_id || null;
            this.hasClientContract = !!data.client_contract_id;
            this.startDate = data.start_date || '';
            this.endDate = data.end_date || '';
            this.selectedStatusId = data.status_id || null;

            // Cargar items existentes
            this.contractItems = (data.items || []).map(item => ({
              item_id: item.item_id ?? 0,
              item_name: item.item_name || '',
              item_code: item.item_code,
              reference_price: undefined,
              provider_price: item.provider_price,
              currency: item.currency || 'MXN'
            }));

            // Cargar items del proveedor
            if (data.provider_id) {
              this.loadProviderItems(data.provider_id);
            }
          }
          this.loading = false;
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo cargar el contrato', 'error');
          this.loading = false;
          this.router.navigate(['/purchases/contracts-providers']);
        }
      });
  }

  private loadProviders(): void {
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
  }

  private loadItems(): void {
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
      currency: providerItem.currency || 'MXN'
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

  onHasClientContractChange(): void {
    if (!this.hasClientContract) {
      this.selectedClientContractId = null;
    }
  }

  addItem(): void {
    if (!this.selectedItemToAdd || this.itemPriceToAdd <= 0) {
      Swal.fire('Error', 'Seleccione un item y precio válido', 'warning');
      return;
    }

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
      currency: 'MXN'
    });

    this.selectedItemToAdd = null;
    this.itemPriceToAdd = 0;
  }

  removeItem(index: number): void {
    this.contractItems.splice(index, 1);
  }

  getTotalItemsValue(): number {
    return this.contractItems.reduce((sum, item) => sum + (item.provider_price || 0), 0);
  }

  isFormValid(): boolean {
    return !!(
      this.selectedProviderId &&
      this.contractName?.trim() &&
      this.contractItems.length > 0 &&
      (!this.hasClientContract || this.selectedClientContractId)
    );
  }

  saveContract(): void {
    this.submitted = true;

    if (!this.isFormValid()) {
      Swal.fire('Error', 'Complete todos los campos requeridos', 'error');
      return;
    }

    const items: ProviderContractItemCreate[] = this.contractItems.map(i => ({
      item_id: i.item_id,
      provider_price: i.provider_price,
      currency: i.currency
    }));

    const payload: ProviderContractUpdateRequest = {
      id: this.contractId,
      provider_id: this.selectedProviderId!,
      contract_name: this.contractName,
      description: this.description,
      client_contract_id: this.hasClientContract ? this.selectedClientContractId : null,
      start_date: this.startDate || undefined,
      end_date: this.endDate || undefined,
      status_id: this.selectedStatusId || undefined,
      items: items
    };

    this.saving = true;
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    this.contractService.updateContract(this.contractId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          Swal.fire('Éxito', 'Contrato actualizado correctamente', 'success')
            .then(() => this.router.navigate(['/purchases/contracts-providers/show', this.contractId]));
        },
        error: (err) => {
          this.saving = false;
          Swal.fire('Error', err.error?.message || 'No se pudo actualizar', 'error');
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  providerSearchFn(term: string, item: ProviderOption): boolean {
    term = term.toLowerCase();
    return item.shortname?.toLowerCase().includes(term) ||
           item.company?.toLowerCase().includes(term) || false;
  }

  formatMoney(amount: number | undefined): string {
    if (!amount) return '$0.00';
    return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
