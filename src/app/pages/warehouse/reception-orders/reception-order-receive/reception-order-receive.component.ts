import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceptionOrderService, ReceptionOrder, ReceiveOrderData, ReceiveItemData } from '../reception-order.service';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface ItemReceiveForm {
  id: number;
  item_code: string;
  item_name: string;
  unit_of_measurement: string;
  unit_price: number;
  quantity_expected: number;
  quantity_already_received: number;
  quantity_pending: number;
  quantity_to_receive: number;
  quantity_rejected: number;
  rejection_reason: string;
  reception_notes: string;
  status: string;
}

@Component({
  selector: 'app-reception-order-receive',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './reception-order-receive.component.html',
  styleUrls: ['./reception-order-receive.component.scss']
})
export class ReceptionOrderReceiveComponent implements OnInit {
  private receptionService = inject(ReceptionOrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  order: ReceptionOrder | null = null;
  loading = false;
  saving = false;
  orderId: number = 0;

  items: ItemReceiveForm[] = [];
  receptionNotes: string = '';

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;

    this.receptionService.getOrder(this.orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.order = response.data;
          this.initItemForms();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la orden de recepción', 'error');
        this.router.navigate(['/warehouse/reception-orders/list']);
      }
    });
  }

  initItemForms(): void {
    if (!this.order?.items) return;

    this.items = this.order.items.map(item => ({
      id: item.id,
      item_code: item.item_code || '',
      item_name: item.item_name || '',
      unit_of_measurement: item.unit_of_measurement || 'PZA',
      unit_price: item.unit_price || 0,
      quantity_expected: item.quantity_expected,
      quantity_already_received: item.quantity_received || 0,
      quantity_pending: item.quantity_expected - (item.quantity_received || 0),
      quantity_to_receive: 0,
      quantity_rejected: 0,
      rejection_reason: '',
      reception_notes: '',
      status: item.status
    }));
  }

  receiveAll(): void {
    this.items.forEach(item => {
      if (item.quantity_pending > 0) {
        item.quantity_to_receive = item.quantity_pending;
      }
    });
  }

  clearAll(): void {
    this.items.forEach(item => {
      item.quantity_to_receive = 0;
      item.quantity_rejected = 0;
      item.rejection_reason = '';
      item.reception_notes = '';
    });
  }

  hasChanges(): boolean {
    return this.items.some(item => item.quantity_to_receive > 0 || item.quantity_rejected > 0);
  }

  validateQuantities(): boolean {
    for (const item of this.items) {
      const total = (item.quantity_to_receive || 0) + (item.quantity_rejected || 0);
      if (total > item.quantity_pending) {
        Swal.fire('Error', `El artículo "${item.item_name}" excede la cantidad pendiente`, 'error');
        return false;
      }
      if (item.quantity_rejected > 0 && !item.rejection_reason.trim()) {
        Swal.fire('Error', `Debe especificar una razón para el rechazo del artículo "${item.item_name}"`, 'warning');
        return false;
      }
    }
    return true;
  }

  save(): void {
    if (!this.hasChanges()) {
      Swal.fire('Aviso', 'Debe ingresar al menos una cantidad para recibir o rechazar', 'warning');
      return;
    }

    if (!this.validateQuantities()) {
      return;
    }

    Swal.fire({
      title: '¿Confirmar recepción?',
      text: '¿Está seguro de registrar esta recepción de mercancía?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processReception();
      }
    });
  }

  processReception(): void {
    this.saving = true;

    const itemsData: ReceiveItemData[] = this.items
      .filter(item => item.quantity_to_receive > 0 || item.quantity_rejected > 0)
      .map(item => ({
        id: item.id,
        quantity_received: item.quantity_to_receive || 0,
        quantity_rejected: item.quantity_rejected || 0,
        rejection_reason: item.rejection_reason || undefined,
        reception_notes: item.reception_notes || undefined
      }));

    const data: ReceiveOrderData = {
      items: itemsData,
      reception_notes: this.receptionNotes || undefined
    };

    this.receptionService.receiveOrder(this.orderId, data).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          Swal.fire({
            title: '¡Recepción registrada!',
            text: response.message || 'La recepción de mercancía ha sido registrada correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/warehouse/reception-orders/show', this.orderId]);
          });
        }
      },
      error: (error) => {
        this.saving = false;
        console.error('Error processing reception:', error);
        Swal.fire('Error', error.error?.message || 'No se pudo registrar la recepción', 'error');
      }
    });
  }

  cancel(): void {
    if (this.hasChanges()) {
      Swal.fire({
        title: '¿Cancelar recepción?',
        text: 'Perderá los datos ingresados',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/warehouse/reception-orders/show', this.orderId]);
        }
      });
    } else {
      this.router.navigate(['/warehouse/reception-orders/show', this.orderId]);
    }
  }

  getStatusColor(status: string): string {
    return this.receptionService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.receptionService.getStatusLabel(status);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getTotalToReceive(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity_to_receive || 0), 0);
  }

  getTotalRejected(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity_rejected || 0), 0);
  }

  getTotalLinesAffected(): number {
    return this.items.filter(item => item.quantity_to_receive > 0 || item.quantity_rejected > 0).length;
  }
}
