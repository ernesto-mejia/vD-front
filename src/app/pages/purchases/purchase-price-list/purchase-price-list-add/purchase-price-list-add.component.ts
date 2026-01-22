import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchasePriceListService } from '../purchase-price-list.service';
import {
  ProviderOption,
  ProviderContractOption,
  ProviderProductItem,
  CurrencyOption,
  PurchasePriceListCreateRequest,
} from '../purchase-price-list';

@Component({
  selector: 'app-purchase-price-list-add',
  templateUrl: './purchase-price-list-add.component.html',
  styleUrls: ['./purchase-price-list-add.component.css'],
})
export class PurchasePriceListAddComponent implements OnInit, OnDestroy {
  submitted = false;
  loading = false;

  // Para usar Math en el template
  Math = Math;

  // Modelo de la lista de precios
  priceList: PurchasePriceListCreateRequest = {
    code: '',
    name: '',
    description: '',
    provider_id: undefined,
    provider_contract_id: undefined,
    currency: 'MXN',
    start_date: '',
    end_date: '',
    discount_percentage: 0,
    payment_terms: '',
    delivery_time: undefined,
    minimum_order: undefined,
    notes: '',
    is_active: true,
    items: [],
  };

  // Opciones para selectores
  providersCatalog: ProviderOption[] = [];
  providerContracts: ProviderContractOption[] = [];
  currencies: CurrencyOption[] = [];
  loadingProviders = false;
  loadingContracts = false;
  loadingProducts = false;

  // Productos del proveedor
  providerProducts: ProviderProductItem[] = [];
  selectAllProducts = false;

  // Búsqueda y paginación de productos
  productSearchTerm = '';
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  // Opciones de términos de pago predefinidos
  paymentTermsOptions: string[] = [
    'Contado',
    '15 días',
    '30 días',
    '45 días',
    '60 días',
    '90 días',
    'Personalizado',
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private priceListService: PurchasePriceListService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadMetaData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMetaData(): void {
    // Cargar proveedores
    this.loadingProviders = true;
    this.priceListService
      .getProvidersCatalog()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => {
          this.providersCatalog = providers || [];
          this.loadingProviders = false;
        },
        error: (error) => {
          console.error('Error al cargar proveedores:', error);
          this.loadingProviders = false;
        },
      });

    // Cargar monedas
    this.priceListService
      .getCurrencies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (currencies) => {
          this.currencies = currencies || [];
        },
        error: (error) => {
          console.error('Error al cargar monedas:', error);
          this.currencies = [
            { id: 'MXN', name: 'Peso Mexicano', symbol: '$' },
            { id: 'USD', name: 'Dólar Americano', symbol: 'US$' },
            { id: 'EUR', name: 'Euro', symbol: '€' },
          ];
        },
      });
  }

  /**
   * Cuando se selecciona un proveedor, cargar sus contratos y productos
   */
  onProviderChange(): void {
    // Limpiar selecciones previas
    this.providerContracts = [];
    this.providerProducts = [];
    this.priceList.provider_contract_id = undefined;
    this.selectAllProducts = false;
    this.productSearchTerm = '';
    this.currentPage = 1;

    if (!this.priceList.provider_id) {
      return;
    }

    // Cargar contratos del proveedor
    this.loadingContracts = true;
    this.priceListService
      .getProviderContracts(this.priceList.provider_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.providerContracts = contracts || [];
          this.loadingContracts = false;
        },
        error: (error) => {
          console.error('Error al cargar contratos:', error);
          this.loadingContracts = false;
        },
      });

    // Cargar productos del proveedor
    this.loadProviderProducts();
  }

  /**
   * Cuando se selecciona un contrato, cargar sus productos
   */
  onContractChange(): void {
    this.providerProducts = [];
    this.selectAllProducts = false;
    this.productSearchTerm = '';
    this.currentPage = 1;

    if (this.priceList.provider_contract_id) {
      this.loadContractProducts();
    } else if (this.priceList.provider_id) {
      this.loadProviderProducts();
    }
  }

  /**
   * Cargar productos del proveedor
   */
  private loadProviderProducts(): void {
    if (!this.priceList.provider_id) return;

    this.loadingProducts = true;
    this.priceListService
      .getProviderItems(this.priceList.provider_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          // Marcar todos los productos como seleccionados por defecto
          this.providerProducts = (products || []).map(p => ({ ...p, selected: true }));
          this.updateSelectAllState();
          this.loadingProducts = false;
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
          this.loadingProducts = false;
        },
      });
  }

  /**
   * Cargar productos de un contrato específico
   */
  private loadContractProducts(): void {
    if (!this.priceList.provider_contract_id) return;

    this.loadingProducts = true;
    this.priceListService
      .getContractItems(this.priceList.provider_contract_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          // Marcar todos los productos como seleccionados por defecto
          this.providerProducts = (products || []).map(p => ({ ...p, selected: true }));
          this.updateSelectAllState();
          this.loadingProducts = false;
        },
        error: (error) => {
          console.error('Error al cargar productos del contrato:', error);
          this.loadingProducts = false;
        },
      });
  }

  /**
   * Seleccionar/deseleccionar todos los productos (solo los filtrados en la página actual)
   */
  toggleSelectAll(): void {
    const filtered = this.getFilteredProducts();
    filtered.forEach(p => p.selected = this.selectAllProducts);
  }

  /**
   * Seleccionar/deseleccionar todos los productos filtrados (todas las páginas)
   */
  toggleSelectAllFiltered(): void {
    const filtered = this.getFilteredProducts();
    const allSelected = filtered.every(p => p.selected);
    filtered.forEach(p => p.selected = !allSelected);
    this.updateSelectAllState();
  }

  /**
   * Actualizar estado del checkbox "Seleccionar todos"
   */
  updateSelectAllState(): void {
    const filtered = this.getFilteredProducts();
    this.selectAllProducts = filtered.length > 0 &&
      filtered.every(p => p.selected);
  }

  /**
   * Obtener productos filtrados por búsqueda
   */
  getFilteredProducts(): ProviderProductItem[] {
    if (!this.productSearchTerm.trim()) {
      return this.providerProducts;
    }
    const term = this.productSearchTerm.toLowerCase().trim();
    return this.providerProducts.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.umc?.toLowerCase().includes(term)
    );
  }

  /**
   * Obtener productos paginados (filtrados y con paginación)
   */
  getPaginatedProducts(): ProviderProductItem[] {
    const filtered = this.getFilteredProducts();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Obtener total de páginas
   */
  getTotalPages(): number {
    return Math.ceil(this.getFilteredProducts().length / this.pageSize);
  }

  /**
   * Cambiar página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  /**
   * Al cambiar el término de búsqueda, volver a la primera página
   */
  onSearchChange(): void {
    this.currentPage = 1;
    this.updateSelectAllState();
  }

  /**
   * Al cambiar el tamaño de página, volver a la primera página
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  /**
   * Obtener rango de páginas visibles para la paginación
   */
  getPageRange(): number[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const range: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(totalPages, current + 2);

    // Ajustar para mostrar siempre 5 páginas si es posible
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, 5);
      } else if (end === totalPages) {
        start = Math.max(1, totalPages - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  /**
   * Obtener productos seleccionados
   */
  getSelectedProducts(): ProviderProductItem[] {
    return this.providerProducts.filter(p => p.selected);
  }

  /**
   * Obtener conteo de productos seleccionados en los filtrados
   */
  getSelectedInFilteredCount(): number {
    return this.getFilteredProducts().filter(p => p.selected).length;
  }

  /**
   * Verificar si todos los productos filtrados están seleccionados
   */
  areAllFilteredSelected(): boolean {
    const filtered = this.getFilteredProducts();
    return filtered.length > 0 && filtered.every(p => p.selected);
  }

  providerSearchFn(term: string, item: ProviderOption): boolean {
    term = term.toLowerCase();
    return (item.name?.toLowerCase().includes(term) ||
            item.company?.toLowerCase().includes(term) ||
            item.shortname?.toLowerCase().includes(term)) || false;
  }

  contractSearchFn(term: string, item: ProviderContractOption): boolean {
    term = term.toLowerCase();
    return item.contract_name?.toLowerCase().includes(term) || false;
  }

  generateCode(): void {
    const timestamp = Date.now().toString().slice(-6);
    this.priceList.code = `PPL-${timestamp}`;
  }

  goBack(): void {
    this.location.back();
  }

  savePriceList(): void {
    this.submitted = true;

    // Validar campos requeridos
    if (!this.priceList.code || !this.priceList.name) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Por favor complete los campos obligatorios (Código y Nombre).',
      });
      return;
    }

    // Obtener productos seleccionados y convertir al formato de items
    const selectedProducts = this.getSelectedProducts();
    this.priceList.items = selectedProducts.map(p => ({
      product_id: p.item_id,
      item_name: p.name,
      sku: p.sku,
      umc: p.umc,
      unit_price: p.unit_price,
    }));

    this.loading = true;

    this.priceListService
      .createPriceList(this.priceList)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Lista de precios creada',
            text: 'La lista de precios ha sido creada exitosamente.',
            showCancelButton: true,
            confirmButtonText: 'Ver detalle',
            cancelButtonText: 'Regresar a lista',
            reverseButtons: true,
          }).then((result) => {
            if (result.isConfirmed && response?.id) {
              this.router.navigate(['/purchases/purchase-price-list/show', response.id]);
              return;
            }
            this.router.navigate(['/purchases/purchase-price-list/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al crear lista de precios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al crear la lista de precios.',
          });
        },
      });
  }
}
