import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { ProviderContractService } from '../contract.service';
import { ProviderContract } from '../contracts';

@Component({
  selector: 'app-contract-show',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './contract-show.component.html',
  styleUrl: './contract-show.component.css'
})
export class ContractShowComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  contract: ProviderContract | null = null;
  loading = true;
  contractId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private contractService: ProviderContractService
  ) {}

  ngOnInit(): void {
    this.contractId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.contractId) {
      this.loadContract();
    } else {
      this.router.navigate(['/purchases/contracts-providers']);
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
          this.contract = response.data || null;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando contrato:', err);
          Swal.fire('Error', 'No se pudo cargar el contrato', 'error');
          this.loading = false;
          this.router.navigate(['/purchases/contracts-providers']);
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  editContract(): void {
    this.router.navigate(['/purchases/contracts-providers/edit', this.contractId]);
  }

  formatMoney(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '$0.00';
    return '$' + amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getTotalValue(): number {
    if (!this.contract?.items) return 0;
    return this.contract.items.reduce((sum, item) => sum + (item.provider_price || 0), 0);
  }
}
