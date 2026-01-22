import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReceptionOrderService, ReceptionOrder } from '../reception-order.service';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reception-order-pending',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './reception-order-pending.component.html',
  styleUrls: ['./reception-order-pending.component.scss']
})
export class ReceptionOrderPendingComponent implements OnInit {
  private receptionService = inject(ReceptionOrderService);
  private router = inject(Router);

  orders: ReceptionOrder[] = [];
  loading = false;

  // Agrupados por fecha
  todayOrders: ReceptionOrder[] = [];
  thisWeekOrders: ReceptionOrder[] = [];
  overdueOrders: ReceptionOrder[] = [];
  laterOrders: ReceptionOrder[] = [];

  ngOnInit(): void {
    this.loadPendingOrders();
  }

  loadPendingOrders(): void {
    this.loading = true;

    this.receptionService.getPendingOrders().subscribe({
      next: (response) => {
        this.orders = response.data;
        this.groupOrdersByDate();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading pending orders:', error);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las órdenes pendientes', 'error');
      }
    });
  }

  groupOrdersByDate(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    this.todayOrders = [];
    this.thisWeekOrders = [];
    this.overdueOrders = [];
    this.laterOrders = [];

    this.orders.forEach(order => {
      if (!order.expected_delivery_date) {
        this.laterOrders.push(order);
        return;
      }

      const expectedDate = new Date(order.expected_delivery_date);
      expectedDate.setHours(0, 0, 0, 0);

      if (expectedDate < today) {
        this.overdueOrders.push(order);
      } else if (expectedDate.getTime() === today.getTime()) {
        this.todayOrders.push(order);
      } else if (expectedDate <= weekEnd) {
        this.thisWeekOrders.push(order);
      } else {
        this.laterOrders.push(order);
      }
    });
  }

  viewOrder(order: ReceptionOrder): void {
    this.router.navigate(['/warehouse/reception-orders/show', order.id]);
  }

  receiveOrder(order: ReceptionOrder): void {
    this.router.navigate(['/warehouse/reception-orders/receive', order.id]);
  }

  getStatusColor(status: string): string {
    return this.receptionService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.receptionService.getStatusLabel(status);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(timeString: string | undefined): string {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }
}
