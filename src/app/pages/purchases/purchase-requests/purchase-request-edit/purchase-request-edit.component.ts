import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PurchaseRequestService } from '../purchase-request.service';
import {
  PurchaseRequest,
  UpdatePurchaseRequestDTO,
  PRIORITIES,
  ProductSearchItem,
  ContractSummary
} from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-request-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, SidebarComponent],
  templateUrl: './purchase-request-edit.component.html',
  styleUrls: ['./purchase-request-edit.component.css']
})
export class PurchaseRequestEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private productSearchSubject = new Subject<string>();

  requestId!: number;
  purchaseRequest: PurchaseRequest | null = null;
  form!: FormGroup;
  manualItemForm!: FormGroup;
  priorities = PRIORITIES;

  // Datos para Fase 1
  contracts: ContractSummary[] = [];
  contractProducts: ProductSearchItem[] = [];
  searchedProducts: ProductSearchItem[] = [];
  isContractRelated = false;

  // Modal de item manual
  showManualItemModal = false;

  // Estados de carga
  loading = true;
  saving = false;
  loadingContracts = false;
  loadingContractProducts = false;
  loadingProductSearch = false;

  // Fecha mínima para validación
  minDate: string = new Date().toISOString().split('T')[0];

  error: string | null = null;

  // Búsqueda
  productSearchTerm = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private purchaseRequestService: PurchaseRequestService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initManualItemForm();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.requestId = +params['id'];
      if (this.requestId) {
        this.loadPurchaseRequest();
      }
    });

    this.loadUserContracts();
    this.setupSearchSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      is_contract_related: [false],
      contract_id: [null],
      manual_destination: [''],
      title: ['', Validators.required],
      description: [''],
      priority: ['normal', Validators.required],
      required_date: ['', Validators.required],
      notes: [''],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    // Escuchar cambios en is_contract_related
    this.form.get('is_contract_related')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.isContractRelated = value;
      this.onContractModeChange();
    });

    // Escuchar cambios en contract_id
    this.form.get('contract_id')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(contractId => {
      if (contractId) {
        this.loadContractProducts(contractId);
      } else {
        this.contractProducts = [];
      }
    });

    // Agregar validaciones condicionales
    this.setupConditionalValidations();
  }

  private setupConditionalValidations(): void {
    this.form.get('is_contract_related')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isContract => {
      if (isContract) {
        this.form.get('contract_id')?.setValidators(Validators.required);
        this.form.get('manual_destination')?.clearValidators();
      } else {
        this.form.get('contract_id')?.clearValidators();
        this.form.get('manual_destination')?.setValidators(Validators.required);
      }
      this.form.get('contract_id')?.updateValueAndValidity();
      this.form.get('manual_destination')?.updateValueAndValidity();
    });
  }

  private initManualItemForm(): void {
    this.manualItemForm = this.fb.group({
      item_name: ['', Validators.required],
      item_description: [''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit_of_measurement: ['pza'],
      notes: ['']
    });
  }

  loadPurchaseRequest(): void {
    this.loading = true;
    this.error = null;

    this.purchaseRequestService.get(this.requestId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.purchaseRequest = response.data;

        if (!this.purchaseRequestService.canEdit(this.purchaseRequest)) {
          Swal.fire('Error', 'Esta solicitud no puede ser editada', 'error');
          this.router.navigate(['/purchases/purchase-requests']);
          return;
        }

        this.populateForm();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la solicitud de compra';
        this.loading = false;
        console.error('Error:', err);
      }
    });
  }

  private populateForm(): void {
    if (!this.purchaseRequest) return;

    const isContract = !!this.purchaseRequest.contract_id;
    this.isContractRelated = isContract;

    this.form.patchValue({
      is_contract_related: isContract,
      contract_id: this.purchaseRequest.contract_id,
      manual_destination: this.purchaseRequest.manual_destination || '',
      title: this.purchaseRequest.title || this.purchaseRequest.description || '',
      description: this.purchaseRequest.description || '',
      priority: this.purchaseRequest.priority,
      required_date: this.purchaseRequest.required_date?.split('T')[0],
      notes: this.purchaseRequest.notes || this.purchaseRequest.internal_notes || ''
    });

    // Cargar items
    this.itemsArray.clear();
    this.purchaseRequest.items?.forEach(item => {
      this.itemsArray.push(this.createItemFormGroup({
        item_id: item.item_id,
        item_name: item.item?.name || item.item_name || '',
        item_description: item.item?.description || item.item_description || '',
        is_manual_item: item.is_manual_item || !item.item_id,
        quantity: item.quantity,
        unit_of_measurement: item.unit || item.unit_of_measurement || 'pza',
        notes: item.notes
      }));
    });

    // Cargar productos del contrato si aplica
    if (this.purchaseRequest.contract_id) {
      this.loadContractProducts(this.purchaseRequest.contract_id);
    }
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private createItemFormGroup(item?: any): FormGroup {
    return this.fb.group({
      item_id: [item?.item_id || null],
      item_name: [item?.item_name || '', Validators.required],
      item_description: [item?.item_description || ''],
      is_manual_item: [item?.is_manual_item || false],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(0.01)]],
      unit_of_measurement: [item?.unit_of_measurement || 'pza'],
      notes: [item?.notes || '']
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemFormGroup({ is_manual_item: true }));
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 0) {
      this.itemsArray.removeAt(index);
    }
  }

  // Modal de item manual
  openManualItemModal(): void {
    this.manualItemForm.reset({
      item_name: '',
      item_description: '',
      quantity: 1,
      unit_of_measurement: 'pza',
      notes: ''
    });
    this.showManualItemModal = true;
  }

  closeManualItemModal(): void {
    this.showManualItemModal = false;
  }

  addManualItem(): void {
    if (this.manualItemForm.invalid) {
      return;
    }

    const manualItem = this.manualItemForm.value;
    const itemGroup = this.createItemFormGroup({
      item_id: null,
      item_name: manualItem.item_name,
      item_description: manualItem.item_description,
      is_manual_item: true,
      quantity: manualItem.quantity,
      unit_of_measurement: manualItem.unit_of_measurement,
      notes: manualItem.notes
    });

    this.itemsArray.push(itemGroup);
    this.closeManualItemModal();
  }

  // Cargar datos
  loadUserContracts(): void {
    this.loadingContracts = true;
    this.purchaseRequestService.getUserContracts().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.contracts = response.data || [];
        this.loadingContracts = false;
      },
      error: () => {
        this.contracts = [];
        this.loadingContracts = false;
      }
    });
  }

  loadContractProducts(contractId: number): void {
    this.loadingContractProducts = true;
    this.purchaseRequestService.getContractProducts(contractId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.contractProducts = response.data || [];
        this.loadingContractProducts = false;
      },
      error: () => {
        this.contractProducts = [];
        this.loadingContractProducts = false;
      }
    });
  }

  onContractModeChange(): void {
    if (!this.isContractRelated) {
      this.form.patchValue({ contract_id: null });
      this.contractProducts = [];
    }
  }

  private setupSearchSubscriptions(): void {
    this.productSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchProducts(term);
    });
  }

  onProductSearch(term: string): void {
    this.productSearchTerm = term;
    this.productSearchSubject.next(term);
  }

  searchProducts(term: string): void {
    if (!term || term.length < 2) {
      this.searchedProducts = [];
      return;
    }

    this.loadingProductSearch = true;
    this.purchaseRequestService.searchProducts(term).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.searchedProducts = response.data || [];
        this.loadingProductSearch = false;
      },
      error: () => {
        this.searchedProducts = [];
        this.loadingProductSearch = false;
      }
    });
  }

  addProductFromSearch(product: ProductSearchItem): void {
    const itemGroup = this.createItemFormGroup({
      item_id: product.id,
      item_name: product.name,
      item_description: product.description,
      is_manual_item: false,
      quantity: 1,
      unit_of_measurement: 'pza'
    });

    this.itemsArray.push(itemGroup);
    this.searchedProducts = [];
    this.productSearchTerm = '';
  }

  addContractProduct(product: ProductSearchItem): void {
    const itemGroup = this.createItemFormGroup({
      item_id: product.id,
      item_name: product.name,
      item_description: product.description,
      is_manual_item: false,
      quantity: 1,
      unit_of_measurement: 'pza'
    });

    this.itemsArray.push(itemGroup);
  }

  isFormValid(): boolean {
    // Validar campos básicos
    if (!this.form.get('title')?.value) return false;
    if (!this.form.get('priority')?.value) return false;
    if (!this.form.get('required_date')?.value) return false;

    // Validar según modo
    if (this.isContractRelated) {
      if (!this.form.get('contract_id')?.value) return false;
    } else {
      if (!this.form.get('manual_destination')?.value) return false;
    }

    // Validar items
    if (this.itemsArray.length === 0) return false;

    return true;
  }

  async save(submitAfterSave = false): Promise<void> {
    if (!this.isFormValid()) {
      this.markFormGroupTouched();
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      return;
    }

    if (this.itemsArray.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un artículo', 'error');
      return;
    }

    this.saving = true;

    const formValue = this.form.value;
    const dto: UpdatePurchaseRequestDTO = {
      is_contract_related: formValue.is_contract_related,
      contract_id: formValue.is_contract_related ? formValue.contract_id : null,
      manual_destination: !formValue.is_contract_related ? formValue.manual_destination : null,
      title: formValue.title,
      description: formValue.description || undefined,
      priority: formValue.priority,
      required_date: formValue.required_date,
      notes: formValue.notes || undefined,
      items: formValue.items.map((item: any) => ({
        item_id: item.item_id || null,
        item_name: item.item_name,
        item_description: item.item_description || undefined,
        is_manual_item: item.is_manual_item || !item.item_id,
        quantity: item.quantity,
        unit_of_measurement: item.unit_of_measurement,
        notes: item.notes || undefined
      }))
    };

    this.purchaseRequestService.update(this.requestId, dto).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.saving = false;

        if (submitAfterSave && response.data) {
          this.submitRequest();
        } else {
          Swal.fire('Éxito', 'Solicitud de compra actualizada correctamente', 'success');
          this.router.navigate(['/purchases/purchase-requests']);
        }
      },
      error: (err) => {
        this.saving = false;
        const message = err.error?.message || 'Error al actualizar la solicitud';
        Swal.fire('Error', message, 'error');
      }
    });
  }

  private submitRequest(): void {
    this.purchaseRequestService.submit(this.requestId).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Solicitud actualizada y enviada para pre-autorización', 'success');
        this.router.navigate(['/purchases/purchase-requests']);
      },
      error: () => {
        Swal.fire('Aviso', 'Solicitud actualizada pero no se pudo enviar automáticamente', 'warning');
        this.router.navigate(['/purchases/purchase-requests']);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/purchases/purchase-requests']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();

      if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            Object.keys(c.controls).forEach(k => c.get(k)?.markAsTouched());
          }
        });
      }
    });
  }

  formatCurrency(value: number): string {
    return this.purchaseRequestService.formatCurrency(value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const item = this.itemsArray.at(index);
    const field = item?.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }
}
