import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PurchaseRequestService } from '../purchase-request.service';
import { PurchaseRequestPdfService } from '../services/purchase-request-pdf.service';
import { PurchaseRequestPermissionService } from '../services/purchase-request-permission.service';
import {
  PurchaseRequest,
  PurchaseRequestApproval
} from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-request-show',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-request-show.component.html',
  styleUrls: ['./purchase-request-show.component.css']
})
export class PurchaseRequestShowComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  requestId!: number;
  purchaseRequest: PurchaseRequest | null = null;
  history: PurchaseRequestApproval[] = [];

  loading = true;
  loadingHistory = false;
  loadingAction = false;
  loadingExport = false;
  error: string | null = null;

  activeTab: 'details' | 'items' | 'history' = 'details';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseRequestService: PurchaseRequestService,
    private pdfService: PurchaseRequestPdfService,
    private permissionService: PurchaseRequestPermissionService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.requestId = +params['id'];
      if (this.requestId) {
        this.loadPurchaseRequest();
        this.loadHistory();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchaseRequest(): void {
    this.loading = true;
    this.error = null;

    this.purchaseRequestService.get(this.requestId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.purchaseRequest = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la solicitud de compra';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  loadHistory(): void {
    this.loadingHistory = true;

    this.purchaseRequestService.getHistory(this.requestId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.history = response.data || [];
        this.loadingHistory = false;
      },
      error: () => {
        this.history = [];
        this.loadingHistory = false;
      }
    });
  }

  // Navegación
  goBack(): void {
    this.router.navigate(['/purchases/purchase-requests']);
  }

  editRequest(): void {
    this.router.navigate(['/purchases/purchase-requests/edit', this.requestId]);
  }

  // Acciones de Workflow
  async submitRequest(): Promise<void> {
    const result = await Swal.fire({
      title: 'Enviar para Aprobación',
      text: '¿Está seguro de enviar esta solicitud para aprobación?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd'
    });

    if (result.isConfirmed) {
      this.loadingAction = true;
      this.purchaseRequestService.submit(this.requestId).subscribe({
        next: () => {
          this.loadingAction = false;
          Swal.fire('Enviada', 'La solicitud ha sido enviada para aprobación', 'success');
          this.loadPurchaseRequest();
          this.loadHistory();
        },
        error: (err) => {
          this.loadingAction = false;
          Swal.fire('Error', err.error?.message || 'No se pudo enviar la solicitud', 'error');
        }
      });
    }
  }

  async approveRequest(): Promise<void> {
    const { value: notes } = await Swal.fire({
      title: 'Aprobar Solicitud',
      input: 'textarea',
      inputLabel: 'Notas de aprobación (opcional)',
      inputPlaceholder: 'Escriba aquí sus notas...',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#198754'
    });

    if (notes !== undefined) {
      this.loadingAction = true;
      this.purchaseRequestService.approve(this.requestId, notes).subscribe({
        next: () => {
          this.loadingAction = false;
          Swal.fire('Aprobada', 'La solicitud ha sido aprobada', 'success');
          this.loadPurchaseRequest();
          this.loadHistory();
        },
        error: (err) => {
          this.loadingAction = false;
          Swal.fire('Error', err.error?.message || 'No se pudo aprobar la solicitud', 'error');
        }
      });
    }
  }

  async rejectRequest(): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Rechazar Solicitud',
      input: 'textarea',
      inputLabel: 'Motivo de rechazo',
      inputPlaceholder: 'Escriba el motivo del rechazo...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (reason) {
      this.loadingAction = true;
      this.purchaseRequestService.reject(this.requestId, reason).subscribe({
        next: () => {
          this.loadingAction = false;
          Swal.fire('Rechazada', 'La solicitud ha sido rechazada', 'success');
          this.loadPurchaseRequest();
          this.loadHistory();
        },
        error: (err) => {
          this.loadingAction = false;
          Swal.fire('Error', err.error?.message || 'No se pudo rechazar la solicitud', 'error');
        }
      });
    }
  }

  async returnRequest(): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Devolver Solicitud',
      text: 'La solicitud será devuelta al solicitante para correcciones',
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
      confirmButtonColor: '#ffc107'
    });

    if (reason) {
      this.loadingAction = true;
      this.purchaseRequestService.returnRequest(this.requestId, reason).subscribe({
        next: () => {
          this.loadingAction = false;
          Swal.fire('Devuelta', 'La solicitud ha sido devuelta al solicitante', 'success');
          this.loadPurchaseRequest();
          this.loadHistory();
        },
        error: (err) => {
          this.loadingAction = false;
          Swal.fire('Error', err.error?.message || 'No se pudo devolver la solicitud', 'error');
        }
      });
    }
  }

  async cancelRequest(): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Cancelar Solicitud',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación',
      inputPlaceholder: 'Escriba el motivo de la cancelación...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Debe proporcionar un motivo de al menos 10 caracteres';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Cancelar Solicitud',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#dc3545'
    });

    if (reason) {
      this.loadingAction = true;
      this.purchaseRequestService.cancel(this.requestId, reason).subscribe({
        next: () => {
          this.loadingAction = false;
          Swal.fire('Cancelada', 'La solicitud ha sido cancelada', 'success');
          this.loadPurchaseRequest();
          this.loadHistory();
        },
        error: (err) => {
          this.loadingAction = false;
          Swal.fire('Error', err.error?.message || 'No se pudo cancelar la solicitud', 'error');
        }
      });
    }
  }

  // Helpers
  canEdit(): boolean {
    return this.purchaseRequest ? this.purchaseRequestService.canEdit(this.purchaseRequest) : false;
  }

  canSubmit(): boolean {
    return this.purchaseRequest ? this.purchaseRequestService.canSubmit(this.purchaseRequest) : false;
  }

  canApprove(): boolean {
    return this.purchaseRequest ? this.purchaseRequestService.canApprove(this.purchaseRequest) : false;
  }

  canCancel(): boolean {
    return this.purchaseRequest ? this.purchaseRequestService.canCancel(this.purchaseRequest) : false;
  }

  formatCurrency(value: number | undefined): string {
    return this.purchaseRequestService.formatCurrency(value || 0);
  }

  formatDate(date: string | undefined): string {
    return date ? this.purchaseRequestService.formatDate(date) : '-';
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPriorityColor(priority: string | undefined): string {
    return this.purchaseRequestService.getPriorityColor(priority || 'normal');
  }

  getPriorityLabel(priority: string | undefined): string {
    return this.purchaseRequestService.getPriorityLabel(priority || 'normal');
  }

  getPriorityIcon(priority: string | undefined): string {
    return this.purchaseRequestService.getPriorityIcon(priority || 'normal');
  }

  /**
   * Obtener lista de proveedores únicos de los items de la solicitud
   */
  getItemProviders(): string[] {
    if (!this.purchaseRequest?.items || this.purchaseRequest.items.length === 0) return [];

    const providers = new Set<string>();
    this.purchaseRequest.items.forEach((item: any) => {
      if (item.provider_name) {
        providers.add(item.provider_name);
      }
    });
    return Array.from(providers);
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'created': 'Creada',
      'updated': 'Actualizada',
      'opened': 'Abierta',
      'submitted': 'Enviada para Aprobación',
      'released': 'Liberada para Autorización',
      'authorized': 'Autorizada',
      'pre_authorized': 'Pre-autorizada',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'returned': 'Devuelta',
      'cancelled': 'Cancelada',
      'po_generated': 'Orden Generada'
    };
    return labels[action] || action;
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'created': 'bi-plus-circle text-primary',
      'updated': 'bi-pencil text-info',
      'opened': 'bi-folder2-open text-info',
      'submitted': 'bi-send text-primary',
      'released': 'bi-send-check text-primary',
      'authorized': 'bi-check-circle-fill text-success',
      'pre_authorized': 'bi-check2-circle text-info',
      'approved': 'bi-check-circle text-success',
      'rejected': 'bi-x-circle text-danger',
      'returned': 'bi-arrow-return-left text-warning',
      'cancelled': 'bi-slash-circle text-danger',
      'po_generated': 'bi-file-earmark-check text-success'
    };
    return icons[action] || 'bi-circle';
  }

  // ============ EXPORTACIÓN PDF ============

  /**
   * Verifica si el usuario puede exportar solicitudes
   */
  canExport(): boolean {
    return this.permissionService.canExportPurchaseRequests();
  }

  /**
   * Exporta la solicitud de compra a PDF
   */
  async exportToPdf(): Promise<void> {
    if (!this.purchaseRequest) return;

    this.loadingExport = true;
    try {
      await this.pdfService.generatePurchaseRequestPdf(this.purchaseRequest);
      Swal.fire({
        icon: 'success',
        title: 'PDF Generado',
        text: 'La solicitud se ha exportado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    } finally {
      this.loadingExport = false;
    }
  }

  /**
   * Exporta como Orden de Compra (solo si está aprobada)
   */
  async exportPurchaseOrderPdf(): Promise<void> {
    if (!this.purchaseRequest) return;

    const isApproved = this.purchaseRequest.status?.code === 'approved' ||
                       this.purchaseRequest.status?.code === 'completed';

    if (!isApproved) {
      Swal.fire({
        icon: 'warning',
        title: 'Solicitud no aprobada',
        text: 'Solo se pueden generar órdenes de compra para solicitudes aprobadas'
      });
      return;
    }

    this.loadingExport = true;
    try {
      await this.pdfService.generatePurchaseOrderPdf(this.purchaseRequest);
      Swal.fire({
        icon: 'success',
        title: 'Orden de Compra Generada',
        text: 'La orden de compra se ha exportado correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error exportando Orden de Compra:', error);
      Swal.fire('Error', 'No se pudo generar la orden de compra', 'error');
    } finally {
      this.loadingExport = false;
    }
  }

  /**
   * Verifica si puede generar orden de compra
   */
  canGeneratePO(): boolean {
    if (!this.purchaseRequest) return false;
    const isApproved = this.purchaseRequest.status?.code === 'approved' ||
                       this.purchaseRequest.status?.code === 'completed';
    return isApproved && this.permissionService.canGeneratePO();
  }
}
