import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { LicitationService } from '../licitation.service';
import { LicitationPermissionService } from '../services/licitation-permission.service';
import {
  Licitation,
  getStatusLabel,
  getStatusColor,
  canConvertToContract,
  LICITATION_STATUS_OPTIONS,
  LicitationStatus
} from '../licitation.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-licitation-show',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './licitation-show.component.html',
  styleUrls: ['./licitation-show.component.css']
})
export class LicitationShowComponent implements OnInit {

  licitation: Licitation | null = null;
  loading = true;
  error: string | null = null;

  getStatusLabel = getStatusLabel;
  getStatusColor = getStatusColor;
  canConvertToContract = canConvertToContract;

  constructor(
    private licitationService: LicitationService,
    public permissions: LicitationPermissionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLicitation(parseInt(id, 10));
    } else {
      this.router.navigate(['/purchases/licitations']);
    }
  }

  loadLicitation(id: number): void {
    this.loading = true;
    this.error = null;

    this.licitationService.getById(id).subscribe({
      next: (response) => {
        this.licitation = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar la licitación';
        this.loading = false;
        console.error('Error loading licitation:', err);
      }
    });
  }

  editLicitation(): void {
    if (this.licitation?.id_licitation) {
      this.router.navigate(['/purchases/licitations/edit', this.licitation.id_licitation]);
    }
  }

  convertToContract(): void {
    if (this.licitation?.id_licitation) {
      this.router.navigate(['/purchases/licitations/convert', this.licitation.id_licitation]);
    }
  }

  changeStatus(): void {
    if (!this.licitation || !this.permissions.canChangeStatus()) return;

    const statusHtml = LICITATION_STATUS_OPTIONS
      .filter(s => s.value !== 'converted')
      .map(s => `<option value="${s.value}" ${s.value === this.licitation!.status ? 'selected' : ''}>${s.label}</option>`)
      .join('');

    Swal.fire({
      title: 'Cambiar Estado',
      html: `
        <div class="text-start">
          <label class="form-label">Nuevo estado:</label>
          <select id="swal-status" class="form-select">
            ${statusHtml}
          </select>
          <div id="swal-won-amount-container" class="mt-3" style="display: none;">
            <label class="form-label">Monto adjudicado:</label>
            <input type="number" id="swal-won-amount" class="form-control" step="0.01" min="0">
          </div>
          <div class="mt-3">
            <label class="form-label">Notas:</label>
            <textarea id="swal-notes" class="form-control" rows="2"></textarea>
          </div>
        </div>
      `,
      didOpen: () => {
        const statusSelect = document.getElementById('swal-status') as HTMLSelectElement;
        const wonAmountContainer = document.getElementById('swal-won-amount-container') as HTMLDivElement;

        statusSelect.addEventListener('change', () => {
          wonAmountContainer.style.display = statusSelect.value === 'won' ? 'block' : 'none';
        });
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const status = (document.getElementById('swal-status') as HTMLSelectElement).value as LicitationStatus;
        const wonAmount = (document.getElementById('swal-won-amount') as HTMLInputElement).value;
        const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement).value;

        return {
          status,
          won_amount: status === 'won' && wonAmount ? parseFloat(wonAmount) : undefined,
          notes: notes || undefined
        };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value && this.licitation) {
        this.licitationService.changeStatus(this.licitation.id_licitation!, result.value).subscribe({
          next: (response) => {
            Swal.fire('Actualizado', 'El estado ha sido actualizado.', 'success');
            this.licitation = response.data;
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo cambiar el estado.', 'error');
          }
        });
      }
    });
  }

  deleteLicitation(): void {
    if (!this.licitation || !this.permissions.canDelete()) return;

    Swal.fire({
      title: '¿Eliminar licitación?',
      html: `¿Está seguro de eliminar la licitación <strong>${this.licitation.licitation_number}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && this.licitation) {
        this.licitationService.delete(this.licitation.id_licitation!).subscribe({
          next: () => {
            Swal.fire('Eliminada', 'La licitación ha sido eliminada.', 'success');
            this.router.navigate(['/purchases/licitations']);
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo eliminar.', 'error');
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/purchases/licitations']);
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
