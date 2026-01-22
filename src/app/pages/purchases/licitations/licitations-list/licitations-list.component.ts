import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { LicitationService } from '../licitation.service';
import { LicitationPermissionService } from '../services/licitation-permission.service';
import {
  Licitation,
  LicitationFilters,
  LicitationStatus,
  LICITATION_STATUS_OPTIONS,
  getStatusLabel,
  getStatusColor,
  canConvertToContract
} from '../licitation.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-licitations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './licitations-list.component.html',
  styleUrls: ['./licitations-list.component.css']
})
export class LicitationsListComponent implements OnInit, OnDestroy {

  licitations: Licitation[] = [];
  loading = false;
  error: string | null = null;

  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  perPage = 15;

  // Filtros
  filterForm: FormGroup;
  statusOptions = LICITATION_STATUS_OPTIONS;
  clients: { id: number; name: string }[] = [];

  // Helpers
  getStatusLabel = getStatusLabel;
  getStatusColor = getStatusColor;
  canConvertToContract = canConvertToContract;

  // Utilities para template
  Math = Math;
  today = new Date().toISOString().split('T')[0];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private licitationService: LicitationService,
    public permissions: LicitationPermissionService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      company_id: [''],
      date_from: [''],
      date_to: [''],
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadLicitations();
    this.setupSearchDebounce();
    this.setupFilterChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadLicitations();
    });
  }

  private setupFilterChanges(): void {
    this.filterForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadLicitations();
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterForm.patchValue({ search: value }, { emitEvent: false });
    this.searchSubject.next(value);
  }

  loadClients(): void {
    this.licitationService.getClients().subscribe(clients => {
      this.clients = clients;
    });
  }

  loadLicitations(): void {
    this.loading = true;
    this.error = null;

    const filters: LicitationFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      per_page: this.perPage,
    };

    // Limpiar valores vacíos
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof LicitationFilters] === '' || filters[key as keyof LicitationFilters] === null) {
        delete filters[key as keyof LicitationFilters];
      }
    });

    this.licitationService.getAll(filters).subscribe({
      next: (response) => {
        this.licitations = response.data;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.last_page;
        this.currentPage = response.pagination.current_page;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las licitaciones';
        this.loading = false;
        console.error('Error loading licitations:', err);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadLicitations();
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      company_id: '',
      date_from: '',
      date_to: '',
    });
  }

  // ==================== ACCIONES ====================

  viewLicitation(id: number): void {
    this.router.navigate(['/purchases/licitations/show', id]);
  }

  editLicitation(id: number): void {
    this.router.navigate(['/purchases/licitations/edit', id]);
  }

  deleteLicitation(licitation: Licitation): void {
    if (!this.permissions.canDelete()) return;

    Swal.fire({
      title: '¿Eliminar licitación?',
      html: `¿Está seguro de eliminar la licitación <strong>${licitation.licitation_number}</strong>?<br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.licitationService.delete(licitation.id_licitation!).subscribe({
          next: () => {
            Swal.fire('Eliminada', 'La licitación ha sido eliminada.', 'success');
            this.loadLicitations();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo eliminar la licitación.', 'error');
          }
        });
      }
    });
  }

  convertToContract(licitation: Licitation): void {
    if (!this.permissions.canConvert() || !canConvertToContract(licitation)) return;

    this.router.navigate(['/purchases/licitations/convert', licitation.id_licitation]);
  }

  changeStatus(licitation: Licitation): void {
    if (!this.permissions.canChangeStatus()) return;

    const statusHtml = LICITATION_STATUS_OPTIONS
      .filter(s => s.value !== 'converted')
      .map(s => `<option value="${s.value}" ${s.value === licitation.status ? 'selected' : ''}>${s.label}</option>`)
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
      if (result.isConfirmed && result.value) {
        this.licitationService.changeStatus(licitation.id_licitation!, result.value).subscribe({
          next: () => {
            Swal.fire('Actualizado', 'El estado ha sido actualizado.', 'success');
            this.loadLicitations();
          },
          error: (err) => {
            Swal.fire('Error', err.error?.message || 'No se pudo cambiar el estado.', 'error');
          }
        });
      }
    });
  }

  // ==================== HELPERS ====================

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
      month: 'short',
      day: 'numeric'
    });
  }
}
