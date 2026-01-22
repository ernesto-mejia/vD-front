import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderService } from '../purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderReceipt,
  PurchaseOrderHistory
} from '../purchase-orders';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-order-show',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './purchase-order-show.component.html',
  styleUrls: ['./purchase-order-show.component.scss']
})
export class PurchaseOrderShowComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private purchaseOrderService = inject(PurchaseOrderService);

  purchaseOrder: PurchaseOrder | null = null;
  receipts: PurchaseOrderReceipt[] = [];
  history: PurchaseOrderHistory[] = [];
  loading = true;
  activeTab = 'details';

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
        this.loadReceipts(id);
        this.loadHistory(id);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading purchase order:', error);
        Swal.fire('Error', 'No se pudo cargar la orden de compra', 'error');
        this.router.navigate(['/purchases/purchase-orders']);
      }
    });
  }

  loadReceipts(id: number): void {
    this.purchaseOrderService.getReceipts(id).subscribe({
      next: (response: PurchaseOrderReceipt[]) => {
        this.receipts = response || [];
      },
      error: (error: any) => {
        console.error('Error loading receipts:', error);
      }
    });
  }

  loadHistory(id: number): void {
    this.purchaseOrderService.getHistory(id).subscribe({
      next: (response: PurchaseOrderHistory[]) => {
        this.history = response || [];
      },
      error: (error: any) => {
        console.error('Error loading history:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Status helpers
  getStatusBadge(status: string): string {
    return this.purchaseOrderService.getStatusBadge(status);
  }

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

  formatDateTime(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Action checks
  canEdit(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canEdit(this.purchaseOrder.status?.code || '') : false;
  }

  canSubmit(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canSubmit(this.purchaseOrder.status?.code || '') : false;
  }

  canApprove(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canApprove(this.purchaseOrder.status?.code || '') : false;
  }

  canSend(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canSend(this.purchaseOrder.status?.code || '') : false;
  }

  canReceive(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canReceive(this.purchaseOrder.status?.code || '') : false;
  }

  canClose(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canClose(this.purchaseOrder.status?.code || '') : false;
  }

  canCancel(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canCancel(this.purchaseOrder.status?.code || '') : false;
  }

  canConfirmPurchase(): boolean {
    return this.purchaseOrder ? this.purchaseOrderService.canConfirmPurchase(this.purchaseOrder) : false;
  }

  /**
   * Verificar si puede autorizar OC (Fase 4)
   */
  canAuthorizePO(): boolean {
    if (!this.purchaseOrder) return false;
    const validStatuses = ['PENDING_PO_AUTHORIZATION', 'PROVIDERS_ASSIGNED', 'RELEASED', 'OPEN'];
    return validStatuses.includes(this.purchaseOrder.status?.code || '');
  }

  /**
   * Verificar si puede devolver OC
   */
  canReturnOrder(): boolean {
    if (!this.purchaseOrder) return false;
    const validStatuses = ['PENDING_PO_AUTHORIZATION', 'PROVIDERS_ASSIGNED', 'RELEASED', 'OPEN', 'DRAFT'];
    return validStatuses.includes(this.purchaseOrder.status?.code || '');
  }

  // Actions
  onEdit(): void {
    if (this.purchaseOrder) {
      this.router.navigate(['/purchases/purchase-orders', this.purchaseOrder.id, 'edit']);
    }
  }

  onSubmit(): void {
    if (!this.purchaseOrder) return;

    Swal.fire({
      title: '¿Enviar para aprobación?',
      text: 'La orden será enviada para su aprobación',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.purchaseOrder) {
        this.purchaseOrderService.submit(this.purchaseOrder.id).subscribe({
          next: () => {
            Swal.fire('Enviada', 'Orden enviada para aprobación', 'success');
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo enviar la orden', 'error');
          }
        });
      }
    });
  }

  onApprove(): void {
    if (!this.purchaseOrder) return;

    Swal.fire({
      title: '¿Aprobar orden?',
      text: 'La orden será aprobada',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.purchaseOrder) {
        this.purchaseOrderService.approve(this.purchaseOrder.id).subscribe({
          next: () => {
            Swal.fire('Aprobada', 'Orden aprobada correctamente', 'success');
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo aprobar la orden', 'error');
          }
        });
      }
    });
  }

  onReject(): void {
    if (!this.purchaseOrder) return;

    Swal.fire({
      title: '¿Rechazar orden?',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Ingrese el motivo del rechazo...',
      inputAttributes: {
        'aria-label': 'Motivo del rechazo'
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed && this.purchaseOrder) {
        this.purchaseOrderService.reject(this.purchaseOrder.id, result.value).subscribe({
          next: () => {
            Swal.fire('Rechazada', 'Orden rechazada', 'success');
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo rechazar la orden', 'error');
          }
        });
      }
    });
  }

  onSend(): void {
    if (!this.purchaseOrder) return;

    Swal.fire({
      title: '¿Marcar como enviada?',
      text: 'La orden será marcada como enviada al proveedor',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.purchaseOrder) {
        this.purchaseOrderService.send(this.purchaseOrder.id).subscribe({
          next: () => {
            Swal.fire('Enviada', 'Orden marcada como enviada', 'success');
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo marcar como enviada', 'error');
          }
        });
      }
    });
  }

  onConfirmPurchase(): void {
    if (!this.purchaseOrder) return;

    // Calcular fecha por defecto (2 meses desde hoy)
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 2);
    const defaultDateStr = defaultDate.toISOString().split('T')[0];

    Swal.fire({
      title: 'Confirmar Compra Realizada',
      html: `
        <p class="text-muted small mb-3">Registre la compra realizada para la Orden: <strong>${this.purchaseOrder.order_number}</strong></p>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">Comprobante de Compra (ticket/factura)</label>
          <input type="file" id="swal-receipt" class="form-control" accept="image/*,.pdf">
          <small class="text-muted">Formatos: JPG, PNG, PDF (máx. 5MB)</small>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">Fecha de Entrega Estimada *</label>
          <input type="date" id="swal-delivery-date" class="form-control" value="${defaultDateStr}" min="${new Date().toISOString().split('T')[0]}">
          <small class="text-muted">Por defecto: 2 meses desde hoy</small>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">Notas de la Compra</label>
          <textarea id="swal-notes" class="form-control" rows="2" placeholder="Información adicional sobre la compra..."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Confirmar Compra',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const fileInput = document.getElementById('swal-receipt') as HTMLInputElement;
        const dateInput = document.getElementById('swal-delivery-date') as HTMLInputElement;
        const notesInput = document.getElementById('swal-notes') as HTMLTextAreaElement;

        return {
          receipt: fileInput.files?.[0] || undefined,
          estimated_delivery_date: dateInput.value || defaultDateStr,
          notes: notesInput.value || undefined
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value && this.purchaseOrder) {
        Swal.fire({
          title: 'Guardando...',
          text: 'Confirmando compra realizada',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        this.purchaseOrderService.confirmPurchase(this.purchaseOrder.id, result.value).subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: '¡Compra Confirmada!',
              html: `
                <p>La compra ha sido registrada exitosamente.</p>
                <p><strong>Entrega estimada:</strong> ${this.formatDate(response.data.estimated_delivery)}</p>
                ${response.data.receipt_url ? '<p class="text-success"><i class="bi bi-check-circle me-1"></i>Comprobante guardado</p>' : ''}
              `,
              confirmButtonText: 'Aceptar'
            });
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo confirmar la compra', 'error');
          }
        });
      }
    });
  }

  onReceive(): void {
    if (this.purchaseOrder) {
      this.router.navigate(['/purchases/purchase-orders', this.purchaseOrder.id, 'receive']);
    }
  }

  onCancel(): void {
    if (!this.purchaseOrder) return;

    Swal.fire({
      title: '¿Cancelar orden?',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Ingrese el motivo de la cancelación...',
      inputAttributes: {
        'aria-label': 'Motivo de cancelación'
      },
      showCancelButton: true,
      confirmButtonText: 'Cancelar orden',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed && this.purchaseOrder) {
        this.purchaseOrderService.cancel(this.purchaseOrder.id, result.value).subscribe({
          next: () => {
            Swal.fire('Cancelada', 'Orden cancelada', 'success');
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo cancelar la orden', 'error');
          }
        });
      }
    });
  }

  onClose(): void {
    if (!this.purchaseOrder) return;

    Swal.fire({
      title: '¿Cerrar orden?',
      text: 'La orden será cerrada y no podrá modificarse',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.purchaseOrder) {
        this.purchaseOrderService.close(this.purchaseOrder.id).subscribe({
          next: () => {
            Swal.fire('Cerrada', 'Orden cerrada correctamente', 'success');
            this.loadPurchaseOrder(this.purchaseOrder!.id);
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo cerrar la orden', 'error');
          }
        });
      }
    });
  }

  /**
   * Autorizar Orden de Compra (Fase 4)
   */
  async onAuthorizePO(): Promise<void> {
    if (!this.purchaseOrder) return;

    const result = await Swal.fire({
      title: 'Autorizar Orden de Compra',
      html: `
        <p>¿Autorizar la orden <strong>${this.purchaseOrder.order_number}</strong> para proceder a compra?</p>
        <p class="text-muted">Proveedor: ${this.purchaseOrder.provider?.company || 'No especificado'}</p>
        <p class="text-muted">Total: ${this.formatCurrency(this.purchaseOrder.total || 0)}</p>
      `,
      input: 'textarea',
      inputLabel: 'Notas (opcional)',
      inputPlaceholder: 'Agregar notas de autorización...',
      showCancelButton: true,
      confirmButtonText: 'Autorizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      icon: 'question'
    });

    if (result.isConfirmed) {
      this.purchaseOrderService.authorizePO(this.purchaseOrder.id, result.value || undefined).subscribe({
        next: () => {
          Swal.fire({
            title: 'Autorizada',
            text: 'La orden de compra ha sido autorizada. Lista para proceder a compra.',
            icon: 'success'
          });
          this.loadPurchaseOrder(this.purchaseOrder!.id);
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo autorizar la orden', 'error');
        }
      });
    }
  }

  /**
   * Devolver OC a Compras para modificar proveedores/precios
   */
  async onReturnToPurchasing(): Promise<void> {
    if (!this.purchaseOrder) return;

    const result = await Swal.fire({
      title: 'Devolver a Compras',
      html: `
        <p>La orden <strong>${this.purchaseOrder.order_number}</strong> será devuelta al área de compras para modificar proveedores o precios.</p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de devolución',
      inputPlaceholder: 'Escriba el motivo de la devolución...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
      icon: 'warning'
    });

    if (result.isConfirmed && result.value) {
      this.purchaseOrderService.returnToPurchasing(this.purchaseOrder.id, result.value).subscribe({
        next: () => {
          Swal.fire('Devuelta', 'La orden ha sido devuelta al área de compras', 'success');
          this.loadPurchaseOrder(this.purchaseOrder!.id);
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo devolver la orden', 'error');
        }
      });
    }
  }

  /**
   * Devolver OC hasta la Solicitud original
   */
  async onReturnToRequest(): Promise<void> {
    if (!this.purchaseOrder) return;

    const result = await Swal.fire({
      title: 'Devolver a Solicitud',
      html: `
        <p><strong>⚠️ Acción mayor:</strong> La orden <strong>${this.purchaseOrder.order_number}</strong> será devuelta hasta la solicitud de compra original.</p>
        <p class="text-muted">El solicitante deberá corregir y volver a enviar la solicitud.</p>
      `,
      input: 'textarea',
      inputLabel: 'Motivo de devolución',
      inputPlaceholder: 'Escriba el motivo detallado de la devolución...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Devolver a Solicitud',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      icon: 'warning'
    });

    if (result.isConfirmed && result.value) {
      this.purchaseOrderService.returnToRequest(this.purchaseOrder.id, result.value).subscribe({
        next: () => {
          Swal.fire('Devuelta', 'La orden ha sido devuelta hasta la solicitud original', 'success');
          this.loadPurchaseOrder(this.purchaseOrder!.id);
        },
        error: (error) => {
          Swal.fire('Error', error.error?.message || 'No se pudo devolver la orden', 'error');
        }
      });
    }
  }

  onPrint(): void {
    if (!this.purchaseOrder) return;

    this.purchaseOrderService.downloadPdf(this.purchaseOrder.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `OC-${this.purchaseOrder!.order_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        Swal.fire('Error', 'No se pudo descargar el PDF de la orden de compra', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/purchases/purchase-orders']);
  }

  // Item calculations
  getItemSubtotal(item: PurchaseOrderItem): number {
    const qty = item.quantity || item.quantity_ordered || 0;
    return qty * item.unit_price;
  }

  getItemTax(item: PurchaseOrderItem): number {
    const subtotal = this.getItemSubtotal(item);
    const taxRate = item.tax_rate || 0;
    return subtotal * (taxRate / 100);
  }

  getItemTotal(item: PurchaseOrderItem): number {
    return this.getItemSubtotal(item) + this.getItemTax(item);
  }

  getPendingQuantity(item: PurchaseOrderItem): number {
    const qty = item.quantity || item.quantity_ordered || 0;
    const received = item.received_quantity || item.quantity_received || 0;
    return qty - received;
  }

  getReceiveProgress(item: PurchaseOrderItem): number {
    const qty = item.quantity || item.quantity_ordered || 0;
    if (!qty) return 0;
    const received = item.received_quantity || item.quantity_received || 0;
    return (received / qty) * 100;
  }

  /**
   * Obtener lista de proveedores únicos de los items
   */
  getUniqueProviders(): { id: number; name: string; itemCount: number }[] {
    if (!this.purchaseOrder?.items) return [];

    const providerMap = new Map<number, { id: number; name: string; itemCount: number }>();

    for (const item of this.purchaseOrder.items) {
      const providerId = item.provider_id;
      const providerName = item.provider_name || 'Sin proveedor';

      if (providerId) {
        if (providerMap.has(providerId)) {
          providerMap.get(providerId)!.itemCount++;
        } else {
          providerMap.set(providerId, {
            id: providerId,
            name: providerName,
            itemCount: 1
          });
        }
      }
    }

    return Array.from(providerMap.values());
  }

  /**
   * Verificar si hay múltiples proveedores en la orden
   */
  hasMultipleProviders(): boolean {
    return this.getUniqueProviders().length > 1;
  }

  /**
   * Verificar si hay proveedores asignados a los items
   */
  hasItemProviders(): boolean {
    return this.getUniqueProviders().length > 0;
  }
}
