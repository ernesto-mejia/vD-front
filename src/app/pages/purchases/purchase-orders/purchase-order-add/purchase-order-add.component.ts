import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PurchaseOrderService } from '../purchase-order.service';
import {
  CreatePurchaseOrderDTO,
  CreatePurchaseOrderItemDTO,
  PRIORITIES,
  PAYMENT_METHODS,
  TotalsCalculation
} from '../purchase-orders';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';
import { map } from 'rxjs/operators';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface Provider {
  id: number;
  company: string;
  shortname?: string;
  rfc?: string;
}

interface TaxRates {
  iva_rate: number;
  iva_retention_rate: number;
  isr_retention_rate: number;
}

interface DestinationArea {
  id: number;
  name: string;
  code: string | null;
  approval_required: boolean;
  departments: DestinationDepartment[];
}

interface DestinationDepartment {
  id: number;
  name: string;
  code: string | null;
  budget_center: string | null;
}

@Component({
  selector: 'app-purchase-order-add',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-order-add.component.html',
  styleUrls: ['./purchase-order-add.component.scss']
})
export class PurchaseOrderAddComponent implements OnInit {
  // Form data
  order: CreatePurchaseOrderDTO = {
    provider_id: 0,
    title: '',
    order_date: new Date().toISOString().split('T')[0],
    items: []
  };

  // Lists
  providers: Provider[] = [];
  priorities = PRIORITIES;
  paymentMethods = PAYMENT_METHODS;

  // Destination areas
  destinationAreas: DestinationArea[] = [];
  availableDepartments: DestinationDepartment[] = [];

  // Tax configuration
  taxRates: TaxRates | null = null;

  // Calculated totals
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

  // UI State
  loading = false;
  saving = false;
  loadingTaxRates = false;

  constructor(
    private orderService: PurchaseOrderService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProviders();
    this.loadDestinationAreas();
    this.addItem(); // Start with one empty item
  }

  loadProviders(): void {
    this.http.get<{ data: Provider[] }>(apiEndpoint('v2/company/providers'))
      .subscribe({
        next: (response) => {
          this.providers = response.data;
        },
        error: (error) => {
          console.error('Error loading providers:', error);
        }
      });
  }

  loadDestinationAreas(): void {
    this.http.get<{ success: boolean; data: DestinationArea[] }>(apiEndpoint('v2/purchase-requests/destination-options'))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.destinationAreas = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading destination areas:', error);
        }
      });
  }

  onAreaChange(): void {
    this.order.destination_department_id = undefined;

    if (this.order.destination_area_id) {
      const selectedArea = this.destinationAreas.find(a => a.id === this.order.destination_area_id);
      this.availableDepartments = selectedArea?.departments || [];
    } else {
      this.availableDepartments = [];
    }
  }

  onProviderChange(): void {
    if (this.order.provider_id) {
      this.loadProviderTaxRates();
    } else {
      this.taxRates = null;
    }
  }

  loadProviderTaxRates(): void {
    this.loadingTaxRates = true;
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
          this.loadingTaxRates = false;
          this.calculateTotals();
        },
        error: () => {
          this.taxRates = { iva_rate: 16, iva_retention_rate: 0, isr_retention_rate: 0 };
          this.loadingTaxRates = false;
          this.calculateTotals();
        }
      });
  }

  // Items management
  addItem(): void {
    const newItem: CreatePurchaseOrderItemDTO = {
      item_name: '',
      quantity_ordered: 1,
      unit_price: 0,
      unit_of_measurement: 'PZA',
      discount_percent: 0,
      is_tax_exempt: false
    };
    this.order.items.push(newItem);
  }

  removeItem(index: number): void {
    if (this.order.items.length > 1) {
      this.order.items.splice(index, 1);
      this.calculateTotals();
    }
  }

  duplicateItem(index: number): void {
    const item = { ...this.order.items[index] };
    this.order.items.splice(index + 1, 0, item);
    this.calculateTotals();
  }

  onItemChange(): void {
    this.calculateTotals();
  }

  calculateTotals(): void {
    let subtotal = 0;
    let discountTotal = 0;
    let vatAmount = 0;

    const vatRate = this.taxRates?.iva_rate ?? 16;
    const vatRetentionRate = this.taxRates?.iva_retention_rate ?? 0;
    const isrRetentionRate = this.taxRates?.isr_retention_rate ?? 0;

    for (const item of this.order.items) {
      const qty = item.quantity_ordered || 0;
      const price = item.unit_price || 0;
      const discountPercent = item.discount_percent || 0;

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
    const shippingCost = this.order.shipping_cost || 0;

    this.totals = {
      subtotal,
      discount_amount: discountTotal,
      vat_amount: vatAmount,
      vat_retention_amount: vatRetention,
      isr_retention_amount: isrRetention,
      shipping_cost: shippingCost,
      total: subtotal + vatAmount - vatRetention - isrRetention + shippingCost,
      tax_rates: { vat_rate: vatRate, vat_retention_rate: vatRetentionRate, isr_retention_rate: isrRetentionRate }
    };
  }

  getItemLineSubtotal(item: CreatePurchaseOrderItemDTO): number {
    const base = (item.quantity_ordered || 0) * (item.unit_price || 0);
    const discount = base * ((item.discount_percent || 0) / 100);
    return base - discount;
  }

  // Form validation
  isFormValid(): boolean {
    if (!this.order.provider_id) return false;
    if (!this.order.title?.trim()) return false;
    if (!this.order.order_date) return false;
    if (this.order.items.length === 0) return false;

    return this.order.items.every(item =>
      item.item_name?.trim() &&
      item.quantity_ordered > 0 &&
      item.unit_price >= 0
    );
  }

  // Save actions
  async save(submitAfter: boolean = false): Promise<void> {
    if (!this.isFormValid()) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.saving = true;

    this.orderService.create(this.order).subscribe({
      next: (response) => {
        if (submitAfter && response.data) {
          this.orderService.submit(response.data.id).subscribe({
            next: () => {
              Swal.fire('Éxito', 'Orden creada y enviada para aprobación', 'success');
              this.router.navigate(['/purchases/purchase-orders/show', response.data.id]);
            },
            error: () => {
              Swal.fire('Éxito', 'Orden creada (no se pudo enviar para aprobación)', 'warning');
              this.router.navigate(['/purchases/purchase-orders/show', response.data.id]);
            }
          });
        } else {
          Swal.fire('Éxito', 'Orden de compra creada correctamente', 'success');
          this.router.navigate(['/purchases/purchase-orders/show', response.data.id]);
        }
        this.saving = false;
      },
      error: (error) => {
        this.saving = false;
        Swal.fire('Error', error.error?.message || 'No se pudo crear la orden', 'error');
      }
    });
  }

  saveAsDraft(): void {
    this.save(false);
  }

  saveAndSubmit(): void {
    this.save(true);
  }

  cancel(): void {
    this.router.navigate(['/purchases/purchase-orders/list']);
  }

  formatCurrency(value: number): string {
    return this.orderService.formatCurrency(value);
  }
}
