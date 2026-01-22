import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceptionOrderService, ReceptionOrder, ReceptionOrderFilter } from '../reception-order.service';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reception-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './reception-order-list.component.html',
  styleUrls: ['./reception-order-list.component.scss']
})
export class ReceptionOrderListComponent implements OnInit {
  private receptionService = inject(ReceptionOrderService);
  private router = inject(Router);

  orders: ReceptionOrder[] = [];
  loading = false;
  Math = Math;

  // Paginación
  currentPage = 1;
  lastPage = 1;
  perPage = 15;
  total = 0;

  // Filtros
  filters: ReceptionOrderFilter = {
    search: '',
    status: '',
    sort_by: 'expected_delivery_date',
    sort_dir: 'asc'
  };

  // Resumen
  summary = {
    pending_total: 0,
    partial_total: 0,
    expected_today: 0,
    expected_this_week: 0,
    received_today: 0
  };

  statuses = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'partial', label: 'Parcial' },
    { value: 'received', label: 'Recibido' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  ngOnInit(): void {
    this.loadSummary();
    this.loadOrders();
  }

  loadSummary(): void {
    this.receptionService.getSummary().subscribe({
      next: (response) => {
        if (response.success) {
          this.summary = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading summary:', error);
      }
    });
  }

  loadOrders(): void {
    this.loading = true;

    const params: ReceptionOrderFilter = {
      ...this.filters,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.receptionService.getOrders(params).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.currentPage = response.meta.current_page;
        this.lastPage = response.meta.last_page;
        this.total = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las órdenes de recepción', 'error');
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      status: '',
      sort_by: 'expected_delivery_date',
      sort_dir: 'asc'
    };
    this.applyFilters();
  }

  sortBy(field: string): void {
    if (this.filters.sort_by === field) {
      this.filters.sort_dir = this.filters.sort_dir === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort_by = field;
      this.filters.sort_dir = 'asc';
    }
    this.loadOrders();
  }

  viewOrder(order: ReceptionOrder): void {
    this.router.navigate(['/warehouse/reception-orders/show', order.id]);
  }

  receiveOrder(order: ReceptionOrder): void {
    this.router.navigate(['/warehouse/reception-orders/receive', order.id]);
  }

  cancelOrder(order: ReceptionOrder): void {
    Swal.fire({
      title: '¿Cancelar orden de recepción?',
      text: `¿Está seguro de cancelar la orden ${order.reception_number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        this.receptionService.cancelOrder(order.id, 'Cancelado por usuario').subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('Cancelado', 'La orden ha sido cancelada', 'success');
              this.loadOrders();
              this.loadSummary();
            }
          },
          error: (error) => {
            Swal.fire('Error', error.error?.message || 'No se pudo cancelar la orden', 'error');
          }
        });
      }
    });
  }

  downloadPdf(order: ReceptionOrder): void {
    this.receptionService.downloadPdf(order.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orden-recepcion-${order.reception_number}.pdf`;
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

  getStatusColor(status: string): string {
    return this.receptionService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.receptionService.getStatusLabel(status);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.lastPage, start + maxPages - 1);

    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
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

  isOverdue(order: ReceptionOrder): boolean {
    if (!order.expected_delivery_date || order.status === 'received' || order.status === 'cancelled') {
      return false;
    }
    const expectedDate = new Date(order.expected_delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expectedDate < today;
  }

  isExpectedToday(order: ReceptionOrder): boolean {
    if (!order.expected_delivery_date) return false;
    const expectedDate = new Date(order.expected_delivery_date);
    const today = new Date();
    return expectedDate.toDateString() === today.toDateString();
  }
}
