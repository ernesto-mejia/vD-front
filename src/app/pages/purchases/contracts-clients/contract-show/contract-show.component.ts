import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ClientContractService } from '../contract.service';
import { ContractDocument } from '../contracts';

interface ContractDetail {
  id: number;
  project_name: string;
  contract_number?: string;
  reference_number?: string;
  licitation_number?: string;
  description?: string;
  customer_id: number;
  customer_name?: string;
  customer_company?: string;
  customer_tax_id?: string;
  // Regiones múltiples
  region_ids?: number[];
  regions?: { id: number; name: string; code?: string }[];
  // Legacy
  region_id?: number;
  region_name?: string;
  region_code?: string;
  // Status
  status_id?: number;
  status_name?: string;
  // Montos
  min_amount?: number;
  max_amount?: number;
  // Fechas
  start_date?: string;
  end_date?: string;
  contract_date?: string;
  // Extensiones
  has_extension?: boolean;
  original_ending_date?: string;
  extension_days?: number;
  extension_reason?: string;
  extension_approved_at?: string;
  // Afianzadora
  has_bonding?: boolean;
  bonding_company_id?: number;
  bonding_company_name?: string;
  bonding_amount?: number;
  bonding_start_date?: string;
  bonding_end_date?: string;
  // Alertas
  alert_days_before?: number;
  alert_sent?: boolean;
  last_alert_at?: string;
  // Direcciones
  addresses?: {
    address_id: number;
    id: number;
    shortname?: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    full_address?: string;
  }[];
  // Items
  items?: {
    id: number;
    contract_item_id: number;
    item_id: number;
    item_name?: string;
    item_code?: string;
    price?: number;
    min_quantity?: number;
    max_quantity?: number;
    discount?: number;
    observations?: string;
  }[];
  // Documentos
  documents?: ContractDocument[];
  required_document_types?: number[];
  // Contratos de proveedores
  provider_contracts?: {
    id: number;
    provider_name?: string;
    contract_name?: string;
  }[];
  // Licitación
  licitation_id?: number;
  licitation?: {
    id_licitation: number;
    licitation_number?: string;
    licitation_date?: string;
    status?: string;
    description?: string;
  };
}

@Component({
  selector: 'app-contract-show',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterModule],
  templateUrl: './contract-show.component.html',
  styleUrl: './contract-show.component.css'
})
export class ContractShowComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  contract: ContractDetail | null = null;
  loading = true;
  contractId: number = 0;

  // Tipos de documentos
  documentTypes = [
    { id: 1, name: 'Contrato firmado' },
    { id: 2, name: 'Fianza' },
    { id: 3, name: 'Orden de compra' },
    { id: 4, name: 'Convenio de confidencialidad' },
    { id: 5, name: 'Otro documento' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private contractService: ClientContractService
  ) {}

  ngOnInit(): void {
    this.contractId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.contractId) {
      this.loadContract();
    } else {
      this.router.navigate(['/purchases/contracts-clients']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContract(): void {
    this.loading = true;
    this.contractService.getContract(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.contract = response.data as ContractDetail || null;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando contrato:', err);
          Swal.fire('Error', 'No se pudo cargar el contrato', 'error');
          this.loading = false;
          this.router.navigate(['/purchases/contracts-clients']);
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  editContract(): void {
    this.router.navigate(['/purchases/contracts-clients/edit', this.contractId]);
  }

  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-MX');
  }

  formatMoney(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null) return '$0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getStatusClass(statusName: string | undefined): string {
    switch (statusName?.toLowerCase()) {
      case 'activo':
      case 'vigente':
        return 'bg-success';
      case 'vencido':
      case 'expirado':
        return 'bg-danger';
      case 'pendiente':
      case 'borrador':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getDaysRemaining(): number | null {
    if (!this.contract?.end_date) return null;
    const endDate = new Date(this.contract.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysRemainingClass(): string {
    const days = this.getDaysRemaining();
    if (days === null) return '';
    if (days <= 0) return 'text-danger';
    if (days <= 7) return 'text-danger';
    if (days <= 30) return 'text-warning';
    return 'text-success';
  }

  getDocumentTypeName(typeId: number | undefined): string {
    if (!typeId) return 'Sin tipo';
    const type = this.documentTypes.find(t => t.id === typeId);
    return type?.name || `Tipo ${typeId}`;
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadDocument(doc: ContractDocument): void {
    if (!doc.filename) {
      Swal.fire('Error', 'No se puede descargar el documento', 'error');
      return;
    }

    const filename = doc.filename;
    this.contractService.downloadDocument(this.contractId, filename)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.original_name || filename;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Error descargando documento:', err);
          Swal.fire('Error', 'No se pudo descargar el documento', 'error');
        }
      });
  }
}
