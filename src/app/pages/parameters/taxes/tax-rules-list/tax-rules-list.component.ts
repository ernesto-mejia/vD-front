import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaxesService } from '../taxes.service';
import { TaxRule, TaxRuleFilters, AppliesTo, ItemType } from '../taxes';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-tax-rules-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './tax-rules-list.component.html',
  styleUrls: ['./tax-rules-list.component.css']
})
export class TaxRulesListComponent implements OnInit {
  taxRules: TaxRule[] = [];
  loading = false;
  error: string | null = null;

  // Filtros
  filters: TaxRuleFilters = {
    person_type: undefined,
    applies_to: undefined,
    item_type: undefined,
    active: true,
    sort_by: 'priority',
    sort_dir: 'desc'
  };

  // Opciones de filtros
  appliesToOptions: { value: AppliesTo; label: string }[] = [
    { value: 'person', label: 'Solo Personas' },
    { value: 'item', label: 'Solo Items' },
    { value: 'both', label: 'Ambos' }
  ];

  itemTypeOptions: { value: ItemType; label: string }[] = [
    { value: 'product', label: 'Productos' },
    { value: 'service', label: 'Servicios' },
    { value: 'kit', label: 'Kits' },
    { value: 'equipment', label: 'Equipos' },
    { value: 'supply', label: 'Insumos' },
    { value: 'consumable', label: 'Consumibles' }
  ];

  // Paginación
  currentPage = 1;
  totalPages = 1;
  perPage = 15;
  total = 0;

  constructor(
    private taxesService: TaxesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTaxRules();
  }

  loadTaxRules(): void {
    this.loading = true;
    this.error = null;

    const params: TaxRuleFilters = {
      ...this.filters,
      per_page: this.perPage,
      page: this.currentPage
    };

    this.taxesService.getTaxRules(params).subscribe({
      next: (response) => {
        this.taxRules = response.data;
        if (response.meta) {
          this.currentPage = response.meta.current_page;
          this.totalPages = response.meta.last_page;
          this.total = response.meta.total;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las reglas de impuestos';
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTaxRules();
  }

  clearFilters(): void {
    this.filters = {
      person_type: undefined,
      applies_to: undefined,
      item_type: undefined,
      active: true,
      sort_by: 'priority',
      sort_dir: 'desc'
    };
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTaxRules();
    }
  }

  viewRule(id: number): void {
    this.router.navigate(['/parameters/taxes/rules/show', id]);
  }

  editRule(id: number): void {
    this.router.navigate(['/parameters/taxes/rules/edit', id]);
  }

  addRule(): void {
    this.router.navigate(['/parameters/taxes/rules/add']);
  }

  deleteRule(rule: TaxRule): void {
    if (!confirm(`¿Está seguro de eliminar la regla "${rule.name}"?`)) {
      return;
    }

    this.taxesService.deleteTaxRule(rule.id).subscribe({
      next: () => {
        this.loadTaxRules();
      },
      error: (err) => {
        const message = err.error?.message || 'Error al eliminar la regla';
        alert(message);
      }
    });
  }

  formatRate(rate: number): string {
    return this.taxesService.formatRateAsPercentage(rate);
  }

  getPersonTypeName(type: 'fisica' | 'moral'): string {
    return this.taxesService.getPersonTypeName(type);
  }

  getPersonTypeBadgeClass(type: 'fisica' | 'moral'): string {
    return type === 'fisica' ? 'bg-info' : 'bg-primary';
  }

  getAppliesToName(appliesTo: AppliesTo | undefined): string {
    switch (appliesTo) {
      case 'person': return 'Personas';
      case 'item': return 'Items';
      case 'both': return 'Ambos';
      default: return 'Personas';
    }
  }

  getAppliesToBadgeClass(appliesTo: AppliesTo | undefined): string {
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

  getStatusBadgeClass(active: boolean): string {
    return active ? 'bg-success' : 'bg-secondary';
  }
}
