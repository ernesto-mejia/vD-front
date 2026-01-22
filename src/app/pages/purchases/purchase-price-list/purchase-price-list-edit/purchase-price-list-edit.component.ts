import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchasePriceListService } from '../purchase-price-list.service';
import {
  ProviderOption,
  ProviderContractOption,
  ProviderProductItem,
  CurrencyOption,
  PurchasePriceListUpdateRequest,
} from '../purchase-price-list';

@Component({
  selector: 'app-purchase-price-list-edit',
  templateUrl: './purchase-price-list-edit.component.html',
  styleUrls: ['./purchase-price-list-edit.component.css'],
})
export class PurchasePriceListEditComponent implements OnInit, OnDestroy {
  submitted = false;
  loading = false;
  priceListId: number = 0;

  // Para usar Math en el template
  Math = Math;

  // Modelo de la lista de precios
  priceList: PurchasePriceListUpdateRequest = {
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
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.priceListId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMetaData();
    this.loadPriceList();
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

  private loadPriceList(): void {
    this.loading = true;

    Swal.fire({
      title: 'Cargando...',
      text: 'Por favor espera mientras se cargan los datos.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(null),
    });

    this.priceListService
      .getPriceList(this.priceListId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.close();

          if (response) {
            // Formatear fechas para input type="date"
            const formatDateForInput = (dateStr?: string): string => {
              if (!dateStr) return '';
              const date = new Date(dateStr);
              return date.toISOString().split('T')[0];
            };

            this.priceList = {
              code: response.code,
              name: response.name,
              description: response.description,
              provider_id: response.provider_id,
              provider_contract_id: response.provider_contract_id,
              currency: response.currency,
              start_date: formatDateForInput(response.start_date),
              end_date: formatDateForInput(response.end_date),
              discount_percentage: response.discount_percentage || 0,
              payment_terms: response.payment_terms,
              delivery_time: response.delivery_time,
              minimum_order: response.minimum_order,
              notes: response.notes,
              is_active: response.is_active,
              items: response.items || [],
            };

            // Si hay proveedor, cargar contratos y productos
            if (this.priceList.provider_id) {
              this.loadProviderContractsForEdit();
              this.loadProductsForEdit();
            }
          }
        },
        error: (error) => {
          this.loading = false;
          Swal.close();
          console.error('Error al cargar lista de precios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información de la lista de precios.',
          });
        },
      });
  }

  /**
   * Cargar contratos del proveedor (para edición inicial)
   */
  private loadProviderContractsForEdit(): void {
    if (!this.priceList.provider_id) return;

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
  }

  /**
   * Cargar productos para edición (marcando los ya seleccionados)
   */
  private loadProductsForEdit(): void {
    if (!this.priceList.provider_id) return;

    this.loadingProducts = true;

    // Cargar productos del contrato o del proveedor según corresponda
    const loadProducts$ = this.priceList.provider_contract_id
      ? this.priceListService.getContractItems(this.priceList.provider_contract_id)
      : this.priceListService.getProviderItems(this.priceList.provider_id);

    loadProducts$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (products) => {
        // Marcar productos que ya están en la lista
        const existingItemIds = new Set(
          (this.priceList.items || []).map(item => item.product_id)
        );

        this.providerProducts = (products || []).map(product => {
          // Buscar si este producto ya está en los items
          const existingItem = (this.priceList.items || []).find(
            item => item.product_id === product.item_id
          );

          return {
            ...product,
            // Marcar como seleccionado si ya estaba en la lista O por defecto true para nuevos
            selected: existingItemIds.has(product.item_id) || existingItemIds.size === 0,
            unit_price: existingItem?.unit_price ?? product.unit_price,
          };
        });

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

  goBack(): void {
    this.location.back();
  }

  updatePriceList(): void {
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
      .updatePriceList(this.priceListId, this.priceList)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: 'Lista de precios actualizada',
            text: 'La lista de precios ha sido actualizada exitosamente.',
            showCancelButton: true,
            confirmButtonText: 'Ver detalle',
            cancelButtonText: 'Regresar a lista',
            reverseButtons: true,
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/purchases/purchase-price-list/show', this.priceListId]);
              return;
            }
            this.router.navigate(['/purchases/purchase-price-list/list']);
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al actualizar lista de precios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al actualizar la lista de precios.',
          });
        },
      });
  }
}
