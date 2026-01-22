import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';
import { apiEndpoint } from '../../../../shared/api-endpoint.util';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [SidebarComponent, FormsModule, CommonModule],
  templateUrl: './product-add.component.html',
  styleUrl: './product-add.component.css',
})
export class ProductAddComponent implements OnInit {
  formSubmitted: boolean = false;

  // Modelo alineado con API v2/items (JSON simplificado para creación)
  product: any = {
    name: '',
    item_status_id: null,
    product_type_id: null,
    presentation_id: null,
    gtin: '',
    inventory_unit_of_measurement_id: null,
    purchase_unit_of_measurement_id: null,
    unit_equivalence: 0,
    storage_condition_id: null,
  };

  inventoryStatuses: any[] = [];
  productTypes: any[] = [];
  unitsOfMeasurement: any[] = [];
  storageConditions: any[] = [];
  providersCatalog: any[] = [];
  providers: any[] = [];
  presentationInput = '';
  presentationOptions: Array<{ id: number; label: string }> = [];
  private presentationSearchTimeout: any = null;

  getFilteredPresentationOptions(): Array<{ id: number; label: string }> {
    const value = this.presentationInput.trim().toLowerCase();
    if (!value) {
      return this.presentationOptions;
    }

    return this.presentationOptions.filter((option) =>
      option.label.toLowerCase().includes(value)
    );
  }

  searchPresentations(): void {
    const value = this.presentationInput.trim();
    if (this.presentationSearchTimeout) {
      clearTimeout(this.presentationSearchTimeout);
    }

    this.presentationSearchTimeout = setTimeout(() => {
      this.http
        .get<any>(
          apiEndpoint(`v2/product-presentations?search=${encodeURIComponent(value)}`)
        )
        .subscribe({
          next: (resp) => {
            const items = resp?.data || resp || [];
            this.presentationOptions = items.map((item: any) => ({
              id: item.id,
              label: item.name || String(item.id),
            }));
          },
          error: (err: HttpErrorResponse) =>
            console.error('Error al buscar presentaciones:', err),
        });
    }, 250);
  }

  addPresentationOption(): void {
    const value = this.presentationInput.trim();
    if (!value) {
      return;
    }

    this.http
      .post<any>(apiEndpoint('v2/product-presentations'), {
        name: value.toUpperCase(),
      })
      .subscribe({
        next: (resp) => {
          const data = resp?.data || resp;
          const option = {
            id: data?.id ?? null,
            label: data?.name ?? value.toUpperCase(),
          };
          if (option.id !== null) {
            this.presentationOptions = [option, ...this.presentationOptions];
            this.selectPresentationOption(option);
          }
        },
        error: (err: HttpErrorResponse) =>
          console.error('Error al crear presentacion:', err),
      });
  }

  selectPresentationOption(option: { id: number; label: string }): void {
    this.presentationInput = option.label;
    this.product.presentation_id = option.id;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
  }

  private loadCatalogs(): void {
    this.loadInventoryStatuses();
    this.loadProductTypes();
    this.loadUnitsOfMeasurement();
    this.loadStorageConditions();
    this.loadProvidersCatalog();
  }

  private loadInventoryStatuses(): void {
    this.http.get<any>(apiEndpoint('inventory_status/list')).subscribe({
      next: (resp) => {
        this.inventoryStatuses = resp?.data || resp || [];
        // Si el backend define un estatus "Activo", úsalo como valor fijo
        const active = this.inventoryStatuses.find(
          (s: any) => s.name?.toLowerCase() === 'activo'
        );
        if (active) {
          this.product.item_status_id = active.id;
        }
      },
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar estatus de inventario:', err),
    });
  }

  private loadProductTypes(): void {
    this.http.get<any>(apiEndpoint('v2/product-types')).subscribe({
      next: (resp) => {
        console.log('Product types response:', resp);
        this.productTypes = resp?.data || resp || [];
      },
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar tipos de producto:', err),
    });
  }

  private loadUnitsOfMeasurement(): void {
    this.http.get<any>(apiEndpoint('unit_measurement/list')).subscribe({
      next: (resp) => (this.unitsOfMeasurement = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar unidades de medida:', err),
    });
  }

  private loadStorageConditions(): void {
    this.http.get<any>(apiEndpoint('story_types/list')).subscribe({
      next: (resp) => (this.storageConditions = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar tipos de almacenamiento:', err),
    });
  }

  private loadProvidersCatalog(): void {
    this.http.get<any>(apiEndpoint('v2/company/providers')).subscribe({
      next: (resp) => (this.providersCatalog = resp?.data || resp || []),
      error: (err: HttpErrorResponse) =>
        console.error('Error al cargar catalogo de proveedores:', err),
    });
  }

  addProvider(): void {
    this.providers.push({
      provider_id: null,
      provider_code: '',
      ref: '',
      is_active: true,
      is_primary: true,
      meta: {
        notes: '',
      },
    });
  }

  setPrimaryProvider(index: number): void {
    this.providers = this.providers.map((provider, i) => ({
      ...provider,
      is_primary: i === index,
    }));
  }

  removeProvider(index: number): void {
    this.providers.splice(index, 1);
  }

  onProviderCodeChange(index: number): void {
    const provider = this.providers[index];
    if (!provider) {
      return;
    }
    const newCode = (provider.provider_code || '').trim();
    const currentRef = (provider.ref || '').trim();
    if (!currentRef) {
      provider.ref = newCode;
    }
  }

  syncPresentationOption(): void {
    const value = this.presentationInput.trim();
    if (!value) {
      this.product.presentation_id = null;
      return;
    }

    const match = this.presentationOptions.find(
      (option) => option.label.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      this.product.presentation_id = match.id;
    } else {
      this.product.presentation_id = null;
    }
  }

  setCurrentTab(tab: string): void {
    // this.currentTab = tab;
  }

  goBack(): void {
    this.formSubmitted = false;

    this.location.back();
  }

  validateRequiredFields(): boolean {
    return !!this.product.name && !!this.product.product_type_id;
  }

  // Método para verificar si hay errores en campos requeridos
  hasRequiredErrors(): boolean {
    return this.formSubmitted && !this.validateRequiredFields();
  }

  saveNewProduct(): void {
    // Marcar el formulario como enviado para mostrar validaciones
    this.formSubmitted = true;

    // Validar campos obligatorios; la propia función muestra detalle si falla
    if (!this.validateRequiredFields()) {
      return;
    }

    // Si pasa la validación, resetear formSubmitted para futuras interacciones
    this.formSubmitted = false;

    const payload = {
      name: this.product.name,
      item_status_id: this.product.item_status_id,
      product_type_id: this.product.product_type_id,
      product_presentation_id: this.product.presentation_id,
      inventory_unit_of_measurement_id:
        this.product.inventory_unit_of_measurement_id,
      purchase_unit_of_measurement_id:
        this.product.purchase_unit_of_measurement_id,
      unit_equivalence: this.product.unit_equivalence ?? 0,
      storage_condition_id: this.product.storage_condition_id,
      providers: this.providers.map((provider) => {
        const refValue = (provider.ref || '').trim() || provider.provider_code;
        return {
          provider_id: provider.provider_id,
          provider_code: provider.provider_code,
          ref: refValue,
          is_active: provider.is_active ?? true,
          is_primary: provider.is_primary ?? false,
          meta: provider.meta ?? { notes: '' },
        };
      }),
    };

    // Debug: ver datos que se intentan guardar
    console.log('Nuevo producto - payload a enviar:', payload);

    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    Swal.fire({
      title: 'Guardando producto...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http.post(apiEndpoint('v2/items'), payload, { headers }).subscribe({
      next: (response: any) => {
        Swal.close();

        const createdId = response?.data?.id || response?.id;

        Swal.fire({
          title: 'Producto creado correctamente',
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: 'Ver detalle',
          cancelButtonText: 'Ver listado',
        }).then((result) => {
          if (result.isConfirmed && createdId) {
            this.router.navigate(['/products/show', createdId]);
          } else {
            this.router.navigate(['/products/list']);
          }
        });
      },
      error: (error: any) => {
        console.error('Error al crear el producto', error);
        Swal.close();
        Swal.fire(
          'Error',
          'No se pudo crear el producto. Intente nuevamente.',
          'error'
        );
      },
    });
  }

  // Funciones para control de estado de pestañas
  checkEquipmentState(): void {}

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }
}
