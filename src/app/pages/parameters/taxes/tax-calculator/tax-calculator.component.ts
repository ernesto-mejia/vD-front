import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaxesService } from '../taxes.service';
import { TaxRule, TaxRulesListResponse } from '../taxes';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

interface CalculationResult {
  subtotal: number;
  vat: number;
  vat_retention: number;
  isr_retention: number;
  total: number;
  rates_applied?: {
    vat_rate: number;
    vat_retention_rate: number;
    isr_retention_rate: number;
    vat_retention_applies: boolean;
    isr_retention_applies: boolean;
  };
  rule_applied?: TaxRule;
}

@Component({
  selector: 'app-tax-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, SidebarComponent],
  templateUrl: './tax-calculator.component.html',
  styleUrls: ['./tax-calculator.component.css']
})
export class TaxCalculatorComponent implements OnInit {
  form!: FormGroup;
  taxRules: TaxRule[] = [];
  loading = false;
  calculating = false;
  error: string | null = null;

  // Resultados del cálculo
  result: CalculationResult | null = null;
  selectedRule: TaxRule | null = null;
  detectedPersonType: string | null = null;

  constructor(
    private fb: FormBuilder,
    private taxesService: TaxesService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTaxRules();
  }

  initForm(): void {
    this.form = this.fb.group({
      rfc: ['', [Validators.minLength(12), Validators.maxLength(13)]],
      person_type: ['fisica'],
      subtotal: [10000, [Validators.required, Validators.min(0.01)]],
      tax_rule_id: [null],
      use_manual_rates: [false],
      manual_vat_rate: [16],
      manual_vat_retention_rate: [10.6667],
      manual_isr_retention_rate: [10],
      manual_vat_retention_applies: [true],
      manual_isr_retention_applies: [true]
    });

    // Cuando cambia el RFC, detectar tipo de persona
    this.form.get('rfc')?.valueChanges.subscribe(rfc => {
      if (rfc && rfc.length >= 12) {
        this.detectPersonType(rfc);
      }
    });

    // Cuando cambia el tipo de persona, filtrar reglas
    this.form.get('person_type')?.valueChanges.subscribe(() => {
      this.filterRulesByPersonType();
    });

    // Recalcular cuando cambian valores relevantes
    this.form.valueChanges.subscribe(() => {
      if (this.result) {
        this.calculate();
      }
    });
  }

  loadTaxRules(): void {
    this.loading = true;
    this.taxesService.getTaxRules().subscribe({
      next: (response: TaxRulesListResponse) => {
        this.taxRules = (response.data || []).filter(r => r.active);
        this.loading = false;
        this.filterRulesByPersonType();
      },
      error: (err) => {
        this.error = 'Error al cargar las reglas de impuestos';
        this.loading = false;
        console.error(err);
      }
    });
  }

  detectPersonType(rfc: string): void {
    const personType = this.taxesService.getPersonTypeFromRfc(rfc);
    if (personType) {
      this.detectedPersonType = personType;
      this.form.patchValue({ person_type: personType }, { emitEvent: false });
      this.filterRulesByPersonType();
    }
  }

  filterRulesByPersonType(): void {
    const personType = this.form.get('person_type')?.value;
    const filteredRules = this.taxRules.filter(r => r.person_type === personType);

    // Si hay una regla por defecto, seleccionarla
    const defaultRule = filteredRules.find(r => r.is_default);
    if (defaultRule) {
      this.form.patchValue({ tax_rule_id: defaultRule.id }, { emitEvent: false });
      this.selectedRule = defaultRule;
    } else if (filteredRules.length > 0) {
      this.form.patchValue({ tax_rule_id: filteredRules[0].id }, { emitEvent: false });
      this.selectedRule = filteredRules[0];
    }
  }

  get filteredRules(): TaxRule[] {
    const personType = this.form.get('person_type')?.value;
    return this.taxRules.filter(r => r.person_type === personType);
  }

  onRuleChange(): void {
    const ruleId = this.form.get('tax_rule_id')?.value;
    this.selectedRule = this.taxRules.find(r => r.id === ruleId) || null;
  }

  calculate(): void {
    const formValues = this.form.value;
    const subtotal = formValues.subtotal || 0;

    if (formValues.use_manual_rates) {
      // Cálculo manual
      const vatRate = (formValues.manual_vat_rate || 0) / 100;
      const vatRetentionRate = formValues.manual_vat_retention_applies
        ? (formValues.manual_vat_retention_rate || 0) / 100
        : 0;
      const isrRetentionRate = formValues.manual_isr_retention_applies
        ? (formValues.manual_isr_retention_rate || 0) / 100
        : 0;

      const vat = subtotal * vatRate;
      const vatRetention = subtotal * vatRetentionRate;
      const isrRetention = subtotal * isrRetentionRate;
      const total = subtotal + vat - vatRetention - isrRetention;

      this.result = {
        subtotal,
        vat,
        vat_retention: vatRetention,
        isr_retention: isrRetention,
        total,
        rates_applied: {
          vat_rate: vatRate,
          vat_retention_rate: vatRetentionRate,
          isr_retention_rate: isrRetentionRate,
          vat_retention_applies: formValues.manual_vat_retention_applies,
          isr_retention_applies: formValues.manual_isr_retention_applies
        }
      };
    } else if (this.selectedRule) {
      // Cálculo con regla seleccionada
      const vatRate = this.selectedRule.vat_rate || 0;
      const vatRetentionRate = this.selectedRule.vat_retention_applies
        ? (this.selectedRule.vat_retention_rate || 0)
        : 0;
      const isrRetentionRate = this.selectedRule.isr_retention_applies
        ? (this.selectedRule.isr_retention_rate || 0)
        : 0;

      const vat = subtotal * vatRate;
      const vatRetention = subtotal * vatRetentionRate;
      const isrRetention = subtotal * isrRetentionRate;
      const total = subtotal + vat - vatRetention - isrRetention;

      this.result = {
        subtotal,
        vat,
        vat_retention: vatRetention,
        isr_retention: isrRetention,
        total,
        rates_applied: {
          vat_rate: vatRate,
          vat_retention_rate: vatRetentionRate,
          isr_retention_rate: isrRetentionRate,
          vat_retention_applies: this.selectedRule.vat_retention_applies,
          isr_retention_applies: this.selectedRule.isr_retention_applies
        },
        rule_applied: this.selectedRule
      };
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  formatPercent(value: number): string {
    return (value * 100).toFixed(4).replace(/\.?0+$/, '') + '%';
  }

  getPersonTypeLabel(type: string): string {
    return type === 'fisica' ? 'Persona Física' : 'Persona Moral';
  }

  reset(): void {
    this.result = null;
    this.form.patchValue({
      rfc: '',
      subtotal: 10000,
      tax_rule_id: null,
      use_manual_rates: false
    });
    this.detectedPersonType = null;
    this.filterRulesByPersonType();
  }
}
