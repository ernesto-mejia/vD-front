import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { PurchaseRequestService } from '../purchase-request.service';
import { ProviderService } from '../../../providers/provider.service';
import { ProductsService, ItemSupplier, QuickSupplierRequest } from '../../../warehouse/products/products.service';
import { PurchaseOrderService } from '../../purchase-orders/purchase-order.service';
import {
  PurchaseRequest,
  PurchaseRequestItemExtended,
  PRIORITIES,
  STATUS_CODES
} from '../purchase-requests';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import Swal from 'sweetalert2';

interface Provider {
  id: number;
  name: string;
  rfc: string;
  person_type?: string;
}

// Mapa de proveedores por item_id
interface ItemProvidersMap {
  [itemId: number]: ItemSupplier[];
}

@Component({
  selector: 'app-purchase-request-preauthorize',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './purchase-request-preauthorize.component.html',
  styleUrls: ['./purchase-request-preauthorize.component.css']
})
export class PurchaseRequestPreauthorizeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  requestId!: number;
  request: PurchaseRequest | null = null;
  form!: FormGroup;
  priorities = PRIORITIES;

  // Datos
  providers: Provider[] = [];

  // Mapa de proveedores por item_id (para items del catálogo)
  itemProvidersMap: ItemProvidersMap = {};
  loadingItemProviders: { [itemId: number]: boolean } = {};

  // Estados
  loading = false;
  loadingRequest = true;
  loadingProviders = false;
  submitting = false;

  // Modo de asignación de proveedor (viene desde OC)
  assignProviderMode = false;
  relatedOrderId: number | null = null;

  // Totales calculados
  calculatedTotals = {
    subtotal: 0,
    iva: 0,
    total: 0
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public purchaseRequestService: PurchaseRequestService,
    private providerService: ProviderService,
    private productsService: ProductsService,
    private purchaseOrderService: PurchaseOrderService
  ) {}

  ngOnInit(): void {
    this.requestId = +this.route.snapshot.params['id'];

    // Verificar si venimos del modo asignación de proveedor (desde OC)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.assignProviderMode = params['assignProvider'] === 'true';
      this.relatedOrderId = params['orderId'] ? +params['orderId'] : null;
    });

    this.initForm();
    this.loadProviders();
    this.loadRequest();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      provider_id: [null], // Proveedor global (opcional, para items manuales sin proveedor específico)
      notes: [''],
      items: this.fb.array([])
    });
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  loadRequest(): void {
    this.loadingRequest = true;
    this.purchaseRequestService.get(this.requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.request = response.data;
          this.populateForm();
          this.loadingRequest = false;
        },
        error: (error) => {
          console.error('Error loading request:', error);
          Swal.fire('Error', 'No se pudo cargar la solicitud', 'error');
          this.router.navigate(['/purchases/purchase-requests']);
        }
      });
  }

  private populateForm(): void {
    if (!this.request) return;

    this.form.patchValue({
      provider_id: this.request.provider_id,
      notes: ''
    });

    // Crear FormGroup para cada item
    this.itemsArray.clear();
    (this.request.items || []).forEach(item => {
      this.itemsArray.push(this.createItemFormGroup(item as PurchaseRequestItemExtended));
    });

    this.calculateTotals();

    // Cargar proveedores para items del catálogo
    this.loadItemProviders();
  }

  /**
   * Cargar proveedores disponibles para cada item del catálogo
   */
  private loadItemProviders(): void {
    const itemsWithCatalog = (this.request?.items || []).filter(item =>
      item.item_id && !item.is_manual_item
    );

    if (itemsWithCatalog.length === 0) return;

    itemsWithCatalog.forEach(item => {
      if (item.item_id) {
        this.loadingItemProviders[item.item_id] = true;

        this.productsService.getItemSuppliers(item.item_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.itemProvidersMap[item.item_id!] = response.data;
              this.loadingItemProviders[item.item_id!] = false;

              // Si hay un proveedor preferido y el item no tiene precio, autoseleccionar
              const preferred = response.data.find(s => s.is_preferred);
              if (preferred) {
                this.autoSelectProviderForItem(item.item_id!, preferred);
              }
            },
            error: () => {
              this.loadingItemProviders[item.item_id!] = false;
            }
          });
      }
    });
  }

  /**
   * Autoseleccionar un proveedor para un item específico
   */
  private autoSelectProviderForItem(itemId: number, supplier: ItemSupplier): void {
    const itemIndex = this.itemsArray.controls.findIndex(
      c => c.get('item_id')?.value === itemId
    );

    if (itemIndex !== -1) {
      const control = this.itemsArray.at(itemIndex);
      // Solo autocompletar si no tiene proveedor ya seleccionado
      if (!control.get('provider_id')?.value) {
        control.patchValue({
          provider_id: supplier.id,
          provider_name: supplier.name,
          unit_price: supplier.price || control.get('unit_price')?.value
        });
        this.calculateTotals();
      }
    }
  }

  /**
   * Al cambiar el proveedor de un item, actualizar el precio
   */
  onItemProviderChange(itemIndex: number): void {
    const control = this.itemsArray.at(itemIndex);
    const itemId = control.get('item_id')?.value;
    const providerId = control.get('provider_id')?.value;

    if (itemId && providerId && this.itemProvidersMap[itemId]) {
      const supplier = this.itemProvidersMap[itemId].find(s => s.id === +providerId);
      if (supplier) {
        control.patchValue({
          provider_name: supplier.name,
          unit_price: supplier.price || control.get('unit_price')?.value
        });
        this.calculateTotals();
      }
    }
  }

  /**
   * Obtener los proveedores disponibles para un item por índice
   */
  getItemProviders(itemIndex: number): ItemSupplier[] {
    const control = this.itemsArray.at(itemIndex);
    const itemId = control.get('item_id')?.value;
    return itemId ? (this.itemProvidersMap[itemId] || []) : [];
  }

  /**
   * Verificar si un item tiene proveedores disponibles
   */
  hasItemProviders(itemIndex: number): boolean {
    return this.getItemProviders(itemIndex).length > 0;
  }

  /**
   * Verificar si está cargando proveedores para un item
   */
  isLoadingItemProviders(itemIndex: number): boolean {
    const control = this.itemsArray.at(itemIndex);
    const itemId = control.get('item_id')?.value;
    return itemId ? (this.loadingItemProviders[itemId] || false) : false;
  }

  /**
   * Verificar si un item es del catálogo (puede agregar proveedor)
   */
  isFromCatalog(itemIndex: number): boolean {
    const control = this.itemsArray.at(itemIndex);
    return !!control.get('item_id')?.value && !control.get('is_manual_item')?.value;
  }

  /**
   * Verificar si un item tiene proveedor asignado desde contrato
   */
  hasContractProvider(itemIndex: number): boolean {
    const control = this.itemsArray.at(itemIndex);
    return !!control.get('contract_provider_id')?.value && !!control.get('provider_name')?.value;
  }

  /**
   * Agregar proveedor rápido a un item del catálogo
   */
  addQuickSupplier(itemIndex: number): void {
    const control = this.itemsArray.at(itemIndex);
    const itemId = control.get('item_id')?.value;
    const itemName = control.get('item_name')?.value;

    if (!itemId) {
      Swal.fire('Error', 'Solo se pueden agregar proveedores a productos del catálogo', 'error');
      return;
    }

    Swal.fire({
      title: 'Agregar Proveedor',
      html: `
        <p class="text-muted small mb-3">Producto: <strong>${itemName}</strong></p>
        <div class="mb-3">
          <label class="form-label small">Nombre del Proveedor *</label>
          <input id="swal-company" class="swal2-input" placeholder="Nombre o Razón Social">
        </div>
        <div class="mb-3">
          <label class="form-label small">RFC</label>
          <input id="swal-rfc" class="swal2-input" placeholder="RFC (opcional)">
        </div>
        <div class="mb-3">
          <label class="form-label small">Email</label>
          <input id="swal-email" class="swal2-input" type="email" placeholder="correo@ejemplo.com">
        </div>
        <div class="mb-3">
          <label class="form-label small">Teléfono</label>
          <input id="swal-phone" class="swal2-input" placeholder="Teléfono de contacto">
        </div>
        <div class="mb-3">
          <label class="form-label small">Precio Unitario *</label>
          <input id="swal-price" class="swal2-input" type="number" step="0.01" min="0" placeholder="0.00">
        </div>
        <div class="mb-3">
          <label class="form-label small">SKU del Proveedor</label>
          <input id="swal-sku" class="swal2-input" placeholder="Código del producto (opcional)">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar Proveedor',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      preConfirm: () => {
        const company = (document.getElementById('swal-company') as HTMLInputElement).value.trim();
        const price = parseFloat((document.getElementById('swal-price') as HTMLInputElement).value);

        if (!company) {
          Swal.showValidationMessage('El nombre del proveedor es requerido');
          return false;
        }
        if (!price || price <= 0) {
          Swal.showValidationMessage('El precio debe ser mayor a 0');
          return false;
        }

        return {
          company_name: company,
          rfc: (document.getElementById('swal-rfc') as HTMLInputElement).value.trim() || undefined,
          email: (document.getElementById('swal-email') as HTMLInputElement).value.trim() || undefined,
          phone: (document.getElementById('swal-phone') as HTMLInputElement).value.trim() || undefined,
          price: price,
          supplier_sku: (document.getElementById('swal-sku') as HTMLInputElement).value.trim() || undefined,
          is_preferred: false
        } as QuickSupplierRequest;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.saveQuickSupplier(itemIndex, itemId, result.value);
      }
    });
  }

  /**
   * Guardar el proveedor rápido
   */
  private saveQuickSupplier(itemIndex: number, itemId: number, data: QuickSupplierRequest): void {
    Swal.fire({
      title: 'Guardando...',
      text: 'Creando proveedor y asociándolo al producto',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.productsService.createQuickSupplier(itemId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          Swal.close();

          // Agregar el nuevo proveedor al mapa
          const newSupplier: ItemSupplier = {
            id: response.data.provider.id,
            name: response.data.provider.name,
            rfc: response.data.provider.rfc,
            price: response.data.supplier.price,
            is_preferred: response.data.supplier.is_preferred,
            supplier_sku: data.supplier_sku || null,
            priority: null,
            notes: null
          };

          if (!this.itemProvidersMap[itemId]) {
            this.itemProvidersMap[itemId] = [];
          }
          this.itemProvidersMap[itemId].push(newSupplier);

          // Seleccionar automáticamente el nuevo proveedor
          const control = this.itemsArray.at(itemIndex);
          control.patchValue({
            provider_id: response.data.provider.id,
            provider_name: response.data.provider.name,
            unit_price: response.data.supplier.price
          });

          this.calculateTotals();

          Swal.fire({
            icon: 'success',
            title: 'Proveedor Agregado',
            text: `${response.data.provider.name} se agregó y seleccionó correctamente`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo agregar el proveedor', 'error');
        }
      });
  }

  private createItemFormGroup(item: PurchaseRequestItemExtended): FormGroup {
    // Si viene con proveedor del contrato, usar ese precio
    const unitPrice = item.contract_price || item.unit_price || 0;

    return this.fb.group({
      id: [item.id],
      item_id: [item.item_id], // ID del item del catálogo (si aplica)
      item_name: [item.item_name],
      item_description: [item.item_description],
      is_manual_item: [item.is_manual_item],
      quantity: [item.quantity],
      unit_of_measurement: [item.unit_of_measurement || item.unit],
      unit_price: [unitPrice, [Validators.required, Validators.min(0)]],
      estimated_price: [item.estimated_price || null],
      line_total: [{ value: 0, disabled: true }],
      review_status: [item.review_status || 'pending'],
      review_notes: [item.review_notes || ''],
      provider_id: [item.suggested_provider_id || null], // Proveedor por item
      provider_name: [item.provider_name || ''], // Nombre del proveedor seleccionado (para mostrar)
      contract_provider_id: [item.suggested_provider_id || null], // ID original del proveedor del contrato
      contract_price: [item.contract_price || null], // Precio del contrato
      source_contract_id: [item.source_contract_id || null] // Contrato de origen
    });
  }

  loadProviders(): void {
    this.loadingProviders = true;
    this.providerService.getProviders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.providers = (response.data || []).map((p: any) => ({
            id: p.id,
            name: p.company || p.name || p.shortname || 'Sin nombre',
            rfc: p.rfc || p.document_number || '',
            person_type: p.person_type
          }));
          this.loadingProviders = false;
        },
        error: () => {
          this.providers = [];
          this.loadingProviders = false;
        }
      });
  }

  calculateTotals(): void {
    let subtotal = 0;

    this.itemsArray.controls.forEach((control, index) => {
      const qty = parseFloat(control.get('quantity')?.value) || 0;
      const price = parseFloat(control.get('unit_price')?.value) || 0;
      const lineTotal = qty * price;

      // Actualizar line_total en el FormGroup
      control.get('line_total')?.setValue(lineTotal);

      if (control.get('review_status')?.value !== 'rejected') {
        subtotal += lineTotal;
      }
    });

    this.calculatedTotals.subtotal = subtotal;
    this.calculatedTotals.iva = subtotal * 0.16; // Por defecto 16%
    this.calculatedTotals.total = subtotal + this.calculatedTotals.iva;
  }

  onPriceChange(): void {
    this.calculateTotals();
  }

  getItemLineTotal(index: number): number {
    const control = this.itemsArray.at(index);
    const qty = parseFloat(control.get('quantity')?.value) || 0;
    const price = parseFloat(control.get('unit_price')?.value) || 0;
    return qty * price;
  }

  setItemStatus(index: number, status: 'approved' | 'rejected' | 'needs_integration'): void {
    const control = this.itemsArray.at(index);
    control.get('review_status')?.setValue(status);

    if (status === 'rejected' || status === 'needs_integration') {
      // Solicitar notas
      Swal.fire({
        title: status === 'rejected' ? 'Motivo del Rechazo' : 'Notas de Integración',
        input: 'textarea',
        inputPlaceholder: 'Ingrese el motivo...',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          control.get('review_notes')?.setValue(result.value || '');
        } else {
          control.get('review_status')?.setValue('pending');
        }
      });
    }

    this.calculateTotals();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-success';
      case 'rejected': return 'bg-danger';
      case 'needs_integration': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'needs_integration': return 'Requiere Integración';
      default: return 'Pendiente';
    }
  }

  // Poner en revisión
  putInReview(): void {
    this.submitting = true;
    this.purchaseRequestService.putInReview(this.requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire('Éxito', 'Solicitud puesta en revisión', 'success');
          this.loadRequest();
          this.submitting = false;
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo actualizar el estado', 'error');
          this.submitting = false;
        }
      });
  }

  // Pre-autorizar
  preAuthorize(): void {
    if (this.form.invalid) {
      Swal.fire('Error', 'Complete todos los campos requeridos (precios)', 'error');
      return;
    }

    // Verificar que todos los items tengan un estado definido
    const pendingItems = this.itemsArray.controls.filter(
      c => c.get('review_status')?.value === 'pending'
    );

    if (pendingItems.length > 0) {
      Swal.fire('Error', 'Debe revisar todos los items (aprobar, rechazar o marcar para integración)', 'error');
      return;
    }

    // Verificar que haya al menos un item aprobado
    const approvedItems = this.itemsArray.controls.filter(
      c => c.get('review_status')?.value === 'approved'
    );

    if (approvedItems.length === 0) {
      Swal.fire('Error', 'Debe aprobar al menos un item para pre-autorizar', 'error');
      return;
    }

    // NOTA: La asignación de proveedor es opcional en la pre-autorización
    // Los proveedores se pueden asignar después al generar la Orden de Compra
    const globalProviderId = this.form.get('provider_id')?.value;
    const itemsWithoutProvider = approvedItems.filter(c => {
      const itemProviderId = c.get('provider_id')?.value;
      return !itemProviderId && !globalProviderId;
    });

    // Solo mostrar advertencia informativa, no bloquear
    let confirmMessage = 'La solicitud quedará lista para convertirse en Orden de Compra';
    if (itemsWithoutProvider.length > 0) {
      confirmMessage = `Hay ${itemsWithoutProvider.length} item(s) sin proveedor asignado. Podrá asignarlos al generar la Orden de Compra.`;
    }

    Swal.fire({
      title: '¿Pre-autorizar solicitud?',
      text: confirmMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Pre-autorizar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.submitPreAuthorization();
      }
    });
  }

  private submitPreAuthorization(): void {
    this.submitting = true;

    const formValue = this.form.value;
    const data = {
      provider_id: formValue.provider_id, // Proveedor global (opcional)
      notes: formValue.notes,
      items: formValue.items.map((item: any) => ({
        id: item.id,
        unit_price: item.unit_price,
        estimated_price: item.estimated_price,
        review_status: item.review_status,
        review_notes: item.review_notes,
        provider_id: item.provider_id // Proveedor por item
      }))
    };

    this.purchaseRequestService.preAuthorize(this.requestId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire('Éxito', 'Solicitud pre-autorizada exitosamente', 'success');
          this.router.navigate(['/purchases/purchase-requests']);
        },
        error: (err) => {
          Swal.fire('Error', err.error?.message || 'No se pudo pre-autorizar', 'error');
          this.submitting = false;
        }
      });
  }

  // Rechazar solicitud
  reject(): void {
    Swal.fire({
      title: 'Rechazar Solicitud',
      input: 'textarea',
      inputPlaceholder: 'Motivo del rechazo...',
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar un motivo';
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.submitting = true;
        this.purchaseRequestService.reject(this.requestId, result.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire('Rechazada', 'La solicitud ha sido rechazada', 'info');
              this.router.navigate(['/purchases/purchase-requests']);
            },
            error: (err) => {
              Swal.fire('Error', err.error?.message || 'No se pudo rechazar', 'error');
              this.submitting = false;
            }
          });
      }
    });
  }

  // Devolver para correcciones
  returnForCorrections(): void {
    Swal.fire({
      title: 'Devolver para Correcciones',
      input: 'textarea',
      inputPlaceholder: 'Indique las correcciones requeridas (mínimo 10 caracteres)...',
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar las correcciones requeridas';
        if (value.length < 10) return 'El motivo debe tener al menos 10 caracteres';
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Devolver',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.submitting = true;
        this.purchaseRequestService.returnRequest(this.requestId, result.value)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire('Devuelta', 'La solicitud ha sido devuelta al solicitante', 'info');
              this.router.navigate(['/purchases/purchase-requests']);
            },
            error: (err) => {
              Swal.fire('Error', err.error?.message || 'No se pudo devolver', 'error');
              this.submitting = false;
            }
          });
      }
    });
  }

  // Solicitar integración
  requestIntegration(): void {
    const itemsNeedingIntegration = this.itemsArray.controls.filter(
      c => c.get('review_status')?.value === 'needs_integration'
    );

    if (itemsNeedingIntegration.length === 0) {
      Swal.fire('Error', 'Marque primero los items que requieren integración', 'error');
      return;
    }

    Swal.fire({
      title: 'Solicitar Integración',
      input: 'textarea',
      inputPlaceholder: 'Describa qué productos/proveedores necesitan ser integrados...',
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar una descripción';
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Solicitar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed && result.value) {
        const itemIds = itemsNeedingIntegration.map(c => c.get('id')?.value);
        this.submitting = true;

        this.purchaseRequestService.requestIntegration(this.requestId, result.value, itemIds)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              Swal.fire('Enviado', 'Se ha solicitado la integración de productos', 'success');
              this.loadRequest();
              this.submitting = false;
            },
            error: (err) => {
              Swal.fire('Error', err.error?.message || 'No se pudo enviar la solicitud', 'error');
              this.submitting = false;
            }
          });
      }
    });
  }

  // Convertir a Orden(es) de Compra - divide por proveedor
  convertToPO(): void {
    // Contar cuántos proveedores diferentes hay
    const providersSet = new Set<number>();
    this.itemsArray.controls.forEach(item => {
      const providerId = item.get('provider_id')?.value;
      if (providerId) {
        providersSet.add(providerId);
      }
    });

    const uniqueProviders = providersSet.size;

    let message = 'Se creará una nueva Orden de Compra con los datos de esta solicitud';
    if (uniqueProviders > 1) {
      message = `Se crearán ${uniqueProviders} Órdenes de Compra (una por cada proveedor asignado)`;
    }

    Swal.fire({
      title: '¿Generar Orden(es) de Compra?',
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: uniqueProviders > 1 ? `Generar ${uniqueProviders} OCs` : 'Sí, Generar OC',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then(result => {
      if (result.isConfirmed) {
        this.submitting = true;

        // Usar el endpoint de múltiples OCs por proveedor
        this.purchaseRequestService.convertToMultiplePurchaseOrders(this.requestId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              const count = response.data.orders_count;
              const orderNumbers = response.data.order_numbers.join(', ');

              Swal.fire({
                title: count > 1 ? '¡Órdenes de Compra Generadas!' : '¡Orden de Compra Generada!',
                html: `
                  <p>${count > 1 ? 'Números' : 'Número'}: <strong>${orderNumbers}</strong></p>
                  ${count > 1 ? `<p class="text-muted small">Se generaron ${count} órdenes, una por cada proveedor</p>` : ''}
                `,
                icon: 'success',
                confirmButtonText: count > 1 ? 'Ver Órdenes' : 'Ver Orden',
                showCancelButton: count > 1,
                cancelButtonText: 'Cerrar'
              }).then((swalResult) => {
                if (swalResult.isConfirmed) {
                  if (count === 1) {
                    this.router.navigate(['/purchases/purchase-orders', response.data.purchase_orders[0].id]);
                  } else {
                    // Si hay múltiples, ir a la lista de OCs
                    this.router.navigate(['/purchases/purchase-orders'], {
                      queryParams: { purchase_request_id: this.requestId }
                    });
                  }
                } else {
                  this.router.navigate(['/purchases/purchase-requests']);
                }
              });
            },
            error: (err) => {
              Swal.fire('Error', err.error?.message || 'No se pudo generar la(s) OC', 'error');
              this.submitting = false;
            }
          });
      }
    });
  }

  formatCurrency(value: number): string {
    return this.purchaseRequestService.formatCurrency(value);
  }

  /**
   * Guardar asignación de proveedores y actualizar la OC relacionada
   * Se usa cuando venimos desde el listado de OC para asignar proveedores
   */
  saveProviderAssignment(): void {
    if (!this.relatedOrderId) {
      Swal.fire('Error', 'No se encontró la orden de compra relacionada', 'error');
      return;
    }

    // Verificar que al menos un item tenga proveedor asignado o que haya un proveedor global
    const globalProviderId = this.form.get('provider_id')?.value;
    const approvedItems = this.itemsArray.controls.filter(
      c => c.get('review_status')?.value === 'approved'
    );

    const itemsWithProvider = approvedItems.filter(c => c.get('provider_id')?.value);

    if (!globalProviderId && itemsWithProvider.length === 0) {
      Swal.fire('Error', 'Debe asignar al menos un proveedor (global o por item)', 'error');
      return;
    }

    this.submitting = true;

    const formValue = this.form.value;

    // Preparar datos para actualizar la OC
    const updateData: any = {
      provider_id: globalProviderId,
      items: formValue.items
        .filter((item: any) => item.review_status === 'approved')
        .map((item: any) => ({
          id: item.id,
          provider_id: item.provider_id || globalProviderId,
          unit_price: item.unit_price || 0,
          quantity_ordered: item.quantity
        }))
    };

    this.purchaseOrderService.update(this.relatedOrderId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.submitting = false;
          Swal.fire({
            title: 'Guardado',
            text: 'La asignación de proveedores ha sido guardada correctamente',
            icon: 'success'
          }).then(() => {
            this.router.navigate(['/purchases/purchase-orders/list']);
          });
        },
        error: (err) => {
          this.submitting = false;
          Swal.fire('Error', err.error?.message || 'No se pudo guardar la asignación', 'error');
        }
      });
  }

  goBack(): void {
    // Si venimos del modo asignación de proveedor, volver a la lista de OC
    if (this.assignProviderMode) {
      this.router.navigate(['/purchases/purchase-orders/list']);
    } else {
      this.router.navigate(['/purchases/purchase-requests']);
    }
  }

  canPreAuthorize(): boolean {
    // Si estamos en modo asignación de proveedor (desde OC), permitir edición
    if (this.assignProviderMode) {
      return true;
    }

    const code = this.request?.status?.code?.toUpperCase();
    return code === STATUS_CODES.SUBMITTED
        || code === STATUS_CODES.RELEASED
        || code === 'RELEASED'
        || code === STATUS_CODES.REVIEW
        || code === STATUS_CODES.NEEDS_INTEGRATION;
  }

  canConvertToPO(): boolean {
    // En modo asignación de proveedor, no mostrar el botón de convertir a OC (ya existe)
    if (this.assignProviderMode) {
      return false;
    }

    const code = this.request?.status?.code?.toUpperCase();
    // Aceptar PRE_AUTHORIZED (flujo nuevo) y AUTHORIZED (legacy)
    return code === STATUS_CODES.PRE_AUTHORIZED
        || code === STATUS_CODES.AUTHORIZED
        || code === 'AUTHORIZED';
  }

  isReadOnly(): boolean {
    return !this.canPreAuthorize() && !this.canConvertToPO();
  }
}
