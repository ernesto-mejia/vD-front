import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  ReceiveItemDTO
} from '../purchase-orders';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface ReceiveItem {
  purchase_order_item_id: number;
  item_name: string;
  item_code: string;
  unit: string;
  ordered_quantity: number;
  received_quantity: number;
  pending_quantity: number;
  quantity_to_receive: number;
  notes: string;
}

@Component({
  selector: 'app-purchase-order-receive',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './purchase-order-receive.component.html',
  styleUrls: ['./purchase-order-receive.component.scss']
})
export class PurchaseOrderReceiveComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private purchaseOrderService = inject(PurchaseOrderService);

  purchaseOrder: PurchaseOrder | null = null;
  receiveItems: ReceiveItem[] = [];
  receiptNotes: string = '';
  loading = true;
  saving = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchaseOrder(+id);
    }
  }

  loadPurchaseOrder(id: number): void {
    this.loading = true;
    this.purchaseOrderService.get(id).subscribe({
      next: (response: any) => {
        this.purchaseOrder = response.data;
        this.initializeReceiveItems();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading purchase order:', error);
        Swal.fire('Error', 'No se pudo cargar la orden de compra', 'error');
        this.router.navigate(['/purchases/purchase-orders']);
      }
    });
  }

  initializeReceiveItems(): void {
    if (!this.purchaseOrder?.items) return;

    this.receiveItems = this.purchaseOrder.items.map(item => ({
      purchase_order_item_id: item.id || 0,
      item_name: item.item?.name || item.item_name || item.description || '',
      item_code: item.item?.code || item.item_code || '',
      unit: item.unit || item.unit_of_measurement || 'UND',
      ordered_quantity: item.quantity || item.quantity_ordered || 0,
      received_quantity: item.received_quantity || item.quantity_received || 0,
      pending_quantity: (item.quantity || item.quantity_ordered || 0) - (item.received_quantity || item.quantity_received || 0),
      quantity_to_receive: 0,
      notes: ''
    }));
  }

  // Helpers
  formatCurrency(value: number): string {
    return this.purchaseOrderService.formatCurrency(value);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusBadge(status: string): string {
    return this.purchaseOrderService.getStatusBadge(status);
  }

  // Calculations
  getReceiveProgress(item: ReceiveItem): number {
    if (!item.ordered_quantity) return 0;
    return (item.received_quantity / item.ordered_quantity) * 100;
  }

  getNewProgress(item: ReceiveItem): number {
    if (!item.ordered_quantity) return 0;
    return ((item.received_quantity + item.quantity_to_receive) / item.ordered_quantity) * 100;
  }

  getTotalToReceive(): number {
    return this.receiveItems.reduce((sum, item) => sum + item.quantity_to_receive, 0);
  }

  hasItemsToReceive(): boolean {
    return this.receiveItems.some(item => item.quantity_to_receive > 0);
  }

  getItemsToReceiveCount(): number {
    return this.receiveItems.filter(item => item.quantity_to_receive > 0).length;
  }

  hasPendingItems(): boolean {
    return this.receiveItems.some(item => item.pending_quantity > 0);
  }

  // Actions
  receiveAll(item: ReceiveItem): void {
    item.quantity_to_receive = item.pending_quantity;
  }

  receiveAllItems(): void {
    this.receiveItems.forEach(item => {
      item.quantity_to_receive = item.pending_quantity;
    });
  }

  clearAll(): void {
    this.receiveItems.forEach(item => {
      item.quantity_to_receive = 0;
      item.notes = '';
    });
    this.receiptNotes = '';
  }

  validateQuantity(item: ReceiveItem): void {
    if (item.quantity_to_receive < 0) {
      item.quantity_to_receive = 0;
    }
    if (item.quantity_to_receive > item.pending_quantity) {
      item.quantity_to_receive = item.pending_quantity;
    }
  }

  onSubmit(): void {
    if (!this.purchaseOrder || !this.hasItemsToReceive()) {
      Swal.fire('Atención', 'Debe ingresar al menos una cantidad a recibir', 'warning');
      return;
    }

    const items: ReceiveItemDTO[] = this.receiveItems
      .filter(item => item.quantity_to_receive > 0)
      .map(item => ({
        purchase_order_item_id: item.purchase_order_item_id,
        quantity_received: item.quantity_to_receive,
        notes: item.notes || undefined
      }));

    Swal.fire({
      title: '¿Confirmar recepción?',
      html: `Se registrará la recepción de <strong>${this.getTotalToReceive()}</strong> unidades`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saving = true;
        this.purchaseOrderService.receive(this.purchaseOrder!.id, {
          items,
          notes: this.receiptNotes || undefined
        }).subscribe({
          next: () => {
            Swal.fire('Éxito', 'Recepción registrada correctamente', 'success');
            this.router.navigate(['/purchases/purchase-orders', this.purchaseOrder!.id]);
          },
          error: (error) => {
            console.error('Error registering receipt:', error);
            Swal.fire('Error', error.error?.message || 'No se pudo registrar la recepción', 'error');
            this.saving = false;
          }
        });
      }
    });
  }

  goBack(): void {
    if (this.purchaseOrder) {
      this.router.navigate(['/purchases/purchase-orders', this.purchaseOrder.id]);
    } else {
      this.router.navigate(['/purchases/purchase-orders']);
    }
  }
}
