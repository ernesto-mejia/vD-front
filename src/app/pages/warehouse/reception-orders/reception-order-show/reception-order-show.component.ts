import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ReceptionOrderService, ReceptionOrder } from '../reception-order.service';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reception-order-show',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './reception-order-show.component.html',
  styleUrls: ['./reception-order-show.component.scss']
})
export class ReceptionOrderShowComponent implements OnInit {
  private receptionService = inject(ReceptionOrderService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  order: ReceptionOrder | null = null;
  loading = false;
  orderId: number = 0;

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

  receiveOrder(): void {
    this.router.navigate(['/warehouse/reception-orders/receive', this.orderId]);
  }

  cancelOrder(): void {
    if (!this.order) return;

    Swal.fire({
      title: '¿Cancelar orden de recepción?',
      text: `¿Está seguro de cancelar la orden ${this.order.reception_number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.receptionService.cancelOrder(this.orderId, 'Cancelado por usuario').subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Cancelado', 'La orden ha sido cancelada', 'success');
              this.loadOrder();
            }
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo cancelar la orden', 'error');
          }
        });
      }
    });
  }

  downloadPdf(): void {
    this.receptionService.downloadPdf(this.orderId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orden-recepcion-${this.order?.reception_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        Swal.fire('Error', 'No se pudo descargar el PDF', 'error');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/warehouse/reception-orders/list']);
  }

  getStatusColor(status: string): string {
    return this.receptionService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.receptionService.getStatusLabel(status);
  }

  getItemStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'secondary',
      'partial': 'info',
      'received': 'success',
      'rejected': 'danger'
    };
    return colors[status] || 'secondary';
  }

  getItemStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'partial': 'Parcial',
      'received': 'Recibido',
      'rejected': 'Rechazado'
    };
    return labels[status] || status;
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

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}
