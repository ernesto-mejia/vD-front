import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TaxesService } from '../taxes.service';
import { TaxRule, TaxRuleUpdateRequest, TaxRegime, ItemType } from '../taxes';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-tax-rule-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './tax-rule-edit.component.html',
  styleUrls: ['./tax-rule-edit.component.css']
})
export class TaxRuleEditComponent implements OnInit {
  form!: FormGroup;
  taxRule: TaxRule | null = null;
  taxRegimes: TaxRegime[] = [];
  loading = true;
  submitting = false;
  error: string | null = null;
  ruleId!: number;

  // Opciones de tipos de item
  itemTypeOptions: { value: ItemType; label: string }[] = [
    { value: 'product', label: 'Productos' },
    { value: 'service', label: 'Servicios' },
    { value: 'kit', label: 'Kits' },
    { value: 'equipment', label: 'Equipos' },
    { value: 'supply', label: 'Insumos' },
    { value: 'consumable', label: 'Consumibles' }
  ];

  constructor(
    private fb: FormBuilder,
    private taxesService: TaxesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.ruleId = Number(this.route.snapshot.paramMap.get('id'));
    this.initForm();
    this.loadData();
    this.setupFormWatchers();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9\-_]+$/)]],
      description: [''],
      person_type: ['fisica', Validators.required],
      applies_to: ['person', Validators.required],
      item_types: [[] as ItemType[]],
      sat_product_code: [''],
      item_category_id: [null],
      tax_regime_id: [null],
      vat_rate: [16, [Validators.required, Validators.min(0), Validators.max(100)]],
      vat_retention_applies: [false],
      vat_retention_rate: [10.6667, [Validators.min(0), Validators.max(100)]],
      isr_retention_applies: [false],
      isr_retention_rate: [10, [Validators.min(0), Validators.max(100)]],
      ieps_applies: [false],
      ieps_rate: [0, [Validators.min(0), Validators.max(100)]],
      is_border_zone: [false],
      is_default: [false],
      active: [true],
      priority: [0, [Validators.min(0)]]
    });
  }

  setupFormWatchers(): void {
    // Observar cambios en applies_to
    this.form.get('applies_to')?.valueChanges.subscribe(value => {
      if (value === 'item') {
        this.form.get('person_type')?.setValue('moral');
      }
    });

    // Observar cambios en is_border_zone para ajustar IVA
    this.form.get('is_border_zone')?.valueChanges.subscribe(isBorder => {
      if (isBorder) {
        this.form.get('vat_rate')?.setValue(8);
      } else {
        const currentRate = this.form.get('vat_rate')?.value;
        if (currentRate === 8) {
          this.form.get('vat_rate')?.setValue(16);
        }
      }
    });
  }

  loadData(): void {
    this.loading = true;

    // Cargar regímenes fiscales
    this.taxesService.getTaxRegimes().subscribe({
      next: (regimes) => {
        this.taxRegimes = regimes;
      },
      error: (err) => console.error('Error cargando regímenes:', err)
    });

    // Cargar la regla
    this.taxesService.getTaxRule(this.ruleId).subscribe({
      next: (response) => {
        this.taxRule = response.data;
        this.populateForm(this.taxRule);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la regla de impuesto';
        this.loading = false;
      }
    });
  }

  populateForm(rule: TaxRule): void {
    this.form.patchValue({
      name: rule.name,
      code: rule.code,
      description: rule.description || '',
      person_type: rule.person_type,
      applies_to: rule.applies_to || 'person',
      item_types: rule.item_types || [],
      sat_product_code: rule.sat_product_code || '',
      item_category_id: rule.item_category_id || null,
      tax_regime_id: rule.tax_regime_id || null,
      vat_rate: rule.vat_rate * 100,
      vat_retention_applies: rule.vat_retention_applies,
      vat_retention_rate: rule.vat_retention_rate * 100,
      isr_retention_applies: rule.isr_retention_applies,
      isr_retention_rate: rule.isr_retention_rate * 100,
      ieps_applies: rule.ieps_applies || false,
      ieps_rate: (rule.ieps_rate || 0) * 100,
      is_border_zone: rule.is_border_zone || false,
      is_default: rule.is_default,
      active: rule.active,
      priority: rule.priority
    });
  }

  onItemTypeChange(itemType: ItemType, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentTypes: ItemType[] = this.form.get('item_types')?.value || [];

    if (checkbox.checked) {
      if (!currentTypes.includes(itemType)) {
        this.form.get('item_types')?.setValue([...currentTypes, itemType]);
      }
    } else {
      this.form.get('item_types')?.setValue(currentTypes.filter(t => t !== itemType));
    }
  }

  isItemTypeSelected(itemType: ItemType): boolean {
    const currentTypes: ItemType[] = this.form.get('item_types')?.value || [];
    return currentTypes.includes(itemType);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const formValue = this.form.value;
    const payload: TaxRuleUpdateRequest = {
      name: formValue.name,
      code: formValue.code.toUpperCase(),
      description: formValue.description || undefined,
      person_type: formValue.person_type,
      applies_to: formValue.applies_to,
      item_types: formValue.applies_to !== 'person' ? formValue.item_types : undefined,
      sat_product_code: formValue.sat_product_code || undefined,
      item_category_id: formValue.item_category_id || null,
      tax_regime_id: formValue.tax_regime_id || null,
      vat_rate: formValue.vat_rate / 100,
      vat_retention_applies: formValue.vat_retention_applies,
      vat_retention_rate: formValue.vat_retention_applies ? formValue.vat_retention_rate / 100 : 0,
      isr_retention_applies: formValue.isr_retention_applies,
      isr_retention_rate: formValue.isr_retention_applies ? formValue.isr_retention_rate / 100 : 0,
      ieps_applies: formValue.ieps_applies,
      ieps_rate: formValue.ieps_applies ? formValue.ieps_rate / 100 : 0,
      is_border_zone: formValue.is_border_zone,
      is_default: formValue.is_default,
      active: formValue.active,
      priority: formValue.priority
    };

    this.taxesService.updateTaxRule(this.ruleId, payload).subscribe({
      next: () => {
        this.router.navigate(['/parameters/taxes/rules']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al actualizar la regla de impuesto';
        if (err.error?.errors) {
          const errors = Object.values(err.error.errors).flat().join(', ');
          this.error += ': ' + errors;
        }
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/parameters/taxes/rules']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return control ? control.invalid && control.touched : false;
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valor máximo: ${control.errors['max'].max}`;
    if (control.errors['pattern']) return 'Solo letras mayúsculas, números, guiones y guiones bajos';

    return 'Campo inválido';
  }

  calculatePreviewTotal(): number {
    const subtotal = 10000;
    const vatRate = (this.form.get('vat_rate')?.value || 0) / 100;
    const vatRetentionRate = this.form.get('vat_retention_applies')?.value
      ? (this.form.get('vat_retention_rate')?.value || 0) / 100
      : 0;
    const isrRetentionRate = this.form.get('isr_retention_applies')?.value
      ? (this.form.get('isr_retention_rate')?.value || 0) / 100
      : 0;
    const iepsRate = this.form.get('ieps_applies')?.value
      ? (this.form.get('ieps_rate')?.value || 0) / 100
      : 0;

    const vat = subtotal * vatRate;
    const ieps = subtotal * iepsRate;
    const vatRetention = subtotal * vatRetentionRate;
    const isrRetention = subtotal * isrRetentionRate;

    return subtotal + vat + ieps - vatRetention - isrRetention;
  }
}
