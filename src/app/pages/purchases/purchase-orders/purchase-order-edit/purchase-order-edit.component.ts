import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { PurchaseOrderService } from '../purchase-order.service';
import { ProductsService, ItemSupplier } from '../../../warehouse/products/products.service';
import {
  PurchaseOrder,
  UpdatePurchaseOrderDTO,
  UpdatePurchaseOrderItemDTO,
  PRIORITIES,
  PAYMENT_METHODS,
  TotalsCalculation
} from '../purchase-orders';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';
import { map } from 'rxjs/operators';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface TaxRates {
  iva_rate: number;
  iva_retention_rate: number;
  isr_retention_rate: number;
}

// Mapa de proveedores por item_id
interface ItemProvidersMap {
  [itemId: number]: ItemSupplier[];
}

@Component({
  selector: 'app-purchase-order-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-order-edit.component.html',
  styleUrls: ['./purchase-order-edit.component.scss']
})
export class PurchaseOrderEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orderId!: number;
  order: PurchaseOrder | null = null;

  // Form data
  formData: UpdatePurchaseOrderDTO = {
    items: []
  };

  // Proveedores por item
  itemProvidersMap: ItemProvidersMap = {};
  loadingItemProviders: { [itemId: number]: boolean } = {};

  // Proveedores globales (para items sin proveedor específico)
  allProviders: { id: number; name: string; rfc?: string }[] = [];
  loadingProviders = false;

  priorities = PRIORITIES;
  paymentMethods = PAYMENT_METHODS;
  taxRates: TaxRates | null = null;

  totals: TotalsCalculation = {
    subtotal: 0,
    discount_amount: 0,
    vat_amount: 0,
    vat_retention_amount: 0,
    isr_retention_amount: 0,
    shipping_cost: 0,
    total: 0,
    tax_rates: { vat_rate: 16, vat_retention_rate: 0, isr_retention_rate: 0 }
  };

  loading = true;
  saving = false;

  constructor(
    private orderService: PurchaseOrderService,
    private productsService: ProductsService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAllProviders(); // Cargar todos los proveedores
    this.loadOrder();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar todos los proveedores del sistema
   */
  private loadAllProviders(): void {
    this.loadingProviders = true;
    this.http.get<{ data: any[] }>(apiEndpoint('v2/company/providers'))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allProviders = (response.data || []).map(p => ({
            id: p.id,
            name: p.company || p.shortname || 'Sin nombre',
            rfc: p.tax_id
          }));
          this.loadingProviders = false;
        },
        error: () => {
          this.allProviders = [];
          this.loadingProviders = false;
        }
      });
  }

  loadOrder(): void {
    this.loading = true;
    this.orderService.get(this.orderId).subscribe({
      next: (response) => {
        this.order = response.data;
        this.initFormData();
        this.loadProviderTaxRates();
        this.loadItemProviders(); // Cargar proveedores para cada item
        this.loadContractPrices(); // Cargar precios del contrato si aplica
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la orden de compra', 'error');
        this.router.navigate(['/purchases/purchase-orders/list']);
      }
    });
  }

  /**
   * Cargar precios del contrato si la OC tiene contrato asociado
   */
  private loadContractPrices(): void {
    if (!this.order?.contract_id) return;

    this.http.get<{ success: boolean; data: any[] }>(
      apiEndpoint(`v2/purchase-requests/contract-products/${this.order.contract_id}`)
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Mapear precios del contrato por item_id
            const contractPrices: { [itemId: number]: { price: number; provider_id: number; provider_name: string } } = {};
            response.data.forEach((product: any) => {
              if (product.id) {
                contractPrices[product.id] = {
                  price: product.unit_price || 0,
                  provider_id: product.provider_id,
                  provider_name: product.provider_name
                };
              }
            });

            // Actualizar precios de items que estén en 0
            this.formData.items?.forEach(item => {
              if (item.item_id && contractPrices[item.item_id]) {
                const contractData = contractPrices[item.item_id];
                // Si el precio es 0, usar el del contrato
                if (!item.unit_price || item.unit_price === 0) {
                  item.unit_price = contractData.price;
                }
                // Si no tiene proveedor, usar el del contrato
                if (!item.provider_id) {
                  item.provider_id = contractData.provider_id;
                  item.provider_name = contractData.provider_name;
                }
              }
            });

            this.calculateTotals();
          }
        },
        error: () => {
          // Si falla, simplemente continuamos sin precios del contrato
        }
      });
  }

  initFormData(): void {
    if (!this.order) return;

    this.formData = {
      title: this.order.title,
      description: this.order.description,
      expected_delivery_date: this.order.expected_delivery_date,
      priority: this.order.priority,
      internal_notes: this.order.internal_notes,
      vendor_notes: this.order.vendor_notes,
      payment_terms: this.order.payment_terms,
      payment_method: this.order.payment_method,
      shipping_method: this.order.shipping_method,
      shipping_cost: this.order.shipping_cost,
      items: this.order.items?.map(item => ({
        id: item.id,
        item_id: item.item_id,
        provider_id: item.provider_id,
        provider_name: item.provider_name,
        item_code: item.item_code,
        item_name: item.item_name,
        item_description: item.item_description,
        provider_code: item.provider_code,
        provider_sku: item.provider_sku,
        quantity_ordered: item.quantity_ordered,
        unit_price: item.unit_price,
        unit_of_measurement: item.unit_of_measurement,
        discount_percent: item.discount_percent,
        is_tax_exempt: item.is_tax_exempt,
        notes: item.notes,
        expected_date: item.expected_date
      })) || []
    };
  }

  loadProviderTaxRates(): void {
    if (!this.order?.provider_id) return;

    this.http.get<any>(apiEndpoint(`v2/company/providers/${this.order.provider_id}/tax-configuration`))
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              iva_rate: response.data.iva_rate ?? 16,
              iva_retention_rate: response.data.iva_retention_rate ?? 0,
              isr_retention_rate: response.data.isr_retention_rate ?? 0
            };
          }
          return { iva_rate: 16, iva_retention_rate: 0, isr_retention_rate: 0 };
        })
      )
      .subscribe({
        next: (rates) => {
          this.taxRates = rates;
          this.calculateTotals();
        },
        error: () => {
          this.taxRates = { iva_rate: 16, iva_retention_rate: 0, isr_retention_rate: 0 };
          this.calculateTotals();
        }
      });
  }

  addItem(): void {
    const newItem: UpdatePurchaseOrderItemDTO = {
      item_name: '',
      quantity_ordered: 1,
      unit_price: 0,
      unit_of_measurement: 'PZA',
      discount_percent: 0,
      is_tax_exempt: false
    };
    this.formData.items?.push(newItem);
  }

  removeItem(index: number): void {
    if (this.formData.items && this.formData.items.length > 1) {
      this.formData.items.splice(index, 1);
      this.calculateTotals();
    }
  }

  duplicateItem(index: number): void {
    if (this.formData.items) {
      const item = { ...this.formData.items[index], id: undefined };
      this.formData.items.splice(index + 1, 0, item);
      this.calculateTotals();
    }
  }

  onItemChange(): void {
    this.calculateTotals();
  }

  calculateTotals(): void {
    let subtotal = 0;
    let discountTotal = 0;
    let vatAmount = 0;

    const vatRate = Number(this.taxRates?.iva_rate) || Number(this.order?.vat_rate) || 16;
    const vatRetentionRate = Number(this.taxRates?.iva_retention_rate) || Number(this.order?.vat_retention_rate) || 0;
    const isrRetentionRate = Number(this.taxRates?.isr_retention_rate) || Number(this.order?.isr_retention_rate) || 0;

    for (const item of this.formData.items || []) {
      const qty = Number(item.quantity_ordered) || 0;
      const price = Number(item.unit_price) || 0;
      const discountPercent = Number(item.discount_percent) || 0;

      const lineBase = qty * price;
      const lineDiscount = lineBase * (discountPercent / 100);
      const lineSubtotal = lineBase - lineDiscount;

      discountTotal += lineDiscount;
      subtotal += lineSubtotal;

      if (!item.is_tax_exempt) {
        vatAmount += lineSubtotal * (vatRate / 100);
      }
    }

    const vatRetention = subtotal * (vatRetentionRate / 100);
    const isrRetention = subtotal * (isrRetentionRate / 100);
    const shippingCost = Number(this.formData.shipping_cost) || 0;

    const total = subtotal + vatAmount - vatRetention - isrRetention + shippingCost;

    this.totals = {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      discount_amount: isNaN(discountTotal) ? 0 : discountTotal,
      vat_amount: isNaN(vatAmount) ? 0 : vatAmount,
      vat_retention_amount: isNaN(vatRetention) ? 0 : vatRetention,
      isr_retention_amount: isNaN(isrRetention) ? 0 : isrRetention,
      shipping_cost: isNaN(shippingCost) ? 0 : shippingCost,
      total: isNaN(total) ? 0 : total,
      tax_rates: { vat_rate: vatRate, vat_retention_rate: vatRetentionRate, isr_retention_rate: isrRetentionRate }
    };
  }

  getItemLineSubtotal(item: UpdatePurchaseOrderItemDTO): number {
    const base = (Number(item.quantity_ordered) || 0) * (Number(item.unit_price) || 0);
    const discount = base * ((Number(item.discount_percent) || 0) / 100);
    const result = base - discount;
    return isNaN(result) ? 0 : result;
  }

  isFormValid(): boolean {
    if (!this.formData.title?.trim()) return false;
    if (!this.formData.items || this.formData.items.length === 0) return false;

    return this.formData.items.every(item =>
      item.item_name?.trim() &&
      (item.quantity_ordered || 0) > 0 &&
      (item.unit_price || 0) >= 0
    );
  }

  save(): void {
    if (!this.isFormValid()) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.saving = true;

    this.orderService.update(this.orderId, this.formData).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Orden de compra actualizada', 'success');
        this.router.navigate(['/purchases/purchase-orders/show', this.orderId]);
        this.saving = false;
      },
      error: (error) => {
        this.saving = false;
        Swal.fire('Error', error.error?.message || 'No se pudo actualizar la orden', 'error');
      }
    });
  }

  /**
   * Verificar si puede enviar a autorización
   */
  canSubmitForAuth(): boolean {
    if (!this.order) return false;
    const allowedStatuses = ['DRAFT', 'PROVIDERS_ASSIGNED', 'ASSIGNING_PROVIDERS'];
    return allowedStatuses.includes(this.order.status?.code || '');
  }

  /**
   * Enviar OC a autorización (primero guarda, luego envía)
   */
  async submitForAuthorization(): Promise<void> {
    if (!this.isFormValid()) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos antes de enviar', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Enviar a Autorización?',
      html: `
        <p>La orden de compra será enviada para autorización.</p>
        <p class="text-muted small">Una vez enviada, aparecerá en el listado de "Autorización de OC" para su revisión.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (!result.isConfirmed) return;

    this.saving = true;

    // Primero guardar los cambios
    this.orderService.update(this.orderId, this.formData).subscribe({
      next: () => {
        // Luego enviar a autorización
        this.orderService.submit(this.orderId).subscribe({
          next: (response) => {
            this.saving = false;
            Swal.fire({
              title: 'Enviada',
              text: response.message || 'La orden ha sido enviada para autorización',
              icon: 'success'
            }).then(() => {
              this.router.navigate(['/purchases/purchase-orders/list']);
            });
          },
          error: (error) => {
            this.saving = false;
            Swal.fire('Error', error.error?.message || 'No se pudo enviar la orden', 'error');
          }
        });
      },
      error: (error) => {
        this.saving = false;
        Swal.fire('Error', error.error?.message || 'No se pudo guardar la orden antes de enviar', 'error');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/purchases/purchase-orders/show', this.orderId]);
  }

  formatCurrency(value: number): string {
    return this.orderService.formatCurrency(value);
  }

  // ==================== GESTIÓN DE PROVEEDORES POR ITEM ====================

  /**
   * Cargar proveedores disponibles para cada item del catálogo
   */
  private loadItemProviders(): void {
    const itemsWithCatalog = (this.formData.items || []).filter(item => item.item_id);

    if (itemsWithCatalog.length === 0) return;

    itemsWithCatalog.forEach(item => {
      if (item.item_id) {
        this.loadProvidersForItem(item.item_id);
      }
    });
  }

  /**
   * Cargar proveedores para un item específico
   */
  loadProvidersForItem(itemId: number): void {
    if (this.itemProvidersMap[itemId] || this.loadingItemProviders[itemId]) return;

    this.loadingItemProviders[itemId] = true;

    this.productsService.getItemSuppliers(itemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.itemProvidersMap[itemId] = response.data || [];
          this.loadingItemProviders[itemId] = false;
        },
        error: () => {
          this.itemProvidersMap[itemId] = [];
          this.loadingItemProviders[itemId] = false;
        }
      });
  }

  /**
   * Obtener los proveedores disponibles para un item por índice
   */
  getItemProviders(itemIndex: number): ItemSupplier[] {
    const item = this.formData.items?.[itemIndex];
    const itemId = item?.item_id;
    return itemId ? (this.itemProvidersMap[itemId] || []) : [];
  }

  /**
   * Verificar si un item tiene proveedores disponibles
   */
  hasItemProviders(itemIndex: number): boolean {
    return this.getItemProviders(itemIndex).length > 0;
  }

  /**
   * Verificar si está cargando proveedores para un item
   */
  isLoadingItemProviders(itemIndex: number): boolean {
    const item = this.formData.items?.[itemIndex];
    const itemId = item?.item_id;
    return itemId ? (this.loadingItemProviders[itemId] || false) : false;
  }

  /**
   * Al cambiar el proveedor de un item, actualizar el precio
   */
  onItemProviderChange(itemIndex: number): void {
    const item = this.formData.items?.[itemIndex];
    if (!item) return;

    const itemId = item.item_id;
    const providerId = item.provider_id;

    if (itemId && providerId && this.itemProvidersMap[itemId]) {
      const supplier = this.itemProvidersMap[itemId].find(s => s.id === +providerId);
      if (supplier) {
        item.provider_name = supplier.name;
        // Actualizar precio si el proveedor tiene uno definido
        if (supplier.price !== null && supplier.price !== undefined) {
          item.unit_price = supplier.price;
        }
        this.calculateTotals();
      }
    }
  }

  /**
   * Al cambiar el proveedor global de un item (sin proveedor específico)
   */
  onGlobalProviderChange(itemIndex: number): void {
    const item = this.formData.items?.[itemIndex];
    if (!item || !item.provider_id) return;

    const provider = this.allProviders.find(p => p.id === +item.provider_id!);
    if (provider) {
      item.provider_name = provider.name;
    }
  }

  /**
   * Verificar si necesita seleccionar proveedor global (no tiene proveedores específicos)
   */
  needsGlobalProvider(itemIndex: number): boolean {
    const item = this.formData.items?.[itemIndex];
    if (!item) return false;
    // Necesita proveedor global si no tiene item_id o si no tiene proveedores específicos
    return !item.item_id || !this.hasItemProviders(itemIndex);
  }
}
