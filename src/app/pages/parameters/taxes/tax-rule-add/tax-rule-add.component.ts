import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TaxesService } from '../taxes.service';
import { TaxRuleCreateRequest, TaxRegime, AppliesTo, ItemType, TaxRuleOptions } from '../taxes';
import { SidebarComponent } from '../../../sidebar/sidebar.component';

@Component({
  selector: 'app-tax-rule-add',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './tax-rule-add.component.html',
  styleUrls: ['./tax-rule-add.component.css']
})
export class TaxRuleAddComponent implements OnInit {
  form!: FormGroup;
  taxRegimes: TaxRegime[] = [];
  options: TaxRuleOptions | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;

  // Opciones de tipo de item disponibles
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9\-_]+$/)]],
      description: [''],
      person_type: ['fisica', Validators.required],
      applies_to: ['person', Validators.required],
      item_types: [[]],
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

    // Escuchar cambios en person_type para sugerir valores
    this.form.get('person_type')?.valueChanges.subscribe(type => {
      this.suggestRatesForPersonType(type);
    });

    // Escuchar cambios en applies_to para limpiar item_types si no aplica
    this.form.get('applies_to')?.valueChanges.subscribe(appliesTo => {
      if (appliesTo === 'person') {
        this.form.patchValue({ item_types: [] });
      }
    });

    // Escuchar cambios en is_border_zone para ajustar IVA
    this.form.get('is_border_zone')?.valueChanges.subscribe(isBorder => {
      if (isBorder) {
        this.form.patchValue({ vat_rate: 8 });
      } else {
        this.form.patchValue({ vat_rate: 16 });
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
      error: (err) => console.error('Error cargando regímenes fiscales:', err)
    });

    // Cargar opciones
    this.taxesService.getTaxRuleOptions().subscribe({
      next: (opts) => {
        this.options = opts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando opciones:', err);
        this.loading = false;
      }
    });
  }

  suggestRatesForPersonType(type: 'fisica' | 'moral'): void {
    if (type === 'fisica') {
      this.form.patchValue({
        vat_rate: 16,
        vat_retention_applies: true,
        vat_retention_rate: 10.6667,
        isr_retention_applies: true,
        isr_retention_rate: 10
      });
    } else {
      this.form.patchValue({
        vat_rate: 16,
        vat_retention_applies: false,
        vat_retention_rate: 0,
        isr_retention_applies: false,
        isr_retention_rate: 0
      });
    }
  }

  generateCode(): void {
    const personType = this.form.get('person_type')?.value;
    const appliesTo = this.form.get('applies_to')?.value;
    let prefix = personType === 'fisica' ? 'PF' : 'PM';
    if (appliesTo === 'item') {
      prefix = 'ITM';
    } else if (appliesTo === 'both') {
      prefix = 'MIX';
    }
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    this.form.patchValue({ code: `${prefix}-${timestamp}` });
  }

  onItemTypeChange(itemType: ItemType, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentTypes: ItemType[] = this.form.get('item_types')?.value || [];

    if (checkbox.checked) {
      if (!currentTypes.includes(itemType)) {
        this.form.patchValue({ item_types: [...currentTypes, itemType] });
      }
    } else {
      this.form.patchValue({ item_types: currentTypes.filter(t => t !== itemType) });
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
    const payload: TaxRuleCreateRequest = {
      name: formValue.name,
      code: formValue.code.toUpperCase(),
      description: formValue.description || undefined,
      person_type: formValue.person_type,
      applies_to: formValue.applies_to,
      item_types: formValue.applies_to !== 'person' ? formValue.item_types : undefined,
      sat_product_code: formValue.sat_product_code || undefined,
      item_category_id: formValue.item_category_id || null,
      tax_regime_id: formValue.tax_regime_id || null,
      vat_rate: formValue.vat_rate / 100, // Convertir a decimal
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

    this.taxesService.createTaxRule(payload).subscribe({
      next: () => {
        this.router.navigate(['/parameters/taxes/rules']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear la regla de impuesto';
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
