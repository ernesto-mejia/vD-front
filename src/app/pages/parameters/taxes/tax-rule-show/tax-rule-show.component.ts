import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TaxesService } from '../taxes.service';
import { TaxRule, ItemType } from '../taxes';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-tax-rule-show',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './tax-rule-show.component.html',
  styleUrls: ['./tax-rule-show.component.css']
})
export class TaxRuleShowComponent implements OnInit {
  taxRule: TaxRule | null = null;
  loading = true;
  error: string | null = null;
  ruleId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taxesService: TaxesService
  ) {}

  ngOnInit(): void {
    this.ruleId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.ruleId) {
      this.router.navigate(['/parameters/taxes/rules']);
      return;
    }
    this.loadTaxRule();
  }

  loadTaxRule(): void {
    this.loading = true;
    this.taxesService.getTaxRule(this.ruleId).subscribe({
      next: (response) => {
        this.taxRule = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la regla de impuesto';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getPersonTypeLabel(type: string): string {
    return type === 'fisica' ? 'Persona Física' : 'Persona Moral';
  }

  getPersonTypeBadgeClass(type: string): string {
    return type === 'fisica' ? 'bg-info' : 'bg-success';
  }

  getAppliesToLabel(appliesTo: string | undefined): string {
    switch (appliesTo) {
      case 'person': return 'Solo Personas';
      case 'item': return 'Solo Items';
      case 'both': return 'Ambos';
      default: return 'Personas';
    }
  }

  getAppliesToBadgeClass(appliesTo: string | undefined): string {
    switch (appliesTo) {
      case 'person': return 'bg-secondary';
      case 'item': return 'bg-success';
      case 'both': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getItemTypeName(itemType: ItemType): string {
    const names: Record<ItemType, string> = {
      'product': 'Productos',
      'service': 'Servicios',
      'kit': 'Kits',
      'equipment': 'Equipos',
      'supply': 'Insumos',
      'consumable': 'Consumibles'
    };
    return names[itemType] || itemType;
  }

  formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0%';
    return (value * 100).toFixed(4).replace(/\.?0+$/, '') + '%';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  calculatePreview(subtotal: number = 10000): {
    subtotal: number;
    vat: number;
    ieps: number;
    vatRetention: number;
    isrRetention: number;
    total: number;
  } {
    if (!this.taxRule) {
      return { subtotal, vat: 0, ieps: 0, vatRetention: 0, isrRetention: 0, total: subtotal };
    }

    const vat = subtotal * (this.taxRule.vat_rate || 0);
    const ieps = this.taxRule.ieps_applies
      ? subtotal * (this.taxRule.ieps_rate || 0)
      : 0;
    const vatRetention = this.taxRule.vat_retention_applies
      ? subtotal * (this.taxRule.vat_retention_rate || 0)
      : 0;
    const isrRetention = this.taxRule.isr_retention_applies
      ? subtotal * (this.taxRule.isr_retention_rate || 0)
      : 0;
    const total = subtotal + vat + ieps - vatRetention - isrRetention;

    return { subtotal, vat, ieps, vatRetention, isrRetention, total };
  }

  goBack(): void {
    this.router.navigate(['/parameters/taxes/rules']);
  }

  edit(): void {
    this.router.navigate(['/parameters/taxes/rules', this.ruleId, 'edit']);
  }
}
